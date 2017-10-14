// This file is part of Microsafe AVANTY. -*- tab-width: 4; -*-
//
// Copyright © 2017 Microsafe, S.A. de C.V.
// Derechos Reservados (R) 2017 Microsafe, S.A. de C.V.

(function () {
	var MOD_NAME = 'lock';

	var ui = {};

	function layout_init () {
		ui.sections_parent = $('#lock-sections');
		ui.section_overlay = $('#lock-overlay');
		ui.section_unlock = $('#lock-unlock');

		ui.shell = ui.sections_parent.find ('.shell');
		ui.shell_unlock = ui.shell.find ('.shell-lock');
		ui.shell_unlock.button ();
		ui.shell_unlock.bind ('click', unlock_start);

		ui.user = ui.section_unlock.find ('span');

		ui.pass = ui.section_unlock.find ('input');
		ui.pass.input ();

		ui.submit = ui.section_unlock.find ('button');
		ui.submit.button ();

		ui.form = ui.section_unlock.find ('form');
		ui.form.bind ('submit', unlock_submit);

		mod.loaded = true;
		mod.onLoad ();
	}

	function unlock_start () {
		APP.switchSection (ui.section_unlock, ui.sections_parent);

		ui.shell_unlock.hide ();
		ui.pass.focus ();
	}

	function unlock_submit (evt) {
		evt.preventDefault ();

		ui.submit.button ('disable');
		
		// Need to try new credentials, so create a new charp client, cloning the "regular" client.
		// This avoids that wrong new credentials bork background tasks on the POS.
		var charp = new CHARP ().init (APP.charp);

		var cred = charp.credentialsGet ();
		APP.mod.login.loginTry (charp, cred.login, ui.pass.val (),
								function () { unlock_success (charp); },
								unlock_error);
	}

	function unlock_success (charp) {
		APP.charp.credentialsSet (charp.credentialsGet ());
		APP.clock.color (null);
		// pop interface.
	}

	function unlock_error (err, ctx, charp) {
		mod.reset ();
		return APP.mod.login.loginErrorHandler (err, ctx, charp);
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
			APP.switchSection (ui.section_overlay, ui.sections_parent);
			APP.clock.color ('white');
			
			ui.shell_unlock.show ();
			ui.user.text (APP.charp.credentialsGet ().login);
			ui.pass.val ('');
			ui.submit.button ('enable');
		}
	};

	APP.addModule (MOD_NAME, mod);
}) ();
