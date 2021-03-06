//
"use strict";

var ws;

var msg_buf_max = 50;
var msg_buf = [];

const expected_samples_per_second = 60;
const seconds_to_retain = 8;
const data_max = Math.ceil(expected_samples_per_second * seconds_to_retain);

var our_labels = [];
var our_data = [];
for (var i = 0; i < data_max; ++i) {
    our_labels.push("");
    our_data.push(0);
}


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
    const now_ms = new Date().getTime();
    const elapsed_ms = now_ms - last_update_ms;
    if (elapsed_ms > min_interval) {
        do_update = 1;
        last_update_ms = now_ms;
    }

    if (do_update) {
        var serverDataElem = document.getElementById("serverData");
        if (serverDataElem) {
            var contents = msg_buf.join("<br/>\n");
            serverDataElem.innerHTML = contents;
        }
    }

    if (is_data_message(data)) {
        if (our_data.length >= data_max) {
            our_data.shift();
            our_labels.shift();
        }

        const time_ms = data[1];
        const date = new Date(time_ms);
        const label = date.toISOString().substr(11, 11)
        our_labels.push(label);

        const signal_val = data[2];
        our_data.push(signal_val);
        if (do_update) {
            update_chart();
        }
    }
};

function update_chart() {
    var labels = ["", "", ""];
    var line_data = [-1, 1, 0];

    chart.data.labels = labels.concat(our_labels);
    chart.data.datasets[0].data = line_data.concat(our_data);
    chart.update();
}

function init_chart() {
    var chart_context = document.getElementById('dataCanvas').getContext('2d');
    chart = new Chart(chart_context, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'The data',
                data: [],
                fill: false,
                borderColor: "rgb(75, 192, 192)",
                lineTension: 0.1
            }]
        },
        options: {}
    });
    update_chart();
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
