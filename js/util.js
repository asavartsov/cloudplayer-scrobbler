/**
* Various utility functions
*/

function find_play_tab(callback) {
    chrome.tabs.query({url: '*://play.google.com/music/listen*'},
        function(tabs) {
            if (tabs.length > 0) {
                callback(tabs[0]);
            } else {
                callback(null);
            }
        });
}

function open_play_tab() {
    find_play_tab(
        function(tab) {
            if (tab) {
                chrome.tabs.update(tab.id, {selected: true});
            } else {
                chrome.tabs.create({url:
                    'https://play.google.com/music/listen',
                     selected: true});
            }
        }
    );
}