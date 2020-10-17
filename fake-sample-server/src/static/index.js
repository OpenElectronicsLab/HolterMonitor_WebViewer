//
"use strict";

var url = new URL(document.URL);
var hostname = url.hostname;
var port = url.port;

var ws = new WebSocket(`ws://${hostname}:${port}/sub`);
var msg_buf_max = 50;
var msg_buf = [];
var msg_cnt = 0;

ws.onmessage = function(event) {
    msg_cnt++;
    const data = JSON.parse(event.data);
    msg_buf.unshift(data);
    if (msg_cnt > msg_buf_max) {
        msg_buf.pop();
    }

    var serverDataElem = document.getElementById("serverData");
    if (serverDataElem) {
        var contents = msg_buf.join("<br/>\n");
        serverDataElem.innerHTML = contents;
    }
};

window.addEventListener('load', (event) => {
    var serverDataElem = document.getElementById("serverData");
    var previous = serverDataElem.innerHTML;
    serverDataElem.innerHTML = `ws://${hostname}:${port}/sub<br>${ws}`;
});
