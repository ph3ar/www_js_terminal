var express =       require('express');
var bodyParser =    require('body-parser');
var http =          require('http');
var https =         require('https');
var path =          require('path');
var server =        require('socket.io');
var pty =           require('node-pty');
var fs =            require('fs');
var log =           require('yalm');
var { rateLimit } = require('express-rate-limit');
log.setLevel('debug');

var app = express();

app.set('trust proxy', 1);

var limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000 // limit each IP to 100 requests per windowMs
});



app.set('trust proxy', 1);

app.use(bodyParser.urlencoded({
    extended: true
}));

app.post('/', limiter, function(req, res) {
    res.sendFile(__dirname + '/public/index.html');
});

// Added maxAge for performance optimization (caching static files)
app.use('/', limiter, express.static(path.join(__dirname, 'public/'), { maxAge: '1d' }));

function setupSocketIo(httpserv) {
    var io = server(httpserv, {path: '/socket.io'});

    io.on('connection', function (socket) {
        log.info('socket.io connection');
        var term;

        socket.on('start', function (data) {

            var params;

            // Hardcode 'telnet' or 'ssh' instead of depending completely on user input
            // Validate the user input against allowed types
            // Only telnet is supported securely with positional arguments
            var type = 'telnet';

            // Sanitize host to alphanumeric + dots + dashes
            var safeHost = String(data.host || '').replace(/[^a-zA-Z0-9\.\-]/g, '');
            // Sanitize port as integer
            var safePort = parseInt(data.port, 10) || 22;

            params = [safeHost, safePort.toString()];

            log.info(type, params.join(' '));

        // 🛡️ Sentinel: Sanitize and validate inputs to prevent command injection and DoS
        var hostStr = String(data.host || '').trim();
        var portStr = String(data.port || '').trim();
        var portNum = parseInt(portStr, 10);

        if (!/^[a-zA-Z0-9][a-zA-Z0-9.-]*$/.test(hostStr)) {
            log.error('Invalid host input');
            socket.emit('end');
            return;
        }

        if (!/^\d+$/.test(portStr) || portNum < 1 || portNum > 65535) {
            log.error('Invalid port input');
            socket.emit('end');
            return;
        }

        var cols = parseInt(data.col, 10) || 80;
        var rows = parseInt(data.row, 10) || 24;

        if (data.type === 'telnet') {
            params = [hostStr, portStr];
        } else {
            data.type = 'telnet';
            params = [hostStr, portStr];
        }

            log.info(term.pid, 'spawned');
            term.on('data', function(data) {
                socket.emit('output', data);
            });
            term.on('exit', function (code) {
                log.info(term.pid, 'ended');
                socket.emit('end');
                term.kill();
                term = null;
            });

        term = pty.spawn(data.type, params, {
            name: 'xterm-256color',
            cols: cols,
            rows: rows
        });

        socket.on('resize', function (data) {
            term && term.resize(parseInt(data.col, 10) || 80, parseInt(data.row, 10) || 24);
        });

        socket.on('input', function (data) {
            if (term && typeof data === 'string') { term.write(data); }
        });

        socket.on('disconnect', function () {
            term && term.kill();
        });

    });
    });

    return io;
}

if (require.main === module) {
    var opts = require('optimist')
        .options({
            sslkey: {
                demand: false,
                description: 'path to SSL key'
            },
            sslcert: {
                demand: false,
                description: 'path to SSL certificate'
            },
            port: {
                demand: true,
                alias: 'p',
                description: 'wetty listen port'
            }
        }).boolean('allow_discovery').argv;

    var runhttps = false;

    if (opts.sslkey && opts.sslcert) {
        runhttps = true;
        opts['ssl'] = {
            key: fs.readFileSync(path.resolve(opts.sslkey)),
            cert: fs.readFileSync(path.resolve(opts.sslcert))
        };
    }

    var httpserv;

    if (runhttps) {
        httpserv = https.createServer(opts.ssl, app).listen(opts.port, function () {
            log.info('https on port ' + opts.port);
        });
    } else {
        httpserv = http.createServer(app).listen(opts.port, function () {
            log.info('http on port ' + opts.port);
        });
    }

    setupSocketIo(httpserv);
}

module.exports = { app, setupSocketIo };
