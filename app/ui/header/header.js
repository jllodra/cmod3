"use strict";

angular.module('cmod.ui.header', [
  'cmod.nwgui',
  'cmod.player',
  'cmod.engine'
])
.controller('cmodHeaderCtrl',
  [         'nwgui', 'player', 'engine', '$scope',
    function(nwgui, player, engine, $scope) {

      var drops = 0;
      var max_drops = 5;

      $scope.vuleft = 1;
      $scope.vuright = 1;

      $scope.minimize = function() {
        nwgui.Window.get().minimize();
      };

      $scope.close = function() {
        nwgui.Window.get().close();
      };

      $scope.devConsole = function() {
        nwgui.Window.get().showDevTools();
      };

      function updateUI() {
        window.requestAnimationFrame(updateUI);
        if(drops < max_drops) {
          return ++drops;
        }
        drops = 0;
        var left = 1;
        var right = 1;
        if(!player.hasEnded()) {
          left = -20*Math.log10(Math.abs(engine.getVU().l));
          right = -20*Math.log10(Math.abs(engine.getVU().r));
          left = (left == Infinity) ? 1 : left/400;
          right = (right == Infinity) ? 1 : right/400;
        }
        $scope.$apply(function() {
          $scope.vuleft = left;
          $scope.vuright = right;
        });
      }

      window.requestAnimationFrame(updateUI);
}]);
