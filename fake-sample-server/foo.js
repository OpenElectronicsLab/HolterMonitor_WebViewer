"use strict";
var fs = require('fs'),
    http = require('http'),
    assert = require('assert');

const hostname = '127.0.0.1';
const port = 8080;
const testMaxMillis = (1 * 1000);

http.createServer(function(req, res) {
    fs.readFile(__dirname + "/static/" + req.url, function(err, data) {
        if (err) {
            res.writeHead(404);
            res.end(JSON.stringify(err));
            return;
        }
        res.writeHead(200, {
            'Content-Type': 'text/html'
        });
        res.end(data);
    });
}).listen(port, hostname, () => {
    console.log(`Node.js server is running on http://${hostname}:${port}/`);
});

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
            assert(pageString.indexOf("Test page") !== -1);
            assert(pageString.match(/Test page/));
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
        assert(numTestsCalled == numTestsExpected);
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
            ++numTestsCalled;
            currentTest(nextTest);
        }
    }
    theTest()
}


runTests(
    [
        testIndexPage,
    ]
)

setInterval((function() {
    console.log('####### Timeout exceeded ########');
    process.exit(1);
}), testMaxMillis);