"use strict";

angular.module('cmod.playerState', [])
.factory('state', function($rootScope) {
  var state = {
    playlist: [],
    current_song: null,
    current_song_path: null,
    current_song_index: null,
    current_song_index_context_menu: null,
    playing_nectarine: false,
    nectarine_info: {
      now: [],
      queue: [],
      history: []
    },
    modarchive: {
      search_results: [],
      is_downloading_modarchive: false,
      current_artist_text: "",
      current_song_text: "",
      more_songs_to_load: false,
      current_page: 1,
      current_type: "",
      current_text: "",
      current_request: "",
      loading_text: "",
      current_song_index: null
    }
  };

  return state;

});
