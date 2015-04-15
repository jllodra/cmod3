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
      $scope.progress_bar_label = "";

      $scope.play = function() {
        if(state.current_song_index === null && state.playlist.length > 0) {
          state.playSongInPlaylist(0);
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

      $scope.seekProgressBar = function($event) {
        var percent = $event.pageX / $($event.currentTarget).width();
        $scope.progress_bar_scaleX = percent;
        player.setPosition(state.current_song.metadata.duration * percent);
      };

      function updateProgressBar() {
        var completed = 0;
        //var label = "";
        var seconds_elapsed = null;
        var duration = null;
        if(!player.hasEnded()) {
          /*var minutes_elapsed = "0";
          var seconds_elapsed = "00";*/
          var seconds_elapsed = player.getPosition();
          console.log(seconds_elapsed);
          var duration = state.current_song.metadata.duration;
          console.log(duration);
          completed = seconds_elapsed / duration;
          /*completed = seconds / state.current_song.metadata.duration;
          minutes_elapsed = Math.floor(seconds/60);
          seconds_elapsed = ("0" + Math.round(seconds - minutes_elapsed * 60)).substr(-2, 2);
          var minutes_total = Math.floor(state.current_song.metadata.duration/60);
          var seconds_total = ("0" + Math.round(state.current_song.metadata.duration - minutes_total * 60)).substr(-2, 2);
          label = minutes_elapsed + ":" + seconds_elapsed + " / " + minutes_total + ":" + seconds_total;*/
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
