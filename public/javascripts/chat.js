var nick = null;
  var clientSocket = io.connect('http://localhost:3000');
  clientSocket.on('client::nick', function (data) { 
    if (data) {
      if (data.err) {
        alert(data.err);
      } else {
        $('#welcome').text("Welcome " + nick);
      }
      return;
    }

    clientSocket.on('client::join', function (data) {
      $('#info').append('<p>' + data + ': &lt;joined&gt;</p>')
      scroll();
    });
    clientSocket.on('client::leave', function (data) {
      $('#info').append('<p>' + data + ': &lt;left&gt;</p>')
      scroll();
    });
    clientSocket.on('client::msg', function (data) {
      $('#info').append('<p>' + data.user + ': ' + data.msg + '</p>')
      scroll();
    });
    $('#nick').on('keydown', function(e){
      nick = $('#nick').val();
      if (nick && nick.length > 0 && e.keyCode==13) {
        clientSocket.emit('client::nick', nick);  
      }	
    });
  });
  
  
  //jquery onready - bind listeners
  $(function() {
    $('#send').click(function(){
      send();
    });
    $('#msg').keydown(function(event){
      if(event.keyCode==13)
        send();
    });
  });
  
  function send() {
    clientSocket.emit('client::msg', { user: nick, msg: $('#msg').val() }); 
    $('#msg').val('');
    $('#msg').focus();
    scroll();
  }

  function scroll() {
    $("#info").animate({ scrollTop: $("#info")[0].scrollHeight}, 100);
  }
