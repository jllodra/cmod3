angular.module('cmod.ui.settings', [])
.factory('settings', function($rootScope) {
  //you have to initialize settings from localstorage I guess
  var settings = {
    vu: true,
    repeat: true,
    shuffle: true
  };
  function setSetting(key, value) {
      settings[key] = value;
      $rootScope.$broadcast(key+'changed');
  };

  function getSetting(key) {
    return settings[key];
  };

  return {
    set: setSetting,
    get: getSetting
  };
})
.controller('cmodSettingsCtrl', [
          'settings', '$scope',
  function(settings,   $scope) {

    // get all settings from localStorage please?
    $scope.vu = settings.get('vu');
    $scope.repeat = settings.get('repeat');
    $scope.shuffle = settings.get('shuffle');

    $scope.hideVU = function() {
      settings.set('vu', $scope.vu);
    };

    $scope.repeatPlaylist = function() {
      settings.set('repeat', $scope.repeat);
    };

    $scope.shufflePlaylist = function() {
      settings.set('shuffle', $scope.shuffle);
    };

}]);
