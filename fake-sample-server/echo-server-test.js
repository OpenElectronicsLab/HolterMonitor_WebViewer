"use strict";

var fs = require('fs'),
    http = require('http'),
    assert = require('assert'),
    WebSocket = require('ws'),
    echoServer = require('./echo-server.js');

const hostname = '127.0.0.1';
const port = 8080;
const testMaxMillis = (0.5 * 1000); // half second

function assertEquals(expected, actual) {
    if (expected !== actual) {
        console.error(`expected "${expected}" but was "${actual}"`);
        assert(false);
    }
}

function assertContains(needle, haystack) {
    if (haystack.indexOf(needle) == -1) {
        console.error(`expected "${needle}" in "${haystack}"`);
        assert(false);
    }
}

function testSocketReceive(callback) {
    const ws = new WebSocket(`ws://${hostname}:${port}/sub`);
    ws.on('message', function incoming(data) {
        var pageString = data.toString();
        assertContains(echoServer.echoServerConnectMessage, pageString);
        ws.terminate();
        callback();
    });
}

function testEcho(callback) {
    const wssub = new WebSocket(`ws://${hostname}:${port}/sub`);
    const wspub = new WebSocket(`ws://${hostname}:${port}/pub`);

    var expected = [
        echoServer.echoServerConnectMessage,
        "one",
        "two",
    ];
    var cnt = 0;

    wssub.on('message', function incoming(data) {
        var pageString = data.toString();
        assertContains(expected[cnt], pageString);

        cnt++;

        if (cnt < expected.length) {
            wspub.send(expected[cnt]);
        } else {
            wssub.terminate();
            wspub.terminate();
            callback();
        }
    });
}


function testParallelReceive(callback) {
    var wssubs = [];
    const wspub = new WebSocket(`ws://${hostname}:${port}/pub`);

    var expected = [
        "one",
        "two",
        "three",
    ];
    var messagesBySocket = [];
    var sendCount = 0;
    var receiveCount = 0;

    function assertAllMessagesExpected() {
        assertEquals(messagesBySocket.length, expected.length);
        // assertions go here
        var i, j;
        for (i = 0; i < messagesBySocket.length; ++i) {
            var numMessagesExpected = expected.length + 1 - i;
            assertEquals(messagesBySocket[i].length, numMessagesExpected);
            assertEquals(messagesBySocket[i][0], echoServer.echoServerConnectMessage);
            for (j = 1; j < numMessagesExpected; ++j) {
                var expMsg = expected[j + i - 1];
                assertEquals(messagesBySocket[i][j], expMsg);
            }
        }
    };

    function createSocket() {
        var newws = new WebSocket(`ws://${hostname}:${port}/sub`);
        wssubs.push(newws);
        var messages = [];
        newws.on('message', recorderCallback(messages));
        messagesBySocket.push(messages);
    }

    function recorderCallback(messageList) {
        return (data) => {
            var pageString = data.toString();
            messageList.push(pageString);

            if (pageString == echoServer.echoServerConnectMessage) {
                return;
            }

            receiveCount++;
            if (receiveCount >= wssubs.length) {
                sendCount++;
                receiveCount = 0;
                if (sendCount < expected.length) {
                    createSocket();
                    wspub.send(expected[sendCount]);
                } else {
                    assertAllMessagesExpected();
                    wssubs.forEach((ws) => {
                        ws.terminate();
                    });
                    wspub.terminate();
                    callback();
                }
            }
        };
    };

    createSocket();
    wspub.on('open', () => {
        wspub.send(expected[0]);
    });
}


function testIndexPage(callback) {
    const options = {
        hostname: hostname,
        port: port,
        path: '/index.html',
        method: 'GET'
    }
    const req = http.request(options, res => {
        res.on('data', data => {
            var pageString = data.toString();
            assertContains("Test page", pageString);
            callback();
        })
    })
    req.end();
}

function runTests(tests) {
    assert(Array.isArray(tests));
    var numTestsExpected = tests.length;
    var numTestsCalled = 0;
    var testStartMillis = Date.now();
    var theTest = function() {
        console.log(`Ran ${numTestsCalled}/${numTestsExpected} tests`)
        assertEquals(numTestsExpected, numTestsCalled);
        var testEndMillis = Date.now();
        var testTimeMillis = testEndMillis - testStartMillis;
        console.log(`time: ${testTimeMillis}`);
        console.log('*** tests pass ***');
        process.exit(0);
    };

    while (tests.length) {
        let currentTest = tests.pop();
        let nextTest = theTest;
        theTest = function() {
            console.log('* ' + currentTest.name);
            ++numTestsCalled;
            currentTest((test) => {
                nextTest(test);
            });
        }
    }
    theTest();
}


echoServer.createEchoServer(hostname, port);

runTests(
    [
        testIndexPage,
        testSocketReceive,
        testEcho,
        testParallelReceive,
    ]
);

setInterval((function() {
    console.log('####### Timeout exceeded ########');
    process.exit(1);
}), testMaxMillis);
