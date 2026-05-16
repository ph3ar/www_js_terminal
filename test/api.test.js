const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire');

describe('Vercel API Tests', function() {
    let apiHandler;
    let appMock, setupSocketIoMock;

    beforeEach(function() {
        appMock = sinon.stub().returns('app_response');
        setupSocketIoMock = sinon.stub().returns('io_instance');

        const appModuleMock = {
            app: appMock,
            setupSocketIo: setupSocketIoMock,
            '@noCallThru': true,
            '@global': true
        };

        apiHandler = proxyquire('../api/index.js', {
            '../app.js': appModuleMock
        });
    });

    it('should initialize socket.io if it does not exist on res.socket.server', function() {
        const req = {};
        const res = {
            socket: {
                server: {}
            }
        };

        const result = apiHandler(req, res);

        expect(setupSocketIoMock.calledOnce).to.be.true;
        expect(setupSocketIoMock.calledWith(res.socket.server)).to.be.true;
        expect(res.socket.server.io).to.equal('io_instance');
        expect(appMock.calledOnce).to.be.true;
        expect(appMock.calledWith(req, res)).to.be.true;
        expect(result).to.equal('app_response');
    });

    it('should not initialize socket.io if it already exists on res.socket.server', function() {
        const req = {};
        const res = {
            socket: {
                server: {
                    io: 'existing_io_instance'
                }
            }
        };

        const result = apiHandler(req, res);

        expect(setupSocketIoMock.called).to.be.false;
        expect(res.socket.server.io).to.equal('existing_io_instance');
        expect(appMock.calledOnce).to.be.true;
        expect(appMock.calledWith(req, res)).to.be.true;
        expect(result).to.equal('app_response');
    });
});
