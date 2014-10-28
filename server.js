
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
var userId = 0;
var offset;
var playersDone = 0;
var numUsers = 0;
var picker = false;

app.get('/', function(req, res){
  res.sendfile('index.html');
});

io.on('connection', function(socket){
  socket.on('parse spotify', function(item){
    var query = item + " NOT live NOT version NOT vs NOT karaoke NOT demo";
    spotifyApi.searchTracks(query, {limit: 1, market: "us"})
      .then(function(data) {
        var num = (data.tracks.total - 50)/2;
        if (num > 200){
          return Math.floor(Math.random() * 200) + 1;
        } else if (num > 0) {
          return Math.floor(Math.random() * num) + 1;
        } else if (num < 1){
          io.emit('search error', {name: socket.username, error: "there were no results for that search, TRY AGAIN"});
        } else {
          return 0;
        }
      })
     .then(function(data) {
        spotifyApi.searchTracks(query, {limit: 50, market: "us", offset: data})
        .then(function(data) {
          var song = data.tracks.items[Math.floor(Math.random()*data.tracks.items.length)];
          io.emit('parse spotify', song);
        }, function(err) {
          io.emit('search error', {name: socket.username, error: err.error});
      });
    });
  });

  socket.on('end round', function (ppr) {
    socket.picker = false;
    io.emit('end round', socket.username);
  });

  socket.on('start round', function (username) {
    playersDone = 0;
    socket.picker = true;
    socket.broadcast.emit('call picker', socket.picker);
    io.emit('start round', socket.username);
  });

  socket.on('not picker', function(){
    socket.picker = false;
  });

  socket.on('player out', function (username) {
    playersDone += 1;
    socket.picker = false;
    if (playersDone === Object.keys(usernames).length) {
      io.emit('round reset', socket.username);
    }
  });

  socket.on('add user', function (username) {
    socket.username = username;
    userId += 1;
    socket.userId = userId;
    socket.picker = picker;
    usernames[username] = username;
    numUsers += 1;
    if (userId === 1) {
      socket.picker = true;
    }
    socket.emit('logged in', {username: username, userId: userId});
    io.emit('user num',  numUsers);
  });

  socket.on('disconnect', function (username) {
    delete usernames[socket.username];
    if (socket.picker) {
      io.emit('start round', usernames[Object.keys(usernames)[0]]);
    }
    numUsers -= 1;
    console.log("NUM USERS: " + numUsers)
    io.emit('user num',  numUsers);
    if (Object.keys(usernames).length < 1) {
      numUsers = 0;
      console.log("reset");
      userId = 0;
    }
  });

});
