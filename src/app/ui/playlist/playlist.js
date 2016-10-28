"use strict";

angular.module('cmod.ui.playlist', [
  'cmod.player',
  'cmod.playerState',
  'cmod.ui.settings',
  'cmod.utils'
])
.controller('cmodPlaylistCtrl',
  [         'nwgui', 'player', 'state', 'settings', '$rootScope', '$scope', '$state', '$timeout', 'toastr', 'utils', // We pre-load utils to avoid unnecessary future stuttering
    function(nwgui, player, state, settings, $rootScope, $scope, $state, $timeout, toastr, utils) {
      console.log("playlist ctrl!");

      $scope.state = state;

      $scope.addSongToPlaylist = function(path) {
        console.log("adding song...");
        if(player.isFormatSupported(path)) {
          player.metadataFromFile(path, function(metadata) {
            console.log(metadata);
            $scope.$apply(function() {
              $scope.state.playlist.push({
                'name': metadata.title,
                'filename': metadata.filename,
                'path': metadata.path,
                'metadata': metadata
              });
            });
          });
        } else {
          console.error('Format not supported ' + path);
        }
      };

      $scope.addSongsToPlaylist = function(paths) {
        console.log(paths);
        var left = paths.length;
        var newSongs = [];

        // callback for metadata
        var metadataLoaded = function(index) {
          return function(metadata) {
            console.log(metadata);
            newSongs[index] = {
              'name': metadata.title,
              'filename': metadata.filename,
              'path': metadata.path,
              'metadata': metadata
            };
            left--;
            if(left === 0) { // if this is the last song, push all songs
              $scope.$apply(function() {
                $scope.state.playlist = $scope.state.playlist.concat(newSongs);
              });
            }
          };
        };

        // Load metadata from all files
        for(var i = 0; i < paths.length; i++) {
          if(player.isFormatSupported(paths[i])) {
            player.metadataFromFile(paths[i], metadataLoaded(i));
          } else {
            console.error('Format not supported ' + paths[i]);
          }
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

      // [[ addFilesToPlaylistHidden ]]
      // Add files to current playlist
      var chooser = document.getElementById('addFilesToPlaylistHidden');
      chooser.addEventListener("change", function(evt) {
        console.log(this.value);
        var files = this.value.split(';');
        $scope.addSongsToPlaylist(files.sort());
      }, false);
      $scope.addFilesToPlaylist = function() {
        // https://docs.angularjs.org/error/$rootScope/inprog
        $timeout(function() {
          chooser.click();
        }, 0, false);
      };

      // [[ savePlaylistHidden ]]
      // Save current playlist state to file system
      var savePlaylistChooser = document.getElementById('savePlaylistHidden') ;
      savePlaylistChooser.addEventListener('change', function(evt) {
        console.log('saving playlist to file', this.value) ;
        // Ensure we have an appropriate file extension (.json)
        // Maybe just save song path? Looks like metadata gets determined from the file
        var filename = (this.value.endsWith('.json')) ? this.value : this.value + '.json' ;
        utils.fs.writeFile(filename, JSON.stringify(state.playlist), function(err) {
          if (err) {
            console.error('error writing playlist', err);
            throw err;
          }
        });
      });
      $scope.savePlaylist = function() {
        $timeout(function() {
          savePlaylistChooser.click();
        }, 0, false);
      };

      // [[ loadPlaylistHidden ]]
      // Load playlist from file system and add songs to our player
      var loadPlaylistChooser = document.getElementById('loadPlaylistHidden') ;
      loadPlaylistChooser.addEventListener('change', function(evt) {
        console.log('loading playlist', this.value) ;
        utils.fs.readFile(this.value, function(err, data) {
          if (err) {
            console.error('error loading playlist', err);
            throw err;
          }

          // We only need the path to the file to load, let the other methods add the songs
          var paths = JSON.parse(data).reduce(function(paths, song) {
            if (song.path) {
              paths.push(song.path);
            }
            return paths;
          }, []);
          $scope.addSongsToPlaylist(paths);
        });
      });
      $scope.loadPlaylist = function() {
        $timeout(function() {
          loadPlaylistChooser.click();
        }, 0, false);
      };

      $scope.ondrop = function(e) {
        this.className = '';
        e.preventDefault();

        // callback functions using during directory walking
        var pushToPaths = function(paths) {
          return function(path, stat) {
            paths.push(path);
          };
        };
        var walkingEnded = function(paths) {
          return function(path, stat) {
            $scope.addSongsToPlaylist(paths.sort());
          };
        };

        // declarations
        var files = e.dataTransfer.files; // all files
        var entries = e.dataTransfer.items;
        var individualFilesPaths = [];

        if(files.length > 0) {
          for (var i = 0; i < files.length; ++i) {
            if(entries[i].webkitGetAsEntry().isDirectory) { // found a directory
              console.log("scanning directory: " + files[i].path);
              var paths = [];
              var emitter = utils.walkdir(files[i].path);
              emitter.on('file', pushToPaths(paths));
              emitter.on('end', walkingEnded(paths));
            } else { // individual dropped files
              individualFilesPaths.push(files[i].path);
            }
          }
        }
        if(individualFilesPaths.length > 0) {
          $scope.addSongsToPlaylist(individualFilesPaths.sort());
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
      menu.append(new nwgui.MenuItem({ type: 'separator' })) ;
      menu.append(new nwgui.MenuItem({ label: 'Load Playlist' })) ;
      menu.append(new nwgui.MenuItem({ label: 'Save Playlist' })) ;
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
      menu.items[7].click = function() {
        $scope.loadPlaylist() ;
      };
      menu.items[8].click = function() {
        $scope.savePlaylist() ;
      };
      $scope.showOptions = function($index, $event) {
        state.current_song_index_context_menu = $index;
        menu.popup($event.pageX, $event.pageY);
      };
}]);
