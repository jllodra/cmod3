"use strict";

var player = require('./player.js');

var app = {
  player: player
};

app.config = {

};

app.ui = {
  vul: null,
  vur: null
};

app.render = function() {
  var left = 20*Math.log10(Math.abs(player.engine.getVU().l));
  var right = 20*Math.log10(Math.abs(player.engine.getVU().r));
  left = (left == -Infinity) ? -400 : left;
  right = (right == -Infinity) ? -400 : right;
  app.ui.vul.width(400 - (left + 400));
  app.ui.vur.width(400 - (right + 400));


  var vul = window.document.getElementById('vul');
  var vur = window.document.getElementById('vur');
  vul.innerHTML = left;
  vur.innerHTML = right;
  window.requestAnimationFrame(app.render);
}

app.init = function() {
  console.log("app init");
  app.ui.vul = window.$("#vuleft div.vu_overlay");
  app.ui.vur = window.$("#vuright div.vu_overlay");
  player.init();
  window.requestAnimationFrame(app.render);
};

app.load = function(file) {
  player.load(file, function() {});
}

app.loadAndPlay = function(file) {
  player.load(file, function() {
    player.play();
  });
}

module.exports = app;
