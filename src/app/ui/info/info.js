"use strict";

angular.module('cmod.ui.info', [
  'cmod.player',
  'cmod.playerState'
])
.controller('cmodInfoCtrl',
  [         'player', 'state', '$rootScope', '$scope',
    function(player, state, $rootScope, $scope) {
      console.log("Info controller");

      $scope.state = state;

      $scope.refreshNectarineInfo = function() {
        player.refreshNectarine();
      };

}]);
