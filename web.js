var express = require('express');
var fs = require('fs');
var app = express();

var buf = fs.readFileSync('index.html');
var out = buf.toString('utf-8');

app.get('/', function(request, response) {
  response.send(out);
});

app.use("/js", express.static(__dirname + '/js'));
app.use("/img", express.static(__dirname + '/img'));
app.use("/pde", express.static(__dirname + '/pde'));
app.use(express.bodyParser({keepExtensions: true, uploadDir:__dirname + '/uploads'}));
app.post('/uploads', function(req, res) {
    console.log("Request Method:" + req.method);
    console.log("Request URL:" + req.url);
    console.log("Request img:" + req.body);
   
});

var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Listening on " + port);
});
