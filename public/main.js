var socket = io();
var $btn = $('#spotify');
var $track;
var match;
var data;
var clicks = 0;
var score = 0;
var ppr = 200;
var $score = $('#score');
var interval = false;
var submit = true;

$('#spotify').on('mouseover', function(){
  if (!interval && !submit) {
    console.log("HERE")
    interval = setInterval(time, 1000);
  }
});

function time() {
  if (ppr > 0) {
    ppr -= 1;
    $('#ppr').text("Points: " +ppr);
  }
}

$('#send-song').submit(function(e){
    e.preventDefault();
    socket.emit('parse spotify', $('#search').val());
    $('#search').val('');
    $('#answer').text("");
});

$('#send-guess').submit(function(e){
  e.preventDefault();
  if ($('#song').val().toLowerCase() === match){
      clearInterval(interval);
      interval = false;
      $('#answer').text("CORRECT").css({color: "rgba(183, 215, 146,1)"})
      $('iframe').css({opacity: '1'})
      $('#send-song').css({display: ""})
      $('#send-guess').css({display: "none"})
      $('#song').val('');
      $('#hints').empty()
      $('#hint').css({display: "none"})
      clicks = 0;
      addToScore(ppr);
      ppr = 200;
      submit = true;
  } else {
      $('#answer').text("GUESS AGAIN").css({color: "rgba(238,113, 167,1)"})
      if (ppr > 0) {
        ppr -= 10;
      }
  }
});

  socket.on('parse spotify', function(song){
    var link = song.uri;
    data = song;
    $track = song.name;
    getSongName(song.name);

    $('#spotify').html("<h1 style='margin-top: 80px;' id='play-button'>PLAY</h1><iframe src='https://embed.spotify.com/?uri=spotify:track:"+link+"'  width='300' height='380' frameborder='0' allowtransparency='true' style='opacity: 0; margin-top: -200px;'></iframe>");
    $('#send-song').css({display: "none"})
    $('#send-guess').css({display: ""})
    $('#hint').css({display: ""})
    submit = false;
  });

  $('#hint').on('click',function(e){
    e.preventDefault();
    if (clicks === 0) {
      clicks += 1
      $('#hints').append($('<li>').text("ALBUM: " + data.album.name));
      ppr -= 25;
    } else if (clicks === 1) {
      clicks += 1
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
    } else if (clicks === 2) {
       clicks += 1;
      $('#hints').append($('<li>').html("<img src='"+data.album.images[1].url+"'>"));
      ppr -= 25;
    } else if (clicks === 3) {
      $('#hints').append($('<li>').text("CLICK AGAIN FOR ANSWER"));
      clicks += 1
    } else if(clicks === 4){
      $('#hints').append($('<li>').text("ANSWER: " + match));
      clicks += 1
      clearInterval(interval);
      ppr = 0;
      $('#ppr').text("Points: " + ppr);
      $('#hint').css({display: "none"})
    }

  });

  function addToScore(points) {
    score += points;
    $score.text("Total Score: " + score)
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
