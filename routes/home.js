//GET /home
exports.index = function(req, res){
  if (!req.session.lastLogin) {
    req.session.lastLogin = new Date();
  }
  res.render('home', { title: 'Express', user: 'guest', lastLogin: new Date(req.session.lastLogin).toLocaleTimeString() });
};

//POST /home
exports.create = function(req, res){
  console.log('saved posted data');
  res.redirect('/home');
};
