"use strict";

angular.module('cmod.ui.playlist', [
  'cmod.player'
])
.controller('cmodPlaylistCtrl',
  [         'nwgui', 'player', '$rootScope', '$scope',
    function(nwgui, player, $rootScope, $scope) {
      console.log("playlist ctrl!");

      $scope.current_song = null;
      $scope.current_song_index = null;
      $scope.current_song_index_context_menu = null;
      $scope.playlist = [];

      $scope.addSongToPlaylist = function(name, path) {
        console.log("adding song...");
        player.metadataFromFile(path, function(metadata) {
          console.log(metadata);
          $scope.$apply(function() {
            var minutes = Math.floor(metadata.duration/60);
            var seconds = Math.round(metadata.duration - minutes * 60);
            $scope.playlist.push({
              'name': metadata.title,
              'filename': name,
              'path': path,
              'duration': minutes + ":" + (("0" + seconds).substr(-2, 2)),
              'metadata': metadata
            });
          });
        });
      };

      $scope.playSongInPlaylist = function(i) {
        if($scope.current_song_index !== null) {
          $('table#playlist tbody tr:nth-child(' + ($scope.current_song_index+1) + ')').removeClass('selected_song');
        }
        $scope.current_song = $scope.playlist[i].path;
        $scope.current_song_index = i;
        $('table#playlist tbody tr:nth-child(' + ($scope.current_song_index+1) + ')').addClass('selected_song');
        player.loadAndPlay($scope.playlist[i].path);
      };




      $scope.ondrop = function(e) {
        this.className = '';
        e.preventDefault();
        // all files
        var files = e.dataTransfer.files;
        var num_files = files.length;
        if(num_files > 0) {
          for (var i = 0; i < num_files; ++i) {
            var name = files[i].name;
            /*var supported = false;
            for (var j = 0; j < $rootScope.supportedFormats.length && !supported; j++) {
              if(name.toLowerCase().endsWith($rootScope.supportedFormats[j])) {
                supported = true;
              }
            }*/
            //if(supported) {
              var size = files[i].size;
              var path = files[i].path;
              $scope.$apply(function() {
                $scope.addSongToPlaylist(name, path);
              });
            //}
          }
        }
        return false;
      }

      // prevent default behavior from changing page on dropped file
      var holder = document.body;
      window.ondragover = function(e) { e.preventDefault(); return false };
      window.ondrop = function(e) { e.preventDefault(); return false };
      holder.ondragover = function () { this.className = 'hover'; return false; };
      holder.ondragleave = function () { this.className = ''; return false; };
      holder.ondrop = $scope.ondrop;




      var menu = new nwgui.Menu();
      menu.append(new nwgui.MenuItem({ label: 'Remove' }));
      menu.append(new nwgui.MenuItem({ label: 'Remove all' }));
      menu.append(new nwgui.MenuItem({ type: 'separator' }));
      menu.append(new nwgui.MenuItem({ label: 'Info' }));
      menu.items[0].click = function() {
        $scope.$apply(function() {
          $scope.removeSongFromPlaylist();
        });
      };
      menu.items[1].click = function() {
        $scope.$apply(function() {
          $scope.removeAllSongsFromPlaylist();
        });
      };
      menu.items[3].click = function() {
        console.log("info " + $scope.current_song_index_context_menu);
      };
      $scope.showOptions = function($index, $event) {
        $scope.current_song_index_context_menu = $index;
        menu.popup($event.pageX, $event.pageY);
      };



      console.log(player);
}]);
