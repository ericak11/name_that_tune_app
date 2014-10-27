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

$btn.on('mouseover', function(){
  if (!interval && !submit) {
    interval = setInterval(time, 1000);
  }
});

$('#send-song').submit(function(e){
    e.preventDefault();
    socket.emit('parse spotify', $('#search').val());
    $('#search').val('');
    $('#answer').text("");
});

$('#send-guess').submit(function(e){
  e.preventDefault();
  if ($('#song').val().toLowerCase().trim() === match){
    correctGuess();
  } else {
  incorrectGuess();
  }
});

socket.on('parse spotify', function(song){
  var link = song.uri;
  data = song;
  $track = song.name;
  getSongName(song.name);
  $btn.html("<h1 class='push_button blue' id='play-button'>PLAY SONG</h1><iframe src='https://embed.spotify.com/?uri=spotify:track:"+link+"'  width='300' height='380' frameborder='0' allowtransparency='true' style='opacity: 0;'></iframe>");
  $('#send-song').css({display: "none"});
  $('#send-guess').css({display: ""});
  $('#hint').css({display: ""});
  $('#play-button').css({display: ""});
  submit = false;
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
    resetToSubmitScreen();
  }
});

function addToScore(points) {
  score += points;
  $score.text("Total Score: " + score);
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
  }
}

function correctGuess() {
  $('#answer').text("CORRECT").css({color: "rgba(183, 215, 146,1)"});
  resetToSubmitScreen();
}

function incorrectGuess() {
  $('#answer').text("GUESS AGAIN").css({color: "rgba(238,113, 167,1)"}).animate({opacity:0},200,"linear",function(){
    $(this).animate({opacity:1},200);
  });
  if (ppr > 0) {
    ppr -= 10;
  }
}

function resetToSubmitScreen() {
  clearInterval(interval);
  interval = false;
  var styles = {
    "opacity": "1",
    "margin-top": "-40px"
  };
  $('iframe').css(styles);
  $('#send-song').css({display: ""});
  $('#send-guess').css({display: "none"});
  $('#song').val('');
  $('#hints').empty();
  $('#hint').css({display: "none"});
  $('#play-button').css({display: "none"});
  clicks = 0;
  addToScore(ppr);
  ppr = 200;
  submit = true;
}
