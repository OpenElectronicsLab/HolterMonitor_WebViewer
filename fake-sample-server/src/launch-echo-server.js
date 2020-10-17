"use strict";

var fs = require('fs'),
    http = require('http'),
    assert = require('assert'),
    WebSocket = require('ws'),
    echoServer = require('./echo-server.js');

const hostname = '127.0.0.1';
const port = 8080;

function logger() {
    return console;
}

const server = echoServer.createEchoServer(hostname, port, logger());

// trap interrupt? to call server.close(onsuccess);
