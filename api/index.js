const { app, setupSocketIo } = require('../app.js');

module.exports = (req, res) => {
    // ⚡ Bolt Optimization & Safety: Fast-path socket initialization with safe nil checks.
    // Prevents unhandled TypeError exceptions if the request lacks a socket context (e.g., local mock testing)
    // while ensuring Vercel serverless function correctly initializes the WebSocket engine.
    if (res && res.socket && res.socket.server && !res.socket.server.io) {
        console.log('*First use, starting socket.io');
        // Vercel serverless functions attach the HTTP Server object at res.socket.server
        res.socket.server.io = setupSocketIo(res.socket.server);
    }

    // Delegate all HTTP requests to our Express app
    return app(req, res);
};
