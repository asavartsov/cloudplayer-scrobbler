/**
 * contentscripts.js
 * Player page parsing and transmitting song info to background page
 * Copyright (c) 2011 Alexey Savartsov <asavartsov@gmail.com>
 * Licensed under the MIT license
 * http://www.opensource.org/licenses/mit-license.php 
 */

/**
 * Player class
 *
 * Cloudplayer page parser
 */
function Player() {
    this.has_song = this._get_has_song();
    this.is_playing = this._get_is_playing();
    this.song = {
        position: this._get_song_position(),
        time: this._get_song_time(),
        title: this._get_song_title(),
        artist: this._get_song_artist(),
        cover: this._get_song_cover()
    };
}

/**
 * Check whether a song loaded into player widget
 *
 * @return true if some song is loaded, otherwise false
 */
Player.prototype._get_has_song = function() {
    return ($("#noMusicInNowPlaying").length == 0);
}

/**
 * Checks whether song is playing or paused
 *
 * @return true if song is playing, false if song is paused
 */
Player.prototype._get_is_playing = function() {
    return $("#mp3Player .mp3MasterPlayGroup").hasClass("playing");
}

/**
 * Checks current song playing position
 *
 * @return Playing position in seconds
 */
Player.prototype._get_song_position = function() {
    var _time = $("span.timer span#currentTime").text();
    _time = $.trim(_time).split(':');
    if(_time.length == 2) {
        return (parseInt(_time[0], 10) * 60 + parseInt(_time[1], 10));
    }
    else {
        return 0;
    }
}

/**
 * Checks current song length
 *
 * @return Song length in seconds
 */
Player.prototype._get_song_time = function() {
    var _time = $("span.timer")
        .contents()
        .filter(function() { return (this.nodeType == 3); })
        .text();
    _time = $.trim(_time.replace(/\//, '')).split(':');
    if(_time.length == 2) {
        return (parseInt(_time[0], 10) * 60 + parseInt(_time[1], 10));
    }
    else {
        return 0;
    }
}

/**
 * Checks current song title
 *
 * @return Song title
 */
Player.prototype._get_song_title = function() {
    return $.trim($("div.currentSongDetails .title").text());
}

/**
 * Checks current song artist
 *
 * @return Song artist
 */
Player.prototype._get_song_artist = function() {
    return $.trim($("div.currentSongDetails .title + span")
        .text()
        .replace(/by/, ""));
}

/**
 * Checks current song album cover image
 *
 * @return Image URL or default artwork
 */
Player.prototype._get_song_cover = function() {
    return $(".albumImage.small").attr("src");
}


// Port for communicating with background page
var port = chrome.extension.connect({name: "cloudplayer"});

// Send song information to the extension every 10 seconds
window.setInterval(function() {
        port.postMessage(new Player());
    }, 
    10000);
