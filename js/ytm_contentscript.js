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
 * @returns {YtMusicParser}
 */
YtMusicParser = function() {

};

/**
 * Check whether a song loaded into player widget
 *
 * @return true if some song is loaded, otherwise false
 */
YtMusicParser.prototype._get_has_song = function() {
    return $("yt-formatted-string.title.ytmusic-player-bar").text().length > 0;
};

/**
 * Checks whether song is playing or paused
 *
 * @return true if song is playing, false if song is paused
 */
YtMusicParser.prototype._get_is_playing = function() {
    return play_btn = $("#play-pause-button").attr("title") === "Pause";
};

/**
 * Get current song playing position
 *
 * @return Playing position in seconds
 */
YtMusicParser.prototype._get_song_position = function() {
    var _time = $("span.time-info").text().split("/")[0];
    _time = $.trim(_time).split(":");
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
YtMusicParser.prototype._get_song_time = function() {
    var _time = $("span.time-info").text().split("/")[1];
    _time = $.trim(_time).split(":");
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
YtMusicParser.prototype._get_song_title = function() {
    // the text inside the div located inside element with id="playerSongTitle"
    return $("yt-formatted-string.title.ytmusic-player-bar").text();
};

/**
 * Get current song artist
 *
 * @return Song artist
 */
YtMusicParser.prototype._get_song_artist = function() {
   return $("span.subtitle.ytmusic-player-bar>yt-formatted-string>a").first().text();
};

/**
 * Get current song album artist
 *
 * @return The album artist
 */
YtMusicParser.prototype._get_album_artist = function() {
    // TODO: Check if album artist is actually available.
   return $("span.subtitle.ytmusic-player-bar>yt-formatted-string>a").first().text();
};

/**
 * Get current song artwork
 *
 * @return Image URL or default artwork
 */
YtMusicParser.prototype._get_song_cover = function() {
    var albumImg = $("div.middle-controls.ytmusic-player-bar>img").attr("src");
    if (albumImg)
        return albumImg;
    return null;
};

/**
 * Get current song album name
 *
 * @return Album name or null
 */
YtMusicParser.prototype._get_song_album = function() {
    return $("span.subtitle.style-scope.ytmusic-player-bar>yt-formatted-string>a").last().text();
};

var port = chrome.runtime.connect();

window.setInterval(function() {
    port.postMessage(new Player(new YtMusicParser()));
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
        var play_btn = $("#play-pause-button");
        play_btn.click();
        /*
        * Wait a little for the UI to update before sending a response
        * with the updated state.
        */
        setTimeout(function() {
            send_response(new Player(new YtMusicParser()));
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
        var prev_btn = $("div.left-controls-buttons>.previous-button");
        prev_btn.click();
        setTimeout(function() {
            send_response(new Player(new YtMusicParser()));
        }, 100);
        return true;
    }
    return false;
}

function next_song(msg, sndr, send_response) {
    if (msg.cmd == "nxt") {
        var next_btn = $("div.left-controls-buttons>.next-button");
        next_btn.click();
        setTimeout(function() {
            send_response(new Player(new YtMusicParser()));
        }, 100);
        return true;
    }
    return false;
}
