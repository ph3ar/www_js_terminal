var express =       require('express');
var bodyParser =    require('body-parser');
var http =          require('http');
var https =         require('https');
var path =          require('path');
var server =        require('socket.io');
var pty =           require('pty.js');
var fs =            require('fs');
var log =           require('yalm');
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

var httpserv;

var app = express();

app.use(bodyParser.urlencoded({
    extended: true
}));

app.post('/', function(req, res) {
    res.sendFile(__dirname + '/public/jutty.html');
});

app.use('/', express.static(path.join(__dirname, 'public/')));

if (runhttps) {
    httpserv = https.createServer(opts.ssl, app).listen(opts.port, function () {
        log.info('https on port ' + opts.port);
    });
} else {
    httpserv = http.createServer(app).listen(opts.port, function () {
        log.info('http on port ' + opts.port);
    });
}

var io = server(httpserv, {path: '/socket.io'});

var term;

io.on('connection', function (socket) {
    log.info('socket.io connection');

    socket.on('start', function (data) {

        var params;

        if (data.type === 'telnet') {
            params = [data.host, data.port];
        } else {
            data.type = 'telnet';
            params = [data.host, data.port];
        }

        log.info(data.type, params.join(' '));

        term = pty.spawn(data.type, params, {
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
            term.destroy();
            term = null;
        });

    });

    socket.on('resize', function (data) {
        term && term.resize(data.col, data.row);
    });

    socket.on('input', function (data) {
        term && term.write(data);
    });

    socket.on('disconnect', function () {
        term && term.end();
    });

});
