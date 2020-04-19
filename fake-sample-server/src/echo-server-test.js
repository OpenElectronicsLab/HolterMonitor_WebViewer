"use strict";

var fs = require('fs'),
    http = require('http'),
    assert = require('assert'),
    WebSocket = require('ws'),
    echoServer = require('./echo-server.js');

const hostname = '127.0.0.1';
const port = 8080;
const testMaxMillis = (0.5 * 1000); // half second

function logger() {
    var DEBUG = ((process.env.DEBUG !== undefined) &&
        (process.env.DEBUG !== "0"));

    var VERBOSE = ((process.env.VERBOSE !== undefined) &&
        (process.env.VERBOSE !== "0"));

    if (DEBUG || VERBOSE) {
        return console;
    } else {
        return {
            log: function() {}
        }
    };
}


// test infra

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

async function runTests(tests) {
    var numTestsExpected = tests.length;
    var numTestsCalled = 0;
    var testStartMillis = Date.now();

    var intervalId = setInterval((function() {
        console.log('####### Timeout exceeded ########');
        process.exit(1);
    }), testMaxMillis);

    while (tests.length) {
        ++numTestsCalled;
        var func = tests.shift();
        console.log(func.name);
        await new Promise(func);
        // console.log(`ok ${func.name}`);
    }

    console.log(`Ran ${numTestsCalled}/${numTestsExpected} tests`)
    assertEquals(numTestsExpected, numTestsCalled);
    var testEndMillis = Date.now();
    var testTimeMillis = testEndMillis - testStartMillis;
    console.log(`time: ${testTimeMillis}`);
    console.log('*** tests pass ***');
    clearInterval(intervalId);
}

function promisedEvent(obj, eventName) {
    return new Promise((onSuccess, onFailure) => {
        async function func(...varargs) {
            obj.removeListener(eventName, func);
            onSuccess(varargs);
        };
        obj.on(eventName, func);
    });
}

// test functions

const testModules = [

    async function testIndexPage(onsuccess, onfail) {
        const server = echoServer.createEchoServer(hostname, port, logger());
        await promisedEvent(server, 'listening');

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
                server.close(onsuccess);
            });
        });
        req.end();
    },

    async function testSocketReceive(onsuccess, onfailure) {
        const server = echoServer.createEchoServer(hostname, port, logger());
        await promisedEvent(server, 'listening');

        const ws = new WebSocket(`ws://${hostname}:${port}/sub`);
        var message = await promisedEvent(ws, 'message');
        var pageString = message[0].toString();
        assertContains(echoServer.echoServerConnectMessage, pageString);
        ws.close();
        server.close(onsuccess);
    },

    async function testEcho(onsuccess, onfailure) {
        const server = echoServer.createEchoServer(hostname, port, logger());
        await promisedEvent(server, 'listening');

        var expected = [
            "one",
            "two",
        ];

        assertEquals(0, server.receivers.size);
        var wssub = new WebSocket(`ws://${hostname}:${port}/sub`);
        // assert echoServer.echoServerConnectMessage in promise?
        await promisedEvent(wssub, 'open');
        assertEquals(1, server.receivers.size);

        var wspub = new WebSocket(`ws://${hostname}:${port}/pub`);
        await promisedEvent(wspub, 'open');
        assertEquals(1, server.receivers.size);

        for (var cnt = 0; cnt < expected.length; ++cnt) {
            var gotData = promisedEvent(wssub, 'message');

            wspub.send(expected[cnt]);

            var data = await gotData;
            var pageString = data.toString();
            assertContains(expected[cnt], pageString);
        }

        wssub.close();
        wspub.close();
        server.close(onsuccess);
    },

    async function testParallelReceive(onsuccess, onfailure) {
        const server = echoServer.createEchoServer(hostname, port, logger());
        await promisedEvent(server, 'listening');

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
                            ws.close();
                        });
                        wspub.close();
                        server.close(onsuccess);
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
    },
];

runTests(testModules);
