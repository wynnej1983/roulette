var db = require('../db');

//GET /roulette/players
exports.index = function(req, res) {
  res.render('players', { players: db, title: "Players" })
};

//GET /roulette/players/:id
exports.show = function(req, res) {
  var playerId = parseInt(req.params.id);
  var player = _.find(db, function(i){ return i.id === playerId});
  res.end(player.name);
}

//GET /roulette/players/new
exports.new = function(req, res) {
  res.end('create new player form');
}

//POST /roulette/players
exports.create = function(req, res) {
  var id = _.max(db, function(p){ return p.id; }).id;
  var player = { id: id, credit: 1000 };
  player.name = req.body.name;
  db.push(player);
}

//GET /roulette/players/:id/edit
exports.edit = function(req, res) {
  var playerId = parseInt(req.params.id);
  var player = _.find(db, function(i){ return i.id === playerId});
  if (!player) throw new Error('player not found!');
  var action = _.last(req.path.split('/'));
  res.end(action + ' player form for player: ' + player);
}

//DELETE /roulette/players/:id
exports.destroy = function(req, res) {
  var playerId = parseInt(req.params.id);
  var player = _.find(db, function(i){ return i.id === playerId});
  res.end('deleted player: ' + player);
}
