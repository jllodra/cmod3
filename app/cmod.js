"use strict";

angular.module('cmod', [
  'ui.router',
  'cmod.nwgui',
  'cmod.player',
  'cmod.ui.header',
  'cmod.ui.playlist',
  'cmod.ui.controls',
  'cmod.ui.info',
  'cmod.ui.modarchive',
  'cmod.ui.settings'
])
.config(['$stateProvider', '$urlRouterProvider', 'toastrConfig',
  function($stateProvider, $urlRouterProvider, toastrConfig) {
    $urlRouterProvider.otherwise("playlist");
    $stateProvider
    .state('playlist', {
      url: "/playlist",
      templateUrl: "app/ui/playlist/playlist.tpl.html",
      controller: "cmodPlaylistCtrl"
    })
    .state('info', {
      url: "/info",
      templateUrl: "app/ui/info/info.tpl.html",
      controller: "cmodInfoCtrl"
    })
    .state('modarchive', {
      url: "/modarchive",
      templateUrl: "app/ui/modarchive/modarchive.tpl.html",
      controller: "cmodModarchiveCtrl"
    })
    .state('settings', {
      url: "/settings",
      templateUrl: "app/ui/settings/settings.tpl.html",
      controller: "cmodSettingsCtrl"
    });
    angular.extend(toastrConfig, {
      positionClass: 'toast-bottom-right',
    });
}])
.run(
  [          'nwgui', 'player', '$rootScope', '$state', '$stateParams',
    function (nwgui, player, $rootScope,   $state,   $stateParams) {
      console.log("run");
      var win = nwgui.Window.get();
      if (process.platform === "darwin") {
        var mb = new nwgui.Menu({type: 'menubar'});
        mb.createMacBuiltin('cmod3', { hideEdit: false });
        win.menu = mb;
      }
      win.on("close", function() {
        player.quit();
        this.close(true);
      });
      function setCorrectHeight() {
        $rootScope.$apply(function() {
          $rootScope.height = window.innerHeight - document.getElementById('header').offsetHeight - document.getElementById('footer').offsetHeight;
        });
      }
      win.on("loaded", setCorrectHeight);
      win.on("resize", setCorrectHeight);
      //win.moveTo(win.x, 30);
      //win.showDevTools();
}])
.controller('cmodAppCtrl',
  [          'nwgui', 'player', '$rootScope', '$scope',
    function (nwgui, player, $rootScope, $scope) {
      console.log("cmodAppCtrl");
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
    if(typeof seconds == "number") {
      var minutes = Math.floor(seconds/60);
      seconds = ("0" + Math.round(seconds - minutes * 60)).substr(-2, 2);
      return minutes + ":" + seconds;
    }
    return "0:00";
  };
});
