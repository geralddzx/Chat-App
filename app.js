var http = require('http'),
  socketio = require('socket.io'),
  static = require('node-static'),
  chat = require('./lib/chat_server.js');

var file = new static.Server('./public');
  
var server = http.createServer(function(req,res){
  req.addListener('end', function () {
    file.serve(req, res);
  }).resume();
}).listen(8000);

chat.createServer(server);