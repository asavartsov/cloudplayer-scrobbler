/*
 lastfm_callback.html
 Authorization token handler for last.fm web-based authentication
 Copyright (c) 2011 Alexey Savartsov <asavartsov@gmail.com>
 Licensed under the MIT license
*/
function _url_param(name, url) {
    return unescape((RegExp(name + '=' +
        '(.+?)(&|$)').exec(url) || [,null])[1]);
}

var background_page = chrome.extension.getBackgroundPage();
location.href = "http://last.fm/";

background_page.get_lastfm_session(_url_param("token", location.search));