"use strict";

angular.module('cmod.ui.playlist', [
  'cmod.player',
  'cmod.playerState',
  'cmod.ui.settings',
  'cmod.utils'
])
.controller('cmodPlaylistCtrl',
  [         'nwgui', 'player', 'state', 'settings', '$rootScope', '$scope', '$state', '$timeout', 'utils', // We pre-load utils to avoid unnecessary future stuttering
    function(nwgui, player, state, settings, $rootScope, $scope, $state, $timeout, utils) {
      console.log("playlist ctrl!");

      $scope.state = state;

      // TODO: arregla això (feu com la d'abaix, amb el metadata...)

      $scope.addSongToPlaylist = function(name, path) {
        console.log("adding song...");
        player.metadataFromFile(path, function(metadata) {
          console.log(metadata);
          $scope.$apply(function() {
            $scope.state.playlist.push({
              'name': metadata.title,
              'filename': name,
              'path': path,
              'metadata': metadata
            });
          });
        });
      };

      // TODO: mira si pots treure ses funcions defora per no crear tantes coses...

      $scope.addSongsToPlaylist = function(paths) {
        console.dir(paths);
        var left = paths.length;
        var newSongs = [];
        // PROMISIFY THIS!
        for(var i = 0; i < paths.length; i++) {
          player.metadataFromFile(paths[i], (function(index) {
            return function(metadata) {
              console.log(metadata);
              newSongs[index] = {
                'name': metadata.title,
                'filename': metadata.filename,
                'path': metadata.path,
                'metadata': metadata
              };
              left--;
              if(left === 0) {
                $scope.$apply(function() {
                  $scope.state.playlist = $scope.state.playlist.concat(newSongs);
                });
              }
            };
          })(i));
        }
      };

      $scope.markSongInPlaylist = function(i, $event) {
        $scope.state.current_song_index_marked = i;
        $event.stopPropagation();
      };

      $scope.playSongInPlaylist = function(i) {
        $scope.state.current_song = $scope.state.playlist[i];
        $scope.state.current_song_path = $scope.state.playlist[i].path;
        $scope.state.current_song_index = i;
        $scope.state.current_song_index_marked = null;
        console.log($scope.state.current_song.metadata);
        player.loadAndPlay($scope.state.playlist[i].path);
      };

      $scope.removeSongFromPlaylist = function() {
        state.playlist.splice(state.current_song_index_context_menu, 1);
        if(state.current_song_index_context_menu === state.current_song_index) {
          player.stop();
          state.current_song = null;
          state.current_song_path = null;
          state.current_song_index = null;
        } else if (state.current_song_index_context_menu < state.current_song_index) {
          state.current_song_index--;
        }
        state.current_song_index_marked = null;
      };

      $scope.removeAllSongsFromPlaylist = function() {
        player.stop();
        state.playlist = [];
        state.current_song = null;
        state.current_song_path = null;
        state.current_song_index = null;
        state.current_song_index_marked = null;
      };

      // TODO: pensa que el .replace ja el fa el player a metadata, no fa falta aquí

      var chooser = document.getElementById('addFilesToPlaylistHidden');
      chooser.addEventListener("change", function(evt) {
        console.log(this.value);
        var files = this.value.split(';');
        var name;
        for(var i = 0; i < files.length; i++) {
          name = files[i].replace(/^.*[\\\/]/, ''); // TODO: does this work on win32?
          $scope.addSongToPlaylist(name, files[i]);
        }
      }, false);
      $scope.addFilesToPlaylist = function() {
        // https://docs.angularjs.org/error/$rootScope/inprog
        $timeout(function() {
          chooser.click();
        }, 0, false);
      };

      // TODO: mira si te pot quedar més guapo

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
              var paths = [];
              var emitter = require('walkdir')(files[i].path);
              emitter.on('file', function(path, stat) {
                if(player.isFormatSupported(path)) {
                  console.dir(path);
                  paths.push(path);
                }
              });
              emitter.on('end', function(path, stat) {
                console.dir("eeeended");
                //$scope.$apply(function() {
                  $scope.addSongsToPlaylist(paths.sort());
                //});
              });
            } else {
              var name = files[i].name;
              if(player.isFormatSupported(name)) {
                var size = files[i].size;
                //$scope.$apply(function() {
                  var path = files[i].path;
                  $scope.addSongToPlaylist(name, path);
                //});
              }
            }
          }
        }
        return false;
      };

      $scope.playNext = function(forced) {
        if($scope.state.playlist.length > 0) {
          if(settings.get('shuffle')) {
            console.log('suffle');
            $scope.playSongInPlaylist(Math.floor(Math.random() * $scope.state.playlist.length));
          } else {
            if($scope.state.current_song_index+1 < $scope.state.playlist.length) {
              console.log('next');
              $scope.playSongInPlaylist($scope.state.current_song_index+1);
            } else {
              if(settings.get('repeat')) {
                console.log('repeat');
                $scope.playSongInPlaylist(0);
              } else {
                if(forced) {
                  $scope.playSongInPlaylist(0);
                } else {
                  player.stop();
                }
              }
            }
          }
        }
      };

      $scope.playPrev = function(forced) {
        if($scope.state.playlist.length > 0) {
          if(settings.get('shuffle')) {
            console.log('suffle');
            $scope.playSongInPlaylist(Math.floor(Math.random() * $scope.state.playlist.length));
          } else {
            if($scope.state.current_song_index-1 >= 0) {
              console.log('prev');
              $scope.playSongInPlaylist($scope.state.current_song_index-1);
            } else {
              if(settings.get('repeat')) {
                console.log('repeat');
                $scope.playSongInPlaylist($scope.state.playlist.length-1);
              } else {
                if(forced) {
                  $scope.playSongInPlaylist(0);
                } else {
                  player.stop();
                }
              }
            }
          }
        }
      };

      if(!$rootScope.songendcleanup) {
        $rootScope.songendcleanup = $rootScope.$on('songend', function() {
          console.log("songend recieved");
          $scope.playNext(false);
        });
        /*$scope.$on('$destroy', function() {
          songendcleanup();
        });*/
      }

      if(!$rootScope.playnextcleanup) {
        $rootScope.playnextcleanup = $rootScope.$on('playnext', function() {
          console.log("playnext recieved");
          if(!$scope.state.playing_nectarine) {
            $scope.playNext(true);
          }
        });
        /*$scope.$on('$destroy', function() {
          playnextcleanup();
        });*/
      }

      if(!$rootScope.playprevcleanup) {
        $rootScope.playprevcleanup = $rootScope.$on('playprev', function() {
          console.log("playprev recieved");
          if(!$scope.state.playing_nectarine) {
            $scope.playPrev(true);
          }
        });
        /*$scope.$on('$destroy', function() {
          playprevcleanup();
        });*/
      }

      // prevent default behavior from changing page on dropped file
      var holder = document.body;
      window.ondragover = function(e) { e.preventDefault(); return false; };
      window.ondrop = function(e) { e.preventDefault(); return false; };
      holder.ondragover = function () { this.className = 'hover'; return false; };
      holder.ondragleave = function () { this.className = ''; return false; };
      holder.ondrop = $scope.ondrop;

      var menu = new nwgui.Menu();
      menu.append(new nwgui.MenuItem({ label: 'Remove' }));
      menu.append(new nwgui.MenuItem({ label: 'Remove all' }));
      menu.append(new nwgui.MenuItem({ type: 'separator' }));
      menu.append(new nwgui.MenuItem({ label: 'Info' }));
      menu.append(new nwgui.MenuItem({ type: 'separator' }));
      menu.append(new nwgui.MenuItem({ label: 'Add file(s)' }));
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
        $state.go('info');
      };
      menu.items[5].click = function() {
        $scope.addFilesToPlaylist();
      };
      $scope.showOptions = function($index, $event) {
        state.current_song_index_context_menu = $index;
        menu.popup($event.pageX, $event.pageY);
      };
}]);
