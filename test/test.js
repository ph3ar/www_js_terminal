const request = require('supertest');
const expect = require('chai').expect;
const assert = require('assert');

// Because native node-pty fails to load in test environment without full build,
// we will mock it before app.js requires it. This uses proxyquire.
const proxyquire = require('proxyquire');

process.env.PORT = 3001; // Avoid conflict with any running instance

const app = proxyquire('../app.js', {
  'node-pty': {
    spawn: () => ({
      on: () => {},
      write: () => {},
      resize: () => {},
      end: () => {},
      destroy: () => {}
    }),
    '@noCallThru': true
  },
  'optimist': {
    options: () => ({
      boolean: () => ({
        argv: { port: 3001, sslkey: null, sslcert: null, allow_discovery: false }
      })
    })
  }
});

describe('PH3AR Terminal API', function() {
    let server;

    before(function(done) {
        server = app.listen(3001, done);
    });

    after(function(done) {
        server.close(done);
    });

    it('should serve the main page on GET /', function(done) {
        request('http://localhost:3001')
            .get('/')
            .expect(200)
            .end(function(err, res) {
                if (err) return done(err);
                done();
            });
    });

    it('should serve /.well-known/ai-plugin.json', function(done) {
        request('http://localhost:3001')
            .get('/.well-known/ai-plugin.json')
            .expect(200)
            .end(function(err, res) {
                if (err) return done(err);
                expect(res.body.name_for_human).to.equal('PH3AR Terminal');
                done();
            });
    });

    it('should serve /.well-known/openapi.yaml', function(done) {
        request('http://localhost:3001')
            .get('/.well-known/openapi.yaml')
            .expect(200)
            .end(function(err, res) {
                if (err) return done(err);
                expect(res.text).to.include('openapi: 3.0.1');
                done();
            });
    });

    it('should allow static assets like jutty.js', function(done) {
        request('http://localhost:3001')
            .get('/jutty.js')
            .expect(200)
            .end(done);
    });
});
