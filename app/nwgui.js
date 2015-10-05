"use strict";

angular.module('cmod.nwgui', [])
.factory('nwgui', [
  function() {
    return require('nw.gui');
}]);
