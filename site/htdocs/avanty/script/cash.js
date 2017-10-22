// This file is part of Microsafe AVANTY. -*- tab-width: 4; -*-
//
// Copyright © 2017 Microsafe, S.A. de C.V.
// Derechos Reservados (R) 2017 Microsafe, S.A. de C.V.

(function () {
	var MOD_NAME = 'cash';

	var ui = {};
	var shell;

	function pass_layout_init (name, validator_options) {
		var section = ui['section_' + name] = $('#cash-' + name);
		
		var orig = ui[name + '_orig_pass'] = section.find ('input[name="orig-pass"]');
		orig.input ();

		var pass = ui[name + '_pass'] = section.find ('input[name="' + name + '-pass"]');
		pass.input ();

		var pass2 = ui[name + '_pass2'] = section.find ('input[name="' + name + '-pass2"]');
		pass2.input ();

		var submit = ui[name + '_submit'] = section.find ('button');
		submit.button ();

		ui[name + '_title'] = section.find ('h2');

		var rules = {};

		rules['orig-pass'] = {
			required: true,
		};
		rules[name + '-pass'] = {
			required: true,
			minlength: 8,
			maxlength: 255
		};
		rules[name + '-pass2'] = {
			'validate-pass2': true
		};

		validator_options.rules = rules;
		validator_options.ignore = "";

		var form = ui[name + '_form'] = section.find ('form');
		form.attr ('autocomplete', 'off');
		form.validate (validator_options);

		// Custom validations:
		pass2.addClass ('validate-pass2');
	}

	function layout_init () {
		$.validator.addMethod ('validate-pass2', function (val, ele) {
			var pass_name = ele.name.substring (0, ele.name.length - 1).replace ('-', '_');
			var pass = ui[pass_name].val ();
			return pass == val;
		}, 'Las contraseñas deben de coincidir.');

		ui.sections_parent = $('#cash-sections');
		ui.section_main = $('#cash-main');

		shell = APP.shellCreate (ui.sections_parent);

		shell.ui.logout.on ('click', cash_logout);

		shell.ui.park_enter = $('#cash-tab-park-enter');
		shell.ui.park_exit = $('#cash-tab-park-exit');
		shell.ui.rent_enter = $('#cash-tab-rent-enter');
		shell.ui.rent_exit = $('#cash-tab-rent-exit');
		shell.ui.rent_search = $('#cash-tab-rent-search');
		shell.ui.rent_create = $('#cash-tab-rent-create');

		pass_layout_init ('chpass', { submitHandler: cash_chpass_submit });

		mod.loaded = true;
		mod.onLoad ();
	}

	function cash_logout () {
		var desc;
		var icon;
		
		if (APP.history.length () > 0) {
			desc = '<>Parece que dejaste actividades pendientes.<br /><br />¿Estás seguro que quieres salir?';
			icon = 'warning';
		} else {
			desc = '¿Estás seguro que quieres salir?';
			icon = 'question';
		}

		APP.msgDialog ({
			icon: icon,
			desc: desc,
			title: 'Cerrar sesión',
			opts: {
				buttons: {
					'Sí, salir': cash_do_logout,
					'Cancelar': null
				},
				width: '75%'
			}
		});
	}

	function cash_do_logout () {
		APP.loadModule ('login');
	}

	function cash_main_message (msg) {
		ui.cash_main_message.html (msg);
	}

	var chpass_title;

	function cash_chpass_request () {
		if (APP.mod.login.is_first) {
			// This is the first login for the user. Setup page accordingly.
			chpass_title = ui.chpass_title.text ();
			ui.chpass_title.text ('Establece una contraseña propia');
			shell.show (false);
			APP.switchSection (ui.section_chpass);
		} else
			APP.history.go (MOD_NAME, ui.section_chpass, 'cash-change-password');
	}

	function cash_chpass_submit (form, evt) {
		evt.originalEvent.preventDefault ();

		var cred = APP.charp.credentialsGet ();

		var orig_pass = ui.chpass_orig_pass.val ();
		if (cred.passwd != APP.mod.login.passwordHash (orig_pass, cred.salt)) {
			// Wrong original password.
			APP.msgDialog ({
				icon: 'no',
				desc: 'La contraseña original está equivocada.',
				sev: CHARP.ERROR_SEV['USER'],
				title: 'Contraseña incorrecta',
				opts: { width: '75%' }
			});
			return;
		}

		ui.chpass_submit.button ('disable');

		var pass = ui.chpass_pass.val ();
		APP.charp.request ('this_user_password_change', [pass],
						   {
							   success: function (salt) {
								   cred.pass = APP.mod.login.passwordHash (pass, salt);
								   cred.salt = salt;
								   APP.charp.credentialsSet (cred);
								   cash_chpass_success ();
							   }
						   });
	}

	function cash_chpass_success () {
		if (APP.mod.login.is_first) {
			// End of first login exception. Restore and go back to main screen.
			APP.mod.login.is_first = false;
			ui.chpass_title.text (chpass_title);
			cash_main ();
		} else
			APP.history.back ();
	}

	function cash_main () {
		if (APP.mod.login.is_first) {
			// This is the first login for the user. Force a password change.
			cash_chpass_request ();
			return;
		}

		shell.show (true);
		shell.backShow ();
		APP.history.setHome (MOD_NAME, ui.section_main);
		APP.switchSection (ui.section_main);
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
			APP.hourglass.enable ();
			APP.switchPage (MOD_NAME);
			cash_main ();
		}
	};

	APP.addModule (MOD_NAME, mod);
}) ();
