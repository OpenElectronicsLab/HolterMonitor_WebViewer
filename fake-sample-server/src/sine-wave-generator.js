"use strict";

var fs = require('fs'),
    http = require('http'),
    WebSocket = require('ws'),
    echoServer = require('./echo-server.js');

const hostname = '127.0.0.1';
const port = 8080;

var wspub = new WebSocket(`ws://${hostname}:${port}/pub`);
var loop_counter = 0;
var ticks_counter = 0;
var interval_ms = 100;
var seconds_per_cycle = 4;
var ticks_per_cycle = seconds_per_cycle * 1000 / interval_ms;

setInterval(() => {
    loop_counter++;
    ticks_counter++;
    var radians = ticks_counter * 2 * Math.PI / ticks_per_cycle;
    var message = `${loop_counter},${Math.sin(radians)}`;
    wspub.send(message);
    if (ticks_counter > ticks_per_cycle) {
        console.log("completed a cycle\n");
        ticks_counter = ticks_counter - ticks_per_cycle;
    }
}, interval_ms);
