//GET /roulette
exports.index = function(req, res){
  res.render('roulette', { title: 'Roulette', credit: 2000, lastLogin: new Date(req.session.lastLogin).toLocaleTimeString() })
}
