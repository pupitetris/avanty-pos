// This file is part of Microsafe AVANTY. -*- tab-width: 4; -*-
//
// Copyright © 2017 Microsafe, S.A. de C.V.
// Derechos Reservados (R) 2017 Microsafe, S.A. de C.V.

(function () {
	var MOD_NAME = 'super';

	var super_is_first; // True when supervisor creation is required, right after activation.

	var ui = {};

	function newuser_layout_init (name, validator_options) {
		var section = ui['section_' + name] = $('#super-' + name);
		
		var login = ui[name + '_login'] = section.find ('input[name="' + name + '-login"]');
		login.input ();

		var pass = ui[name + '_pass'] = section.find ('input[name="' + name + '-pass"]');
		pass.input ();

		var pass2 = ui[name + '_pass2'] = section.find ('input[name="' + name + '-pass2"]');
		pass2.input ();

		var submit = ui[name + '_submit'] = section.find ('button');
		submit.button ();

		var form = ui[name + '_form'] = section.find ('form');
		form.attr ('autocomplete', 'off');

		var rules = {};

		rules[name + '-login'] = {
			required: true,
			maxlength: 255,
			'validate-login': true
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

		form.validate (validator_options);

		// Custom validations:
		pass2.addClass ('validate-pass2');
	}

	function shell_show (show) {
		if (show) {
			ui.sections_parent.addClass ('with-shell');
			ui.shell.show ();
		} else {
			ui.sections_parent.removeClass ('with-shell');
			ui.shell.hide ();
		}
	}

	function layout_init () {
		$.validator.addMethod ('validate-login', function (val, ele) { 
			var re = new RegExp ('^[a-zA-Z0-9_.áéíóúñÁÉÚÍÓÚÑüÜ]+$');
			return re.exec (val);
		}, 'La clave tiene caracteres no válidos.');

		$.validator.addMethod ('validate-pass2', function (val, ele) {
			var pass_name = ele.name.substring (0, ele.name.length - 1).replace ('-', '_');
			var pass = ui[pass_name].val ();
			return pass == val;
		}, 'Las contraseñas deben de coincidir.');

		ui.sections_parent = $('#super-sections');
		ui.section_main = $('#super-main');

		ui.shell = ui.sections_parent.find ('.shell');
		ui.shell_lock = ui.shell.find ('.shell-lock');
		ui.shell_lock.button ();
		ui.shell_lock.on ('click', function () { APP.loadModule ('lock'); });

		ui.shell_menu = ui.shell.find ('.shell-menu');
		ui.shell_menu.tabs ({ collapsible: true });

		ui.shell_menu.find ('button').button ();
		ui.shell_users_create = $('#super-tab-users-create');
		ui.shell_users_create.on ('click', super_create_user);

		newuser_layout_init ('newsuper', { submitHandler: super_create_super_submit });
		newuser_layout_init ('newuser', {
			submitHandler: super_create_user_submit,
			invalidHandler:
				function (form, validator) {
					$.each (validator.errorList,
							function (index, value) {
								if (value.element.nodeName.toLowerCase() == 'select')
									$(value.element).next ('span').addClass ('error');
							}
					)
				}
		});

		ui.newuser_type = ui.section_newuser.find ('select[name="newuser-type"]');
		ui.newuser_type.rules ('add', { required: true });	
		ui.newuser_type.selectmenu (
			{
				appendTo: ui.section_newuser,
				change: function () {
					var val = $(this).val ();
					ui.newuser_form.validate ().element (this);
					if (val.length > 0)
						$(this).next ().next ().removeClass ('error');
					else
						$(this).next ().next ().addClass ('error');
				}
			});

		mod.loaded = true;
		mod.onLoad ();
	}

	var menu_selected = 0;

	function collapse_menu (collapse) {
		if (collapse === true)
			menu_selected = ui.shell_menu.tabs ('option', 'active');
		ui.shell_menu.tabs ('option', 'active', (collapse === false)? menu_selected: false);
	}

	function super_create_user () {
		collapse_menu (true);
		APP.history.go (MOD_NAME, ui.section_newuser, 'super-create-user');
	}

	function super_create_super () {
		APP.switchSection (ui.section_newsuper);

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

	function super_create_user_submit (form, evt) {
		evt.originalEvent.preventDefault ();

		ui.newuser_submit.button ('disable');

		var login = ui.newuser_login.val ();
		var pass = ui.newuser_pass.val ();
		var type = ui.newuser_type.val ();

		APP.charp.request ('user_create', [login, pass, type],
						   {
							   success: function () { super_user_create_user_success (login); },
							   error: super_user_create_user_error
						   });
	}

	function super_user_create_user_error (err, ctx) {
		ui.newuser_submit.button ('enable');
		switch (err.key) {
		case 'SQL:DATADUP':
			APP.msgDialog ({
				icon: 'no',
				desc: 'El nombre de usuario que escogiste ya existe. Prueba con otro nombre de usuaro.',
				sev: CHARP.ERROR_SEV['USER'],
				title: 'Usuario ya existe',
				opts: { width: '75%' }
			});
			return;
		}
		return true;
	}

	function super_user_create_user_success (login) {
		APP.toast ('Usuario <i> ' + login + ' </i> creado con éxito.');
		APP.history.back ();
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

	function super_main_message (msg) {
		ui.super_main_message.html (msg);
	}

	function super_main () {
		APP.history.setHome (MOD_NAME, ui.section_main);
		APP.switchSection (ui.section_main);
		shell_show (true);
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
