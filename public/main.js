var socket = io();
var $btn = $('#spotify');
// full track name
var $track;
// guess match name
var match;
// full query data for song
var data;
// hint clicks
var clicks = 0;
// total score
var score = 0;
// points per round
var ppr = 200;
var $score = $('#score');
var interval = false;
var submit = true;
var username;
var loggedIn = false;
var scores;

$('#user-login').submit(function(e){
    e.preventDefault();
    username = $('#login').val()
    if (username) {
      socket.emit('add user', username);
    }
});

socket.on('search error', function(info){
  if (username === info.name) {
    $('#error').text(info.error);
  }
});

socket.on('logged in', function(username) {
  console.log(username.userId);
  $('.login').css({display: "none"});
  $('.game').css({display: ""});
  if (username.userId === 1) {
    $('#welcome').css({display: "none"});
    $('#send-song').css({display: ""});
    $('#search-message').text("It's your turn to search for a song!");
  }
});

$btn.on('mouseover', function(){
  if (!interval && !submit) {
    interval = setInterval(time, 1000);
  }
});

$('#send-song').submit(function(e){
    e.preventDefault();
    socket.emit('parse spotify', $('#search').val());
    $('#answer').text("");
});

$('#send-guess').submit(function(e){
  e.preventDefault();
  var message = "hello"
  if ($('#song').val().toLowerCase().trim() === match){
    console.log("YOU ARE HERE")
    socket.emit('end round', message);
  } else {
    incorrectGuess();
  }
});

socket.on('end round', function(username) {
  correctGuess(username);
});

socket.on('call picker', function(picker) {
  socket.emit('not picker');
});

socket.on('update scores', function(score){
  $('#scores').empty();
  scores = score;
  for(var key in scores) {
    var val = scores[key];
    $('#scores').append($('<li>').addClass("scores-list").html("<b>"+key+"</b> : "+val+" "));
  }
});

socket.on('round reset', function(name) {
  $('#answer').html("The correct answer is: <div id='match-title'>" + match + "</div>").css({color: "rgba(183, 215, 146,1)"});
  if (name === username) {
    resetNoWinner(true);
  } else {
    resetNoWinner(false);
  }
});

socket.on('start round', function(username) {
  showSearchScreen(username);
});

socket.on('parse spotify', function(song, term){
  var link = song.uri;
  data = song;
  $track = song.name;
  getSongName(song.name);
  $btn.html("<h1 class='push_button blue' id='play-button'>PLAY SONG</h1><iframe src='https://embed.spotify.com/?uri=spotify:track:"+link+"'  width='300' height='380' frameborder='0' allowtransparency='true' style='opacity: 0;'></iframe>");
  $('#error').text("");
  $('#answer').text("");
  $('#welcome').css({display: "none"});
  $('#send-song').css({display: "none"});
  $('#search-message').css({display: "none"});
  $('#search-term').text("Search Term: " + term);
  $('#search').val('');
  $('#send-guess').css({display: ""});
  $('#hint').css({display: ""});
  $('#play-button').css({display: ""});
  submit = false;
});

socket.on('user num', function(num) {
  if (num === 1) {
    $('#num-users').text("There is " + num + " player")
  } else {
    $('#num-users').text("There are " + num + " players")
  }

});

$('#hint').on('click',function(e){
  e.preventDefault();
  if (clicks === 0) {
    clicks += 1;
    var artists = "";
    if (data.artists.length > 1) {
      for (var i = 0; i < data.artists.length; i++) {
        if (i !== data.artists.length -1) {
          artists += data.artists[i].name + " | ";
        } else {
          artists += data.artists[i].name;
        }
      }
      $('#hints').append($('<li>').text("ARTISTS: " + artists));
    } else {
      artists += data.artists[0].name;
      $('#hints').append($('<li>').text("ARTIST: " + artists));
    }
    artists = "";
    ppr -= 25;
  } else if (clicks === 1) {
     clicks += 1;
    $('#hints').append($('<li>').text("ALBUM: " + data.album.name));
    ppr -= 25;
  } else if (clicks === 2) {
     clicks += 1;
    $('#hints').append($('<li>').html("<img id='album-cover' src='"+data.album.images[1].url+"'>"));
    ppr -= 25;
  } else if (clicks === 3) {
    $('#hints').append($('<li>').text("CLICK AGAIN FOR ANSWER"));
    clicks += 1;
  } else if(clicks === 4){
    ppr = 0;
    $('#ppr').text("Points: " + ppr);
    $('#answer').html("The correct answer is: <div id='match-title'>" + match + "</div>").css({color: "rgba(183, 215, 146,1)"});
    socket.emit('player out', username);
    resetToSubmitScreen();
  }
});

function addToScore(points) {
  score += points;
  $score.text("Total Score: " + score);
  socket.emit('send score', score);
}

function getSongName(track) {
  if ($track.match(/[(]/)) {
    match = $track.match(/(.*)[(]/)[1].toLowerCase().trim();
  } else if ($track.match(/[[]/)) {
    match = $track.match(/(.*)[[]/)[1].toLowerCase().trim();
  } else if ($track.match(/[-]/)) {
    match = $track.match(/(.*)[-]/)[1].toLowerCase().trim();
  } else {
    match = track.toLowerCase();
  }
}

function time() {
  if (ppr > 0) {
    ppr -= 1;
    $('#ppr').text("Points: " +ppr);
  } else {
    socket.emit('player out', username);
    $('#answer').html("The correct answer is: <div id='match-title'>" + match + "</div>").css({color: "rgba(183, 215, 146,1)"});
    resetToSubmitScreen();
  }
}

function correctGuess(name) {
  if (name === username) {
    $('#answer').text("CORRECT").css({color: "rgba(183, 215, 146,1)"});
    resetToSubmitScreen(true);
  } else {
    $('#answer').html("The correct answer is: <div id='match-title'>" + match + "</div>").css({color: "rgba(183, 215, 146,1)"});
    resetToSubmitScreen(false);
  }
}

function incorrectGuess() {
  $('#answer').text("GUESS AGAIN").css({color: "rgba(238,113, 167,1)"}).animate({opacity:0},200,"linear",function(){
    $(this).animate({opacity:1},200);
  });
  if (ppr > 0) {
    ppr -= 10;
  }
}

function resetToSubmitScreen(value) {
  clearInterval(interval);
  interval = false;
  var styles = {
    "opacity": "1",
    "margin-top": "-40px"
  };
  $('iframe').css(styles);
  $('#send-guess').css({display: "none"});
  $('#song').val('');
  $('#hints').empty();
  $('#hint').css({display: "none"});
  $('#play-button').css({display: "none"});
  clicks = 0;
  submit = true;
  if (value) {
    addToScore(ppr);
    socket.emit('send scores', score);
    socket.emit('start round', username);
  } else {
    ppr = 0;
    $('#ppr').text("Points: " + ppr);
  }
  ppr = 200;
}

function showSearchScreen(name) {
  if (username === name) {
    $('#send-song').css({display: ""});
    $('#search-message').css({display: ""});
    $('#search-message').text("It's your turn to search for a song")
  } else {
    $('#search-message').css({display: ""});
    $('#search-message').text("It's "+ name +"'s turn to search for a song")
  }
}

function resetNoWinner(value) {
  clearInterval(interval);
  interval = false;
  var styles = {
    "opacity": "1",
    "margin-top": "-40px"
  };
  $('iframe').css(styles);
  $('#send-guess').css({display: "none"});
  $('#song').val('');
  $('#hints').empty();
  $('#hint').css({display: "none"});
  $('#play-button').css({display: "none"});
  clicks = 0;
  submit = true;
  ppr = 0;
  $('#ppr').text("Points: " + ppr);
  if (value) {
    socket.emit('start round', username);
  }
  ppr = 200;
}
