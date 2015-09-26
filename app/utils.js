"use strict";

angular.module('cmod.utils', [])
.factory('utils', [
  function() {
    return {
      Download: require('download'),
      Entities: new (require('html-entities').AllHtmlEntities)()
    };
}]);
