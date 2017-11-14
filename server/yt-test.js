//var oauth2Client = new OAuth2(
//	"63140535018-pg5viamor4p07nmi4rv11gfl8ehq3071.apps.googleusercontent.com",
//	"MIfZFgOR4DKEq_e61L9RKLU4",
//	["urn:ietf:wg:oauth:2.0:oob","http://localhost"]
//);
var google = require('googleapis');
var sampleClient = require('./client');
var util = require('util');
var https = require('https');
const fs = require('fs');
var request = require('request');

// initialize the Youtube API library
var youtube = google.youtube({
  version: 'v3',
  auth: sampleClient.oAuth2Client
});

var scopes = [
	'https://www.googleapis.com/auth/youtube'
];



// a very simple example of searching for youtube videos
function update_pic_for(liveid) {



	console.log('pic upload '+liveid);

	request({uri:'https://exse.eu/img3.jpg',encoding:null}, function (error, response, body) {
	

		//console.log(error);
		//console.log(response);


		youtube.thumbnails.set({
			videoId: liveid,
			media: {
				mimeType: "image/jpeg",
				body: body
			}
		},function (err, data) {
			if (err) {
				console.error('Error: ' + err);
			}
			if (data) {
				console.log("pic for "+liveid+" set");
				sampleClient.execute(scopes, function(){update_vid(liveid)});
				//console.log(util.inspect(data, false, null));
			}
			//process.exit();
		});
	});
}

function update_vid(liveid) {
	
	console.log('profile'+liveid);
			
	youtube.liveBroadcasts.update({
		resource:{
			id: liveid,
			status: {
				privacyStatus: "private", //private , public
			},
			snippet: {
				title: "[LIVE] x",
				description: "."
			},
			contentDetails: {
				enableEmbed: true,
				enableDvr: true,
				recordFromStart: true,
				enableContentEncryption: false,
				startWithSlate: false,
				enableLowLatency: true,
				monitorStream: {
					broadcastStreamDelayMs: 0,
					enableMonitorStream: false
				},
				enableClosedCaptions: false
			}
		},
		part: 'id,status,snippet,contentDetails'
	},function (err, data) {
		if (err) {
			console.error('Error: ' + err);
		}
		if (data) {
			console.log('profile ok');
			//sampleClient.execute(scopes, function(){update_pic_for(liveid)});
			//console.log(util.inspect(data, false, null));
		}
		process.exit();
	});

}

function runSamples () {
	youtube.liveBroadcasts.list({
		part: 'id,snippet',
		//	broadcastStatus: 'upcoming',
		mine: true,
		broadcastType: 'persistent'
	}, function (err, data) {
		if (err) {
			console.error('Error: ' + err);
			process.exit();
		}
		if (data) {
			console.log(data.items[0].id);
			//sampleClient.execute(scopes, function(){update_vid(data.items[0].id)});
			sampleClient.execute(scopes, function(){update_pic_for(data.items[0].id)});
			//console.log(util.inspect(data, false, null));
		}
	});
}


sampleClient.execute(scopes, runSamples);

