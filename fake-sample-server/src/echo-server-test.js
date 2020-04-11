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
    const server = echoServer.createEchoServer(hostname, port);
    server.on('listening', function() {
        const ws = new WebSocket(`ws://${hostname}:${port}/sub`);
        ws.on('message', function incoming(data) {
            var pageString = data.toString();
            assertContains(echoServer.echoServerConnectMessage, pageString);
            ws.terminate();
            server.close();
            callback();
        });
    });
}

function testEcho(callback) {
    const server = echoServer.createEchoServer(hostname, port);

    var expected = [
        "one",
        "two",
    ];
    var cnt = 0;

    var wspub;
    var wssub;
    server.on('listening', function() {
        wssub = new WebSocket(`ws://${hostname}:${port}/sub`);
        wssub.on('open', function() {
            wspub = new WebSocket(`ws://${hostname}:${port}/pub`);
            wspub.on('open', function() {
                wssub.on('message', function(data) {
                    var pageString = data.toString();
                    if (pageString != echoServer.echoServerConnectMessage) {
                        assertContains(expected[cnt], pageString);
                        cnt++;

                        if (cnt < expected.length) {
                            wspub.send(expected[cnt]);
                        } else {
                            wssub.terminate();
                            wspub.terminate();
                            server.close();
                            callback();
                        }
                    }
                });
                wspub.send(expected[0]);
            });
        });
    });
}


function testParallelReceive(callback) {
    const server = echoServer.createEchoServer(hostname, port);
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

    function createWebSocket() {
        var newws = new WebSocket(`ws://${hostname}:${port}/sub`);
        wssubs.push(newws);
        var messages = [];
        newws.on('message', recorderCallback(messages));
        messagesBySocket.push(messages);
        return newws;
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
                    var socket = createWebSocket();
                    socket.on("open", function() {
                        wspub.send(expected[sendCount]);
                    });
                } else {
                    assertAllMessagesExpected();
                    wssubs.forEach((ws) => {
                        ws.terminate();
                    });
                    wspub.terminate();
                    server.close();
                    callback();
                }
            }
        };
    };

    wspub.on('open', () => {
        var ws_sub_one = createWebSocket();
        ws_sub_one.on('open', function() {
            wspub.send(expected[0]);
        });
    });
}


function testIndexPage(callback) {
    const server = echoServer.createEchoServer(hostname, port);
    const options = {
        hostname: hostname,
        port: port,
        path: '/index.html',
        method: 'GET'
    }
    server.on('listening', function() {
        const req = http.request(options, res => {
            res.on('data', data => {
                var pageString = data.toString();
                assertContains("Test page", pageString);
                server.close();
                callback();
            });
        });
        req.end();
    });
}

function runTests(tests) {
    // console.log(process.versions);
    // console.log(`WebSocket.version ${WebSocket.version}`);
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
