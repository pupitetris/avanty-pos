// This file is part of Microsafe AVANTY. -*- tab-width: 4; -*-
//
// Copyright © 2017 Microsafe, S.A. de C.V.
// Derechos Reservados (R) 2017 Microsafe, S.A. de C.V.

(function () {
	var MOD_NAME = 'activate';

	var FADE_DELAY = 2000;

	var activate_sequence = [1,2,3,4,5];
	var activate_current = 0;

	var ui = {};

	function layout_init () {
		ui.sections_parent = $('#activate-sections');

		// "Blank" screen, where we go when things fail.

		var blank_button = $('#activate-blank button');
		blank_button.button ();
		// Give the user the option of starting again the process, even if a fatal error occurred.
		blank_button.bind ('click', function () { mod.reset (); });
		
		// Greeting screen.

		$('.activate-quadrant').bind ('click', quadrant_click);

		ui.greeting_cont = $('#activate-greeting-continue');
		
		ui.greeting_button = ui.greeting_cont.find ('button');
		ui.greeting_button.button ();
		ui.greeting_button.bind ('click', greeting_click);

		ui.activate_load_icon = $('#activate-load img');

		// Challenge screen.

		var chal_cont = $('#activate-chal');
		chal_cont.find ('form').bind ('submit', challenge_submit);

		ui.chal_button = chal_cont.find ('button');
		ui.chal_button.button ();

		ui.chal_input = chal_cont.find ('input');
		ui.chal_input.input ();

		mod.loaded = true;
		mod.onLoad ();
	}

	// In case of an unhandled error, blank the screen.
	function activate_blank_error () {
		APP.switchSection ($('#activate-blank'), ui.sections_parent);
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
			APP.hourglass.enable ();
			APP.switchSection ($('#activate-greeting'), ui.sections_parent);
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

		ui.greeting_cont.show ();
		ui.greeting_button.focus ();
	}

	function greeting_click (evt) {
		ui.greeting_button.button ("disable");
		APP.switchSection ($('#activate-chal'), ui.sections_parent);
		activate_challenge_get ();
	}

	function activate_challenge_get () {
		ui.chal_input.val ('');
		APP.charp.request ('activation_challenge_get', [],
						   {
							   success: activate_challenge_get_success,
							   error: activate_blank_error
						   });
	}

	function activate_challenge_get_success (data) {
		ui.chal_value = data;
		ui.chal_button.button ("enable");
		ui.chal_input.focus ();
		$('#activate-chal-value').text (ui.chal_value);
	}

	function challenge_submit (evt) {
		evt.preventDefault ();
		ui.chal_button.button ("disable");
		ui.chal_input.focus ();
		APP.charp.request ('activation_challenge_check', [ui.chal_value, ui.chal_input.val ()],
						   {
							   success: activate_challenge_check_success,
							   error: function (err) {
								   switch (err.key) {
								   case 'SQL:EXIT':
									   if (err.desc == 'BAD_SOLUTION') {
										   ui.chal_button.button ("enable");
										   APP.msgDialog ({
											   icon: 'no',
											   desc: 'La solución proporcionada no es correcta.',
											   sev: CHARP.ERROR_SEV['USER'],
											   title: 'Solución incorrecta',
											   opts: { width: '75%' }
										   });
										   return;
									   }
								   case 'SQL:NOTFOUND':
									   ui.chal_button.button ("enable");
									   APP.msgDialog ({
										   icon: 'timeout.png',
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
			APP.appendPageAndLoadLayout (MOD_NAME, MOD_NAME + '.html', layout_init);
		},

		onLoad: function () {
			if (!mod.loaded)
				return;

			mod.reset ();
		},

		reset: function () {
			$('#activate-chal-value').text ('--------');

			ui.greeting_button.button ("enable");
			ui.chal_button.button ("disable");
			
			APP.hourglass.disable ();
			APP.switchPage (MOD_NAME);
			APP.switchSection ($('#activate-load'), ui.sections_parent);

			activate_current = 0;
			ui.greeting_cont.hide ();

			ui.activate_load_icon.hide ();
			ui.activate_load_icon.fadeIn (FADE_DELAY, activate_load_start);
		}
	};

	APP.addModule (MOD_NAME, mod);
}) ();
