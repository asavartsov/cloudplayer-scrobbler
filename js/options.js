// Saves options to localStorage.
function save_options() {
    var scrobble_mult = document.getElementById('scrobble_mult').checked;
    if (!scrobble_mult) {
        localStorage['max_scrobbles'] = 1;
    } else {
        localStorage.removeItem('max_scrobbles')
    }

    chrome.runtime.getBackgroundPage(function(backgroundPage) {
        backgroundPage.location.reload();
        // Update status to let user know options were saved.
        var status = document.getElementById('status');
        status.innerHTML = 'Options saved, please reload the Google Play page.';
        setTimeout(function() {
            status.innerHTML = '';
        }, 3500);
    });
}

// Restores select box state to saved value from localStorage.
function restore_options() {
    var scrobble_mult = SETTINGS.max_scrobbles > 1;
    document.getElementById('scrobble_mult').checked = scrobble_mult;
    document.getElementById('minute_field').innerHTML = 
            Math.round((SETTINGS.scrobble_interval / 60) * 100) / 100;
}
document.addEventListener('DOMContentLoaded', restore_options);
document.querySelector('#save').addEventListener('click', save_options);