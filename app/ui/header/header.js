"use strict";

angular.module('cmod.ui.header', [
  'cmod.nwgui',
  'cmod.player',
  'cmod.engine',
  'cmod.ui.settings'
])
.controller('cmodHeaderCtrl',
  [         'settings', 'nwgui', 'player', 'engine', '$scope',
    function(settings, nwgui, player, engine, $scope) {

      var requestId;

      var drops = 0;
      var max_drops = 4;

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

      $scope.$on('vuchanged', function() {
        if (settings.get('vu')) {
          requestId = window.requestAnimationFrame(updateUI);
        } else {
          window.cancelAnimationFrame(requestId);
          $scope.vuleft = 1;
          $scope.vuright = 1;
        }


        /* else {
          window.cancelAnimationFrame(requestId);
          $scope.vuleft = 1;
          $scope.vuright = 1;
          //$scope.$apply(function() {
            $scope.vuleft = left;
            $scope.vuright = right;
          //});
        }*/
      });

      function updateUI() {
        requestId = window.requestAnimationFrame(updateUI);

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
        if(left !== $scope.vuleft || right !== $scope.vuright) {
          $scope.$apply(function() {
            $scope.vuleft = left;
            $scope.vuright = right;
          });
        }
      }

      requestId = window.requestAnimationFrame(updateUI);
}]);
