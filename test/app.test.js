const { expect } = require('chai');
const request = require('supertest');
const sinon = require('sinon');
const proxyquire = require('proxyquire');

describe('App Tests', function () {
    let app, server, ioServer;
    let ptyMock, termMock;

    before(function (done) {
        // Mock term returned by pty.spawn
        termMock = {
            pid: 1234,
            on: sinon.stub(),
            resize: sinon.stub(),
            write: sinon.stub(),
            end: sinon.stub(),
            kill: sinon.stub()
        };

        // Mock pty module
        ptyMock = {
            spawn: sinon.stub().returns(termMock),
            // Ensure any internal require logic that checks properties doesn't fail
            '@global': true,
            '@noCallThru': true
        };

        // Inject the mocked pty into app.js
        const appModule = proxyquire('../app.js', {
            'node-pty': ptyMock
        });

        // Create a test server programmatically instead of relying on app.js's self-starting block
        const express = require('express');
        const http = require('http');

        const { app: expressApp, setupSocketIo } = appModule;

        server = http.createServer(expressApp);
        ioServer = setupSocketIo(server);

        // We listen on an ephemeral port
        server.listen(0, () => {
            done();
        });
    });

    after(function (done) {
        if (server) {
            server.close();
        }
        done();
    });

    it('should serve index.html on GET / from memory cache', function (done) {
        request(server)
            .get('/')
            .expect(200)
            .end(function (err, res) {
                if (err) return done(err);
                expect(res.text).to.include('<title>PH3AR Terminal</title>');
                done();
            });
    });

    it('should serve index.html on POST / from memory cache', function (done) {
        request(server)
            .post('/')
            .expect(200)
            .end(function (err, res) {
                if (err) return done(err);
                expect(res.text).to.include('<title>PH3AR Terminal</title>');
                done();
            });
    });

    it('should serve jutty.js as a static file', function (done) {
        request(server)
            .get('/jutty.js')
            .expect(200)
            .end(function (err, res) {
                if (err) return done(err);
                expect(res.text).to.include('$(document).ready(function () {');
                done();
            });
    });

    it('should serve index.html as a static file', function (done) {
        request(server)
            .get('/index.html')
            .expect(200)
            .end(function (err, res) {
                if (err) return done(err);
                expect(res.text).to.include('<title>PH3AR Terminal</title>');
                done();
            });
    });

    it('should serve socket.io.js from the socket.io paths', function (done) {
        // Test that Socket.io is running correctly using a simple GET request
        // because we can't depend on socket.io-client without modifying package.json
        request(server)
            .get('/socket.io/socket.io.js')
            .expect(200)
            .end(function (err, res) {
                if (err) return done(err);
                expect(res.text).to.include('Socket');
                done();
            });
    });

    describe('Socket.io Terminal Events', function () {
        it('should handle terminal lifecycle (start, resize, input, disconnect) correctly', function () {
            // Find the connection listener registered by our setup
            const connectionListener = ioServer.sockets.listeners('connection')[0];
            expect(connectionListener).to.be.a('function');

            // Mock socket object
            const socketMock = {
                on: sinon.stub(),
                emit: sinon.stub()
            };

            // Trigger connection
            connectionListener(socketMock);

            // Extract registered callbacks
            const startCallback = socketMock.on.withArgs('start').args[0][1];
            const resizeCallback = socketMock.on.withArgs('resize').args[0][1];
            const inputCallback = socketMock.on.withArgs('input').args[0][1];
            const disconnectCallback = socketMock.on.withArgs('disconnect').args[0][1];

            expect(startCallback).to.be.a('function');

            // 1. Trigger 'start'
            startCallback({
                host: '127.0.0.1',
                port: '22',
                col: 100,
                row: 30
            });

            expect(ptyMock.spawn.calledOnce).to.be.true;
            expect(ptyMock.spawn.firstCall.args[0]).to.equal('telnet');
            expect(ptyMock.spawn.firstCall.args[1]).to.deep.equal(['127.0.0.1', '22']);
            expect(ptyMock.spawn.firstCall.args[2].cols).to.equal(100);

            // Extract the 'data' listener bound to termMock
            const termDataCallback = termMock.on.withArgs('data').args[0][1];

            // 2. Trigger 'resize'
            resizeCallback({ col: 120, row: 40 });
            expect(termMock.resize.calledOnce).to.be.true;
            expect(termMock.resize.calledWith(120, 40)).to.be.true;

            // 3. Trigger 'input'
            inputCallback('ls\n');
            expect(termMock.write.calledOnce).to.be.true;
            expect(termMock.write.calledWith('ls\n')).to.be.true;

            // 4. Trigger 'disconnect'
            disconnectCallback();
            expect(termMock.kill.calledOnce).to.be.true;
        });

        it('should safely reject invalid host inputs', function () {
            const connectionListener = ioServer.sockets.listeners('connection')[0];
            const socketMock = {
                on: sinon.stub(),
                emit: sinon.stub()
            };
            connectionListener(socketMock);
            const startCallback = socketMock.on.withArgs('start').args[0][1];

            // Reset pty mock
            ptyMock.spawn.resetHistory();

            startCallback({ host: '-invalid-host', port: '22' });

            // Spawn should not be called due to security validation
            expect(ptyMock.spawn.called).to.be.false;
            expect(socketMock.emit.calledWith('end')).to.be.true;
        });
    });
});
