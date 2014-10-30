
$('#pick-room').submit(function(e){
    e.preventDefault();
    socket.emit('join room', $("#select").val());
});

socket.on('joined', function(username, room) {
  $('.lobby').css({display: "none"});
  $('.game').css({display: ""});
  $('#room-welcome').text("Welcome to the " + room + " Room");
  restoreDefault();
  if (username.picker) {
    $('#welcome').css({display: "none"});
    $('#send-song').css({display: ""});
    $('#search-message').text("It's your turn to search for a song!");
  }
});


$('#create-room').submit(function(e){
    e.preventDefault();
    socket.emit('create room', $("#room-name").val());
});

socket.on('room created', function(roomName) {
  socket.emit('join room', roomName);
});

socket.on('room exists', function(roomName) {
  $('#room-exists').text(roomName + " already exists, please try again.");
});


function restoreDefault() {
  $('#answer').text("");
  $('#ppr').text("");
  $('#search-term').text("");
  $('#send-guess').css({display: "none"});
  $('#song').val('');
  $('#hints').empty();
  $('#hint').css({display: "none"});
  $('#play-button').css({display: "none"});
  $('iframe').css({display: "none"});
  clicks = 0;
  score = 0;
  ppr = 200;
  interval = false;
  submit = true;
  $('#score').text("Total Score: " + score);
  socket.emit('send score', score);
}
