const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire');

describe('Vercel API Handler Tests', function () {
    let apiHandler, appMock, setupSocketIoMock;

    beforeEach(function () {
        appMock = sinon.stub();
        setupSocketIoMock = sinon.stub().returns({ isIo: true });

        apiHandler = proxyquire('../api/index.js', {
            '../app.js': {
                app: appMock,
                setupSocketIo: setupSocketIoMock
            }
        });
    });

    it('should initialize socket.io on first use and attach to res.socket.server', function () {
        const req = {};
        const res = {
            socket: {
                server: {}
            }
        };

        apiHandler(req, res);

        expect(setupSocketIoMock.calledOnce).to.be.true;
        expect(setupSocketIoMock.calledWith(res.socket.server)).to.be.true;
        expect(res.socket.server.io.isIo).to.be.true;
        expect(appMock.calledOnce).to.be.true;
        expect(appMock.calledWith(req, res)).to.be.true;
    });

    it('should not re-initialize socket.io on subsequent uses', function () {
        const req = {};
        const res = {
            socket: {
                server: {
                    io: { isIo: true }
                }
            }
        };

        apiHandler(req, res);

        expect(setupSocketIoMock.called).to.be.false;
        expect(appMock.calledOnce).to.be.true;
        expect(appMock.calledWith(req, res)).to.be.true;
    });

    it('should safely handle missing res.socket without crashing', function () {
        const req = {};
        const res = {}; // No socket

        apiHandler(req, res);

        expect(setupSocketIoMock.called).to.be.false;
        expect(appMock.calledOnce).to.be.true;
        expect(appMock.calledWith(req, res)).to.be.true;
    });
});
