#!/usr/local/bin/node

var http = require('http');
var server = http.createServer();
var io = require('socket.io').listen(server);

var state = 'A';
var count = 0;




io.sockets.on('connection', function (socket) {
	count++;
	
	console.log('A client is connected! '+count);
	
	socket.broadcast.emit('state',state,count);
	
	socket.on('ctrl', function(newstate){
		state = newstate;
		socket.broadcast.emit('state',state,count);
	});
	socket.on("disconnect", function(){
		count--;
	});
});


server.listen(23231,'127.0.0.1');

