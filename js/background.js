/**
 * background.js
 * Background page script
 * Copyright (c) 2011 Alexey Savartsov <asavartsov@gmail.com>
 * Licensed under the MIT license
 */

var SETTINGS = {
    api_key: "754ae915036422c2134252ffeb1d6cc9",
    api_secret: "8fbb8c5f1208e4476b27e03bde8e5c99",
    
    callback_file: "lastfm_callback.html",
    
    main_icon: "img/main-icon.png",
    playing_icon: "img/main-icon-playing.png",
    paused_icon: "img/main-icon-paused.png",
    error_icon: "img/main-icon-error.png",
    scrobbling_stopped_icon: "img/main-icon-scrobbling-stopped.png"
};

var player = {}; // Previous player state
var now_playing_sent = false;
var scrobbled = false;
var lastfm_api = new LastFM(SETTINGS.api_key, SETTINGS.api_secret);

// Load settings from local storage
lastfm_api.session.key = localStorage["session_key"] || null;
lastfm_api.session.name = localStorage["session_name"] || null;

// This enables scrobbling by default
SETTINGS.scrobble = !(localStorage["scrobble"] == "false");

if(!SETTINGS.scrobble) {
    chrome.browserAction.setIcon({ 'path': SETTINGS.scrobbling_stopped_icon });
}

// Connect event handlers
chrome.extension.onConnect.addListener(port_on_connect);

/**
 * Content script has connected to the extension
 */
function port_on_connect(port) {
    console.assert(port.name == "yandexplayer"); 

    // Connect another port event handlers
    port.onMessage.addListener(port_on_message);
    port.onDisconnect.addListener(port_on_disconnect);
}
 
 /**
  * New message arrives to the port
  */
function port_on_message(message) {
    // Current player state
    var _p = message;
    
    if(!SETTINGS.scrobble) {
        chrome.browserAction.setIcon({
            'path': SETTINGS.scrobbling_stopped_icon });

        player = _p;
        return;
    }
    
    if(_p.has_song) {
        if(_p.is_playing) {
            chrome.browserAction.setIcon({ 
                'path': SETTINGS.playing_icon });
            
            // Last.fm recommends to scrobble a song at least at 70%
            // TODO: Setting for 0.7?
            var time_to_scrobble = _p.song.time * 0.7 - _p.song.position;
            
            // Check for valid timings and for that the now playing status was reported at least once
            // This intended to fix an issue with invalid timings that Amazon accidentally reports on
            // song start
            if(time_to_scrobble <= 0 && _p.song.position > 0 && _p.song.time > 0) {
                // TODO: Another way?
                // if(scrobbled && _p.song.position > player.song.position)

                if(now_playing_sent && !scrobbled) {
                    // Scrobble this song
                    lastfm_api.scrobble(_p.song.title,
                        /* Song start time */
                        Math.round(new Date().getTime() / 1000) - _p.song.position, 
                        _p.song.artist,
                        _p.song.album,
                        function(response) {
                            if(!response.error) {
                            	// Song was scrobled, waiting for the next song
                                scrobbled = true;
                                now_playing_sent = false;
                            }
                            else {
                                if(response.error == 9) {
                                    // Session expired
                                    clear_session();
                                }
                                
                                chrome.browserAction.setIcon({
                                     'path': SETTINGS.error_icon });
                            }
                        });
                }
            }
            else {
                // Set now playing status
                // TODO: Maybe there is no need to do it so frequent?
                lastfm_api.now_playing(_p.song.title,
                    _p.song.artist,
                    _p.song.album,
                    function(response) {
                		// TODO: 
                    });
                
                now_playing_sent = true;
                scrobbled = false;
            }
             
            // Save player state
            player = _p; // TODO: Save here?
        }
        else {
            // The player is paused
            chrome.browserAction.setIcon({ 
                'path': SETTINGS.paused_icon });
        }
    }
    else {
        chrome.browserAction.setIcon({ 'path': SETTINGS.main_icon });
        player = {};
        scrobbled = false;
        now_playing_sent = false;
    }
}
 
 /**
  * Content script has disconnected
  */
function port_on_disconnect() {
    player = {}; // Clear player state
    scrobbled = false;
    now_playing_sent = false;
    chrome.browserAction.setIcon({ 'path': SETTINGS.main_icon });
}


/**
 * Authentication link from popup window
 */
function start_web_auth() {
    var callback_url = chrome.extension.getURL(SETTINGS.callback_file);
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
        if(response.session)
        {
            localStorage["session_key"] = response.session.key;
            localStorage["session_name"] = response.session.name;
        }
    });
}
