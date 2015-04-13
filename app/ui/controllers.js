angular.module('cmod', [])
.run(function($rootScope) {
  var app = require('./app/app.js');
  app.init();
  app.load("./mods/Pop/DOSKPRO.XM");
  $rootScope.app = app;
  $rootScope.gui = require('nw.gui');
})
.controller('cmodCtrl', function ($rootScope, $scope) {
  var app = $rootScope.app;

  $scope.current_song = ' ';
  $scope.playlist = [
    {
      'name': 'Land of Lore',
      'filename': 'BLAEH.IT',
      'path': '/Users/josep/Projects/cmod3/mods/Pop/nwk-road.xm',
      'length': '1:30'
    },
    {
      'name': 'Nexus S',
      'filename': 'Fast just got faster with Nexus S.',
      'path': '/Users/josep/Projects/cmod3/mods/Pop/nwk-road.xm',
      'length': '1:30'
    },
    {
      'name': 'Nexus S',
      'filename': 'Fast just got faster with Nexus S.',
      'path': '/Users/josep/Projects/cmod3/mods/Pop/nwk-road.xm',
      'length': '1:30'
    }
  ];
  $scope.addSongToPlaylist = function(name, path) {
    console.log("adding song...");
    $scope.playlist.push({
      'name': name,
      'filename': name,
      'path': path,
      'length': '0:00'
    });
    console.log($scope.playlist);
  };
  $scope.playSongInPlaylist = function(i) {
    console.log("play song in playlist...");
    $scope.current_song = $scope.playlist[i].path;
    app.loadAndPlay($scope.playlist[i].path);
  };

  $('#fileDialog').change(function(evt) {
    var file = $(this)[0].files[0];
    var name = file.name;
    var path = file.path;
    $scope.$apply(function() {
      $scope.addSongToPlaylist(name, path);
    });
  });
  $scope.addFilesToPlaylist = function() {
    $('#fileDialog').trigger('click');
  };
  $scope.play = function() {
    app.player.play();
  };
  $scope.stop = function() {
    app.player.stop();
  };
  $scope.pause = function() {
    app.player.pause();
  };

  $scope.ondrop = function(e) {
    this.className = '';
    e.preventDefault();
    // all files
    var files = e.dataTransfer.files;
    var num_files = files.length;
    for (var i = 0; i < num_files; ++i) {
      console.log(files[i].path);
    }
    // pick first file
    // TODO: check extension
    if(num_files === 1) {
      var name = files[0].name;
      var size = files[0].size;
      var path = files[0].path;
      //app.loadAndPlay(path);
      $scope.$apply(function() {
        $scope.addSongToPlaylist(name, path);
        $scope.playSongInPlaylist($scope.playlist.length-1);
      });
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

});
