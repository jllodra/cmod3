"use strict";

var player = require('./player.js');
var gui = window.require('nw.gui');

var elapsed = 0;

var app = {
  player: player,
  win: gui.Window.get()
};

app.config = {
  drops: 0,
  max_drops: 3
};

// podriem fer tota la UI a traves de cridades a angular o alguna cosa aixi...
// o millor, des de angular fer un require app i anar fent
// millor passar tot a angular tio
app.ui = {
  vul: null,
  vur: null,
  song_position_progress: null,
  song_position_label: null
};

app.updateUI = function() {
  // POSITION BAR && VU
  window.requestAnimationFrame(app.updateUI);

  if(app.config.drops < app.config.max_drops) {
    return ++app.config.drops;
  }
  app.config.drops = 0;


  if(app.player.metadata != null) {
    //console.log("updating...");
    if(!app.player.hasEnded() && app.player.status.playing) {
      var seconds = app.player.getPosition();
      var completed = seconds / app.player.metadata.duration;

      app.ui.song_position_progress.css("transform", "scaleX(" + completed + ")");
      //app.win.setProgressBar(completed / 100);

      var minutes_elapsed = Math.floor(seconds/60);
      var seconds_elapsed = ("0" + Math.round(seconds - minutes_elapsed * 60)).substr(-2, 2);

      //VU
      var left = -20*Math.log10(Math.abs(player.engine.getVU().l));
      var right = -20*Math.log10(Math.abs(player.engine.getVU().r));
      left = (left == Infinity) ? 1 : left/400;
      right = (right == Infinity) ? 1 : right/400;
      app.ui.vul.css("transform", "scaleX("+ (left) +")");
      app.ui.vur.css("transform", "scaleX("+ (right) +")");
    } else {
      var minutes_elapsed = "0";
      var seconds_elapsed = "00";
      app.ui.song_position_progress.css("transform", "scaleX(0)");
      //app.win.setProgressBar(0);
      // VU
      app.ui.vul.css("transform", "scaleX(1)");
      app.ui.vur.css("transform", "scaleX(1)");
    }
    var minutes_total = Math.floor(app.player.metadata.duration/60);
    var seconds_total = ("0" + Math.round(app.player.metadata.duration - minutes_total * 60)).substr(-2, 2);
    //app.ui.song_position_label.text(minutes_elapsed + ":" + seconds_elapsed + " / " + minutes_total + ":" + seconds_total);
  }
}

app.updateUITimer = function() {
  if(app.player.metadata != null) {
    var minutes_elapsed = "0";
    var seconds_elapsed = "00";
    if(!app.player.hasEnded() && app.player.status.playing) {
      var seconds = app.player.getPosition();
      var completed = seconds / app.player.metadata.duration;
      var minutes_elapsed = Math.floor(seconds/60);
      var seconds_elapsed = ("0" + Math.round(seconds - minutes_elapsed * 60)).substr(-2, 2);
      //app.ui.song_position_progress.css("transform", "scaleX(" + completed + ")");
      app.win.setProgressBar(completed / 100);
    } else {
      //app.ui.song_position_progress.css("transform", "scaleX(0)");
      app.win.setProgressBar(0);
    }
    var minutes_total = Math.floor(app.player.metadata.duration/60);
    var seconds_total = ("0" + Math.round(app.player.metadata.duration - minutes_total * 60)).substr(-2, 2);
    app.ui.song_position_label.text(minutes_elapsed + ":" + seconds_elapsed + " / " + minutes_total + ":" + seconds_total);
  }
}

app.init = function() {
  app.ui.vul = window.$("#vuleft div.vu_overlay");
  app.ui.vur = window.$("#vuright div.vu_overlay");
  app.ui.song_position_progress = window.$("#song_position_progress");
  app.ui.song_position_label = window.$("#song_position_label");
  app.setOSStuff();

  player.init();

  window.requestAnimationFrame(app.updateUI); // soft anim
  window.setInterval(app.updateUITimer, 1000); // text updates
};

app.load = function(file) {
  player.load(file, function() {});
}

app.loadAndPlay = function(file) {
  player.load(file, function() {
    player.play();
  });
}

app.setOSStuff = function() {
  var win = app.win;
  if (process.platform === "darwin") {
    var mb = new gui.Menu({type: 'menubar'});
    mb.createMacBuiltin('cmod3', {
      hideEdit: false,
    });
    win.menu = mb;
  }

  win.on("close", function() {
    player.engine.unload();
    this.close(true);
  });

  win.on("loaded", function() {
    var winh = window.$(window).height();
    var headh = window.$("div#header").height();
    var footh = window.$("div#footer").height();
    window.$("div#main").height(winh-headh-footh-60);
  });

  win.on("resize", function(x, y) {
    var winh = window.$(window).height();
    var headh = window.$("div#header").height();
    var footh = window.$("div#footer").height();
    window.$("div#main").height(winh-headh-footh-60);
  });

  win.moveTo(win.x, 30);
}

module.exports = app;
