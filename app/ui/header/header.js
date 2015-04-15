"use strict";

angular.module('cmod.ui.header', [])
.controller('cmodHeaderCtrl',
  [         'player', 'engine', '$scope',
    function(player, engine, $scope) {

      var drops = 0;
      var max_drops = 4;

      $scope.vuleft = 1;
      $scope.vuright = 1;

      function updateUI() {
        window.requestAnimationFrame(updateUI);
        if(drops < max_drops) {
          return ++drops;
        }
        drops = 0;

        if(player.getMetadata() != null) {
          if(!player.hasEnded() && player.getStatus().playing) {
            //var seconds = player.getPosition();
            //var completed = seconds / player.getMetadata().duration;

            //app.ui.song_position_progress.css("transform", "scaleX(" + completed + ")");

            //var minutes_elapsed = Math.floor(seconds/60);
            //var seconds_elapsed = ("0" + Math.round(seconds - minutes_elapsed * 60)).substr(-2, 2);

            //VU
            var left = -20*Math.log10(Math.abs(engine.getVU().l));
            var right = -20*Math.log10(Math.abs(engine.getVU().r));
            $scope.$apply(function() {
              $scope.vuleft = (left == Infinity) ? 1 : left/400;
              $scope.vuright = (right == Infinity) ? 1 : right/400;
            });
          } else {
            //var minutes_elapsed = "0";
            //var seconds_elapsed = "00";
            //app.ui.song_position_progress.css("transform", "scaleX(0)");
            // VU
            $scope.$apply(function() {
              $scope.vuleft = 1;
              $scope.vuright = 1;
            });
          }
          //var minutes_total = Math.floor(player.metadata.duration/60);
          //var seconds_total = ("0" + Math.round(player.metadata.duration - minutes_total * 60)).substr(-2, 2);
          //app.ui.song_position_label.text(minutes_elapsed + ":" + seconds_elapsed + " / " + minutes_total + ":" + seconds_total);
        }
      }

      window.requestAnimationFrame(updateUI);
}]);
