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

app.set('trust proxy', 1);

app.use(bodyParser.urlencoded({
    extended: true
}));

var requestCounts = new Map();

var limiter = function(req, res, next) {
    var ip = req.ip;
    var now = Date.now();
    var current = requestCounts.get(ip) || { count: 0, time: now };

    // Lazily clear expired entries to prevent memory leaks without setInterval
    if (requestCounts.size > 1000) {
        var expired = now - 15 * 60 * 1000;
        requestCounts.forEach(function(val, key) {
            if (val.time < expired) {
                requestCounts.delete(key);
            }
        });
    }

    if (now - current.time > 15 * 60 * 1000) {
        current = { count: 0, time: now };
    }
    current.count++;
    requestCounts.set(ip, current);

    if (current.count > 100) {
        return res.status(429).send('Too many requests, please try again later.');
    }
    next();
};

app.post('/', limiter, function(req, res) {
    res.sendFile(__dirname + '/public/jutty.html');
});

app.use('/', express.static(path.join(__dirname, 'public/'), {
    maxAge: '1d' // ⚡ Bolt: Cache static assets to improve load time and reduce server load
}));

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

    var io = server(httpserv, {path: '/socket.io'});
    setupSocketIO(io);
}

function setupSocketIO(io) {
    io.on('connection', function (socket) {
        log.info('socket.io connection');
        var term;

    socket.on('start', function (data) {

        var params;

        if (data && data.type === 'telnet') {
            data.type = 'telnet';
            params = [data.host, data.port];
        } else if (data && data.type === 'ssh') {
            data.type = 'ssh';
            params = [data.user + '@' + data.host, '-p', data.port];
        } else {
            data = data || {};
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
        if (term && data && typeof data.col === 'number' && typeof data.row === 'number') {
            term.resize(data.col, data.row);
        }
    });

    socket.on('input', function (data) {
        if (term && typeof data === 'string') {
            term.write(data);
        }
    });

        socket.on('disconnect', function () {
            term && term.end();
        });

    });
}

module.exports = { app: app, setupSocketIO: setupSocketIO };
