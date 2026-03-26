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

    it('should serve index.html on POST /', function (done) {
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
});