//
"use strict";

var ws;

var msg_buf_max = 50;
var msg_buf = [];

var expected_samples_per_second = 60;
var seconds_to_retain = 8;
var data_max = Math.ceil(expected_samples_per_second * seconds_to_retain);

const max_frames_per_second = 15;
const min_interval = 1000 / max_frames_per_second;
var last_update_ms = 0;

var chart;

function is_data_message(data) {
    if (Number.isInteger(data[0])) {
        return 1;
    }

    return 0;
}

function ws_on_message(event) {
    const data = JSON.parse(event.data);
    if (msg_buf.length >= msg_buf_max) {
        msg_buf.pop();
    }
    msg_buf.unshift(data);

    var do_update = 0;
    var now_ms = new Date();
    var elapsed_ms = now_ms - last_update_ms;
    if (elapsed_ms > min_interval) {
        do_update = 1;
    }

    if (do_update) {
        var serverDataElem = document.getElementById("serverData");
        if (serverDataElem) {
            var contents = msg_buf.join("<br/>\n");
            serverDataElem.innerHTML = contents;
        }
    }

    if (is_data_message(data)) {
        if (chart) {
            if (chart.data.datasets[0].data.length >= data_max) {
                chart.data.datasets[0].data.shift();
                chart.data.labels.shift();
            }
            chart.data.datasets[0].data.push(data[1]);
            chart.data.labels.push(data[0]);
            if (do_update) {
                chart.update();
            }
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

    var url = new URL(document.URL);
    var hostname = url.hostname;
    var port = url.port;
    ws = new WebSocket(`ws://${hostname}:${port}/sub`);
    ws.onmessage = ws_on_message;
});
