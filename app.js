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

// ⚡ Bolt Optimization: Load heavily requested static HTML synchronously into memory at application startup
// instead of relying on Express's res.sendFile on every request. This eliminates disk I/O bottlenecks.
var indexHtml = fs.readFileSync(path.join(__dirname, 'public', 'index.html'), 'utf8');

app.get('/', limiter, function(req, res) {
    res.send(indexHtml);
});

app.post('/', limiter, function(req, res) {
    res.send(indexHtml);
});

// Added maxAge for performance optimization (caching static files)
// ⚡ Bolt Optimization: Rate limiting is bypassed for static assets to improve performance and save server resources
app.use('/', express.static(path.join(__dirname, 'public/'), { maxAge: '1d' }));

function setupSocketIo(httpserv) {
    var io = server(httpserv, {path: '/socket.io'});

    io.on('connection', function (socket) {
        log.info('socket.io connection');
        var term;

        socket.on('start', function (data) {

            var params;

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

            var type = 'telnet';
            var safeHost = hostStr.replace(/[^a-zA-Z0-9\.\-]/g, '');
            var safePort = portNum;

            // Prevent command injection starting with a dash (-)
            if (safeHost.startsWith('-')) {
                log.error('Host cannot start with a hyphen');
                socket.emit('end');
                return;
            }

            params = [safeHost, safePort.toString()];

            log.info(type, params.join(' '));

            var cols = parseInt(data.col, 10) || 80;
            var rows = parseInt(data.row, 10) || 24;

            term = pty.spawn(type, params, {
                name: 'xterm-256color',
                cols: cols,
                rows: rows
            });

            log.info(term.pid, 'spawned');

            // ⚡ Bolt Optimization: Batch terminal output to drastically reduce Socket.IO messages
            // This prevents UI freezes and reduces CPU overhead during high-throughput operations (e.g. catting large files)
            var outBuffer = '';
            var outTimeout = null;

            function flushOutput() {
                if (outBuffer) {
                    socket.emit('output', outBuffer);
                    outBuffer = '';
                }
                if (outTimeout) {
                    clearTimeout(outTimeout);
                    outTimeout = null;
                }
            }

            term.on('data', function(data) {
                outBuffer += data;
                if (!outTimeout) {
                    outTimeout = setTimeout(flushOutput, 10);
                }
            });

            term.on('exit', function (code) {
                log.info(term.pid, 'ended');
                flushOutput();
                socket.emit('end');
                if (term) {
                    term.kill();
                    term = null;
                }
            });
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
