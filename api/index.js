const { app, setupSocketIo } = require('../app.js');

module.exports = (req, res) => {
    // If we're serving a websocket upgrade request or a socket.io request,
    // we need to make sure the socket.io server is initialized on the response server.
    if (res && res.socket && res.socket.server && !res.socket.server.io) {
        console.log('*First use, starting socket.io');
        // Vercel serverless functions attach the HTTP Server object at res.socket.server
        res.socket.server.io = setupSocketIo(res.socket.server);
    }

    // Delegate all HTTP requests to our Express app
    return app(req, res);
};
