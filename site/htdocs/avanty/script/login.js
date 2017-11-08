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

		ui.enter_form = ui.section_enter.find ('form');
		ui.enter_form.attr ('autocomplete', 'off');
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

		ui.enter_submit = ui.enter_form.find ('button');
		ui.enter_submit.button ();

		ui.enter_lostpass = $('#login-lostpass');
		ui.enter_lostpass.button ();
		ui.enter_lostpass.on ('click', request_challenge);

		// Secret combo for supervisor challenge request.
		ui.sections_parent.find ('.quadrant').on ('click',
												  function (evt) {
													  if (APP.mod.activate.quadrantClick (evt))
														  quadrant_success ();
												  });

		mod.loaded = true;
		mod.onLoad ();
	}

	function quadrant_success () {
		ui.enter_lostpass.show ();
	}

	function request_challenge () {
		ui.enter_lostpass.hide ();
		APP.mod.activate.requestChallenge (request_challenge_success);
	}

	function request_challenge_success (chal, solution) {
		function super_set_chpass (mod) {
			mod.chpass = true;
			mod.chpass_chal = chal;
			mod.chpass_solution = solution;
		}

		var mod_super = APP.mod['super'];
		if (!mod_super)
			APP.loadModule ('super', super_set_chpass);
		else {
			super_set_chpass (mod_super);
			mod_super.reset ();
		}
	}

	function login_enter () {
		APP.switchSection (ui.section_enter);

		APP.charp.credentialsSet (null, null, null);

		APP.later (function () {
			if (ui.section_enter.is (':hidden')) return true;
			ui.enter_username.focus ();
		});

		ui.enter_username.val ('');
		ui.enter_pass.val ('');

		ui.enter_submit.button ('enable');
	}

	function login_enter_submit (form, evt) {
		evt.originalEvent.preventDefault ();

		ui.enter_submit.button ('disable');
		
		var login = ui.enter_username.val ();
		var pass = ui.enter_pass.val ();

		mod.loginTry (APP.charp, login, pass, login_success, login_error);
	}

	function set_credentials (charp, login, pass, salt) {
		pass = mod.passwordHash (pass, salt);
		charp.credentialsSet (login, pass, salt);
	}

	function login_error (err, ctx) {
		ui.enter_submit.button ('enable');

		if (err.key == 'SQL:REPFAIL')
			ui.enter_pass.focus ();
		else
			ui.enter_username.focus ();

		return mod.loginErrorHandler (err, ctx);
	}

	function login_configure_terminal (info) {
		APP.terminal.id = info.terminal_id;
		APP.terminal.name = info.name;
		APP.terminal.shiftUser = info.shift_user;

		APP.mod.devices.setQzCredentials (info.qz_private_key, info.qz_certificate);
	}

	function login_success (is_first) {
		mod.isFirst = is_first;
		mod.isLoggedIn = true;

		APP.charp.request ('this_terminal_info_get', [],
						   {
							   asObject: true,
							   success: login_configure_terminal
						   });

		APP.charp.request ('this_user_types_get', [],
						   {
							   asObject: true,
							   success: function (types) {
								   mod.userTypes = types;
								   // Since an user can be more than one, the order is important.
								   if (types.maintenance) {
									   APP.loadModule ('maint');
									   return;
								   }
								   if (types.supervisor) {
									   APP.loadModule ('super');
									   return;
								   }
								   if (types.cashier) {
									   APP.loadModule ('cash');
									   return;
								   }
							   }
						   });
	}

	function login_reset () {
		mod.isFirst = false;
		mod.isLoggedIn = false;
		
		APP.history.setHome (null);
		APP.history.clear ();

		APP.switchPage (MOD_NAME);

		login_enter ();
	}

	var mod = {
		userTypes: {},
		isFirst: false,
		isLoggedIn: false,

		passwordHash: function (pass, salt) {
			if (pass.indexOf (salt) == 0)
				return pass;
			return dcodeIO.bcrypt.hashSync (pass, salt);
		},

		loginTry: function (charp, login, clear_pass, success_cb, error_cb) {
			function auth_try (salt) {
				set_credentials (charp, login, clear_pass, salt);
				charp.request ('log_in', [], 
							   { 
								   success: success_cb,
								   error: error_cb
							   });
			}

			APP.charp.request ('salt_get', [login],
							   {
								   asAnon: true,
								   success: auth_try,
								   error: error_cb
							   });
		},

		loginErrorHandler: function (err, ctx) {
			switch (err.key) {
			case 'SQL:USERDIS':
				APP.msgDialog ({
					icon: 'no',
					desc: 'Este usuario se encuentra deshabilitado.',
					sev: CHARP.ERROR_SEV['PERM'],
					title: 'Usuario deshabilitado',
					opts: { width: '75%' }
				});
				return;
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
		},

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
			if (mod.isLoggedIn)
				APP.charp.request ('log_out', [], login_reset);
			else
				login_reset ();
		}
	};

	APP.addModule (MOD_NAME, mod);
}) ();
