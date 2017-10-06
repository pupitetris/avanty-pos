// This file is part of Microsafe AVANTY. -*- tab-width: 4; -*-
//
// Copyright © 2017 Microsafe, S.A. de C.V.
// Derechos Reservados (R) 2017 Microsafe, S.A. de C.V.

(function () {
	var MOD_NAME = 'activate';

	var activate_sequence = [1,2,3,4,5];
	var activate_current = 0;

	function quadrant_click (evt) {
		if (activate_current == activate_sequence.length)
			// Sequence has been entered. Continue.
			return;
		
		var id = evt.currentTarget.id;
		var num = parseInt (id.split ('-')[1], 10);
		if (activate_sequence[activate_current] != num) {
			activate_current = 0;
			return;
		}

		activate_current ++;
		if (activate_current < activate_sequence.length)
			return;

		mod.greeting_cont.fadeIn (1000);
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

			mod.greeting_cont = $('#activate-greeting-continue');
			
			var greeting_button = mod.greeting_cont.find ('button');
			greeting_button.button ();

			APP.switchPage (MOD_NAME);
			APP.switchSection ($('#activate-greeting'), $('#activate-sections'));

			mod.reset ();
		},

		reset: function () {
			activate_current = 0;
			mod.greeting_cont.hide ();
		}
	};

	function layoutInit () {
		mod.loaded = true;
		mod.onLoad ();
	}

	APP.addModule (MOD_NAME, mod);
}) ();
