// This file is part of Microsafe AVANTY. -*- tab-width: 4; -*-
//
// Copyright © 2017 Microsafe, S.A. de C.V.
// Derechos Reservados (R) 2017 Microsafe, S.A. de C.V.

(function () {
	var MOD_NAME = 'super';

	var super_is_first; // True when supervisor creation is required, right after activation.

	var ui = {};

	function layout_init () {
		ui.sections_parent = $('#super-sections');
		ui.section_newsuper = $('#super-newsuper');
		ui.section_main = $('#super-main');

		ui.shell = ui.sections_parent.find ('.shell');
		ui.shell_lock = ui.shell.find ('.shell-lock');
		ui.shell_lock.button ();
		ui.shell_lock.bind ('click', function () { APP.loadModule ('lock'); });

		ui.newsuper_login = ui.section_newsuper.find ('input[name="newsuper-login"]');
		ui.newsuper_login.input ();

		ui.newsuper_pass = ui.section_newsuper.find ('input[name="newsuper-pass"]');
		ui.newsuper_pass.input ();

		ui.newsuper_pass2 = ui.section_newsuper.find ('input[name="newsuper-pass2"]');
		ui.newsuper_pass2.input ();

		ui.newsuper_submit = ui.section_newsuper.find ('button');
		ui.newsuper_submit.button ();

		$.validator.addMethod ('validate-login', function (val, ele) { 
			var re = new RegExp ('^[a-zA-Z0-9_.áéíóúñÁÉÚÍÓÚÑüÜ]+$');
			return re.exec (val);
		}, 'La clave tiene caracteres no válidos.');

		$.validator.addMethod ('validate-pass2', function (val, ele) {
			var pass = ui.newsuper_pass.val ();
			return pass == val;
		}, 'Las contraseñas deben de coincidir.');

		ui.newsuper_form = ui.section_newsuper.find ('form');
		ui.newsuper_form.validate ({
			submitHandler: super_create_super_submit,
			rules: {
				'newsuper-login': {
					required: true,
					maxlength: 255,
					'validate-login': true
				},
				'newsuper-pass': {
					required: true,
					minlength: 8,
					maxlength: 255
				},
				'newsuper-pass2': {
					'validate-pass2': true
				}
			}
		});

		// Custom validations:
		ui.newsuper_pass2.addClass ('validate-pass2');

		mod.loaded = true;
		mod.onLoad ();
	}

	function super_create_super () {
		APP.switchSection (ui.section_newsuper, ui.sections_parent);

		if (super_is_first) {
			ui.shell.hide ();
		} else {
			ui.shell.show ();
		}

		ui.newsuper_login.val ('');
		ui.newsuper_pass.val ('');
		ui.newsuper_pass2.val ('');
		ui.newsuper_submit.button ('enable');
		ui.newsuper_login.focus ();
	}

	function super_create_super_submit (form, evt) {
		evt.originalEvent.preventDefault ();

		ui.newsuper_submit.button ('disable');

		var login = ui.newsuper_login.val ();
		var pass = ui.newsuper_pass.val ();

		APP.charp.request ('user_create', [login, pass, 'supervisor'],
						   {
							   success: super_user_create_super_success,
							   error: function () { ui.newsuper_submit.button ('enable'); return true; }
						   });
	}

	function super_user_create_super_success () {
		if (super_is_first)
			APP.loadModule ('login');
		else
			super_main ();
	}

	function super_main () {
		APP.history.setHome (MOD_NAME, ui.section_main);
		APP.switchSection (ui.section_main);
		ui.shell.show ();
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
			super_is_first = false;

			var cred = APP.charp.credentialsGet ();
			if (cred.login == 'supervisor') {
				APP.charp.request ('supervisor_created', [],
								   function (data) {
									   APP.hourglass.enable ();
									   if (!data) {
										   // operations supervisor not created. Create one immediately.
										   super_is_first = true;
										   APP.switchPage (MOD_NAME);
										   super_create_super ();
									   } else // operations supervisor present. Go to login screen.
										   APP.loadModule ('login');
								   });
				return;
			}

			APP.hourglass.enable ();
			APP.switchPage (MOD_NAME);
			super_main ();
		}
	};

	APP.addModule (MOD_NAME, mod);
}) ();
