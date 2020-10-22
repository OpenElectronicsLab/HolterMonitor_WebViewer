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
var samples_per_second = 60;
var interval_ms = 1000 / samples_per_second;
var seconds_per_cycle = 4;
var ticks_per_cycle = seconds_per_cycle * 1000 / interval_ms;

setInterval(() => {
    loop_counter++;
    ticks_counter++;
    const time_ms = new Date().getTime();
    const radians = ticks_counter * 2 * Math.PI / ticks_per_cycle;
    const signal_val = Math.sin(radians);
    const message = `[${loop_counter},${time_ms},${signal_val}]`;
    try {
        wspub.send(message);
    } catch (err) {
        console.log(err.message);
    }
    if (ticks_counter > ticks_per_cycle) {
        console.log(`completed a cycle, loop_counter: ${loop_counter}\n`);
        ticks_counter = ticks_counter - ticks_per_cycle;
    }
}, interval_ms);
