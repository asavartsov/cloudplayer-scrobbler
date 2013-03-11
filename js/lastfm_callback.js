function _url_param(name, url) {
    return unescape((RegExp(name + '=' +
        '(.+?)(&|$)').exec(url) || [,null])[1]);
}

var background = chrome.extension.getBackgroundPage();
location.href = "http://last.fm/";

background.get_lastfm_session(_url_param("token", location.search));