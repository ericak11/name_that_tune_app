
$('#pick-room').submit(function(e){
    e.preventDefault();
    socket.emit('join room', $("#select").val());
});

socket.on('joined', function(username, room) {
  $('.lobby').css({display: "none"});
  $('.game').css({display: ""});
   $('#room-welcome').text("Welcome to the " + room + " Room");
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
  $('#room-exists').text(roomName + " already exists, please try again.")
});
