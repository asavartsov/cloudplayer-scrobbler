/**
 * lastfm.js
 * Last.fm authorization and scrobbling XHR requests
 * Copyright (c) 2011 Alexey Savartsov <asavartsov@gmail.com>
 * Licensed under the MIT license
 */

/**
 * LastFM class constructor
 *
 * @param api_key Last.fm API key
 * @param api_secret Last.fm API secret
 */
function LastFM(api_key, api_secret) {
    this.API_KEY = api_key || "";
    this.API_SECRET = api_secret || "";
    this.API_ROOT = "http://ws.audioscrobbler.com/2.0/";
    
    this.session = {};
}

/**
 * Makes an authorization request
 *
 * @param token Authorization token
 * @param callback Callback function for the request. Sends a parameter with
 *                 reply decoded as JS object from JSON on null on error
 */
LastFM.prototype.authorize = function(token, callback) {
    var params = {
        'api_key': this.API_KEY,
        'method': "auth.getSession",
        'token': token
    };

    params.api_sig = this._req_sign(params);
    params.format = "json";
    
    var self = this;

    this._xhr("GET", params, 
        function(reply) {
            if(reply) {
                self.session.key = reply.session.key;
                self.session.name = reply.session.name;
                callback(reply);
            }
            else {
                callback();
            }
        });
};

/**
 * Sets Now Playing status for a track
 *
 * @param track Track title
 * @param artist Track artist
 * @param callback Callback function for the request. Sends a parameter with
 *                 reply decoded as JS object from JSON on null on error
 */
LastFM.prototype.now_playing = function(track, artist, album, callback) {
    var params = {
        'api_key': this.API_KEY,
        'method': "track.updateNowPlaying",
        'track': track,
        'artist': artist,
        'album': album || "",
        'sk': this.session.key
    };

    params.api_sig = this._req_sign(params);
    params.format = "json";

    this._xhr("POST", params, 
        function(result) {
            callback(result);
        });     
};

/**
 * Scrobbles a track
 *
 * @param track Track title
 * @param timestamp The time the track starts playing in UNIX format
 * @param artist Track artist
 * @param callback Callback function for the request. Sends a parameter with
 *                 reply decoded as JS object from JSON on null on error
 */
LastFM.prototype.scrobble = function(track, timestamp, artist, album, callback) {
    var params = {
        'api_key': this.API_KEY,
        'method': "track.scrobble",
        'track': track,
        'timestamp': timestamp,
        'artist': artist,
        'album': album || "",
        'sk': this.session.key
    };
    
    params.api_sig = this._req_sign(params);
    params.format = "json";
    
    this._xhr("POST", params, 
        function(result) {
            callback(result);
        });
};

/**
 * Loves a track
 *
 * @param track Track title
 * @param artist Track artist
 * @param callback Callback function for the request. Sends a parameter with
 *                 reply decoded as JS object from JSON on null on error
 */
LastFM.prototype.love_track = function(track, artist, callback) {
    var params = {
        'api_key': this.API_KEY,
        'method': "track.love",
        'track': track,
        'artist': artist,
        'sk': this.session.key
    };
    
    params.api_sig = this._req_sign(params);
    params.format = "json";
    
    this._xhr("POST", params, 
        function(result) {
            callback(result);
        });
};

/**
 * Unloves a track
 *
 * @param track Track title
 * @param artist Track artist
 * @param callback Callback function for the request. Sends a parameter with
 *                 reply decoded as JS object from JSON on null on error
 */
LastFM.prototype.unlove_track = function(track, artist, callback) {
    var params = {
        'api_key': this.API_KEY,
        'method': "track.unlove",
        'track': track,
        'artist': artist,
        'sk': this.session.key
    };
    
    params.api_sig = this._req_sign(params);
    params.format = "json";
    
    this._xhr("POST", params, 
        function(result) {
            callback(result);
        });
};

/**
 * Checks whether a track loved by current user
 *
 * @param track Track title
 * @param artist Track artist
 * @param callback Callback function for the request. Sends a boolean
 *                 parameter which is true if track loved, otherwise false
 */
LastFM.prototype.is_track_loved = function(track, artist, callback) {
    if(!this.session.name) {
        callback(false);
        return;
    }
    
    var params = {
        'api_key': this.API_KEY,
        'method': "track.getInfo",
        'track': track,
        'artist': artist,
        'username': this.session.name
    };
    
    params.format = 'json';
    
    this._xhr("GET", params, function(result) {
        if(!result.error && result.track) {
            callback(result.track.userloved == 1);
        }
        else {
            callback(false);
        }
    });
};

/**
 * Makes a signature of request
 *
 * @param params Request values
 * @return Signature string
 */
LastFM.prototype._req_sign = function(params) {
    var keys = [];
    var key, i;
    var signature = "";
    
    for(key in params) {
        keys.push(key);
    }
    
    for(i in keys.sort()) {
        key = keys[i];
        signature += key + params[key];
    }
    
    signature += this.API_SECRET;
    return hex_md5(signature);
};

/**
 * Performs an XMLHTTP request and expects JSON as reply
 *
 * @param method Request method (GET or POST)
 * @param params Hash with request values. All request fields will be
 *               automatically urlencoded
 * @param callback Callback function for the request. Sends a parameter with
 *                 reply decoded as JS object from JSON on null on error
 */
LastFM.prototype._xhr = function(method, params, callback) {
    var uri = this.API_ROOT;
    var _data = "";
    var _params = [];
    var xhr = new XMLHttpRequest();
    
    for(param in params) {
        _params.push(encodeURIComponent(param) + "="
            + encodeURIComponent(params[param]));
    }
    
    switch(method) {
        case "GET":
            uri += '?' + _params.join('&').replace(/%20/, '+');
            break;
        case "POST":
            _data = _params.join('&');
            break;
        default:
            return;
    }
    
    xhr.open(method, uri);
    
    // TODO: Better error handling
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            var reply;
            
            try {
                reply = JSON.parse(xhr.responseText);
            }
            catch (e) {
                reply = null;
            }
            
            callback(reply);
        }
    };

    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded; charset=UTF-8");
    xhr.setRequestHeader("Pragma", "no-cache"); // The cache is a lie!
    xhr.send(_data || null);
};
