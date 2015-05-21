/**
 * background.js
 * Background page script
 * Copyright (c) 2011 Alexey Savartsov <asavartsov@gmail.com>
 * Licensed under the MIT license
 */

var player = {}; // Previous player state
var time_played = 0;
var last_refresh = (new Date()).getTime();
var num_scrobbles = 0;
var curr_song_title = '';
var lastfm_api = new LastFM(SETTINGS.api_key, SETTINGS.api_secret);

// Load settings from local storage
lastfm_api.session.key = localStorage['session_key'] || null;
lastfm_api.session.name = localStorage['session_name'] || null;

if (!SETTINGS.scrobble) {
    chrome.browserAction.setIcon({ 'path': SETTINGS.scrobbling_stopped_icon });
}

// Connect event handlers
chrome.runtime.onConnect.addListener(port_on_connect);

bind_keyboard_shortcuts();

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
    var now = (new Date()).getTime();

    // Save player state
    player = _p;

    if (!SETTINGS.scrobble) {
        chrome.browserAction.setIcon({
            'path': SETTINGS.scrobbling_stopped_icon });

        return;
    }

    if (_p.has_song) {
        // if the song changed or looped
        if (_p.song.title != curr_song_title ||
                _p.song.position <= SETTINGS.refresh_interval) {
            curr_song_title = _p.song.title;
            time_played = 0;
            num_scrobbles = 0;
            last_refresh = now - SETTINGS.refresh_interval*1000;
        }

        if (_p.is_playing) {
            chrome.browserAction.setIcon({'path': SETTINGS.playing_icon });
            if ((time_played >= _p.song.time * SETTINGS.scrobble_point ||
                    time_played >= SETTINGS.scrobble_interval) &&
                    num_scrobbles < SETTINGS.max_scrobbles) {
                scrobble_song(_p.song.artist,_p.song.album_artist,
                    _p.song.album, _p.song.title,
                    Math.round(new Date().getTime() / 1000 - time_played));
                time_played = 0;
                num_scrobbles += 1;
            } else {
                /*
                * Don't depend on the SETTINGS.refresh_interval to
                * calculate time_played since there can be a significant delay
                * between the time the message was sent from the contentscript
                * to when it's recieved here.
                * See: https://github.com/newgiin/cloudplayer-scrobbler/issues/23
                */
                time_played += (now - last_refresh) / 1000;
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
    last_refresh = now;
}


function scrobble_song(artist, album_artist, album, title, time) {
    // Scrobble this song
    lastfm_api.scrobble(artist, album_artist, album, title, time,
        function(response) {
            if (response.error) {
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
    time_played = 0;
    num_scrobbles = 0;
    curr_song_title = '';
    chrome.browserAction.setIcon({ 'path': SETTINGS.main_icon });
}


/**
 * Authentication link from popup window
 */
function start_web_auth() {
    var callback_url = chrome.runtime.getURL(SETTINGS.callback_file);
    chrome.tabs.create({
        'url':
            'http://www.last.fm/api/auth?api_key=' +
            SETTINGS.api_key +
            '&cb=' +
            callback_url });
}

/**
 * Clears last.fm session
 */
function clear_session() {
    lastfm_api.session = {};

    localStorage.removeItem('session_key');
    localStorage.removeItem('session_name');
}

/**
 * Toggles setting to scrobble songs or not
 */
function toggle_scrobble() {
    SETTINGS.scrobble = !SETTINGS.scrobble;
    localStorage['scrobble'] = SETTINGS.scrobble;

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
            localStorage['session_key'] = response.session.key;
            localStorage['session_name'] = response.session.name;
        }
    });
}

function bind_keyboard_shortcuts() {
    chrome.commands.onCommand.addListener(
        function(command) {
            switch (command) {
                case 'toggle_play':
                    send_cmd_to_play_tab('tgl');
                    break;
                case 'prev_song':
                    send_cmd_to_play_tab('prv');
                    break;
                case 'next_song':
                    send_cmd_to_play_tab('nxt');
                    break;
                case 'goto_play_tab':
                    open_play_tab();
                    break;
                default:
                    console.error("No handler for command '" + command + "'");
            }
        }
    );
}

function send_cmd_to_play_tab(cmd) {
    find_play_tab(
        function(tab) {
            chrome.tabs.sendMessage(tab.id, {cmd: cmd}, function() {});
        }
    );
}

function open_extensions_page() {
  chrome.tabs.create({url: 'chrome://extensions/'});
}
