/**
 * contentscripts.js
 * Parses player page and transmit song information to background page
 * Copyright (c) 2011 Alexey Savartsov <asavartsov@gmail.com>
 * Licensed under the MIT license
 */

/**
 * Player class
 *
 * Cloud Player page parser
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
 * Executes scripts to fetch now playing info from cloudplayer
 * @returns {AmazonParser}
 */
AmazonParser = function() {
	this._player = injectScript(function() {
    	return amznMusic.widgets.player.getCurrent();
    });
	
	this._time = injectScript(function() {
    	return amznMusic.widgets.player.getCurrentTime();
    });	
};

/**
 * Check whether a song loaded into player widget
 *
 * @return true if some song is loaded, otherwise false
 */
AmazonParser.prototype._get_has_song = function() {
    return ($("#noMusicInNowPlaying").length == 0);
};

/**
 * Checks whether song is playing or paused
 *
 * @return true if song is playing, false if song is paused
 */
AmazonParser.prototype._get_is_playing = function() {
    return $("#mp3Player .mp3MasterPlayGroup").hasClass("playing");
};

/**
 * Get current song playing position
 *
 * @return Playing position in seconds
 */
AmazonParser.prototype._get_song_position = function() {
	return this._time;
};

/**
 * Get current song length
 *
 * @return Song length in seconds
 */
AmazonParser.prototype._get_song_time = function() {
	return this._player ? parseInt(this._player.metadata.duration) : 0;
};

/**
 * Get current song title
 *
 * @return Song title
 */
AmazonParser.prototype._get_song_title = function() {
	return this._player ? this._player.metadata.title : null;
};

/**
 * Get current song artist
 *
 * @return Song artist
 */
AmazonParser.prototype._get_song_artist = function() {
	return this._player ? this._player.metadata.artistName : null;
};

/**
 * Get current song artwork
 *
 * @return Image URL or default artwork
 */
AmazonParser.prototype._get_song_cover = function() {
    return this._player ? this._player.metadata.albumCoverImageSmall : null;
};

/**
 * Get current song album name
 *
 * @return Album name or null
 */
AmazonParser.prototype._get_song_album = function() {
    return this._player ? this._player.metadata.albumName : null;
};

/* Zvooq.ru */

ZvooqParser = function() {
	// init
};

/**
 * Check whether a song loaded into player widget
 *
 * @return true if some song is loaded, otherwise false
 */
ZvooqParser.prototype._get_has_song = function() {
    return !($(".playerControls .icon").hasClass("disabled"));
};

/**
 * Checks whether song is playing or paused
 *
 * @return true if song is playing, false if song is paused
 */
ZvooqParser.prototype._get_is_playing = function() {
    return $(".playerControls .icon").hasClass("icon_top_pause");
};

/**
 * Get current song playing position
 *
 * @return Playing position in seconds
 */
ZvooqParser.prototype._get_song_position = function() {
    var _time = $(".topPanel_playerPlayback_playered_elapse").text();
    _time = $.trim(_time).split(':');
    if(_time.length == 2) {
        return (parseInt(_time[0], 10) * 60 + parseInt(_time[1], 10));
    }
    else {
        return 0;
    }
};

/**
 * Get current song length
 *
 * @return Song length in seconds
 */
ZvooqParser.prototype._get_song_time = function() {
    var _time = $(".topPanel_playerPlayback_playered_leave").text();
    _time = $.trim(_time.replace(/\//, '')).split(':');
    if(_time.length == 2) {
        return (parseInt(_time[0], 10) * 60 + parseInt(_time[1], 10) + this._get_song_position());
    }
    else {
        return 0;
    }
};

/**
 * Get current song title
 *
 * @return Song title
 */
ZvooqParser.prototype._get_song_title = function() {
	var song_regex = /^(.*)\ —\ (.*)$/;
	$(".topPanel_playerPlayback_playered_name").text().match(song_regex);
	
    return $.trim(RegExp.$2);
};

/**
 * Get current song artist
 *
 * @return Song artist
 */
ZvooqParser.prototype._get_song_artist = function() {
	var song_regex = /^(.*)\ —\ (.*)$/;
	$(".topPanel_playerPlayback_playered_name").text().match(song_regex);
	
    return $.trim(RegExp.$1);
};


/**
 * Get current song album
 *
 * @return Song artist
 */
ZvooqParser.prototype._get_song_album = function() {
    return '';
};

/**
 * Checks current song artwork
 *
 * @return Image URL or default artwork
 */
ZvooqParser.prototype._get_song_cover = function() {
    return null; // Sorry :(
};

// Port for communicating with background page
var port = chrome.extension.connect({name: "cloudplayer"});

// Send song information to the extension every 10 seconds

if(window.location.host === "zvooq.ru") {	
	window.setInterval(function() {
        port.postMessage(new Player(new ZvooqParser()));
    }, 
    10000);	
}
else {	
	window.setInterval(function() {
        port.postMessage(new Player(new AmazonParser()));
    }, 
    10000);		
}