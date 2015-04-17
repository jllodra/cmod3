"use strict";

angular.module('cmod.ui.controls', [
  'cmod.player',
  'cmod.playerState'
])
.controller('cmodControlsCtrl',
  [         'nwgui', 'player', 'state', '$window', '$rootScope', '$scope',
    function(nwgui, player, state, $window, $rootScope, $scope) {
      console.log("Controls controller");

      var win = nwgui.Window.get();

      $scope.state = state;
      $scope.progress_bar_scaleX = 0;

      $scope.play = function() {
        if(state.current_song_index === null && state.playlist.length > 0) {
          state.current_song = state.playlist[0];
          state.current_song_path = state.playlist[0].path;
          state.current_song_index = 0;
          player.loadAndPlay(state.playlist[0].path);
        } else {
          player.play();
        }
      };

      $scope.stop = function() {
        player.stop();
      };

      $scope.pause = function() {
        player.pause();
      };

      $scope.playNectarine = function() {
        player.playNectarine();
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
        if(state.current_song != null) {
          if(!player.hasEnded()) {
            var seconds_elapsed = player.getPosition();
            var duration = state.current_song.metadata.duration;
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

}]);
