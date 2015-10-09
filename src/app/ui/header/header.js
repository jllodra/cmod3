"use strict";

angular.module('cmod.ui.header', [
  'cmod.nwgui',
  'cmod.player',
  'cmod.engine',
  'cmod.ui.settings'
])
.controller('cmodHeaderCtrl',
  [         'settings', 'nwgui', 'player', 'engine', '$scope', '$rootScope',
    function(settings, nwgui, player, engine, $scope, $rootScope) {

      var requestId;

      var drops = 0;
      var max_drops = 4 /*0*/; // TODO: add a drop frame user setting!

      $scope.vo = 100;

      // angularjs shortcut
      var vuleftel = document.getElementById('vul_overlay');
      var vurightel = document.getElementById('vur_overlay');

      $scope.minimize = function() {
        nwgui.Window.get().minimize();
      };

      $scope.close = function() {
        nwgui.Window.get().close();
      };

      $scope.devConsole = function() {
        nwgui.Window.get().showDevTools();
      };

      $scope.vochange = function() {
        player.setVolume($scope.vo/100);
      };

      $rootScope.$on('vochanged', function() {
        $scope.vo = player.getVolume() * 100;
      });

      $rootScope.$on('vuchanged', function() {
        if (settings.get('vu')) {
          requestId = window.requestAnimationFrame(updateUI);
        } else {
          window.cancelAnimationFrame(requestId);
          vuleftel.style.transform = "scaleX(1)";
          vurightel.style.transform = "scaleX(1)";
        }
      });

      function updateUI() {
        if(!settings.get('vu')) return;

        requestId = window.requestAnimationFrame(updateUI);

        if(drops < max_drops) {
          return ++drops;
        }
        drops = 0;

        var left = 0;
        var right = 0;

        var array = new Uint8Array(engine.analyzerNodeCh1.frequencyBinCount);
        engine.analyzerNodeCh1.getByteFrequencyData(array);
        var array2 = new Uint8Array(engine.analyzerNodeCh2.frequencyBinCount);
        engine.analyzerNodeCh2.getByteFrequencyData(array2);
        for (var i = 0, length = array.length/4; i < length; i++) {
            left += array[i];
            right += array2[i];
        }
        left = left/length/255;
        right = right/length/255;

        left = Math.abs(left - 1);
        right = Math.abs(right - 1);

        ////left = -20*Math.log(Math.abs(left))/Math.LN10;
        ////right = -20*Math.log(Math.abs(right))/Math.LN10;

        //left = -100*Math.log(Math.abs(left))/Math.LN10;
        //right = -100*Math.log(Math.abs(right))/Math.LN10;
        //window.performance.mark('log10_done');
        //window.performance.measure('log10', 'log10_start', 'log10_done');

        ////left = (left == Infinity) ? 1 : left/170;
        ////right = (right == Infinity) ? 1 : right/170;

        //left = (left == Infinity) ? 1 : left/300;
        //right = (right == Infinity) ? 1 : right/300;

        vuleftel.style.transform = "scaleX(" +  left + ")";
        vurightel.style.transform = "scaleX(" +  right + ")";

        /*if(left !== $scope.vuleft || right !== $scope.vuright) {
          $scope.$apply(function() {
            $scope.vuleft = left;
            $scope.vuright = right;
          });
        }*/
      }

      requestId = window.requestAnimationFrame(updateUI);
}]);
