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

var samples_per_second = 0;
if (process.argv.length > 2 && Number(process.argv[2])) {
    samples_per_second = process.argv[2];
}
if (samples_per_second <= 0) {
    samples_per_second = 60;
}

console.log(`samples_per_second: ${samples_per_second}`);

const seconds_per_cycle = 4;
console.log(`cycle every ${seconds_per_cycle} seconds`);

const ticks_per_cycle = seconds_per_cycle * samples_per_second;
console.log(`data points per cycle: ${ticks_per_cycle}`);

const interval_ms = Math.max(1, 1000 / samples_per_second);
console.log(`timer interval ms: ${interval_ms}`);

var last_update_time_ms = new Date().getTime();
const sample_interval_ms = 1000 / samples_per_second;

console.log("begining ...");
setInterval(() => {
    const new_update_time = new Date().getTime();
    while (last_update_time_ms + sample_interval_ms <= new_update_time) {
        loop_counter++;
        ticks_counter++;
        last_update_time_ms += sample_interval_ms;
        const radians = ticks_counter * 2 * Math.PI / ticks_per_cycle;
        const signal_val = Math.sin(radians);
        const msg = `[${loop_counter},${last_update_time_ms},${signal_val}]`;
        try {
            wspub.send(msg);
        } catch (err) {
            console.log(err.message);
        }
    }
    if (ticks_counter > ticks_per_cycle) {
        console.log(`completed a cycle, loop_counter: ${loop_counter}`);
        ticks_counter = ticks_counter - ticks_per_cycle;
    }
}, interval_ms);
