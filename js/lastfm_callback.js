/**
 * lastfm_callback.js
 * LastFM callback script
 * Copyright (c) 2011 Alexey Savartsov <asavartsov@gmail.com>
 * Licensed under the MIT license
 */
function _url_param(name, url) {
    return unescape((RegExp(name + '=' +
        '(.+?)(&|$)').exec(url) || [,null])[1]);
}

chrome.runtime.getBackgroundPage(function(background) {
    location.href = "http://last.fm/";
    background.get_lastfm_session(_url_param("token", location.search));
});
