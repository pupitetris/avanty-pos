// This file is part of Microsafe AVANTY. -*- tab-width: 4; -*-
//
// Copyright © 2017 Microsafe, S.A. de C.V.
// Derechos Reservados (R) 2017 Microsafe, S.A. de C.V.

(function () {
	var MOD_NAME = 'super';

	var super_first; // True when supervisor creation is required, right after activation.

	var sections_parent;
	var section_newsuper;

	var newsuper_form;
	var newsuper_login;
	var newsuper_pass;
	var newsuper_pass2;
	var newsuper_submit;

	function layout_init () {
		sections_parent = $('#super-sections');
		section_newsuper = $('#super-newsuper');

		newsuper_shell = section_newsuper.find ('.shell');

		newsuper_form = section_newsuper.find ('form');

		newsuper_login = $('#newsuper-login');
		newsuper_login.input ();

		newsuper_pass = $('#newsuper-pass');
		newsuper_pass.input ();

		newsuper_pass2 = $('#newsuper-pass2');
		newsuper_pass2.input ();

		newsuper_submit = section_newsuper.find ('button');
		newsuper_submit.button ();

		mod.loaded = true;
		mod.onLoad ();
	}

	function super_create_super () {
		APP.switchSection (section_newsuper, sections_parent);

		if (super_first) {
			newsuper_shell.hide ();
		} else {
			newsuper_shell.show ();
		}
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
			APP.switchPage (MOD_NAME);

			super_first = false;

			var cred = APP.charp.credentialsGet ();
			if (cred.login == 'supervisor') {
				APP.charp.request ('supervisor_created', [],
								   function (data) {
									   if (!data) {
										   // operations supervisor not created. Create one immediately.
										   super_first = true;
										   super_create_super ();
									   } else // operations supervisor present. Go to login screen.
										   super_login ();
								   });
				return;
			}

			super_login ();
		}
	};

	APP.addModule (MOD_NAME, mod);
}) ();
