// This file is part of Microsafe AVANTY. -*- tab-width: 4; -*-
//
// Copyright © 2017 Microsafe, S.A. de C.V.
// Derechos Reservados (R) 2017 Microsafe, S.A. de C.V.

(function () {
	var MOD_NAME = 'activate';

	var activate_sequence = [1,2,3,4,5];
	var activate_current = -1;

	var mod = {
		init: function () {
			mod.initialized = true;
			APP.appendPageAndLoadLayout (MOD_NAME, MOD_NAME + '.html', layoutInit);
		},

		onLoad: function () {
			if (!mod.loaded)
				return;

			APP.switchPage (MOD_NAME);
			APP.switchSection ($('#activate-greeting'), $('#activate-sections'));
		},

		reset: function () {
			activate_current = -1;
		}
	};

	function layoutInit () {
		mod.loaded = true;
		mod.onLoad ();
	}

	APP.addModule (MOD_NAME, mod);
}) ();
