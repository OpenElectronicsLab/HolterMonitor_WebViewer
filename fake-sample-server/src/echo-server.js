"use strict";

var fs = require('fs'),
    http = require('http'),
    WebSocket = require('ws');

const echoServerConnectMessage = 'Hello world';
const DEBUG = ((process.env.DEBUG !== undefined) && (process.env.DEBUG !== "0"));

var logger = console;

function log_debug(msg) {
    if (DEBUG) {
        logger.log(msg);
    }
}

log_debug(`DEBUG: ${DEBUG}`);

function createEchoServer(hostname, port) {

    const server = http.createServer(function(req, res) {
        var filename = __dirname + "/static/" + req.url;
        log_debug(`serving ${filename}`);
        fs.readFile(filename, function(err, data) {
            if (err) {
                res.writeHead(404);
                res.end(JSON.stringify(err));
                return;
            }
            res.writeHead(200, {
                'Content-Type': 'text/html'
            });
            res.end(data);
        });
    });

    const wss1 = new WebSocket.Server({
        noServer: true
    });

    var receivers = new Set();

    server.on('upgrade', function upgrade(request, socket, head) {
        const pathname = request.url;
        if (pathname === '/sub') {
            wss1.handleUpgrade(request, socket, head, function done(ws) {
                log_debug(`adding receiver`);
                receivers.add(ws);
                ws.on('close', function clear() {
                    log_debug(`removing receiver`);
                    receivers.delete(ws);
                });
                log_debug(`sending echoServerConnectMessage`);
                ws.send(echoServerConnectMessage);
            });
        } else if (pathname == '/pub') {
            wss1.handleUpgrade(request, socket, head, function done(ws) {
                ws.on('message', function incoming(data) {
                    log_debug(`sending to ${receivers.size} receivers`);
                    log_debug(`   data: ${data}`); // log_trace?
                    receivers.forEach((rws) => {
                        rws.send(data);
                    });
                });
            });
        } else {
            log_debug(`calling socket.destroy`);
            socket.destroy();
        }
    });

    server.on('close', function() {
        logger.log(`closing server is running on ${hostname}:${port}`);
    });

    server.listen(port, hostname, () => {
        logger.log(`Node.js server is running on ${hostname}:${port}`);
    });

    return server;
}

exports.echoServerConnectMessage = echoServerConnectMessage;
exports.createEchoServer = createEchoServer;
exports.echoServerLogger = logger;
