"use strict";

angular.module('cmod.player', [
  'cmod.playerState',
  'cmod.engine'
])
.factory('player', [
  'state', 'engine',
  function(state, engine) {

    var supported_formats = "mod s3m xm it mptm stm nst m15 stk wow ult 669 mtm med far mdl ams dsm amf okt dmf ptm psm mt2 dbm digi imf j2b gdm umx mo3 xpk ppm mmcmp".split(" ");

    var buffer = null; // fa falta?
    var metadata = null; // metadata from last loaded file, fa falta?
    var status = {
      playing: false,
      stopped: true,
      paused: false,
      hasEnded: false, // song did end
      nectarine: true // streaming nectarine
    };
    // we should write a nectarine module/service
    var nectarine_endpoint = "https://www.scenemusic.net/demovibes/xml/queue/";

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
            metadata.path = file;
            callback(metadata);
          }
        };
        xhr.send(null);
      },
      getPosition: function() {
        return engine.getPosition();
      },
      setPosition: function(seconds) {
        if(buffer !== null) {
          engine.setPosition(seconds);
        }
      },
      loadAndPlay: function(file) {
        this.load(file, function() {
          this.play();
        }.bind(this));
      },
      play: function() {
        if(state.current_song_index === null && state.playlist.length > 0) {
          state.current_song = state.playlist[0];
          state.current_song_path = state.playlist[0].path;
          state.current_song_index = 0;
          this.loadAndPlay(state.playlist[0].path);
        } else {
          if(status.nectarine) {
            this.stopNectarine();
          }
          if(buffer !== null) {
            if(status.paused) {
              this.pause();
            } else {
              engine.play();
              status.playing = true;
              status.stopped = false;
              status.hasEnded = false;
            }
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
        if(status.nectarine) {
          this.stopNectarine();
        }
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
          var audioel = window.document.getElementById('audio');
          audioel.src="http://privat.is-by.us:8000/necta192.mp3";
          audioel.play();
          status.nectarine = true;
          state.playing_nectarine = true;
          this.refreshNectarine();
        } catch (e) {
          console.error("cant play nectarine :(");
        }
      },
      refreshNectarine: function() {
        if(state.playing_nectarine) {
          var xhr = new window.XMLHttpRequest();
          xhr.onload = function(evt) {
            var xml = xhr.responseXML;
            var lists = ['now', 'queue', 'history'];
            for(var i = 0; i < lists.length; i++) {
              state.nectarine_info[lists[i]] = [];
              var list = xml.getElementsByTagName(lists[i])[0].getElementsByTagName('entry');
              for(var j = 0; j < list.length; j++) {
                var artist = list[j].getElementsByTagName('artist');
                for(var k = 0, artists = []; k < artist.length; k++) {
                  artists.push(artist[k].innerHTML);
                }
                var entry = {
                  song: list[j].getElementsByTagName('song')[0].innerHTML,
                  artist: artists.join('&'),
                  requester: list[j].getElementsByTagName('requester')[0].innerHTML
                };
                state.nectarine_info[lists[i]].push(entry);
              }
            }
          };
          xhr.open('GET', nectarine_endpoint, true);
          xhr.send(null);
        }
      },
      stopNectarine: function() {
        try {
          var audioel = window.document.getElementById('audio');
          audioel.pause();
          audioel.src='';
          status.nectarine = false;
          state.playing_nectarine = false;
        } catch (e) {
          console.error("cant stop nectarine :(");
        }
      },
      quit: function() {
        engine.unload();
      },
      isFormatSupported: function(file) {
        for (var i = 0; i < supported_formats.length; i++) {
          if(file.toLowerCase().endsWith(supported_formats[i])) {
            return true;
          }
        }
        return false;
      },

      // we expose status and metadata for VU etc (header.js),
      // check this because it's ugly
      getMetadata: function() {return metadata; },
      getStatus: function() { return status; }
    };

}]);
