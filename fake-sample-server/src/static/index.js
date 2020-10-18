//
"use strict";

var url = new URL(document.URL);
var hostname = url.hostname;
var port = url.port;

var ws = new WebSocket(`ws://${hostname}:${port}/sub`);
var msg_buf_max = 50;
var msg_buf = [];
var data_max = 255;
var chart;

function is_data_message(data) {
    if (Number.isInteger(data[0])) {
        return 1;
    }

    return 0;
}

ws.onmessage = function(event) {
    const data = JSON.parse(event.data);
    if (msg_buf.length >= msg_buf_max) {
        msg_buf.pop();
    }
    msg_buf.unshift(data);

    var serverDataElem = document.getElementById("serverData");
    if (serverDataElem) {
        var contents = msg_buf.join("<br/>\n");
        serverDataElem.innerHTML = contents;
    }

    if (is_data_message(data)) {
        if (chart) {
            if (chart.data.datasets[0].data.length >= data_max) {
                chart.data.datasets[0].data.shift();
                chart.data.labels.shift();
            }
            chart.data.datasets[0].data.push(data[1]);
            chart.data.labels.push(data[0]);
            chart.update();
        }
    }
};

function init_chart() {
    var labels = [];
    var line_data = [];

    msg_buf.forEach(function(item, index) {
        if (is_data_message(ite)) {
            labels.push(item[0]);
            line_data.push(item[1]);
        }
    });

    var chart_context = document.getElementById('dataCanvas').getContext('2d');
    chart = new Chart(chart_context, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'The data',
                data: line_data,
                fill: false,
                borderColor: "rgb(75, 192, 192)",
                lineTension: 0.1
            }]
        },
        options: {}
    });
}

window.addEventListener('load', (event) => {
    init_chart();

    var serverDataElem = document.getElementById("serverData");
    var previous = serverDataElem.innerHTML;
    serverDataElem.innerHTML = `ws://${hostname}:${port}/sub<br>${ws}`;
});
