#!/usr/local/bin/node

const service = require ("os-service");
const fs = require('fs');

if (process.argv[2] == "--add") {
	var options = {
		displayName: "rtmplink",
		runLevels: [2,3,4,5],
		programArgs: ["--run"]
	};
	service.add ("obs-ws-service", options, function(error) {
		if (error)
			console.log(error);
	});
	process.exit();
} else if (process.argv[2] == "--remove") {
	service.remove ("obs-ws-service", function(error){ 
	if (error)
		console.trace(error);
	});
	process.exit();
} else if (process.argv[2] == "--run") {
	var logStream = fs.createWriteStream (process.argv[1] + ".log");

	service.run (logStream, function () {
		service.stop (0);
	});
}
var express = require('express');
var app = require('express')();
var http = require('http');
var path = require('path');
const { spawn } = require('child_process');
var killer = require('child_process').exec;
var server = http.createServer(app);
var io = require('socket.io').listen(server);

app.get('/', function(req, res) {
	res.sendFile(path.resolve(__dirname+'/../docs/rtmpCtrl.html'));
});

var slots = [];
var targets = [];
var sources = [];

io.sockets.on('connection', function (socket) {

	console.log('A client is connected!');
	
	for(var i in targets)
	{
		socket.emit('conf',i,targets[i],sources[i]);
	}
	
	socket.on('stop', function(slot){
		if( slots[slot] )
		{
			process.kill(slots[slot].pid);
		}
		else
		{
			console.log('nothing there');
		}
	});

	socket.on('start', function(slot,src,target){
		console.log('start'+src+':'+target);
		
		if( slots[slot] )
		{
			console.log('already there');
			return;
		}

		targets[slot]=target;
		sources[slot]=src;

		slots[slot] = spawn('ffmpeg', ['-progress','-','-v','quiet','-nostdin','-i','rtmp://127.0.0.1/'+src+'/live live=1','-c','copy','-f','flv',target],{shell: false});

		slots[slot].stdout.on('data', (data) => {
			io.sockets.emit('stat',slot,data);

		});

		slots[slot].stderr.on('data', (data) => {
			console.log('stderr: '+data);
		});

		slots[slot].on('close', (code) => {
			console.log(`child process exited with code ${code}`);
			delete slots[slot];
		});
		slots[slot].on('error', (code,text) => {
			console.log(`child process exited with error ${code} ${text}`);
		});
	});
	
	socket.emit('good');
});


server.listen(8082,'127.0.0.1');

//			if(/^win/.test(process.platform))
//				spawn("taskkill", ["/pid", ls.pid, '/f', '/t'])
//				else process.kill(ls.pid);
