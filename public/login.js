var socket = io();
var username;

$('#user-login').submit(function(e){
    e.preventDefault();
    username = $('#login').val()
    if (username) {
      socket.emit('add user', username);
    }
});

socket.on('logged in', function(rooms) {
  $('.login').css({display: "none"});
  $('.lobby').css({display: ""});
  $(rooms).each(function() {
    $('#select').append($("<option>").attr('value',this).text(this));
  });
});
