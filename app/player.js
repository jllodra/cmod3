"use strict";

var player = {
  engine: require('./engine.js')(),
  buffer: null
};

player.init = function() {

};

player.load = function(file, callback) {
  var xhr = new window.XMLHttpRequest();
  xhr.open('GET', file, true);
  xhr.responseType = 'arraybuffer';
  xhr.onload = function (evt) {
    // check possible errors
    if(xhr.response) {
      player.buffer = xhr.response;
      player.engine.unload();
      player.engine.loadBuffer(player.buffer);
      callback();
    }
  };
  xhr.send(null);
};

player.play = function() {
  player.engine.play();
}

player.stop = function() {
  player.engine.stop();
}

player.pause = function() {
  player.engine.pause();
}

module.exports = player;
