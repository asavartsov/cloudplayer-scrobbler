/**
 * background.js
 * Background page script
 * Copyright (c) 2011 Alexey Savartsov <asavartsov@gmail.com>
 * Licensed under the MIT license
 */
var SETTINGS = {
    api_key: "d00dce85051b7dbcbfcc165eaebfc6d2",
    api_secret: "bdfcae3563763ece1b6d3dcdd56a7ab8",
    
    callback_file: "html/lastfm_callback.html",
    
    main_icon: "../img/main-icon.png",
    playing_icon: "../img/main-icon-playing.png",
    paused_icon: "../img/main-icon-paused.png",
    error_icon: "../img/main-icon-error.png",
    scrobbling_stopped_icon: "../img/main-icon-scrobbling-stopped.png",
	
	scrobble_threshold: .7,
    scrobble_interval: 480, // 8 minutes
    // NOTE: This should be exactly the same as the portMessage interval in contentscript.js.
    refresh_interval: 5
};

var player = {}; // Previous player state
var time_played = 0;
var curr_song_title = "";
var lastfm_api = new LastFM(SETTINGS.api_key, SETTINGS.api_secret);

// Load settings from local storage
lastfm_api.session.key = localStorage["session_key"] || null;
lastfm_api.session.name = localStorage["session_name"] || null;

// This enables scrobbling by default
SETTINGS.scrobble = !(localStorage["scrobble"] == "false");

if (!SETTINGS.scrobble) {
    chrome.browserAction.setIcon({ 'path': SETTINGS.scrobbling_stopped_icon });
}

// Connect event handlers
chrome.runtime.onConnect.addListener(port_on_connect);

/**
 * Content script has connected to the extension
 */
function port_on_connect(port) {
    port.onMessage.addListener(port_on_message);
    port.onDisconnect.addListener(port_on_disconnect);
}
 
 /**
  * New message arrives to the port
  */
function port_on_message(message) {
    // Current player state
    var _p = message;

    // Save player state
    player = _p;
    
    if (!SETTINGS.scrobble) {
        chrome.browserAction.setIcon({
            'path': SETTINGS.scrobbling_stopped_icon });

        return;
    }

    if (_p.has_song) {
        if (_p.song.title != curr_song_title || 
                _p.song.position <= SETTINGS.refresh_interval) {
            curr_song_title = _p.song.title;
            time_played = 0;
        }
        
        if (_p.is_playing) {
            chrome.browserAction.setIcon({
                'path': SETTINGS.playing_icon });
            if (time_played >= _p.song.time * SETTINGS.scrobble_threshold || 
                    time_played >= SETTINGS.scrobble_interval) {
                scrobble_song(_p.song.artist, _p.song.album, _p.song.title,
                    Math.round(new Date().getTime() / 1000) - time_played);
                time_played = 0;
            } else {
                time_played += SETTINGS.refresh_interval;
            }
            
            lastfm_api.now_playing(_p.song.title,
                _p.song.artist,
                _p.song.album,
                function(response) {
                   // TODO: 
                }
            );
        } else {
            // The player is paused
            chrome.browserAction.setIcon({ 
                'path': SETTINGS.paused_icon });
        }
    } else {
        chrome.browserAction.setIcon({ 'path': SETTINGS.main_icon });
    }
}
 

function scrobble_song(artist, album, title, time) {
    // Scrobble this song
    lastfm_api.scrobble(title, time, artist, album,
        function(response) {
            if (!response.error) {
            
            } else {
                if (response.error == 9) {
                    // Session expired
                    clear_session();
                }
                
                chrome.browserAction.setIcon({
                     'path': SETTINGS.error_icon });
            }
        });
}

/**
* Content script has disconnected
*/
function port_on_disconnect() {
    player = {}; // Clear player state
    time_played = 0
    chrome.browserAction.setIcon({ 'path': SETTINGS.main_icon });
}


/**
 * Authentication link from popup window
 */
function start_web_auth() {
    var callback_url = chrome.runtime.getURL(SETTINGS.callback_file);
    chrome.tabs.create({
        'url': 
            "http://www.last.fm/api/auth?api_key=" + 
            SETTINGS.api_key + 
            "&cb=" + 
            callback_url });
}

/**
 * Clears last.fm session
 */
function clear_session() {
    lastfm_api.session = {};
    
    localStorage.removeItem("session_key");
    localStorage.removeItem("session_name");
}

/**
 * Toggles setting to scrobble songs or not
 */
function toggle_scrobble() {
    SETTINGS.scrobble = !SETTINGS.scrobble;
    localStorage["scrobble"] = SETTINGS.scrobble;
    
    // Set the icon corresponding the current scrobble state
    var icon = SETTINGS.scrobble ? SETTINGS.main_icon : SETTINGS.scrobbling_stopped_icon;
    chrome.browserAction.setIcon({ 'path': icon });
}

/**
 * Last.fm session request
 */
function get_lastfm_session(token) {
    lastfm_api.authorize(token, function(response) {
        // Save session
        if (response.session) {
            localStorage["session_key"] = response.session.key;
            localStorage["session_name"] = response.session.name;
        }
    });
}
