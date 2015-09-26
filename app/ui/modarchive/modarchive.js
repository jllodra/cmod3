"use strict";

angular.module('cmod.ui.modarchive', [
  'cmod.player',
  'cmod.playerState',
  'cmod.config',
  'cmod.utils',
  'toastr'
])
.controller('cmodModarchiveCtrl',
  [         'player', 'state', '$rootScope', '$scope', 'toastr', 'config', 'utils',
    function(player, state, $rootScope, $scope, toastr, config, utils) {
      console.log("Modarchive controller");

      var REQUEST = "http://api.modarchive.org/xml-tools.php?key=" + config.modarchive  + "&request=view_modules_by_guessed_artist&query=";

      $scope.state = state;
      $scope.searchString = "";

      $scope.searchButton = function() {

        if($scope.searchString) {
          $scope.state.search_results = [];
          console.log("searchButton: " + $scope.searchString);
          var searchText = $scope.searchString;
          var xhr = new window.XMLHttpRequest();
          xhr.onload = function(evt) {
            var xml = xhr.responseXML;
            var count = xml.getElementsByTagName('results');
            if(count.length === 0) {
              toastr.success('0 songs found', searchText);
              return; // TODO: no results
            }
            count = count[0].textContent;
            toastr.success(count + ' songs found', searchText);
            var modulesEl = xml.getElementsByTagName('module');
            state.search_results = [];
            for(var i = 0; i < modulesEl.length; i++) {
              state.search_results.push({
                id: modulesEl[i].getElementsByTagName('id')[0].textContent,
                url: modulesEl[i].getElementsByTagName('url')[0].textContent,
                name: utils.Entities.decode(modulesEl[i].getElementsByTagName('songtitle')[0].textContent),
                filename: modulesEl[i].getElementsByTagName('filename')[0].textContent,
                size: modulesEl[i].getElementsByTagName('size')[0].textContent,
                date: modulesEl[i].getElementsByTagName('date')[0].textContent
              });
            }
            console.log(xml);
            console.log(count);
            console.log(state.search_results);
          };
          xhr.open('GET', REQUEST + $scope.searchString, true);
          xhr.send(null);
        }
      };

      $scope.downloadSongAndPlay = function(i) {
        var module = state.search_results[i];
        console.log(module);
        new utils.Download({mode: '755'})
          .get(module.url)
          .dest('/Users/josep/modules')
          .rename(module.id + '_' + module.filename)
          .run(function() {
            console.log("download done!");
            toastr.success(module.filename, 'Download completed');
          });
      };

}]);
