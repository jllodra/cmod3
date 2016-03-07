"use strict";

angular.module('cmod.ui.controls', [
  'cmod.player',
  'cmod.playerState',
  'cmod.ui.settings'
])
.controller('cmodControlsCtrl',
  [         'nwgui', 'player', 'state', '$window', '$rootScope', '$scope', '$state', 'settings',
    function(nwgui, player, state, $window, $rootScope, $scope, $state, settings) {
      console.log("Controls controller");

      var win = nwgui.Window.get();

      $scope.playback_status = player.getStatus();
      $scope.state = state;
      $scope.progress_bar_scaleX = 0;

      $scope.playOrPause = function() {
        var status = player.getStatus();
        if($scope.state.playing_nectarine) {
          $scope.stop();
        } else {
          if(status.stopped) {
            player.play();
          } else if(status.playing) {
            player.pause();
          } else if(status.paused) {
            player.pause();
          }
        }
      };

      $scope.play = function() {
        player.play();
      };

      $scope.stop = function() {
        if($scope.state.playing_nectarine && $state.$current.name === 'info') {
          $state.go('playlist');
        }
        player.stop();
      };

      $scope.pause = function() {
        player.pause();
      };

      $scope.playNectarine = function() {
        $scope.stop();
        $scope.state.current_song = null;
        $scope.state.current_song_path = null;
        $scope.state.current_song_index = null;
        player.playNectarine(settings.get('nectastream'));
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
          if (e.keyCode == 187 || e.keyCode == 107) {
            player.volumeUp(0.1);
          }
          if (e.keyCode == 189 || e.keyCode == 109) {
            player.volumeDown(0.1);
          }
        }
      }, false);

      var playOrPauseKey = new nwgui.Shortcut({
        key: 'MediaPlayPause',
        active: function() {
          $scope.playOrPause();
          $scope.$apply();
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
