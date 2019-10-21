

const fs = require('fs');




var midi = require('midi');
var http = require('http');
var querystring = require('querystring');
var OBSWebSocket = require('obs-websocket-js');
const { spawn } = require('child_process');
var killer = require('child_process').exec;
var server = http.createServer(function(req, res) {
	res.writeHead(200, {"Content-Type": "text/plain"});
	res.end('');
});
var io = require('socket.io').listen(server);
var obs = new OBSWebSocket();
var activeSlot = 1;
var slots = [['d1',0,0],['d2',0,0],['d3',0,0],['d4',0,0],['d5',0,0],['d6',0,0],['player1',0,0],['player2',0,0],['player3',0,0],['player4',0,0],['player5',0,0],['player6',0,0]];
var player = [];
var obs_config = {
					'ticker1text':'<img align="top" src="http://icons.iconarchive.com/icons/limav/flat-gradient-social/256/Twitter-icon.png" height="25"/> @sebseb7',
					'ticker2text':'<img align="top" src="https://cdn1.iconfinder.com/data/icons/logotypes/32/youtube-512.png" height="25"/> /c/sebGreen',
					'ticker3text':'',
					'ticker4text':'',
					'banner1text':'',
					'banner1rtext':'',
					'banner1':'out',
					'clock1live':'off',
					'timezone':'none',
					'clock1':'in',
					'clockpos':960,
					'cube1':'in',
					'ticker1':'out',
					'stream1_url':'',
					'stream1_desc':'',
					'stream1_state':'',
					'stream2_url':'',
					'stream2_desc':'',
					'stream2_state':'',
					'stream3_url':'',
					'stream3_desc':'',
					'stream3_state':'',
					'stream4_url':'',
					'stream4_desc':'',
					'stream4_state':'',
					'stream5_url':'',
					'stream5_desc':'',
					'stream5_state':'',
					'stream6_url':'',
					'stream6_desc':'',
					'stream6_state':'',
					'win_config':[
						[[0],[12],[11],[10]],
						[[0],[9],[8],[7]],
						[[0],[6],[5],[4]],
						[[0],[3],[2],[1]],

						[[0],[11],[5],[4]],
						[[12],[10],[3],[2]],
						[[9],[8],[1],[1]],
						[[7],[6],[1],[1]],

						[[0],[0],[2],[2]],
						[[8],[7],[2],[2]],
						[[6],[5],[1],[1]],
						[[4],[3],[1],[1]],

						[[7],[5],[2],[2]],
						[[6],[4],[2],[2]],
						[[3],[3],[1],[1]],
						[[3],[3],[1],[1]],

						[[0],[0],[4],[2]],
						[[0],[0],[1],[1]],
						[[0],[8],[1],[1]],
						[[7],[6],[5],[3]],

						[[8],[7],[3],[2]],
						[[6],[1],[1],[1]],
						[[5],[1],[1],[1]],
						[[4],[1],[1],[1]],

						[[8],[1],[1],[1]],
						[[7],[1],[1],[1]],
						[[6],[1],[1],[1]],
						[[5],[4],[3],[2]],

						[[1],[1],[1],[1]],
						[[1],[1],[1],[1]],
						[[1],[1],[1],[1]],
						[[1],[1],[1],[1]],
					]
};
fs.readFile('settings.json', (err, data) => {
	if (!err) {
		var json1 = JSON.parse(data);
		obs_config=json1.config;
		obs_config.stream1_state='';
		obs_config.stream2_state='';
		obs_config.stream3_state='';
		obs_config.stream4_state='';
		obs_config.stream5_state='';
		obs_config.stream6_state='';
	}else{
	
		fs.writeFile('settings.json', '{"config":'+JSON.stringify(obs_config,null,2)+'}', 'utf8', function(){});
	};

});


function update_leds()
{
	obs.sendCallback('GetCurrentScene',{},function(error,data){
		data.sources.forEach(source2 => {
			for (var nr of [1,2,3,4,5,6,7,8,9,10,11,12])
			{
				if (source2.name == slots[nr-1][0]) {

					io.sockets.emit('slot_state',nr,source2.render);
				}
			}
		});
	});
}

function disable_win(nr)
{
	console.log("off slot:"+nr);
	
	obs.send('SetSceneItemProperties',{
		'scene-name': 'main',
		'item': slots[nr-1][0],
		'visible': false,
		'locked': true
	});
	
	update_leds();
}

function toggle_win(nr)
{
	obs.sendCallback('GetCurrentScene',{},function(error,data){
		data.sources.forEach(source2 => {
			if (source2.name == slots[nr-1][0]) {

				if(source2.render == false)
				{
					console.log("on: slot:"+nr);
			
					obs.send('SetSceneItemProperties',{
						'scene-name': 'main',
						'item': slots[nr-1][0],
						'visible': true,
						'locked': false
					});
					update_leds();
				}
				else
				{
					disable_win(nr);
				}
			}
		});
	});
}

function win_get_x(nr)
{
	for (var x of [0,1,2,3])//zeile
	{
		for (var y of [0,1,2,3])//spalte
		{
			if(obs_config.win_config[x][y]==nr) return 1280/4*y;
		}
	}
	return 1280;
}
function win_get_xMax(nr)
{
	for (var x of [3,2,1,0])//zeile
	{
		for (var y of [3,2,1,0])//spalte
		{
			if(obs_config.win_config[x][y]==nr) return 1280/4*(y+1);
		}
	}
	return 1280+(1280/4);
}
function win_get_y(nr)
{
	for (var x of [0,1,2,3])//zeile
	{
		for (var y of [0,1,2,3])//spalte
		{
			if(obs_config.win_config[x][y]==nr) return 720/4*x;
		}
	}
	return 720;
}
function win_get_yMax(nr)
{
	for (var x of [3,2,1,0])//zeile
	{
		for (var y of [3,2,1,0])//spalte
		{
			if(obs_config.win_config[x][y]==nr) return 720/4*(x+1);
		}
	}
	return 720+(720/4);
}
	
function playlog(url) {

	return;

	const postData = querystring.stringify({
		'url': url,
		'date': new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
	});
	const options = {
		hostname: '127.0.0.1',
		port: 8082,
		path: '/playlog',
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'Content-Length': Buffer.byteLength(postData)
		}
	};

	const req = http.request(options, (res) => {
		res.setEncoding('utf8');
	});
	req.on('error', function(e) {
		console.error(e);
	});
	req.write(postData);
	req.end();
}

function set_win_active(nr)
{
	activeSlot = nr;
	console.log('active slot:'+nr);


	set_win_pos(nr,'main',slots[nr-1][0],win_get_x(1),win_get_y(1),win_get_xMax(1),win_get_yMax(1),slots[nr-1][2]);
	set_win_pos((2==nr)?1:2,'main',slots[(2==nr)? 0 : 1][0],win_get_x(2),win_get_y(2),win_get_xMax(2),win_get_yMax(2),slots[(2==nr)?0:1][2]);
	set_win_pos((3==nr)?1:3,'main',slots[(3==nr)? 0 : 2][0],win_get_x(3),win_get_y(3),win_get_xMax(3),win_get_yMax(3),slots[(3==nr)?0:2][2]);
	set_win_pos((4==nr)?1:4,'main',slots[(4==nr)? 0 : 3][0],win_get_x(4),win_get_y(4),win_get_xMax(4),win_get_yMax(4),slots[(4==nr)?0:3][2]);
	set_win_pos((5==nr)?1:5,'main',slots[(5==nr)? 0 : 4][0],win_get_x(5),win_get_y(5),win_get_xMax(5),win_get_yMax(5),slots[(5==nr)?0:4][2]);
	set_win_pos((6==nr)?1:6,'main',slots[(6==nr)? 0 : 5][0],win_get_x(6),win_get_y(6),win_get_xMax(6),win_get_yMax(6),slots[(6==nr)?0:5][2]);
	set_win_pos((7==nr)?1:7,'main',slots[(7==nr)? 0 : 6][0],win_get_x(7),win_get_y(7),win_get_xMax(7),win_get_yMax(7),slots[(7==nr)?0:6][2]);
	set_win_pos((8==nr)?1:8,'main',slots[(8==nr)? 0 : 7][0],win_get_x(8),win_get_y(8),win_get_xMax(8),win_get_yMax(8),slots[(8==nr)?0:7][2]);
	set_win_pos((9==nr)?1:9,'main',slots[(9==nr)? 0 : 8][0],win_get_x(9),win_get_y(9),win_get_xMax(9),win_get_yMax(9),slots[(9==nr)?0:8][2]);
	set_win_pos((10==nr)?1:10,'main',slots[(10==nr)? 0 : 9][0],win_get_x(10),win_get_y(10),win_get_xMax(10),win_get_yMax(10),slots[(10==nr)?0:9][2]);
	set_win_pos((11==nr)?1:11,'main',slots[(11==nr)? 0 : 10][0],win_get_x(11),win_get_y(11),win_get_xMax(11),win_get_yMax(11),slots[(11==nr)?0:10][2]);
	set_win_pos((12==nr)?1:12,'main',slots[(12==nr)? 0 : 11][0],win_get_x(12),win_get_y(12),win_get_xMax(12),win_get_yMax(12),slots[(12==nr)?0:11][2]);


	io.sockets.emit('zoom_slot',nr);
}

function resolve_url(value)
{
	console.log('resolve:'+value);
	var ls = spawn('youtube-dl', ['-g',value],{shell: false});

	ls.stdout.on('data', (data) => {
		console.log('stdout: '+data);
		io.sockets.emit('resolver_answer',data);
		
	});

	ls.stderr.on('data', (data) => {
		console.log('stderr: '+data);
	});

	ls.on('close', (code) => {
		console.log(`child process exited with code ${code}`);
	});
	ls.on('error', (code,text) => {
		console.log(`child process exited with error ${code} ${text}`);
	});
}
function resolve_url2(value,slot)
{
	console.log('resolve for '+slot+':'+value);
	var ls = spawn('youtube-dl', ['-g',value],{shell: false});

	var good = 0;

	ls.stdout.on('data', (data) => {
		console.log('stdout: '+data);
		var url =String.fromCharCode.apply(null, new Uint8Array(data));
		
		if(! good) {
			player[slot-1][2]=url;
			io.sockets.emit('player_url',slot,url);
		}
		good=1;
	});

	ls.stderr.on('data', (data) => {
		console.log('stderr: '+data);
	});

	ls.on('close', (code) => {
		console.log(`child process exited with code ${code}`);
	});
	ls.on('error', (code,text) => {
		console.log(`child process exited with error ${code} ${text}`);
	});
}
function update_stream_url(item,value)
{
	if(obs_config['stream'+item+'_state']!=='')
	{
		//obs_config['stream'+item+'_state']='killing';
		//io.sockets.emit('stream_state',item,'killing');
		//console.log("ENDENDE"+ls.pid);
		//spawn("taskkill", ["/pid", ls.pid, '/f', '/t']);

		return;
	}


	console.log('update stream:'+item+':'+value);
	var ls = spawn('streamlink', [value, '480p,720p,best','--ffmpeg-audio-transcode','aac','--hls-live-edge','4','--ringbuffer-size','12M','--hls-segment-threads','4','--http-no-ssl-verify','--player-external-http','--player-external-http-port','500'+item],{shell: false});

	obs_config['stream'+item+'_state']='L';
	io.sockets.emit('stream_state',item,'L');
	//socket.broadcast.emit('ctrl',item,value);

	ls.stdout.on('data', (data) => {
		console.log('stdout: '+data);
		if(data.toString().match("Stream ended"))
		{
			//ls.kill();
			obs_config['stream'+item+'_state']='killing';
			io.sockets.emit('stream_state',item,'killing');
			console.log("_1ENDENDE"+ls.pid);
			if(/^win/.test(process.platform))
				spawn("taskkill", ["/pid", ls.pid, '/f', '/t'])
				else process.kill(ls.pid);
		}
		if(data.toString().match("Starting server"))
		{
			obs_config['stream'+item+'_state']='running';
			io.sockets.emit('stream_state',item,'running');
		}
		if(data.toString().match("Opening stream"))
		{
			playlog(value);
		}
		if(data.toString().match("Could not open stream"))
		{
			//ls.kill();
			obs_config['stream'+item+'_state']='killing';
			io.sockets.emit('stream_state',item,'killing');
			console.log("_2ENDENDE"+ls.pid);
			if(/^win/.test(process.platform))
				spawn("taskkill", ["/pid", ls.pid, '/f', '/t'])
				else process.kill(ls.pid);
		}
	});

	ls.stderr.on('data', (data) => {
		console.log('stderr: '+data);
		if(data.toString().match("No data returned from stream"))
		{
			//ls.kill();
			obs_config['stream'+item+'_state']='killing';
			io.sockets.emit('stream_state',item,'killing');
			console.log("_3ENDENDE"+ls.pid);
			if(/^win/.test(process.platform))
				spawn("taskkill", ["/pid", ls.pid, '/f', '/t'])
				else process.kill(ls.pid);
		}
	});

	ls.on('close', (code) => {
		console.log(`child process exited with code ${code}`);
		obs_config['stream'+item+'_state']='';
		io.sockets.emit('stream_state',item,'');
		
		for (var nr of [1,2,3,4,5,6,7,8,9,10,11,12])
		{
			if ('d'+item == slots[nr-1][0]) {
				disable_win(nr);
			}
		}
	});
	ls.on('error', (code,text) => {
		console.log(`child process exited with error ${code} ${text}`);
		obs_config['stream'+item+'_state']='';
		io.sockets.emit('stream_state',item,'');
		for (var nr of [1,2,3,4,5,6,7,8,9,10,11,12])
		{
			if ('d'+item == slots[nr-1][0]) {
				disable_win(nr);
			}
		}
	});
}

function set_win_pos(nr,scene,source,x,y,w,h,r)
{

	console.log('pos: ' + scene + ' ' + source);


	var scale = 0.25;

	obs.sendCallback('GetCurrentScene',{},function(error,data){

		//console.log(error);
		//console.log(data.sources);


		var sources = data.sources;
		for(var source2 of sources){
			if ((source2.name == source)&&(source2.render)) {


				set_win_pos2(nr,scene,source,source2,x,y,w,h,r);

			}
		};
	});
}

function set_win_pos2(nr,scene,source,source2,x,y,w,h,r)
{
	obs.sendCallback('GetSceneItemProperties',{'scene-name': 'main','item': source},function(error,data2){
	
		console.log(error);
		console.log(source);

		var hori = data2.crop.bottom + data2.crop.top;
		var vert = data2.crop.left + data2.crop.right

		var oscale = data2.scale.x;
		var oposx = data2.position.x;
		var oposy = data2.position.y;

		source2.source_cx -= vert;
		source2.source_cy -= hori;

		if(r==0)
		{
			scale = (w-x)/source2.source_cx;
			if(scale > ((h-y)/source2.source_cy))
				scale = (h-y)/source2.source_cy;
		}
		else if(r== -90)
		{
			scale = (w-x)/source2.source_cy;
			if(scale > ((h-y)/source2.source_cx))
				scale = (h-y)/source2.source_cx;
		}
		else if(r== 90)
		{
			scale = (w-x)/source2.source_cy;
			if(scale > ((h-y)/source2.source_cx))
				scale = (h-y)/source2.source_cx;
		}
		else if(r==180)
		{
			scale = (w-x)/source2.source_cx;
			if(scale > ((h-y)/source2.source_cy))
				scale = (h-y)/source2.source_cy;
		}
		

		if(r==-90)
		{
			y+=(h-y);
		}
		else if(r==90)
		{
			x+=(w-x);
		}
		else if(r==180)
		{
			y+=(h-y);
			x+=(w-x);
		}

		if((oscale != scale)||(oposx != x)||(oposy != y))
		{
			move_win(oscale,oposx,oposy,scale,x,y,scene,source,r,1);
		}
	});
}


function move_win(oscale,oposx,oposy,scale,x,y,scene,source,r,step) {


	var scalediff = (((scale-oscale)/10)*step).toFixed(6);
	var xdiff = ((x-oposx)/10)*step;
	var ydiff = ((y-oposy)/10)*step;

	console.log(scalediff);
	console.log(xdiff);
	console.log(ydiff);

	obs.send('SetSceneItemPosition',{
		'scene-name': scene,
		'item': source,
		'x': x,
		'y': y
	});

	obs.send('SetSceneItemTransform',{
		'scene-name': scene,
		'item': source,
		'rotation': (r*1.0),
		'x-scale': scale,
		'y-scale': scale
	});

}



var obs_connected = false;

function connect_to_obs()
{

}


		obs.on('ConnectionOpened', function(data){
	
			for (var nr of [1,2,3,4,5,6,7,8,9,10,11,12])
			{
				obs.send('SetSceneItemRender',{
					'scene-name': 'main',
					'source': slots[nr-1][0],
					'render': 0
				});
			};
			
			console.log('obsconn2');
			
			obs_connected = true;
			
			update_leds();
		});	

		

		obs.on('SceneItemVisibilityChanged', function(data){
		
			console.log('SIVC:'+data);

		
		});	
		obs.on('ConnectionClosed', function(data){
			obs_connected=false;
		});

	obs.connect({ address: 'localhost:4444', password: 'websocketpw' });




// When a client connects, we note it in the console
io.sockets.on('connection', function (socket) {

	update_leds();
	
	obs.sendCallback('GetCurrentScene',{},function(error,data){
		socket.emit('sources',data.sources,slots);
	});


	obs.sendCallback('GetCurrentScene',{},function(error,data){


		for (var source of data.sources)
		{
			for (var x of [1,2,3,4,5,6,7,8,9,10,11,12])
			{
				if(slots[x-1][0] == source.name)
				{
					//console.log(x+':'+source.volume);
					//socket.emit('volume',x,Math.sqrt(source.volume*100)/100);
				}
			}
		}
	});
	
	socket.emit('conn');
	
	socket.emit('ctrl','ticker1text',obs_config.ticker1text);
	socket.emit('ctrl','ticker2text',obs_config.ticker2text);
	socket.emit('ctrl','ticker3text',obs_config.ticker3text);
	socket.emit('ctrl','ticker4text',obs_config.ticker4text);
	socket.emit('ctrl','banner1text',obs_config.banner1text);
	socket.emit('ctrl','banner1rtext',obs_config.banner1rtext);
	socket.emit('ctrl','banner1',obs_config.banner1);
	socket.emit('ctrl','clock1live',obs_config.clock1live);
	socket.emit('ctrl','timezone',obs_config.timezone);
	socket.emit('ctrl','clock1',obs_config.clock1);
	socket.emit('ctrl','clockpos',obs_config.clockpos);
	socket.emit('ctrl','cube1',obs_config.cube1);
	socket.emit('ctrl','ticker1',obs_config.ticker1);
	socket.emit('stream_url','1',obs_config.stream1_url);
	socket.emit('stream_url','2',obs_config.stream2_url);
	socket.emit('stream_url','3',obs_config.stream3_url);
	socket.emit('stream_url','4',obs_config.stream4_url);
	socket.emit('stream_url','5',obs_config.stream5_url);
	socket.emit('stream_url','6',obs_config.stream6_url);
	socket.emit('stream_desc','1',obs_config.stream1_desc);
	socket.emit('stream_desc','2',obs_config.stream2_desc);
	socket.emit('stream_desc','3',obs_config.stream3_desc);
	socket.emit('stream_desc','4',obs_config.stream4_desc);
	socket.emit('stream_desc','5',obs_config.stream5_desc);
	socket.emit('stream_desc','6',obs_config.stream6_desc);
	socket.emit('stream_state','1',obs_config.stream1_state);
	socket.emit('stream_state','2',obs_config.stream2_state);
	socket.emit('stream_state','3',obs_config.stream3_state);
	socket.emit('stream_state','4',obs_config.stream4_state);
	socket.emit('stream_state','5',obs_config.stream5_state);
	socket.emit('stream_state','6',obs_config.stream6_state);
	socket.emit('matrix',obs_config.win_config);	
	socket.emit('zoom_slot',activeSlot);
	
	//update_leds();
	socket.on('volume', function(nr,vol){
		if(!obs_connected) connect_to_obs();
			
		//console.log("vol"+nr+':'+vol/100);

		obs.send('SetVolume',{
			'source': slots[nr-1][0],
			'volume': (vol*vol)/10000
		});

	});
	
	socket.on('slot_toggle', function(nr){
		if(!obs_connected) connect_to_obs();

		toggle_win(nr);

	});
	socket.on('slot_active', function(nr){
		if(!obs_connected) connect_to_obs();

		set_win_active(nr);

	});

	socket.on('slot_set', function(nr,text,rot){
		slots[nr-1][0]=text;
		slots[nr-1][2]=rot;
		console.log('set slot:'+nr+" : "+text+" r"+rot);
		update_leds();
	});
	
	socket.on('set_matrix', function(matrix){
		console.log(matrix);
			
			for (var x of [1,2,3,4])
			{
				for (var y of [1,2,3,4])
				{
					obs_config.win_config[x-1][y-1]= matrix[x-1][y-1];
				}
			}
			fs.writeFile('settings.json', '{"config":'+JSON.stringify(obs_config,null,2)+'}', 'utf8', function(){});
			set_win_active(activeSlot);
	});
	
	socket.on('card', function(item,value){
		socket.broadcast.emit('card',item,value);
	});
	socket.on('player_stat', function(a,b,c,d,e,f,g){
		socket.broadcast.emit('player_stat',a,b,c,d,e,f,g);
	});
	socket.on('player_vol', function(a,b){
		socket.broadcast.emit('player_vol',a,b);
	});
	socket.on('player', function(slot,desc,url){
		console.log('player '+slot+' '+desc);
		resolve_url2(url,slot);
		player[slot-1]=[desc,url,''];
	});
	
	socket.on('player_getUrl', function(slot){
		if(player[slot-1])
			socket.emit('playurl',player[slot-1][2]);
	});
	socket.on('playlog', function(slot){
		if(player[slot-1])
			playlog(player[slot-1][1]);
	});
	socket.on('player_desc', function(slot){
		if(player[slot-1])
			socket.emit('playdesc',slot,player[slot-1][0],player[slot-1][1],player[slot-1][2]);
	});

	socket.on('ctrl', function(item,value){
		socket.broadcast.emit('ctrl',item,value);
		if(item == 'ticker1text')
			obs_config.ticker1text=value
		else if(item == 'ticker2text')
			obs_config.ticker2text=value;
		else if(item == 'ticker3text')
			obs_config.ticker3text=value;
		else if(item == 'ticker4text')
			obs_config.ticker4text=value
		else if(item == 'banner1text')
			obs_config.banner1text=value
		else if(item == 'banner1rtext')
			obs_config.banner1rtext=value
		else if(item == 'banner1')
			obs_config.banner1=value
		else if(item == 'timezone')
			obs_config.timezone=value
		else if(item == 'clockpos')
			obs_config.clockpos=value
		else if(item == 'clock1live')
			obs_config.clock1live=value
		else if(item == 'clock1')
			obs_config.clock1=value
		else if(item == 'cube1')
			obs_config.cube1=value
		else if(item == 'ticker1')
			obs_config.ticker1=value;
		fs.writeFile('settings.json', '{"config":'+JSON.stringify(obs_config,null,2)+'}', 'utf8', function(){});
	});
	
	socket.on('stream_desc', function(item,value){

		if(item == '1')
			obs_config.stream1_desc=value
		else if(item == '2')
			obs_config.stream2_desc=value
		else if(item == '3')
			obs_config.stream3_desc=value
		else if(item == '4')
			obs_config.stream4_desc=value
		else if(item == '5')
			obs_config.stream5_desc=value
		else if(item == '6')
			obs_config.stream6_desc=value;
		fs.writeFile('settings.json', '{"config":'+JSON.stringify(obs_config,null,2)+'}', 'utf8', function(){});
	});


	socket.on('stream_url', function(item,value){

		update_stream_url(item,value);

		if(item == '1')
			obs_config.stream1_url=value
		else if(item == '2')
			obs_config.stream2_url=value
		else if(item == '3')
			obs_config.stream3_url=value
		else if(item == '4')
			obs_config.stream4_url=value
		else if(item == '5')
			obs_config.stream5_url=value
		else if(item == '6')
			obs_config.stream6_url=value;
		fs.writeFile('settings.json', '{"config":'+JSON.stringify(obs_config,null,2)+'}', 'utf8', function(){});
	});
	socket.on('resolve_url', function(value){

		resolve_url(value);

	});
});


server.listen(8080);



var http = require('http');
var path = require('path');

var server = http.createServer(function(req, res) {
	res.writeHead(200, { 
		'content-type': 'text/html',
		'Access-Control-Allow-Origin': '*.twitter.com'
	});
	fs.createReadStream(path.resolve(__dirname+'/../docs/cardsW.html')).pipe(res);
});

server.listen(8081);
var server2 = http.createServer(function(req, res) {
	res.writeHead(200, { 
		'content-type': 'text/html',
	});
	fs.createReadStream(path.resolve(__dirname+'/../docs/player.html')).pipe(res);
});

server2.listen(8083);
