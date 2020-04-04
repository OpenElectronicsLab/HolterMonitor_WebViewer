"use strict";

var fs = require('fs'),
    http = require('http'),
    WebSocket = require('ws');

const echoServerConnectMessage = 'Hello world';

function createEchoServer(hostname, port) {

    const server = http.createServer(function(req, res) {
        fs.readFile(__dirname + "/static/" + req.url, function(err, data) {
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
                ws.send(echoServerConnectMessage);
                receivers.add(ws);
                ws.on('close', function clear() {
                    receivers.delete(ws);
                });
            });
        } else if (pathname == '/pub') {
            wss1.handleUpgrade(request, socket, head, function done(ws) {
                ws.on('message', function incoming(data) {
                    receivers.forEach((rws) => {
                        rws.send(data);
                    });
                });
            });
        } else {
            socket.destroy();
        }
    });

    server.listen(port, hostname, () => {
        console.log(`Node.js server is running on http://${hostname}:${port}/`);
    });

    return server;
}

exports.echoServerConnectMessage = echoServerConnectMessage;
exports.createEchoServer = createEchoServer;
