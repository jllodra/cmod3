"use strict";

angular.module('cmod.ui.modarchive', [
  'cmod.player',
  'cmod.playerState',
  'cmod.config',
  'cmod.utils',
  'cmod.ui.settings',
  'toastr'
])
.controller('cmodModarchiveCtrl',
  [         'player', 'state', '$rootScope', '$scope', 'toastr', 'config', 'utils', 'settings',
    function(player, state, $rootScope, $scope, toastr, config, utils, settings) {
      console.log("Modarchive controller");

      var REQUEST_ARTIST = "http://api.modarchive.org/xml-tools.php?key=" + config.modarchive + "&request=view_modules_by_guessed_artist&query=";
      var REQUEST_SONG = "http://api.modarchive.org/xml-tools.php?key=" + config.modarchive + "&request=search&type=filename_or_songtitle&query=";

      $scope.state = state;

      $scope.searchButton = function(type) {

        var searchText;
        var request;

        if(type) {
          $scope.state.modarchive.search_results = [];
          state.modarchive.current_page = 1;
          if(type == 'artist') {
            searchText = $scope.state.modarchive.current_artist_text;
            request = REQUEST_ARTIST;
          } else if (type == 'song') {
            searchText = $scope.state.modarchive.current_song_text
            request = REQUEST_SONG;
          }
          state.modarchive.current_type = type;
          state.modarchive.current_text = searchText;
          state.modarchive.current_request = request;
        } else { // loading next page
          state.modarchive.current_page++;
          searchText = state.modarchive.current_text;
          request = state.modarchive.current_request;
        }

        if(searchText) {
          console.log("searchButton: " + searchText);
          var xhr = new window.XMLHttpRequest();
          xhr.onload = function(evt) {
            $scope.state.modarchive.is_downloading_modarchive = false;
            var xml = xhr.responseXML;
            var count = xml.getElementsByTagName('results');
            if(count.length === 0) {
              toastr.success('0 songs found', searchText);
              return; // TODO: no results
            }
            count = count[0].textContent;
            var totalpages = xml.querySelector('totalpages').textContent;
            $scope.more_songs_to_load = (totalpages != state.modarchive.current_page);
            toastr.success(count + ' songs found', searchText);
            var modulesEl = xml.getElementsByTagName('module');
            for(var i = 0; i < modulesEl.length; i++) {
              var artist = modulesEl[i].querySelector('artist_info artist alias');
              artist = artist ? artist.textContent : null;
              state.modarchive.search_results.push({
                id: modulesEl[i].querySelector('id').textContent,
                url: modulesEl[i].querySelector('url').textContent,
                name: utils.Entities.decode(modulesEl[i].querySelector('songtitle').textContent),
                filename: modulesEl[i].querySelector('filename').textContent,
                size: modulesEl[i].querySelector('size').textContent,
                date: modulesEl[i].querySelector('date').textContent,
                artist: artist
              });
            }
            console.log(xml);
            console.log(count);
            console.log(state.modarchive.search_results);
          };
          xhr.open('GET', request + searchText + "&page=" + state.modarchive.current_page, true);
          $scope.state.modarchive.is_downloading_modarchive = true;
          $scope.state.modarchive.loading_text = "Searching the modarchive...";
          xhr.send(null);
        }
      };

      $scope.loadMoreSongs = function() {
        $scope.searchButton();
      };

      // TODO: no need to have this in $scope
      $scope.downloadSongAndPlay = function(i) {
        var module = $scope.state.modarchive.search_results[i];
        console.log(module);
        $scope.state.modarchive.is_downloading_modarchive = true;
        $scope.state.modarchive.loading_text = "Downloading song...";
        var filename = '[' + module.id + ']_' + module.filename;
        var path = settings.get('moddir') + '/';
        if(module.artist) {
          filename = module.artist + '_' + filename;
          path = path + module.artist;
        } else {
          path = path + 'unknown_artist';
        }
        var dest = path;
        if(!utils.fs.existsSync(dest)) {
          utils.fs.mkdirSync(dest);
        }
        path = path + '/' + filename;
        if(!utils.fs.existsSync(path)) {
          new utils.Download({mode: '755'})
            .get(module.url)
            .dest(dest)
            .rename(filename)
            .run(function() {
              console.log("download done!");
              toastr.success(module.filename, 'Download completed, now playing:');
              $scope.state.modarchive.is_downloading_modarchive = false;
              player.metadataFromFile(path, function(metadata) {
                console.log("got metadata...");
                console.log(metadata);
                $scope.addSongToPlaylistAndPlay(metadata, filename, path);
              });
            });
        } else {
          player.metadataFromFile(path, function(metadata) {
            console.log("got metadata...");
            console.log(metadata);
            $scope.state.modarchive.is_downloading_modarchive = false;
            $scope.addSongToPlaylistAndPlay(metadata, filename, path);
          });
        }
      };

      $scope.addSongToPlaylistAndPlay = function(metadata, filename, path) {
        $scope.state.playlist.push({
          'name': metadata.title,
          'filename': filename,
          'path': path,
          'metadata': metadata
        });
        var song_position = $scope.state.playlist.length-1;
        $scope.state.current_song = $scope.state.playlist[song_position];
        $scope.state.current_song_path = $scope.state.playlist[song_position].path;
        $scope.state.current_song_index = $scope.song_position;
        console.log($scope.state.current_song.metadata);
        player.loadAndPlay($scope.state.playlist[song_position].path);
      };

}]);
