/**
 * contentscripts.js
 * Parses player page and transmit song information to background page
 * Copyright (c) 2011 Alexey Savartsov <asavartsov@gmail.com>
 * Licensed under the MIT license
 */

/**
 * Player class
 *
 * Now playing info
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
 * ZvooqParser class
 *
 * Gets now playing info/parses player page
 */
ZvooqParser = function() {
	this._track = injectScript(function() {
    	function clone_object(obj) {
    		var clone = {};
    		
    		for(var i in obj) {
    			if(i == "tracks") {
    				/* do not copy tracks to prevent circular references */
    				clone[i] = null;
    			}
    			else if(typeof(obj[i]) == "object") {
    				clone[i] = clone_object(obj[i]);
    			}
    			else {
    				clone[i] = obj[i];
    			}
    		}
    		return clone;
    	}
    	
    	return clone_object(zvqApp.playerPlayback._track);
    });
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
    return this._track ? this._track.duration : 0;
};

/**
 * Get current song title
 *
 * @return Song title
 */
ZvooqParser.prototype._get_song_title = function() {
	return this._track ? this._track.name : null;
};

/**
 * Get current song artist
 *
 * @return Song artist
 */
ZvooqParser.prototype._get_song_artist = function() {
	if(this._track) {
        // Zvooq.ru has many tracks with artist names like "Pixies, Pixies"
        var name_split = this._track.artist.name.split(", ");

        if(name_split.length == 2 && name_split[0] == name_split[1]) {
            return name_split[0];
        }
        else {
            return this._track.artist.name;
        }
    }

    return null;
};


/**
 * Get current song album
 *
 * @return Song artist
 */
ZvooqParser.prototype._get_song_album = function() {
	return this._track ? this._track.release.name : null;
};

/**
 * Checks current song artwork
 *
 * @return Image URL or default artwork
 */
ZvooqParser.prototype._get_song_cover = function() {
	return this._track ? this._track.release.image.srcTemplate.replace("{size}", "64x64") : null;
};

// Port for communicating with background page
var port = chrome.extension.connect({name: "zvooqplayer"});

// Send song information to the extension every 10 seconds

window.setInterval(function() {
    port.postMessage(new Player(new ZvooqParser()));
    }, 
    10000);	
