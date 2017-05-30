;

// Check if a new cache is available on page load.
window.addEventListener('load', function(e) {

  window.applicationCache.addEventListener('updateready', function(e) {
    if (window.applicationCache.status == window.applicationCache.UPDATEREADY) {
      // Browser downloaded a new app cache.
      // Swap it in and reload the page to get the new hotness.
      window.applicationCache.swapCache();
      window.location.reload();
    } else {
      // Manifest didn't changed. Nothing new to server.
    }
  }, false);

}, false);



var isOffline = false;

$(function() {
	

	$.get('/structr/rest/me')
	.fail(function() {

		isOffline = true;
		
		//console.log('no connection to backend => we are offline');
		setModeButtonOffline();
		disableOnlineElements();
		
	})
	.done(function(data) {
		
		isOffline = data.result.offlineMode;
		
		//console.log('connection to backend exists, offlineMode: ', isOffline);

		if (!isOffline) {
			setModeButtonOnline();
			enableOnlineElements();
			//window.applicationCache.update()
		} else {
			setModeButtonOffline();
			disableOnlineElements();
		}

	});
	
});

function disableOnlineElements() {
	$('.online-only').each(function(i, el) {
		var el = $(el);
		if (el.prop('disabled')) return;
		el.prop('disabled', true).data('offline-disabled', true);
		el.addClass('disabled');
	});
}

function enableOnlineElements() {
	$('.online-only').each(function(i, el) {
		var el = $(el);
		var offlineDisabled = el.data('offline-disabled');
		if (!offlineDisabled) return;
		el.prop('disabled', false);
		el.removeClass('disabled');
	});
}