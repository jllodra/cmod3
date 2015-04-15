"use strict";

angular.module('cmod.playerState', [])
.factory('state', function() {
  var state = {
    playlist: [],
    current_song: null,
    current_song_index: null,
    current_song_index_context_menu: null,
    metadata: null
  };

  return state;

});
