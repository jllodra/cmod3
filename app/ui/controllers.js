angular.module('cmod.ui', [])
.run(function($rootScope) {
  var app = require('./app/app.js');
  //app.load("./mods/Pop/DOSKPRO.XM");
  $rootScope.gui = require('nw.gui');
  $rootScope.app = app;
  $rootScope.supportedFormats = "mod s3m xm it mptm stm nst m15 stk wow ult 669 mtm med far mdl ams dsm amf okt dmf ptm psm mt2 dbm digi imf j2b gdm umx mo3 xpk ppm mmcmp".split(" ");
  // remove
  window.app = app;
})
.directive('ngRightClick', function($parse) {
  return function(scope, element, attrs) {
    var fn = $parse(attrs.ngRightClick);
    element.bind('contextmenu', function(event) {
      scope.$apply(function() {
        event.preventDefault();
        fn(scope, {$event:event});
      });
    });
  };
})
.controller('cmodAppCtrl', function ($rootScope, $scope) {
  var app = $rootScope.app;
  var gui = $rootScope.gui;
  var menu = new gui.Menu();
  menu.append(new gui.MenuItem({ label: 'Remove' }));
  menu.append(new gui.MenuItem({ label: 'Remove all' }));
  menu.append(new gui.MenuItem({ type: 'separator' }));
  menu.append(new gui.MenuItem({ label: 'Info' }));
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

  $scope.current_song = null;
  $scope.current_song_index = null;
  $scope.current_song_index_context_menu = null;
  $scope.playlist = [
    /*{
      'name': 'Land of Lore',
      'filename': 'BLAEH.IT',
      'path': '/Users/josep/Projects/cmod3/mods/Pop/nwk-road.xm',
      'duration': '1:30',
      'metadata': null
    }*/
  ];
  $scope.showOptions = function($index, $event) {
    $scope.current_song_index_context_menu = $index;
    menu.popup($event.pageX, $event.pageY);
  };
  $scope.addSongToPlaylist = function(name, path) {
    console.log("adding song...");
    $scope.playlist.push({
      'name': '',
      'filename': name,
      'path': path,
      'duration': '0:00',
      'metadata': null
    });
    var i = $scope.playlist.length - 1;
    app.player.metadataFromFile(path, function(metadata) {
      console.log(metadata);
      $scope.$apply(function() {
        var minutes = Math.floor(metadata.duration/60);
        var seconds = Math.round(metadata.duration - minutes * 60);
        $scope.playlist[i].name = metadata.title;
        $scope.playlist[i].duration =  minutes + ":" + (("0" + seconds).substr(-2, 2));
        $scope.playlist[i].metadata = metadata;
        console.log($scope.playlist);
      });
    });
  };
  $scope.playSongInPlaylist = function(i) {
    console.log("play song in playlist...");
    if($scope.current_song_index !== null) {
      $('table#playlist tbody tr:nth-child(' + ($scope.current_song_index+1) + ')').removeClass('selected_song');
    }
    $scope.current_song = $scope.playlist[i].path;
    $scope.current_song_index = i;
    $('table#playlist tbody tr:nth-child(' + ($scope.current_song_index+1) + ')').addClass('selected_song');
    app.loadAndPlay($scope.playlist[i].path);
  };

  $scope.removeSongFromPlaylist = function() {
    $scope.playlist.splice($scope.current_song_index_context_menu, 1);
  };

  $scope.removeAllSongsFromPlaylist = function() {
    $scope.playlist = [];
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
    if($scope.current_song_index === null && $scope.playlist.length > 0) {
      $scope.playSongInPlaylist(0);
    } else {
      app.player.play();
    }
  };
  $scope.stop = function() {
    app.player.stop();
  };
  $scope.pause = function() {
    app.player.pause();
  };
  $scope.playNectarine = function() {
    app.player.playNectarine();
  };
  $scope.seekProgressBar = function($event) {
    console.log($event);
    console.log($event.pageX);
    console.log($($event.currentTarget).width());
    var percent = $event.pageX / $($event.currentTarget).width() * 100;
    console.log(percent);
    app.player.setPosition(percent);
  };

  $scope.ondrop = function(e) {
    this.className = '';
    e.preventDefault();
    // all files
    var files = e.dataTransfer.files;
    var num_files = files.length;
    if(num_files > 0) {
      var first_new_file = $scope.playlist.length;
      for (var i = 0; i < num_files; ++i) {
        var name = files[i].name;
        var supported = false;
        for (var j = 0; j < $rootScope.supportedFormats.length && !supported; j++) {
          if(name.toLowerCase().endsWith($rootScope.supportedFormats[j])) {
            supported = true;
          }
        }
        if(supported) {
          var size = files[i].size;
          var path = files[i].path;
          $scope.$apply(function() {
            $scope.addSongToPlaylist(name, path);
          });
        }
      }
      // don't play when dropping files... :?
      /*
      $scope.$apply(function() {
        $scope.playSongInPlaylist(first_new_file);
      });
      */
    }
    /*
    // pick first file
    // TODO: check extension
    if(num_files === 1) {
      var name = files[0].name;
      var size = files[0].size;
      var path = files[0].path;
      $scope.$apply(function() {
        $scope.addSongToPlaylist(name, path);
        //$scope.playSongInPlaylist($scope.playlist.length-1);
      });
      $scope.$apply(function() {
        //$scope.addSongToPlaylist(name, path);
        $scope.playSongInPlaylist($scope.playlist.length-1);
      });
    }*/
    return false;
  }

  // prevent default behavior from changing page on dropped file
  var holder = document.body;
  window.ondragover = function(e) { e.preventDefault(); return false };
  window.ondrop = function(e) { e.preventDefault(); return false };
  holder.ondragover = function () { this.className = 'hover'; return false; };
  holder.ondragleave = function () { this.className = ''; return false; };
  holder.ondrop = $scope.ondrop;


  $scope.minimize = function() {
    gui.Window.get().minimize();
  };

  $scope.close = function() {
    gui.Window.get().close();
  };

  $scope.devConsole = function() {
    gui.Window.get().showDevTools();
  };
  // INIT for testing
  //$scope.addSongToPlaylist("nwk-road.xm", "/Users/josep/Projects/cmod3/mods/Pop/nwk-road.xm");

})
.controller('cmodHeaderCtrl', function($rootScope, $scope) {

});
