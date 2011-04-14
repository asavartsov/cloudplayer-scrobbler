/**
 * popup.js
 * Popup page script
 * Copyright (c) 2011 Alexey Savartsov <asavartsov@gmail.com>
 * Licensed under the MIT license
 */

/* Background page */
var bp = chrome.extension.getBackgroundPage();

/* Render popup when DOM is ready */
$(document).ready(function() {
    render_scrobble_link();
    render_song();
    render_auth_link();
})

/* Render functions */

/**
 * Renders current song details
 */
function render_song() {
    if(bp.player.song)
    {
        $("#artist").text(bp.player.song.artist);
        $("#track").text(bp.player.song.title);
        $("#cover").attr({ src: bp.player.song.cover || "img/defaultcover.png" });
        
        if(bp.lastfm_api.session.name && bp.lastfm_api.session.key) {
            render_love_button();
        }
        else {
            $("#lastfm-buttons").hide();
        }
    }
    else {
        $("#song").addClass("nosong");
        $("#artist").text("Nothing is playing");
        $("#track").html('<a></a>');
        $("#track a")
        .attr({ 
            href: "https://www.amazon.com/gp/dmusic/mp3/player",
            target: "_blank"
        })
        .text("Start Cloud Player");
        $("#cover ").attr({ src: "img/defaultcover.png" });
        $("#lastfm-buttons").hide();
    }
}

/**
 * Renders the link to turn on/off scrobbling
 */
function render_scrobble_link() {
    $("#scrobbling").html('<a></a>');
    $("#scrobbling a")
    .attr({
        href: "#" 
    })
    .click(on_toggle_scrobble)
    .text(bp.SETTINGS.scrobble ? "Stop scrobbling" : "Resume scrobbling");
}

/**
 * Renders authentication/profile link
 */
function render_auth_link() {
    if(bp.lastfm_api.session.name && bp.lastfm_api.session.key)
    {
        $("#lastfm-profile").html("Logged in as " + "<a></a><a></a>");
        $("#lastfm-profile a:first")
        .attr({
            href: "http://last.fm/user/" + bp.lastfm_api.session.name,
            target: "_blank"
        })
        .text(bp.lastfm_api.session.name);
        
        $("#lastfm-profile a:last")
        .attr({
            href: "#",
            title: "Logout"
        })
        .click(on_logout)
        .addClass("logout");
    }
    else {
        $("#lastfm-profile").html('<a></a>');
        $("#lastfm-profile a")
        .attr({
            href: "#" 
        })
        .click(on_auth)
        .text("Connect to Last.fm");
    }
}

/**
 * Renders the love button
 */
function render_love_button() {    
    $("#love-button").html('<img src="img/ajax-loader.gif">');
    
    bp.lastfm_api.is_track_loved(bp.player.song.title,
            bp.player.song.artist, 
            function(result) {
                $("#love-button").html('<a href="#"></a>');
        
                if(result) {
                    $("#love-button a").attr({ title: "Unlove this song"})
                    .click(on_unlove)
                    .addClass("loved");
            
                }
                else {
                    $("#love-button a").attr({ title: "Love this song" })
                    .click(on_love)
                    .addClass("notloved");
                }
            });
}

/* Event handlers */

/**
 * Turn on/off scrobbling link was clicked
 */
function on_toggle_scrobble() {
    bp.toggle_scrobble();
    render_scrobble_link();
}

/**
 * Authentication link was clicked
 */
function on_auth() {
    bp.start_web_auth();
    window.close();
}

/**
 * Logout link was clicked
 */
function on_logout() {
    bp.clear_session();
    render_auth_link();
}

/**
 * Love button was clicked
 */
function on_love() {
    bp.lastfm_api.love_track(bp.player.song.title, bp.player.song.artist, 
        function(result) {
            if(!result.error) {
                render_love_button();
            }
            else {
                if(result.error == 9) {
                    // Session expired
                    bp.clear_session();
                    render_auth_link();
                }
                
                chrome.browserAction.setIcon({
                     'path': SETTINGS.error_icon });
            }
        });

    $("#love-button").html('<img src="img/ajax-loader.gif">');
}

/**
 * Unlove button was clicked
 */
function on_unlove() {
    bp.lastfm_api.unlove_track(bp.player.song.title, bp.player.song.artist, 
        function(result) {
            if(!result.error) {
                render_love_button();
            }
            else {
                if(result.error == 9) {
                    // Session expired
                    bp.clear_session();
                    render_auth_link();
                }
                
                chrome.browserAction.setIcon({
                     'path': SETTINGS.error_icon });
            }
        });

    $("#love-button").html('<img src="img/ajax-loader.gif">');
}
