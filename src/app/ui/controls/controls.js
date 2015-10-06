"use strict";

angular.module('cmod.ui.controls', [
  'cmod.player',
  'cmod.playerState'
])
.controller('cmodControlsCtrl',
  [         'nwgui', 'player', 'state', '$window', '$rootScope', '$scope', '$state',
    function(nwgui, player, state, $window, $rootScope, $scope, $state) {
      console.log("Controls controller");

      var win = nwgui.Window.get();

      $scope.playback_status = player.getStatus();
      $scope.state = state;
      $scope.progress_bar_scaleX = 0;

      $scope.playOrPause = function() {
        var status = player.getStatus();
        if(status.stopped) {
          player.play();
        } else if(status.playing) {
          player.pause();
        } else if(status.paused) {
          player.pause();
        }
      };

      $scope.play = function() {
        /*if(state.current_song_index === null && state.playlist.length > 0) {
          state.current_song = state.playlist[0];
          state.current_song_path = state.playlist[0].path;
          state.current_song_index = 0;
          player.loadAndPlay(state.playlist[0].path);
        } else {
          player.play();
        }*/
        player.play();
      };

      $scope.stop = function() {
        player.stop();
      };

      $scope.pause = function() {
        player.pause();
      };

      $scope.playNectarine = function() {
        $scope.stop();
        player.playNectarine();
        $state.go('info');
      };

      /* TODO: add files using a button (Add files)
      $('#fileDialog').change(function(evt) {
        var file = $(this)[0].files[0];
        var name = file.name;
        var path = file.path;
        $scope.$apply(function() {
          $scope.addSongToPlaylist(name, path);
        });
      });
      $scope.addFilesToPlaylist = function() {
        $('#fileDialog').trigger('click');
      };*/


      $scope.seekProgressBar = function($event) {
        if(state.current_song) {
          var percent = $event.pageX / $event.currentTarget.offsetWidth;
          $scope.progress_bar_scaleX = percent;
          player.setPosition(state.current_song.metadata.duration * percent);
        }
      };

      function updateProgressBar() {
        var completed = 0;
        var seconds_elapsed = null;
        var duration = null;
        if(state.current_song !== null) {
          if(!player.hasEnded()) {
            seconds_elapsed = player.getPosition();
            duration = state.current_song.metadata.duration;
            completed = seconds_elapsed / duration;
          } else {
            if(player.getPosition() >= state.current_song.metadata.duration) {
              console.log("songend");
              console.log(player.getPosition());
              $rootScope.$broadcast("songend");
            }
          }
        }

        $scope.$apply(function() {
          $scope.progress_bar_scaleX = completed;
          $scope.progress_bar_label_elapsed = seconds_elapsed;
          $scope.progress_bar_label_total = duration;
        });
        win.setProgressBar(completed);
      }

      $window.setInterval(updateProgressBar, 1000); // text updates

      document.addEventListener('keydown', function(e) {
        if (e.target.tagName.toUpperCase() !== 'INPUT') {
          if (e.keyCode == 32) {
            e.preventDefault();
          }
        }
      });

      document.addEventListener('keyup', function(e) {
        if (e.target.tagName.toUpperCase() !== 'INPUT') {
          e.preventDefault();
          if (e.keyCode == 32) {
            $scope.playOrPause();
          }
          if (e.keyCode == 49) {
            $state.go('playlist');
          }
          if (e.keyCode == 50) {
            $state.go('modarchive');
          }
          if (e.keyCode == 51) {
            $state.go('info');
          }
          if (e.keyCode == 52) {
            $state.go('settings');
          }
          if (e.keyCode == 53) {
            $state.go('about');
          }
        }
      }, false);

      var playOrPauseKey = new nwgui.Shortcut({
        key: 'MediaPlayPause',
        active: function() {
          $scope.playOrPause();
        },
        failed: function() {
          console.error('MediaPlayPause failed');
        }
      });

      var nextKey = new nwgui.Shortcut({
        key: 'MediaNextTrack',
        active: function() {
          $rootScope.$broadcast('playnext');
        },
        failed: function() {
          console.error('MediaNextTrack failed');
        }
      });

      var prevKey = new nwgui.Shortcut({
        key: 'MediaPrevTrack',
        active: function() {
          $rootScope.$broadcast('playprev');
        },
        failed: function() {
          console.error('MediaPrevTrack failed');
        }
      });

      nwgui.App.registerGlobalHotKey(playOrPauseKey);
      nwgui.App.registerGlobalHotKey(nextKey);
      nwgui.App.registerGlobalHotKey(prevKey);

}]);
