// This file is part of Microsafe AVANTY. -*- tab-width: 4; -*-
//
// Copyright © 2017 Microsafe, S.A. de C.V.
// Derechos Reservados (R) 2017 Microsafe, S.A. de C.V.

(function () {
	var MOD_NAME = 'login';

	var ui = {};

	function layout_init () {
		ui.sections_parent = $('#login-sections');
		ui.section_enter = $('#login-enter');

		ui.enter_username = ui.section_enter.find ('input[name="login-username"]');
		ui.enter_username.input ();

		ui.enter_pass = ui.section_enter.find ('input[name="login-pass"]');
		ui.enter_pass.input ();

		ui.enter_submit = ui.section_enter.find ('button');
		ui.enter_submit.button ();

		ui.enter_form = ui.section_enter.find ('form');
		ui.enter_form.validate ({
			submitHandler: login_enter_submit,
			rules: {
				'login-username': { required: true },
				'login-pass': { required: true }
			},
			messages: {
				'login-username': { required: 'Escribe la clave de tu usuario.' },
				'login-pass': { required: 'Escribe tu contraseña.' }
			}
		});

		mod.loaded = true;
		mod.onLoad ();
	}

	function login_enter () {
		APP.switchSection (ui.section_enter, ui.sections_parent);

		APP.charp.credentialsSet (null, null, null);

		ui.enter_username.focus ();
		ui.enter_username.val ('');
		ui.enter_pass.val ('');

		ui.enter_submit.button ("enable");
	}

	function login_enter_submit (form, evt) {
		evt.originalEvent.preventDefault ();

		ui.enter_submit.button ("disable");
		
		var login = ui.enter_username.val ();
		var pass = ui.enter_pass.val ();

		APP.charp.request ('salt_get', [login],
						   {
							   asAnon: true,
							   success: function (salt) {
								   login_try (login, pass, salt);
							   },
							   error: login_error
						   });
		
	}

	function login_try (login, pass, salt) {
		setCredentials (login, pass, salt);
		APP.charp.request ('user_auth', [], 
						   { 
							   success: login_success,
							   error: login_error
						   });
	}

	function login_error (err, ctx, charp) {
		ui.enter_submit.button ("enable");

		switch (err.key) {
		case 'SQL:USERUNK':
			APP.msgDialog ({
				icon: 'no',
				desc: 'Usuario no encontrado. ¿Escribiste bien tu clave de usuario?',
				sev: CHARP.ERROR_SEV['USER'],
				title: 'Usuario no encontrado',
				opts: { width: '75%' }
			});
			return;
		case 'SQL:REPFAIL':
			APP.msgDialog ({
				icon: 'no',
				desc: 'La contraseña está equivocada.',
				sev: CHARP.ERROR_SEV['USER'],
				title: 'Contraseña incorrecta',
				opts: { width: '75%' }
			});
			return;
		}
		return true;
	}

	function login_success (data) {
		alert ('success');
	}

	function setCredentials (login, pass, salt) {
		if (pass.indexOf (salt) != 0)
			pass = dcodeIO.bcrypt.hashSync (pass, salt);
		APP.charp.credentialsSet (login, pass, salt);
	}

	var mod = {
		init: function () {
			mod.initialized = true;
			APP.appendPageAndLoadLayout (MOD_NAME, MOD_NAME + '.html', layout_init);
		},

		onLoad: function () {
			if (!mod.loaded)
				return;

			APP.switchPage ($('#login'));

			mod.reset ();
		},

		reset: function () {
			login_enter ();
		}
	};

	APP.addModule (MOD_NAME, mod);
}) ();
