#!/usr/local/bin/node

var http = require('http');
var server = http.createServer();
var server2 = http.createServer();
var io = require('socket.io').listen(server);
var io2 = require('socket.io').listen(server2);

var state = 'A';
var count = 0;

io.sockets.on('connection', function (socket) {
	count++;
	
	console.log('A client is connected! '+count);
	
	socket.emit('state',state,count);
	socket.broadcast.emit('state',state,count);
	
	socket.on("disconnect", function(){
		count--;
		io.sockets.emit('state',state,count);
	});
});

io2.sockets.on('connection', function (socket) {
	
	console.log('A ctrl is connected! '+count);
	
	socket.on('ctrl', function(newstate){
	
		if(state !== newstate){
			state = newstate;
			socket.emit('ack');
			io.sockets.emit('state',state,count);
			console.log(state);
		};
	});
});


server.listen(23231,'127.0.0.1');
server2.listen(23232,'127.0.0.1');

