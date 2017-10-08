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
	var chal_cont;
	var chal_input;
	var chal_value;
	var sections_parent;

	function activate_load_error () {
		APP.switchSection ($('#activate-blank'), sections_parent);
		return true; // Call default handler to show the error dialog.
	}

	function activate_load_is_activated (data) {
		if (!data) { // System is not activated. Proceed with activation.
			APP.switchSection ($('#activate-greeting'), sections_parent);
			return;
		}

		activate_proceed ();
	}

	function activate_load_start () {
		APP.charp.credentialsSet ('supervisor',
								  '$2a$08$dcVj2sdh6IU5ixUg5m5i2eD1NHClUqXMcvEIFED1dTlQaXI/uztmy',
								  '$2a$08$dcVj2sdh6IU5ixUg5m5i2e');

		APP.charp.request ('system_is_activated', [],
						   {
							   success: activate_load_is_activated,
							   error: activate_load_error
						   });
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

		greeting_cont.fadeIn (FADE_DELAY);
	}

	function greeting_click (evt) {
		APP.switchSection ($('#activate-chal'), sections_parent);
		APP.charp.request ('activation_challenge_get', [],
						   {
							   success: activate_challenge_get_success,
							   error: activate_load_error
						   });
	}

	function activate_challenge_get_success (data) {
		chal_value = data;
		$('#activate-chal-value').text (chal_value);
	}

	function challenge_click () {
		APP.charp.request ('activation_challenge_check', [chal_value, chal_input.val ()],
						   {
							   success: activate_challenge_check_success,
							   error: activate_load_error
						   });
	}

	function activate_challenge_check_success (data) {
		alert ('success');
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
			
			var greeting_button = greeting_cont.find ('button');
			greeting_button.button ();
			greeting_button.bind ('click', greeting_click);

			sections_parent = $('#activate-sections');
			activate_load_icon = $('#activate-load img');

			chal_cont = $('#activate-chal table');

			var chal_button = chal_cont.find ('button');
			chal_button.button ();
			chal_button.bind ('click', challenge_click);

			chal_input = chal_cont.find ('input');
			chal_input.addClass("ui-widget ui-widget-content ui-corner-all");

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
