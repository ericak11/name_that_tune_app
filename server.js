
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
    var query = item + " NOT live NOT version NOT vs NOT karaoke NOT demo";
    spotifyApi.searchTracks(query, {limit: 1, market: "us"})
      .then(function(data) {
        var num = (data.tracks.total - 50)/2;
        console.log(data);
        console.log(num);
        if (num > 250){
          return Math.floor(Math.random() * 250) + 1;
        } else if (num > 0) {
          return Math.floor(Math.random() * num) + 1;
        } else {
          return 0;
        }
      })
     .then(function(data) {
      console.log("data" + data);
        spotifyApi.searchTracks(query, {limit: 50, market: "us", offset: data})
        .then(function(data) {
          console.log(data.tracks);
          var song = data.tracks.items[Math.floor(Math.random()*data.tracks.items.length)];
          io.emit('parse spotify', song);
        }, function(err) {
          console.log(offset);
          console.error(err);
      });
    });
  });

  socket.on('new score', function(score) {

  });

  socket.on('end round', function(ppr) {
    console.log(socket.username);
    io.emit('end round', socket.username);
  });

  socket.on('add user', function (username) {
    // we store the username in the socket session for this client
    socket.username = username;
    // add the client's username to the global list
    usernames[username] = username;
    // socket.broadcast.emit('user joined', {
    //   username: socket.username,
    // });
  });

  socket.on('disconnect', function (username) {
    console.log(socket.username);
    delete usernames[socket.username];
  });
});
