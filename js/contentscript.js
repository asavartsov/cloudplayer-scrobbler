/**
 * contentscripts.js
 * Parses player page and transmit song information to background page
 * Copyright (c) 2011 Alexey Savartsov <asavartsov@gmail.com>
 * Licensed under the MIT license
 */

/**
 * Player class
 *
 * Player info
 */
function Player(parser) {	
    this.has_song = parser._get_has_song();
    this.is_playing = parser._get_is_playing();
    this.song = {
        position: parser._get_song_position(),
        time: parser._get_song_time(),
        title: parser._get_song_title(),
        artist: parser._get_song_artist(),
        album: parser._get_song_album(),
        cover: parser._get_song_cover()
    };
}

/**
 * Constructor for parser class
 * Executes scripts to fetch now playing info from Yandex
 * @returns {YandexParser}
 */
YandexParser = function() {
	this._track = injectScript(function() {
    	return Mu.Player.getCurrentTrack();
    });
	
	this._status = injectScript(function() {
    	return Mu.Player.real.getCurrentTrackStatus();
    });	
};

YandexParser._album_name = "";

/**
 * Check whether a song loaded into player widget
 *
 * @return true if some song is loaded, otherwise false
 */
YandexParser.prototype._get_has_song = function() {
    return (this._status.track_id != null);
};

/**
 * Checks whether song is playing or paused
 *
 * @return true if song is playing, false if song is paused
 */
YandexParser.prototype._get_is_playing = function() {
    return (this._status.playStatus == "playing");
};

/**
 * Get current song playing position
 *
 * @return Playing position in seconds
 */
YandexParser.prototype._get_song_position = function() {
	return this._status.position ? Math.floor(this._status.position / 1000) : 0;
};

/**
 * Get current song length
 *
 * @return Song length in seconds
 */
YandexParser.prototype._get_song_time = function() {
	return this._status.duration ? Math.floor(this._status.duration / 1000) : 0;
};

/**
 * Get current song title
 *
 * @return Song title
 */
YandexParser.prototype._get_song_title = function() {
	return this._track ? this._track.title : null;
};

/**
 * Get current song artist
 *
 * @return Song artist
 */
YandexParser.prototype._get_song_artist = function() {
	return this._track ? this._track.artist : null;
};

/**
 * Get current song artwork
 *
 * @return Image URL or default artwork
 */
YandexParser.prototype._get_song_cover = function() {
    if(this._track) {
    	if(this._track.cover.indexOf("default") == -1) {
    		return this._track.cover.replace("30x30", "100x100");
    	}
    }
    
    return null;
};

/**
 * Get current song album name
 *
 * @return Album name or null
 */
YandexParser.prototype._get_song_album = function() {	
	if(this._track) {
		$.ajax({
			  url: "http://music.yandex.ru/fragment/album/" + this._track.album_id,
			  success: function(data) {
				  YandexParser._album_name = $(".b-title__title", $(data)).text();
			  },
			  error: function() {
				  YandexParser._album_name = "";
			  }
			});
	}
	
    return YandexParser._album_name;
};

var port = chrome.extension.connect({name: "yandexplayer"});

window.setInterval(function() {
    port.postMessage(new Player(new YandexParser()));
}, 
10000);	
