"use strict";

var player = {
  engine: require('./engine.js')(),
  buffer: null,
  metadata: null,
  status: {
    playing: false,
    stopped: true,
    paused: false,
    hasEnded: false,
    nectarine: true
  }
};

player.init = function() {

};

player.load = function(file, callback) {
  var xhr = new window.XMLHttpRequest();
  xhr.open('GET', file, true);
  xhr.responseType = 'arraybuffer';
  xhr.onload = function (evt) {
    // TODO: check possible errors
    if(xhr.response) {
      player.buffer = xhr.response;
      player.engine.unload();
      player.engine.loadBuffer(player.buffer);
      callback();
    }
  };
  xhr.send(null);
};

player.metadataFromFile = function(file, callback) {
  var xhr = new window.XMLHttpRequest();
  xhr.open('GET', file, true);
  xhr.responseType = 'arraybuffer';
  xhr.onload = function (evt) {
    // check possible errors
    if(xhr.response) {
      var buffer = xhr.response;
      player.metadata = player.engine.metadata(buffer);
      callback(player.metadata);
    }
  };
  xhr.send(null);
};

player.getPosition = function() {
  if(player.status.playing) {
    return player.engine.getPosition();
  }
};

player.setPosition = function(percent) {
  if(player.buffer !== null) {
    var seconds = player.metadata.duration * percent / 100;
    player.engine.setPosition(seconds);
  }
};

player.play = function() {
  if(player.buffer !== null) {
    if(player.status.paused) {
      player.pause();
    } else {
      player.engine.play();
      player.status.playing = true;
      player.status.stopped = false;
      player.status.hasEnded = false;
    }
  }
}

player.stop = function() {
  if(player.buffer !== null) {
    player.engine.stop();
    player.status.playing = false;
    player.status.stopped = true;
    player.status.paused = false;
  }
  player.stopNectarine();
}

player.pause = function() {
  if(player.buffer !== null) {
    player.engine.pause();
    player.status.paused = !player.status.paused;
  }
}

player.hasEnded = function() {
  player.status.playing = !player.engine.status.stopped;
  player.status.stopped = player.engine.status.stopped;
  player.status.hasEnded = player.engine.status.stopped;
  return player.status.hasEnded;
}

player.playNectarine = function() {
  try {
    player.stop();
    var audioel = window.document.getElementById('audio');
    audioel.src="http://privat.is-by.us:8000/necta192.mp3";
    audioel.play();
    player.status.nectarine = true;
  } catch (e) {
    console.error("cant play nectarine :(");
  }
}

player.stopNectarine = function() {
  try {
    var audioel = window.document.getElementById('audio');
    audioel.pause();
    audioel.src='';
    player.status.nectarine = false;
  } catch (e) {
    console.error("cant stop nectarine :(");
  }
}

module.exports = player;
