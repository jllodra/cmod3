"use strict";

var player = require('./player.js');
var gui = window.require('nw.gui');

var app = {
  player: player,
  win: gui.Window.get()
};

app.config = {

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
  if(app.player.metadata != null) {
    //console.log("updating...");
    if(!app.player.hasEnded() && app.player.status.playing) {
      var seconds = app.player.getPosition();
      var completed = seconds / app.player.metadata.duration * 100;

      app.ui.song_position_progress.width(completed + "%");
      app.win.setProgressBar(completed / 100);

      var minutes_elapsed = Math.floor(seconds/60);
      var seconds_elapsed = ("0" + Math.round(seconds - minutes_elapsed * 60)).substr(-2, 2);

      //VU
      var left = 20*Math.log10(Math.abs(player.engine.getVU().l));
      var right = 20*Math.log10(Math.abs(player.engine.getVU().r));
      left = (left == -Infinity) ? -400 : left;
      right = (right == -Infinity) ? -400 : right;
      app.ui.vul.width(400 - (left + 400));
      app.ui.vur.width(400 - (right + 400));

    } else {
      var minutes_elapsed = "0";
      var seconds_elapsed = "00";
      app.ui.song_position_progress.width("0%");
      app.win.setProgressBar(0);
      // VU
      app.ui.vul.width(400);
      app.ui.vur.width(400);
    }
    var minutes_total = Math.floor(app.player.metadata.duration/60);
    var seconds_total = ("0" + Math.round(app.player.metadata.duration - minutes_total * 60)).substr(-2, 2);
    app.ui.song_position_label.text(minutes_elapsed + ":" + seconds_elapsed + " / " + minutes_total + ":" + seconds_total);
  }
  window.requestAnimationFrame(app.updateUI);
}

app.init = function() {
  app.ui.vul = window.$("#vuleft div.vu_overlay");
  app.ui.vur = window.$("#vuright div.vu_overlay");
  app.ui.song_position_progress = window.$("#song_position_progress");
  app.ui.song_position_label = window.$("#song_position_label");
  app.setOSStuff();

  player.init();

  window.requestAnimationFrame(app.updateUI);
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
    console.log(footh);
    window.$("div#main").height(winh-headh-footh-60);
  });
  window.$(function() {
    var winh = window.$(window).height();
    var headh = window.$("div#header").height();
    var footh = window.$("div#footer").height();
    console.log(footh);
    window.$("div#main").height(winh-headh-footh-60);
  });
  win.on("resize", function(x, y) {
    var winh = window.$(window).height();
    var headh = window.$("div#header").height();
    var footh = window.$("div#footer").height();
    console.log(footh);
    console.log(winh);
    window.$("div#main").height(winh-headh-footh-60);
  });

  win.moveTo(win.x, 30);
}

module.exports = app;
