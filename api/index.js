const { app, setupSocketIO } = require('../app.js');
const Server = require('socket.io');

module.exports = (req, res) => {
    if (!res.socket.server.io) {
        console.log('*First use, starting socket.io');
        const io = new Server(res.socket.server, {
            path: '/socket.io'
        });
        setupSocketIO(io);
        res.socket.server.io = io;
    }

    return app(req, res);
};
