"use strict";

angular.module('cmod.player', ['cmod.engine'])
.factory('player', [
  'engine',
  function(engine) {

    var buffer = null; // fa falta?
    var metadata = null; // metadata from last loaded file, fa falta?
    var status = {
      playing: false,
      stopped: true,
      paused: false,
      hasEnded: false, // song did end
      nectarine: true // streaming nectarine
    };

    return {
      load: function(file, callback) {
        var xhr = new window.XMLHttpRequest();
        xhr.open('GET', file, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function (evt) {
          // TODO: check possible errors
          if(xhr.response) {
            buffer = xhr.response;
            engine.unload();
            engine.loadBuffer(buffer);
            callback();
          }
        };
        xhr.send(null);
      },
      metadataFromFile: function(file, callback) {
        var xhr = new window.XMLHttpRequest();
        xhr.open('GET', file, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function (evt) {
          // TODO: check possible errors
          if(xhr.response) {
            var buffer = xhr.response;
            metadata = engine.metadata(buffer);
            callback(metadata);
          }
        };
        xhr.send(null);
      },
      getPosition: function(percent) {
        if(status.playing) {
          return engine.getPosition();
        }
      },
      setPosition: function(percent) {
        if(buffer !== null) {
          var seconds = metadata.duration * percent / 100;
          engine.setPosition(seconds);
        }
      },
      loadAndPlay: function(file) {
        this.load(file, function() {
          this.play();
        }.bind(this));
      },
      play: function() {
        if(buffer !== null) {
          if(status.paused) {
            pause();
          } else {
            engine.play();
            status.playing = true;
            status.stopped = false;
            status.hasEnded = false;
          }
        }
      },
      stop: function() {
        if(buffer !== null) {
          engine.stop();
          status.playing = false;
          status.stopped = true;
          status.paused = false;
        }
        stopNectarine();
      },
      pause: function() {
        if(buffer !== null) {
          engine.pause();
          status.paused = !status.paused;
        }
      },
      hasEnded: function() {
        status.playing = !engine.status.stopped;
        status.stopped = engine.status.stopped;
        status.hasEnded = engine.status.stopped;
        return status.hasEnded;
      },
      playNectarine: function() {
        try {
          stop();
          var audioel = window.document.getElementById('audio');
          audioel.src="http://privat.is-by.us:8000/necta192.mp3";
          audioel.play();
          status.nectarine = true;
        } catch (e) {
          console.error("cant play nectarine :(");
        }
      },
      stopNectarine: function() {
        try {
          var audioel = window.document.getElementById('audio');
          audioel.pause();
          audioel.src='';
          status.nectarine = false;
        } catch (e) {
          console.error("cant stop nectarine :(");
        }
      },
      quit: function() {
        engine.unload();
      }
    }

}]);
