var http = require('http');
var OBSWebSocket = require('obs-websocket-js');
var obs = new OBSWebSocket();

obs.connect({ address: 'localhost:4444', password: 'websocketpw' })
	.then(() => {
		console.log('Success! We\'re connected & authenticated.');
		return obs.getSceneList({});
	})
	.then(data => {
		//console.log(`${data.scenes.length} Available Scenes!`);
		data.scenes.forEach(scene => {
			if (scene.name !== data.currentScene) {
				//console.log('Found a different scene! Switching to Scene:', scene.name);
				//obs.setCurrentScene({'scene-name': scene.name});
			}
		});
	
	
	})
	.catch(err => { // Ensure that you add a catch handler to every Promise chain.
		console.log('ERROR:'+err);
	});

var server = http.createServer(function(req, res) {
	res.writeHead(200, {"Content-Type": "text/plain"});
	res.end('');
});

var io = require('socket.io').listen(server);

// When a client connects, we note it in the console
io.sockets.on('connection', function (socket) {
	console.log('A client is connected!');
		
	obs.getCurrentScene({}).then(data => {
		socket.emit('sources',data.sources);
	}).catch(err => { 
		console.log(err);
	});
	
	socket.on('obs_pos', function(scene,source,x,y,w,h){
		console.log('pos: ' + scene + ' ' + source);
		
		obs.getCurrentScene({}).then(data => {
			data.sources.forEach(source2 => {
				if (source2.name == source) {
					if(source2.source_cx != 0)
					{
						if(source2.source_cx != 960)
						{
							console.log('TYG:', 960/source2.source_cx);
							w=w*(960/source2.source_cx);
							h=h*(540/source2.source_cy);
						}
					}
				}
			});
			
			obs.setSceneItemPosition({
				'scene-name': scene,
				'item': source,
				'x': x,
				'y': y
			}).then(data => {
				//console.log(data.status);
			}).catch(err => { 
				console.log(err);
			});
			
			obs.setSceneItemTransform({
				'scene-name': scene,
				'item': source,
				'rotation':0,
				'x-scale': w,
				'y-scale': h
			}).then(data => {
				//console.log(data.status);
			}).catch(err => { 
				console.log(err);
			});
	
		}).catch(err => { 
			console.log(err);
		});
//
//	obs.getSceneList({}).then(data => {
//			console.log(`${data.scenes.length} Available Scenes!`);
//			data.scenes.forEach(scene => {
//				if (scene.name !== data.currentScene) {
//					console.log('Found a different scene! Switching to Scene:', scene.name);
//					//obs.setCurrentScene({'scene-name': scene.name});
//				}
//			});
//		}).catch(err => { // Ensure that you add a catch handler to every Promise chain.
//			console.log(err);
//		});
//		obs.enableStudioMode({}).then(data => {
//			console.log(`${data} SM!`);
//		}).catch(err => { // Ensure that you add a catch handler to every Promise chain.
//			console.log(err);
//		});
	});
	socket.on('ctrl', function(item,value){
		socket.broadcast.emit('ctrl',item,value);
	});
});


server.listen(8080);
