"use strict";

angular.module('cmod.player', [
  'cmod.playerState',
  'cmod.engine'
])
.factory('player', [
  'state', 'engine', '$timeout', '$rootScope',
  function(state, engine, $timeout, $rootScope) {

    var supported_formats = "mod s3m xm it mptm stm nst m15 stk wow ult 669 mtm med far mdl ams dsm amf okt dmf ptm psm mt2 dbm digi imf j2b gdm umx mo3 xpk ppm mmcmp".split(" ");

    var buffer = null; // necessary? // TODO: next thing todo check this, remove in future versions
    var metadata = null; // metadata from last loaded file, necessary? TODO: next thing todo check this, remove in future versions
    var status = {
      playing: false,
      stopped: true,
      paused: false,
      hasEnded: false, // song did end
      nectarine: true // streaming nectarine
    };
    // we should write a nectarine module&service TODO (pull-request anyone?)
    var nectarine_endpoint = "https://www.scenemusic.net/demovibes/xml/queue/";

    var refresh_timeout = null;

    return {
      load: function(file, callback) {
        console.log("load");
        var xhr = new window.XMLHttpRequest();
        xhr.open('GET', file, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function (evt) {
          // TODO: check possible errors
          if(xhr.response) {
            buffer = xhr.response;
            engine.unload();
            function _() {
              if(engine.status.bufferIsEmptyEnsured) {
                engine.loadBuffer(buffer);
                //process.nextTick(callback); // TODO: not necessary because we wait for the buffer to be emptied
                callback();
              } else {
                setTimeout(_, 200);
              }
            }
            setTimeout(_, 100);
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
            //metadata = engine.metadata(buffer);
            engine.readMetadataAsync(buffer, function(metadata) {
              metadata.path = file;
              callback(metadata);
            });
            //metadata.path = file;
            //callback(metadata);
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
      getVolume: function() {
        return engine.getVolume();
      },
      setVolume: function(v) {
        engine.setVolume(v);
        $rootScope.$broadcast('vochanged');
      },
      volumeUp: function(by) {
        this.setVolume(engine.status.volume+by);
      },
      volumeDown: function(by) {
        this.setVolume(engine.status.volume-by);
      },
      loadAndPlay: function(file) {
        console.info("LOAD AND PLAY");
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
      playNectarine: function(streamUrl) {
        try {
          // TODO: use the MediaElement please...
          var audioel = window.document.getElementById('audio');
          audioel.src=streamUrl;
          audioel.play();
          status.nectarine = true;
          state.playing_nectarine = true;
          this.refreshNectarine();
        } catch (e) {
          console.error("cant play nectarine :(");
        }
      },
      refreshNectarine: function() {
        // this is defensive coding
        $timeout.cancel(refresh_timeout);
        refresh_timeout = null;
        if(state.playing_nectarine) {
          var xhr = new window.XMLHttpRequest();
          xhr.onload = function(evt) {
            //console.info(evt);
            if(evt.currentTarget.status !== 200) {
              refresh_timeout = $timeout(this.refreshNectarine.bind(this), 61000);
              return console.error("not a 200");
            }
            var xml = evt.currentTarget.responseXML;
            var lists = ['now', 'queue', 'history'];
            for(var i = 0; i < lists.length; i++) {
              var list = xml.getElementsByTagName(lists[i])[0].getElementsByTagName('entry');
              if(!list) {
                refresh_timeout = $timeout(this.refreshNectarine.bind(this), 61000);
                return console.info("no now info"); // No "now"? Call in 10 secs // this should never happen
              }
              state.nectarine_info[lists[i]] = [];
              for(var j = 0; j < list.length; j++) {
                var artist = list[j].getElementsByTagName('artist');
                for(var k = 0, artists = []; k < artist.length; k++) {
                  artists.push(artist[k].innerHTML);
                }
                var song = list[j].getElementsByTagName('song')[0];
                var artiststext = artists.join('&');
                var entry = {
                  song: song.textContent.length > 45 ? song.textContent.substring(0,45) + '…' : song.textContent,
                  artist: artiststext.length > 24 ? artiststext.substring(0,24) + '…' : artiststext,
                  requester: list[j].getElementsByTagName('requester')[0].innerHTML,
                  time: song.getAttribute('length')
                };
                if(i === 0 && j === 0) {
                  if(!refresh_timeout) {
                    var playstart = new Date(list[j].getElementsByTagName('playstart')[0].textContent);
                    var length = song.getAttribute('length').split(':');
                    var min = parseInt(length[0], 10);
                    var secs = parseInt(length[1], 10);
                    var mms = (min*60+secs)*1000;
                    var playend = new Date(playstart.getTime() + mms);
                    var diffms = playend-(new Date());
                    diffms += 5000; // 5 extra safe secs
                    //console.info("timeout set for " + diffms);
                    if(diffms >= 5000) {
                      refresh_timeout = $timeout(this.refreshNectarine.bind(this), diffms);
                    } else {
                      //console.info("ok... dunno what happened by 10000 safe")
                      refresh_timeout = $timeout(this.refreshNectarine.bind(this), 10000);
                    }
                  }
                }
                state.nectarine_info[lists[i]].push(entry);
              }
            }
          }.bind(this);
          xhr.open('GET', nectarine_endpoint, true);
          xhr.send(null);
        }
      },
      stopNectarine: function() {
        try {
          //TODO: Use the MediaElement from the engine instead of the tag
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
