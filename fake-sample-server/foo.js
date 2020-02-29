
var fs = require('fs'),
    http = require('http');

const hostname = 'localhost';
const port = 8080;

http.createServer(function (req, res) {
  fs.readFile(__dirname + "/static/" + req.url, function (err,data) {
    if (err) {
      res.writeHead(404);
      res.end(JSON.stringify(err));
      return;
    }
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end(data);
  });
}).listen(port, hostname, () => {
  console.log(`Node.js server is running on http://${hostname}:${port}/`);
});
