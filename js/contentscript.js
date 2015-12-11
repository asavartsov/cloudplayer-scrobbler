/**
 * contentscripts.js
 * Parses player page and transmit song information to background page
 * Copyright (c) 2011 Alexey Savartsov, <asavartsov@gmail.com>, Brad Lambeth <brad@lambeth.us>
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
        album_artist: parser._get_album_artist(),
        album: parser._get_song_album(),
        cover: parser._get_song_cover()
    };
}

/**
 * Constructor for parser class
 * Executes scripts to fetch now playing info from cloudplayer
 * @returns {GoogleMusicParser}
 */
GoogleMusicParser = function() {

};

/**
 * Check whether a song loaded into player widget
 *
 * @return true if some song is loaded, otherwise false
 */
GoogleMusicParser.prototype._get_has_song = function() {
    return $("#playerSongInfo").children().length > 0;
};

/**
 * Checks whether song is playing or paused
 *
 * @return true if song is playing, false if song is paused
 */
GoogleMusicParser.prototype._get_is_playing = function() {
    var play_btn = $(".material-player-middle paper-icon-button[data-id='play-pause']");
    if (play_btn.length == 0) {
        play_btn = $(".material-player-middle sj-icon-button[data-id='play-pause']")
    }
    return play_btn.hasClass("playing");
};

/**
 * Get current song playing position
 *
 * @return Playing position in seconds
 */
GoogleMusicParser.prototype._get_song_position = function() {
    var _time = $("#time_container_current").text();
    _time = $.trim(_time).split(':');
    if(_time.length == 2)
    {
        return (parseInt(_time[0]) * 60 + parseInt(_time[1]));
    }
    else if (_time.length == 3)
    {
        return (parseInt(_time[0]) * 3600 + parseInt(_time[1]) * 60 + parseInt(_time[2]));
    }
    return null;
};

/**
 * Get current song length
 *
 * @return Song length in seconds
 */
GoogleMusicParser.prototype._get_song_time = function() {
    var _time = $("#time_container_duration").text();
    _time = $.trim(_time).split(':');
    if(_time.length == 2) {
        return (parseInt(_time[0]) * 60 + parseInt(_time[1]));
    }
    else if (_time.length == 3)
    {
        return (parseInt(_time[0]) * 3600 + parseInt(_time[1]) * 60 + parseInt(_time[2]));
    }
    return null;
};

/**
 * Get current song title
 *
 * @return Song title
 */
GoogleMusicParser.prototype._get_song_title = function() {
    // the text inside the div located inside element with id="playerSongTitle"
    return $("#currently-playing-title").text();
};

/**
 * Get current song artist
 *
 * @return Song artist
 */
GoogleMusicParser.prototype._get_song_artist = function() {
    return $("#player-artist").text();
};

/**
 * Get current song album artist
 *
 * @return The album artist
 */
GoogleMusicParser.prototype._get_album_artist = function() {
    var album_artist = $("#playerSongInfo .player-album").attr('data-id');
    if (album_artist)
        return decodeURIComponent(
            album_artist.split('/')[1].replace(/\+/g, ' '));
    return null;
};

/**
 * Get current song artwork
 *
 * @return Image URL or default artwork
 */
GoogleMusicParser.prototype._get_song_cover = function() {
    var albumImg = $("#playerBarArt").attr("src");
    if (albumImg)
        return albumImg;
    return null;
};

/**
 * Get current song album name
 *
 * @return Album name or null
 */
GoogleMusicParser.prototype._get_song_album = function() {
    return $("#playerSongInfo .player-album").text();
};

var port = chrome.runtime.connect();

window.setInterval(function() {
    port.postMessage(new Player(new GoogleMusicParser()));
},
SETTINGS.refresh_interval * 1000);

/*
* Listeners for player control buttons
*/
chrome.runtime.onMessage.addListener(toggle_play);
chrome.runtime.onMessage.addListener(prev_song);
chrome.runtime.onMessage.addListener(next_song);

function toggle_play(msg, sndr, send_response) {
    if (msg.cmd == "tgl") {
        var play_btn = $(".material-player-middle paper-icon-button[data-id='play-pause']");
        if (play_btn.length == 0) {
            play_btn = $(".material-player-middle sj-icon-button[data-id='play-pause']")
        }
        play_btn.click();
        /*
        * Wait a little for the UI to update before sending a response
        * with the updated state.
        */
        setTimeout(function() {
            send_response(new Player(new GoogleMusicParser()));
        }, 100);
        /*
        * Return true keeps the message channel open so the timeout function
        * will be called, otherwise send_response will not work per
        * https://developer.chrome.com/extensions/runtime#event-onMessage.
        */
        return true;
    }
    return false;
}

function prev_song(msg, sndr, send_response) {
    if (msg.cmd == "prv") {
        var prev_btn = $(".material-player-middle paper-icon-button[data-id='rewind']");
        if (prev_btn.length == 0) {
            prev_btn = $(".material-player-middle sj-icon-button[data-id='rewind']");
        }
        prev_btn.click();
        setTimeout(function() {
            send_response(new Player(new GoogleMusicParser()));
        }, 100);
        return true;
    }
    return false;
}

function next_song(msg, sndr, send_response) {
    if (msg.cmd == "nxt") {
        var next_btn = $(".material-player-middle paper-icon-button[data-id='forward']");
        if (next_btn.length == 0) {
            next_btn = $(".material-player-middle sj-icon-button[data-id='forward']");
        }
        next_btn.click();
        setTimeout(function() {
            send_response(new Player(new GoogleMusicParser()));
        }, 100);
        return true;
    }
    return false;
}
