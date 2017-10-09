// This file is part of Microsafe AVANTY. -*- tab-width: 4; -*-
//
// Copyright © 2017 Microsafe, S.A. de C.V.
// Derechos Reservados (R) 2017 Microsafe, S.A. de C.V.

(function () {
	var MOD_NAME = 'activate';

	var FADE_DELAY = 2000;

	var activate_sequence = [1,2,3,4,5];
	var activate_current = 0;

	var activate_load_icon;
	var greeting_cont;
	var greeting_button;
	var chal_input;
	var chal_value;
	var sections_parent;

	// In case of an unhandled error, blank the screen.
	function activate_blank_error () {
		APP.switchSection ($('#activate-blank'), sections_parent);
		return true; // Call default handler to show the error dialog.
	}

	function activate_load_start () {
		APP.charp.credentialsSet ('supervisor',
								  '$2a$08$dcVj2sdh6IU5ixUg5m5i2eD1NHClUqXMcvEIFED1dTlQaXI/uztmy',
								  '$2a$08$dcVj2sdh6IU5ixUg5m5i2e');

		APP.charp.request ('system_is_activated', [],
						   {
							   success: activate_load_is_activated,
							   error: activate_blank_error
						   });
	}

	function activate_load_is_activated (data) {
		if (!data) { // System is not activated. Proceed with activation.
			APP.switchSection ($('#activate-greeting'), sections_parent);
			return;
		}

		activate_finish ();
	}

	function quadrant_click (evt) {
		if (activate_current == activate_sequence.length)
			// Sequence has already been entered. Ignore event.
			return;
		
		var id = evt.currentTarget.id;
		var num = parseInt (id.split ('-')[1], 10);
		if (activate_sequence[activate_current] != num) {
			// If user fails the sequence, we are back to the beginning.
			activate_current = (activate_sequence[0] == num)? 1: 0;
			return;
		}

		activate_current ++;
		if (activate_current < activate_sequence.length)
			return;

		greeting_cont.show ();
		greeting_button.focus ();
	}

	function greeting_click (evt) {
		APP.switchSection ($('#activate-chal'), sections_parent);
		activate_challenge_get ();
	}

	function activate_challenge_get () {
		chal_input.val ('');
		APP.charp.request ('activation_challenge_get', [],
						   {
							   success: activate_challenge_get_success,
							   error: activate_blank_error
						   });
	}

	function activate_challenge_get_success (data) {
		chal_value = data;
		chal_input.focus ();
		$('#activate-chal-value').text (chal_value);
	}

	function challenge_submit (evt) {
		evt.preventDefault ();
		chal_input.focus ();
		APP.charp.request ('activation_challenge_check', [chal_value, chal_input.val ()],
						   {
							   success: activate_challenge_check_success,
							   error: function (err) {
								   switch (err.key) {
								   case 'SQL:EXIT':
									   if (err.desc == 'BAD_SOLUTION') {
										   APP.msgDialog ({
											   icon: 'no',
											   desc: 'La solución proporcionada no es correcta.',
											   sev: CHARP.ERROR_SEV['USER'],
											   title: 'Solución incorrecta',
											   opts: {
												   width: '75%',
											   }
										   });
										   return;
									   }
								   case 'SQL:NOTFOUND':
									   APP.msgDialog ({
										   icon: 'timeout',
										   desc: 'El reto ha expirado.',
										   sev: 'El reto debe de ser contestado antes de cierto tiempo. Se proporcionará otro reto para ser contestado antes de que expire nuevamente.',
										   title: 'Reto expirado',
										   opts: {
											   width: '75%',
											   buttons: { 'Cerrar': activate_challenge_get }
										   }
									   });
									   return;
								   }
								   return activate_blank_error ();
							   }
						   });
	}

	function activate_challenge_check_success (data) {
		activate_finish ();
	}

	function activate_finish () {
		APP.loadModule ('super');
	}

	var mod = {
		init: function () {
			mod.initialized = true;
			APP.appendPageAndLoadLayout (MOD_NAME, MOD_NAME + '.html', layoutInit);
		},

		onLoad: function () {
			if (!mod.loaded)
				return;

			$('.activate-quadrant').bind ('click', quadrant_click);

			greeting_cont = $('#activate-greeting-continue');
			
			greeting_button = greeting_cont.find ('button');
			greeting_button.button ();
			greeting_button.bind ('click', greeting_click);

			sections_parent = $('#activate-sections');
			activate_load_icon = $('#activate-load img');

			var chal_cont = $('#activate-chal');
			chal_cont.find ('button').button ();
			chal_cont.find ('form').bind ('submit', challenge_submit);

			chal_input = chal_cont.find ('input');
			chal_input.input ();

			APP.switchPage (MOD_NAME);

			mod.reset ();
		},

		reset: function () {
			activate_current = 0;
			greeting_cont.hide ();

			APP.switchSection ($('#activate-load'), sections_parent);

			activate_load_icon.hide ();
			activate_load_icon.fadeIn (FADE_DELAY, activate_load_start);
		}
	};

	function layoutInit () {
		mod.loaded = true;
		mod.onLoad ();
	}

	APP.addModule (MOD_NAME, mod);
}) ();
