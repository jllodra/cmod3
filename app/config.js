"use strict";

angular.module('cmod.config', [])
.factory('config', [
  function() {
    return require('./config.json');
}]);
