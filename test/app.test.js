const request = require('supertest');
const proxyquire = require('proxyquire');
const { expect } = require('chai');
const path = require('path');
const sinon = require('sinon');
const fs = require('fs');
const http = require('http');

describe('App Backend Tests', function() {
    let appModule;
    let app;
    let mockPty;
    let server;

    beforeEach(function() {
        // Clear require cache for app.js so proxyquire works cleanly
        delete require.cache[require.resolve('../app.js')];
    });

    before(function() {
        mockPty = {
            spawn: sinon.stub().returns({
                pid: 1234,
                on: sinon.stub(),
                resize: sinon.stub(),
                write: sinon.stub(),
                destroy: sinon.stub(),
                end: sinon.stub()
            })
        };

        // Suppress yalm logs during tests
        const mockYalm = {
            setLevel: sinon.stub(),
            info: sinon.stub(),
            error: sinon.stub()
        };

        // Mock process.argv
        process.argv = ['node', 'app.js', '-p', '3000'];

        // Disable callThru so pty.js doesn't try to load its native dependencies
        appModule = proxyquire.noCallThru().load('../app.js', {
            'pty.js': mockPty,
            'yalm': mockYalm,
            'express': require('express'),
            'body-parser': require('body-parser'),
            'http': require('http'),
            'https': require('https'),
            'path': require('path'),
            'socket.io': require('socket.io'),
            'fs': require('fs'),
            'optimist': require('optimist')
        });

        app = appModule.app;
        server = http.createServer(app);
    });

    after(function() {
        if (server) {
            server.close();
        }
    });

    it('should serve index.html statically with Cache-Control header', function(done) {
        request(app)
            .get('/')
            .expect(200)
            .expect('Cache-Control', /max-age=86400/) // 1 day in seconds
            .end(done);
    });

    it('should handle POST to / and serve jutty.html', function(done) {
        // Create a dummy public/jutty.html just for the test if it doesn't exist
        const juttyPath = path.join(__dirname, '../public/jutty.html');
        let createdDummy = false;
        if (!fs.existsSync(juttyPath)) {
            fs.writeFileSync(juttyPath, '<html>Dummy Jutty</html>');
            createdDummy = true;
        }

        request(app)
            .post('/')
            .expect(200)
            .end((err, res) => {
                if (createdDummy) {
                    fs.unlinkSync(juttyPath);
                }
                done(err);
            });
    });
});
