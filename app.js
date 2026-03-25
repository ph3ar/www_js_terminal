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

var app = express();

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

            if (data.type === 'ssh') {
                command = 'ssh';
                params = [];
                if (data.port && data.port !== "22") {
                    params.push('-p', data.port);
                }

                if (data.key) {
                    keyFile = path.join(os.tmpdir(), 'jutty-key-' + crypto.randomBytes(4).toString('hex'));
                    fs.writeFileSync(keyFile, data.key, { mode: 0o600 });
                    params.push('-i', keyFile);
                }

                var target = data.host;
                if (data.user) {
                    target = data.user + '@' + data.host;
                }
                params.push(target);
            } else {
                command = 'telnet';
                params = [data.host, data.port];
            }

            log.info(command, params.join(' '));

            term = pty.spawn(command, params, {
                name: 'xterm-256color',
                cols: data.col,
                rows: data.row
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
