"use strict";

angular.module('cmod.ui.playlist', [
  'cmod.player',
  'cmod.playerState',
  'cmod.ui.settings'
])
.controller('cmodPlaylistCtrl',
  [         'nwgui', 'player', 'state', 'settings', '$rootScope', '$scope',
    function(nwgui, player, state, settings, $rootScope, $scope) {
      console.log("playlist ctrl!");

      $scope.state = state;

      $scope.addSongToPlaylist = function(name, path) {
        console.log("adding song...");
        player.metadataFromFile(path, function(metadata) {
          console.log(metadata);
          $scope.$apply(function() {
            state.playlist.push({
              'name': metadata.title,
              'filename': name,
              'path': path,
              'metadata': metadata
            });
          });
        });
      };

      $scope.playSongInPlaylist = function(i) {
        state.current_song = state.playlist[i];
        state.current_song_path = state.playlist[i].path;
        state.current_song_index = i;
        console.log(state.current_song.metadata);
        player.loadAndPlay(state.playlist[i].path);
      };

      $scope.removeSongFromPlaylist = function() {
        state.playlist.splice(state.current_song_index_context_menu, 1);
        if(state.current_song_index_context_menu === state.current_song_index) {
          player.stop();
          state.current_song = null;
          state.current_song_path = null;
          state.current_song_index = null;
        }
      };

      $scope.removeAllSongsFromPlaylist = function() {
        player.stop();
        state.playlist = [];
        state.current_song = null;
        state.current_song_path = null;
        state.current_song_index = null;
      };

      $scope.ondrop = function(e) {
        this.className = '';
        e.preventDefault();
        // all files
        var files = e.dataTransfer.files;
        var entries = e.dataTransfer.items;
        var num_files = files.length;
        if(num_files > 0) {
          for (var i = 0; i < num_files; ++i) {
            if(entries[i].webkitGetAsEntry().isDirectory) {
              console.log("scanning directory: " + files[i].path);
              var emitter = require('walkdir')(files[i].path);
              emitter.on('file', function(path, stat) {
                if(player.isFormatSupported(path)) {
                  $scope.$apply(function() {
                    var name = path.replace(/^.*[\\\/]/, '');
                    $scope.addSongToPlaylist(name, path);
                  });
                }
              });
            } else {
              var name = files[i].name;
              if(player.isFormatSupported(name)) {
                var size = files[i].size;
                $scope.$apply(function() {
                  var path = files[i].path;
                  $scope.addSongToPlaylist(name, path);
                });
              }

            }
          }
        }
        return false;
      }

      $scope.$on('songend', function() {
        if(state.playlist.length > 0) {
          if(settings.get('shuffle')) {
            $scope.playSongInPlaylist(Math.floor(Math.random() * state.playlist.length));
          } else {
            if(state.current_song_index+1 < state.playlist.length) {
              $scope.playSongInPlaylist(state.current_song_index+1);
            } else {
              if(settings.get('repeat')) {
                $scope.playSongInPlaylist(0);
              } else {
                player.stop();
              }
            }
          }
        }
      });

      // prevent default behavior from changing page on dropped file
      var holder = document.body;
      window.ondragover = function(e) { e.preventDefault(); return false };
      window.ondrop = function(e) { e.preventDefault(); return false };
      holder.ondragover = function () { this.className = 'hover'; return false; };
      holder.ondragleave = function () { this.className = ''; return false; };
      holder.ondrop = $scope.ondrop;




      var menu = new nwgui.Menu();
      menu.append(new nwgui.MenuItem({ label: 'Remove' }));
      menu.append(new nwgui.MenuItem({ label: 'Remove all' }));
      menu.append(new nwgui.MenuItem({ type: 'separator' }));
      menu.append(new nwgui.MenuItem({ label: 'Info' }));
      menu.items[0].click = function() {
        $scope.$apply(function() {
          $scope.removeSongFromPlaylist();
        });
      };
      menu.items[1].click = function() {
        $scope.$apply(function() {
          $scope.removeAllSongsFromPlaylist();
        });
      };
      menu.items[3].click = function() {
        console.log("info " + state.current_song_index_context_menu);
      };
      $scope.showOptions = function($index, $event) {
        state.current_song_index_context_menu = $index;
        menu.popup($event.pageX, $event.pageY);
      };

}]);
