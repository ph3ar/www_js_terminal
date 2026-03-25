var express =       require('express');
var bodyParser =    require('body-parser');
var http =          require('http');
var https =         require('https');
var path =          require('path');
var server =        require('socket.io');
var pty =           require('node-pty');
var fs =            require('fs');
var log =           require('yalm');
var crypto =        require('crypto');
var os =            require('os');

log.setLevel('debug');

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

const { rateLimit } = require('express-rate-limit');

var app = express();
app.set('trust proxy', 1);

var limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

app.use('/.well-known', limiter);

app.use('/.well-known', function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    next();
});

app.use(bodyParser.urlencoded({
    extended: true
}));

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/public/jutty.html');
});

app.post('/', function(req, res) {
    res.sendFile(__dirname + '/public/jutty.html');
});

app.use('/', express.static(path.join(__dirname, 'public/')));

var httpserv;
var io;

if (require.main === module) {
    if (runhttps) {
        httpserv = https.createServer(opts.ssl, app).listen(opts.port, function () {
            log.info('https on port ' + opts.port);
        });
    } else {
        httpserv = http.createServer(app).listen(opts.port, function () {
            log.info('http on port ' + opts.port);
        });
    }

    io = server(httpserv, {path: '/socket.io'});
    setupIo(io);
} else {
    io = server();
    setupIo(io);
}

module.exports = app;
module.exports.app = app;

function setupIo(io) {
    io.on('connection', function (socket) {
        log.info('socket.io connection');
        var term;
        var keyFile;

        socket.on('start', function (data) {


            var params;
            var command;

            // Validate data.col and data.row
            var col = parseInt(data.col, 10);
            var row = parseInt(data.row, 10);
            if (isNaN(col) || col < 1 || col > 500) col = 80;
            if (isNaN(row) || row < 1 || row > 500) row = 24;

            // Sanitize host to prevent flag injection (e.g. -o ProxyCommand)
            var targetHost = (data.host || '').replace(/[^a-zA-Z0-9.-]/g, '');
            if (!targetHost) return;

            if (data.type === 'ssh') {
                command = 'ssh';
                params = [];

                var targetPort = parseInt(data.port, 10);
                if (targetPort && targetPort > 0 && targetPort < 65536) {
                    params.push('-p', targetPort.toString());
                }

                if (data.key) {
                    keyFile = path.join(os.tmpdir(), 'jutty-key-' + crypto.randomBytes(4).toString('hex'));
                    fs.writeFileSync(keyFile, data.key, { mode: 0o600 });
                    params.push('-i', keyFile);
                }

                var targetUser = (data.user || '').replace(/[^a-zA-Z0-9._-]/g, '');
                var target = targetHost;
                if (targetUser) {
                    target = targetUser + '@' + targetHost;
                }

                // Disable executing commands
                params.push('-o', 'ClearAllForwardings=yes');
                params.push(target);
            } else {
                command = 'telnet';
                var targetPort = parseInt(data.port, 10) || 23;
                params = [targetHost, targetPort.toString()];
            }

            // Strictly enforce command
            if (command !== 'ssh' && command !== 'telnet') return;


            log.info(command, params.join(' '));

            term = pty.spawn(command, params, {
                name: 'xterm-256color',
                cols: col,
                rows: row
            });

            log.info(term.pid, 'spawned');
            term.on('data', function(data) {
                socket.emit('output', data);
            });
            term.on('exit', function (code) {
                log.info(term.pid, 'ended');
                socket.emit('end');

                if (keyFile) {
                    try { fs.unlinkSync(keyFile); } catch(e) {}
                    keyFile = null;
                }

                if (term) {
                    try { term.destroy(); } catch(e) {}
                }
                term = null;
            });

        });

        socket.on('resize', function (data) {
            if (term && term._fd) {
                try { term.resize(data.col, data.row); } catch(e) {}
            }
        });

        socket.on('input', function (data) {
            term && term.write(data);
        });

        socket.on('disconnect', function () {
            if (keyFile) {
                try { fs.unlinkSync(keyFile); } catch(e) {}
                keyFile = null;
            }
            if (term && term.destroy) {
                try { term.destroy(); } catch(e) {}
            }
        });

    });
}
