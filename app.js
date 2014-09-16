// dependencies
_ = require('underscore');
var express = require('express')
  , home = require('./routes/home')
  , players = require('./routes/players')
  , roulette = require('./routes/roulette')
  , utils = require('./utils/utils')
  , app = express.createServer()
  , io = require('socket.io').listen(app);
  
// Configuration
app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.cookieParser());
  app.use(express.session({secret: 'baka'}));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Routes
app.get('/', function(req, res){ res.redirect('/home'); });
app.get('/home', home.index);
app.post('/home', home.create);
app.get('/roulette', roulette.index);
app.get('/roulette/players', players.index);
app.get('/roulette/players/new', players.new);
app.get('/roulette/players/:id', players.show);
app.get('/roulette/players/:id/edit', players.edit);
app.put('/roulette/players/:id', players.update);
app.post('/roulette/players', players.create);
app.del('/roulette/players/:id', players.destroy);

//start server and listen for requests
app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);

//Sockets
var nicknames = [];
io.sockets.on('connection', function(socket) {
  socket.emit('client::nick', null);
  socket.on('client::nick', function(data){
    //If nickname is taken send msg to choose nickname again
    if (_.any(nicknames, function(i) { return i == data; })) {
      socket.emit('client::nick', { err: 'nickname not available' });
      return;
    }
	nicknames.push(data);
	socket.emit('client::nick', 'nickname accepted');
    //TODO: add player to db
    io.sockets.emit('client::join', data);
    socket.id = data;
    //bind listeners
    socket.on('disconnect', function(data) {
      io.sockets.emit('client::leave', socket.id);
    });
    socket.on('client::msg', function(data) {
      io.sockets.emit('client::msg', { user: data.user, msg: data.msg });
    });
  });
});
