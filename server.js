
var app = require('express')();
var http = require('http');
var https = require('https');
var server = http.createServer(app);
var io = require('socket.io')(server);


var SpotifyWebApi = require('spotify-web-api-node');
var spotifyApi = new SpotifyWebApi();

var server_port = process.env.YOUR_PORT || process.env.PORT || 3000;
var server_host = process.env.YOUR_HOST || '0.0.0.0';
server.listen(server_port, server_host);

app.get('/', function(req, res){
  res.sendfile('index.html');
});

io.on('connection', function(socket){
  socket.on('parse spotify', function(item){
    spotifyApi.searchTracks(item)
      .then(function(data) {
        var song = data.tracks.items[Math.floor(Math.random()*data.tracks.items.length)];
        io.emit('parse spotify', song);
      }, function(err) {
        console.error(err);
      });
  });
});
