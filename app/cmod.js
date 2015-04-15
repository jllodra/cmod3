"use strict";

angular.module('cmod', [
  'ui.router',
  'cmod.nwgui',
  'cmod.player',
  'cmod.ui.header',
  'cmod.ui.playlist',
  'cmod.ui.controls',
  'cmod.ui.info'
])
.config(['$stateProvider', '$urlRouterProvider',
  function($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise("playlist");
    $stateProvider
    .state('playlist', {
      url: "/playlist",
      templateUrl: "app/ui/playlist/playlist.tpl.html",
      controller: 'cmodPlaylistCtrl'
    })
    .state('info', {
      url: "/info",
      templateUrl: "app/ui/info/info.tpl.html",
      controller: 'cmodInfoCtrl'
    })
}])
.run(
  [          'nwgui', 'player', '$rootScope', '$state', '$stateParams',
    function (nwgui, player, $rootScope,   $state,   $stateParams) {
      console.log("run");
      var win = nwgui.Window.get();
      win.showDevTools();
      win.on("close", function() {
        player.quit();
        this.close(true);
      });
      win.on("loaded", function() {
        //app.init();
        var winh = window.$(window).height();
        var headh = window.$("div#header").height();
        var footh = window.$("div#footer").height();
        $rootScope.$apply(function() {
          $rootScope.height = winh-headh-footh;
        });
      });
      win.on("resize", function(x, y) {
        var winh = window.$(window).height();
        var headh = window.$("div#header").height();
        var footh = window.$("div#footer").height();
        $rootScope.$apply(function() {
          $rootScope.height = winh-headh-footh;
        });
      });
      win.moveTo(win.x, 30);

      /*
      $rootScope.$state = $state;
      $rootScope.$stateParams = $stateParams;
      */
      /*var app = require('./app/app.js');
      app.init();
      $rootScope.gui = require('nw.gui');
      $rootScope.app = app;
      $rootScope.supportedFormats = "mod s3m xm it mptm stm nst m15 stk wow ult 669 mtm med far mdl ams dsm amf okt dmf ptm psm mt2 dbm digi imf j2b gdm umx mo3 xpk ppm mmcmp".split(" ");
      // remove
      window.app = app;*/
}])
.controller('cmodAppCtrl',
  [          'nwgui', 'player', '$rootScope', '$scope',
    function (nwgui, player, $rootScope, $scope) {
      console.log("cmodAppCtrl");
      console.log(player);



      if (process.platform === "darwin") {
        var mb = new nwgui.Menu({type: 'menubar'});
        mb.createMacBuiltin('cmod3', { hideEdit: false });
        nwgui.Window.get().menu = mb;
      }

      /*
      $scope.current_song = null;
      $scope.current_song_index = null;
      $scope.current_song_index_context_menu = null;
      $scope.playlist = [
        //{
          //'name': 'Land of Lore',
          //'filename': 'BLAEH.IT',
          //'path': '/Users/josep/Projects/cmod3/mods/Pop/nwk-road.xm',
          //'duration': '1:30',
          //'metadata': null
        //}
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
          //$scope.$apply(function() {
            //$scope.playSongInPlaylist(first_new_file);
          //});
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


      $scope.minimize = function() {
        gui.Window.get().minimize();
      };

      $scope.close = function() {
        gui.Window.get().close();
      };

      $scope.devConsole = function() {
        gui.Window.get().showDevTools();
      };

      */
      // INIT for testing
      //$scope.addSongToPlaylist("nwk-road.xm", "/Users/josep/Projects/cmod3/mods/Pop/nwk-road.xm");

}])
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
.filter('mmss', function() {
  return function(seconds) {
    var minutes = Math.floor(seconds/60);
    var seconds = ("0" + Math.round(seconds - minutes * 60)).substr(-2, 2);
    return minutes + ":" + seconds;
  }
});
