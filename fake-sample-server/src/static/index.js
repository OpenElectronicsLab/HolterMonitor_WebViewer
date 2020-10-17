//
"use strict";

var url = new URL(document.URL);
var hostname = url.hostname;
var port = url.port;

var ws = new WebSocket(`ws://${hostname}:${port}/sub`);

ws.onmessage = function(event) {
    // const data = JSON.parse(event.data);
    var serverDataElem = document.getElementById("serverData");
    if (serverDataElem) {
        var previous = serverDataElem.innerHTML;
        serverDataElem.innerHTML = `${event.data}<br/>${previous}`;
    }
};

window.addEventListener('load', (event) => {
    var serverDataElem = document.getElementById("serverData");
    var previous = serverDataElem.innerHTML;
    serverDataElem.innerHTML = `ws://${hostname}:${port}/sub<br>${ws}`;
});
