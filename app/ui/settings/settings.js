"use strict";

angular.module('cmod.ui.settings', [])
.factory('settings', function($rootScope) {
  //TODO: initialize settings from localstorage
  var settings = {
    vu: true,
    repeat: false,
    shuffle: false
  };
  function setSetting(key, value) {
      settings[key] = value;
      $rootScope.$broadcast(key+'changed');
  }

  function getSetting(key) {
    return settings[key];
  }

  return {
    set: setSetting,
    get: getSetting
  };
})
.controller('cmodSettingsCtrl', [
          'settings', '$scope',
  function(settings,   $scope) {

    // get all settings from localStorage please?
    $scope.vuDisabled = !settings.get('vu');
    $scope.repeat = settings.get('repeat');
    $scope.shuffle = settings.get('shuffle');

    $scope.hideVU = function() {
      settings.set('vu', !$scope.vuDisabled);
    };

    $scope.repeatPlaylist = function() {
      settings.set('repeat', $scope.repeat);
    };

    $scope.shufflePlaylist = function() {
      settings.set('shuffle', $scope.shuffle);
    };

}]);
