;
var structrAppLocale = 'de_DE';
$(function() {
	
	$('#insurance-subtype').on('change', function() {
		var sel = $(this);
		document.location.href = '?subType=' + sel.val() + '&clientFolder=' + urlParam('clientFolder');
	});
	
	if (window.localStorage.getItem('agent-area-collapsed')) {
		collapseAgentArea();
	}
	
	$('.toggle-agent').on('click', function() {
		if ($('.consulting-folder-left-col').hasClass('col-sm-8')) {
			collapseAgentArea();
		} else {
			expandAgentArea();
		}
	});
	
	$('#toggle-offline-mode').on('click', function() {
		
		var btn = $(this);
		var btnStatus = btn.attr('data-client-side-offline-mode') === 'true';
		
		//console.log('button status', btnStatus);
		
		if (!btnStatus) {
			
			setModeButtonOffline();
			disableOnlineElements();
			
			setOfflineModeInBackend(true);
			
		} else {

			setOfflineModeInBackend(false, function() {
				setModeButtonOnline();
				enableOnlineElements();
			});
		}
		
		//console.log(clientSideOfflineMode); return;
		
	});

	$('#allow-access').on('click', function() {
		
		var inp = $(this);
		var clientId = inp.data('client-id');
		
		if (clientId) {
			var data = {
				accessAllowed: inp.prop('checked')
			};
			$.ajax({
				url: '/structr/rest/Client/' + clientId + '/allowAccess',
				method: 'POST',
				dataType: "json",
				contentType:"application/json; charset=utf-8",
				data: JSON.stringify(data),
				success: function() {
					blinkGreen(inp.parent());
					document.location.reload();
				}
			});
		}		
	});
		
});

function setOfflineModeInBackend(offlineMode, done, fail) {
	$.ajax({
		url: '/structr/rest/me',
		method: 'PUT',
		data: JSON.stringify({
			offlineMode: offlineMode
		})
	}).fail(function() {
		//console.log('no network connection');
		if (fail) fail();
	})
	.done(function(data) {
		//console.log('successfully set offlineMode to', offlineMode, 'in backend');
		if (done) done(data);
		document.location.reload();
	});
}

function setModeButtonOffline() {
	var btn = $('#toggle-offline-mode');
	btn.addClass('btn-danger');
	btn.html('Offline-Modus - klicken zum Deaktivieren');
	btn.attr('data-client-side-offline-mode', true);
}

function setModeButtonOnline() {
	var btn = $('#toggle-offline-mode');
	btn.removeClass('btn-danger');
	btn.html('<i class="fa fa-wifi m-r-1"></i>Offline-Modus aktivieren');
	btn.attr('data-client-side-offline-mode', false);
}

function collapseAgentArea() {
	$('.consulting-folder-left-col').removeClass('col-sm-8').addClass('col-sm-9');
	$('.consulting-folder-right-col').removeClass('col-sm-4').addClass('col-sm-2 col-sm-offset-1');
	$('.toggle-agent i').removeClass('fa-chevron-right').addClass('fa-chevron-left');
	$('.agent-map-marker i').css({ fontSize: '2em' });
	$('.consulting-folder-right-col').css({ fontSize: '.9em' });
	window.localStorage.setItem('agent-area-collapsed', true);
}


function expandAgentArea() {
	$('.consulting-folder-left-col').removeClass('col-sm-9').addClass('col-sm-8');
	$('.consulting-folder-right-col').removeClass('col-sm-2 col-sm-offset-1').addClass('col-sm-4');
	$('.toggle-agent i').removeClass('fa-chevron-left').addClass('fa-chevron-right');
	$('.agent-map-marker i').css({ fontSize: '5em' });
	$('.consulting-folder-right-col').css({ fontSize: '1em' });
	window.localStorage.removeItem('agent-area-collapsed');
}

function blinkGreen(element) {

	blink(element, '#6db813', '#81ce25');
}

function blinkRed(element) {

	blink(element, '#a00', '#faa');
}

function blink (element, color, bgColor) {

	if (!element || !element.length) {
		return;
	}

	var fg = element.prop('data-fg-color'), oldFg = fg || element.css('color');
	var bg = element.prop('data-bg-color'), oldBg = bg || element.css('backgroundColor');

	if (!fg) {
		element.prop('data-fg-color', oldFg);
	}

	if (!bg) {
		element.prop('data-bg-color', oldBg);
	}

	element.animate({
		color: color,
		backgroundColor: bgColor
	}, 50, function() {
		$(this).animate({
			color: oldFg,
			backgroundColor: oldBg
		}, 1000);
	});
}