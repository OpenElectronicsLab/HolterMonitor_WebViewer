"use strict";

var fs = require('fs'),
    http = require('http'),
    WebSocket = require('ws');

const echoServerConnectMessage = '["Hello world"]';
const DEBUG = ((process.env.DEBUG !== undefined) && (process.env.DEBUG !== "0"));

function log_debug(server, msg) {
    if (DEBUG) {
        server.logger.log(msg);
    }
}

log_debug({
    logger: console
}, `DEBUG: ${DEBUG}`);


function createEchoServer(hostname, port, logger) {

    const server = http.createServer(function(req, res) {
        var filename = __dirname + "/static/" + req.url;
        log_debug(server, `serving ${filename}`);
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

    if (typeof logger === 'undefined' || logger === null) {
        server.logger = console;
    } else {
        server.logger = logger;
    }

    server.wss1 = new WebSocket.Server({
        noServer: true
    });

    server.receivers = new Set();

    server.on('upgrade', function upgrade(request, socket, head) {
        const pathname = request.url;
        if (pathname === '/sub') {
            server.wss1.handleUpgrade(request, socket, head, function done(ws) {
                log_debug(server, `adding receiver`);
                server.receivers.add(ws);
                ws.on('close', function clear() {
                    log_debug(server, `removing receiver`);
                    server.receivers.delete(ws);
                });
                log_debug(server, `sending echoServerConnectMessage`);
                ws.send(echoServerConnectMessage);
            });
        } else if (pathname == '/pub') {
            server.wss1.handleUpgrade(request, socket, head, function done(ws) {
                ws.on('message', function incoming(data) {
                    log_debug(server, `sending to ${server.receivers.size} receivers`);
                    log_debug(server, `   data: ${data}`); // log_trace?
                    server.receivers.forEach((rws) => {
                        rws.send(data);
                    });
                });
            });
        } else {
            log_debug(server, `calling socket.destroy`);
            socket.destroy();
        }
    });

    server.on('close', function() {
        server.logger.log(`closing server is running on ${hostname}:${port}`);
    });

    server.listen(port, hostname, () => {
        server.logger.log(`Node.js server is running on ${hostname}:${port}`);
    });

    return server;
}

exports.echoServerConnectMessage = echoServerConnectMessage;
exports.createEchoServer = createEchoServer;
