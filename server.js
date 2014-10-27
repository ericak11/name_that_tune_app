
var express = require('express');
var app = express();
var http = require('http');
var https = require('https');
var server = http.createServer(app);
var io = require('socket.io')(server);


var SpotifyWebApi = require('spotify-web-api-node');
var spotifyApi = new SpotifyWebApi();

var server_port = process.env.YOUR_PORT || process.env.PORT || 3000;
var server_host = process.env.YOUR_HOST || '0.0.0.0';
server.listen(server_port, server_host);
app.use(express.static(__dirname + '/public'));

var usernames = {};
var offset;

app.get('/', function(req, res){
  res.sendfile('index.html');
});

io.on('connection', function(socket){
  socket.on('parse spotify', function(item){
    var query = item + " NOT live NOT version NOT vs";
    spotifyApi.searchTracks(query, {limit: 1, market: "us"})
     .then(function(data) {
      var num = data.tracks.total - 50;
      console.log(data);
      console.log(num);
      offset = Math.floor(Math.random() * num) + 1;
    })
     .then(spotifyApi.searchTracks(query, {limit: 50, market: "us", offset: offset})
      .then(function(data) {
        console.log(data.tracks);
        var song = data.tracks.items[Math.floor(Math.random()*data.tracks.items.length)];
        io.emit('parse spotify', song);
      }, function(err) {
        console.log(offset)
        console.error(err);
      }));
  });
});
