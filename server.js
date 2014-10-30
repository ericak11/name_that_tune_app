var _ = require('underscore');
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
var playersDone = 0;
var picker = false;
var scores = {'60s': {}, '70s': {}, '80s': {}, '90s': {}, '00s': {}, 'present': {}};
var rooms = ['60s', '70s', '80s', '90s', '00s', 'present'];
var genreRooms  = {'60s': '1960-1969', '70s': '1970-1979', '80s': '1980-1989', '90s': '1990-1999', '00s': '2000-2009', 'present': '2010-2020'};

app.get('/', function(req, res){
  res.sendfile('index.html');
});

io.on('connection', function(socket){
  socket.on('parse spotify', function(item){
    var query;
    if (_.has(genreRooms, socket.room)) {
      query = item + " year:"+genreRooms[socket.room]+" NOT live NOT version NOT vs NOT karaoke NOT demo";
    } else {
    query = item + " NOT live NOT version NOT vs NOT karaoke NOT demo";
    }
    spotifyApi.searchTracks(query, {limit: 1, market: "us"})
      .then(function(data) {
        var num = (data.tracks.total);
        if (num > 250){
          return Math.floor(Math.random() * 200) + 1;
        } else if (num > 50) {
          return Math.floor(Math.random() * (num-50)) + 1;
        } else if (num === 0){
          io.to(socket.room).emit('search error', {name: socket.username, error: "there were no results for that search, TRY AGAIN"});
        } else {
          return 0;
        }
      })
     .then(function(data) {
        spotifyApi.searchTracks(query, {limit: 50, market: "us", offset: data})
        .then(function(data) {
          var song = data.tracks.items[Math.floor(Math.random()*data.tracks.items.length)];
          io.to(socket.room).emit('parse spotify', song, item);
        }, function(err) {
          io.to(socket.room).emit('search error', {name: socket.username, error: err.error});
      });
    });
  });

  socket.on('create room', function(roomName) {
    if (_.contains(rooms, roomName)) {
      socket.emit('room exists', roomName);
    } else {
      rooms.push(roomName);
      scores[roomName] = {};
      socket.emit('room created', roomName);
    }
  });

  socket.on('end round', function (ppr) {
    socket.picker = false;
    io.to(socket.room).emit('end round', socket.username);
  });

  socket.on('start round', function (username) {
    playersDone = 0;
    io.to(socket.room).emit('start round', socket.username);
  });

  socket.on('reset picker', function() {
    socket.picker = true;
    socket.broadcast.to(socket.room).emit('call picker', socket.picker);
  });

  socket.on('not picker', function(){
    socket.picker = false;
  });

  socket.on('player out', function (username) {
    playersDone += 1;
    socket.picker = false;
    var userNum = Object.keys(io.sockets.adapter.rooms[socket.room]).length;
    if (playersDone === userNum) {
      io.to(socket.room).emit('round reset', socket.username);
    }
  });

  socket.on('add user', function (username) {
    socket.username = username;
    socket.picker = picker;
    usernames[username] = username;
    // socket.emit('logged in', {username: username, userId: userId});
    socket.emit('logged in', rooms);

  });

  socket.on('send score', function (score) {
    scores[socket.room][socket.username] = score;
    io.to(socket.room).emit('update scores',  scores[socket.room]);
  });

  socket.on('disconnect', function (username) {
    if (socket.room) {
      delete scores[socket.room][socket.username];
      delete usernames[socket.username];
      io.to(socket.room).emit('update scores',  scores[socket.room]);
      var userNum = Object.keys(io.sockets.adapter.rooms[socket.room]).length;
      var name;
      if (socket.picker) {
        for(var key in scores[socket.room]) {
          name = key;
        }
        io.to(socket.room).emit('start round', name);
      }
      io.to(socket.room).emit('user num', userNum);
      if (userNum < 1) {
        scores[socket.room] = {};
        if (!_.has(genreRooms, socket.room)) {
          rooms = _.without(rooms, socket.room);
        }
      }
      socket.leave(socket.room);
    }
  });

  // room info
  socket.on('join room', function (room) {
    socket.join(room);
    var userNum = Object.keys(io.sockets.adapter.rooms[room]).length;
    if (userNum === 1) {
      socket.picker = true;
    }
    socket.room =  room;
    scores[socket.room][socket.username] = 0;
    socket.emit('joined', {username: socket.username, picker: socket.picker}, socket.room);
    io.to(socket.room).emit('user num',  userNum);
  });

  socket.on('leave room', function () {
    socket.leave(socket.room);
    delete scores[socket.room][socket.username];
    io.to(socket.room).emit('update scores',  scores[socket.room]);
    var userNum = Object.keys(io.sockets.adapter.rooms[socket.room]).length;
    var name;
    if (socket.picker) {
      for(var key in scores[socket.room]) {
        name = key;
      }
      io.to(socket.room).emit('start round', name);
    }
    io.to(socket.room).emit('user num', userNum);
    if (userNum < 1) {
      scores[socket.room] = {};
      if (!_.has(genreRooms, socket.room)) {
        rooms = _.without(rooms, socket.room);
      }
    }
    socket.emit('logged in', rooms);
  });

});

