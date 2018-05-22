// This file is part of Microsafe AVANTY. -*- tab-width: 4; -*-
//
// Copyright © 2017 Microsafe, S.A. de C.V.
// Derechos Reservados (R) 2017 Microsafe, S.A. de C.V.

(function () {
	var MOD_NAME = 'super_users';

	var super_is_first; // True when supervisor creation is required, right after activation.

	var ui = {};
	var shell;

	function newuser_layout_init (name, validator_options, ctx) {
		shell = APP.mod['super'].shell;

		var section = ui['section_' + name] = $('#super-' + name);
		
		section.find ('button').button ();

		var form = ui[name + '_form'] = section.find ('form');

		var login = ui[name + '_login'] = section.find ('input[name="' + name + '-login"]');
		login.input ();

		var pass = ui[name + '_pass'] = section.find ('input[name="' + name + '-pass"]');
		pass.input ();

		var pass2 = ui[name + '_pass2'] = section.find ('input[name="' + name + '-pass2"]');
		pass2.input ();

		ui[name + '_submit'] = section.find ('button[type="submit"]');

		var stype = ui.section_newuser.find ('select[name="newuser-type"]');
		if (stype.length > 0) {
			ui[name + '_type'] = stype;
			stype.selectmenu (
				{
					appendTo: ui.section_newuser,
					change: function () {
						form.validate ().element (this);
						if (val.length > 0)
							$(this).next ().next ().removeClass ('error');
						else
							$(this).next ().next ().addClass ('error');
					}
				});
			ui[name + '_type_combo'] = stype.next ();
		}

		var cancel = section.find ('button[type="button"]');
		if (cancel.length > 0) {
			ui[name + '_cancel'] = cancel;
			cancel.on ('click', function () { shell.backGo (); });
		}

		form.attr ('autocomplete', 'off');

		if (!ctx) {
			ctx = {
				modify_passwd: yes
			};
		}
		ctx.other_pass = pass;

		var rules = {};

		rules[name + '-login'] = {
			required: true,
			maxlength: 255,
			'validate-login': true
		};
		rules[name + '-pass'] = {
			required: true,
			passwd: ctx,
			minlength: 8,
			maxlength: 255
		};
		rules[name + '-pass2'] = {
			'pass-confirm': ctx
		};
		rules[name + '_type'] = {
			required: true
		};

		validator_options.rules = rules;
		validator_options.ignore = '';

		form.validate (validator_options);
	}

	function layout_init () {
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

		newuser_layout_init ('super_chpass', { submitHandler: super_chpass_submit });
		ui.super_chpass_cancel = ui.section_super_chpass.find ('button[type="button"]');
		ui.super_chpass_cancel.button ();
		ui.super_chpass_cancel.on ('click', super_chpass_finish);

		ui.section_moduser = $('#super-moduser');
		ui.moduser = {};
		ui.moduser.form = ui.section_moduser.find ('form');
		ui.moduser.remove = ui.moduser.form.find ('button[name="remove"]');
		ui.moduser.remove.on ('click', super_modify_users_remove);
		ui.moduser.edit = ui.moduser.form.find ('button[name="edit"]');
		ui.moduser.edit.on ('click', super_modify_users_edit);
		ui.moduser.cancel = ui.moduser.form.find ('button[name="cancel"]');
		ui.moduser.form.find ('button').button ();

		ui.moduser.select = $('#super-usermod-select');
		ui.moduser.select.avaSelect ();
		ui.moduser.select.on ('avanty:optionSelect',
							  function (evt, option, selected) {
								  var num_selected = $(this).find ('.selected').length;
								  if (num_selected > 1)
									  ui.moduser.edit.button ('disable');
								  else
									  ui.moduser.edit.button ('enable');
							  });

		newuser_layout_init ('edituser', { submitHandler: super_edit_user });

		mod.loaded = true;
		mod.onLoad ();
	}

	function super_create_super () {
		APP.switchSection (ui.section_newsuper);

		if (super_is_first)
			shell.show (false);
		else
			shell.show ();

		ui.newsuper_form.validate ().resetForm ();
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

		APP.charp.request ('supervisor_create', [login, pass],
						   {
							   asAnon: true,
							   success: function () { super_create_super_success (login); },
							   error: function () { ui.newsuper_submit.button ('enable'); return true; }
						   });
	}

	function super_create_super_success (login) {
		APP.toast ('Usuario <i> ' + login + ' </i> creado con éxito.');
		APP.loadModule ('login');
	}

	function super_modify_users_populate () {
		APP.charp.request ('supervisor_get_users', [],
						   {
							   success: function (users) {
								   ui.moduser.select.empty ();
								   for (var user of users) {
									   var option = $('<div>' + user.login + '</div>').avaOption ({ value: user.id });
									   ui.moduser.select.append (option);
								   }
							   }
						   });
	}

	function super_modify_users_remove_confirm (selected) {
		var user_ids = [];
		selected.each (function (i, ele) { user_ids.push ($(ele).avaOption ('value')); });
		APP.charp.request ('supervisor_delete_users', [user_ids], super_modify_users_populate);
	}

	function super_modify_users_remove () {
		var selected = ui.moduser.select.find ('.selected');
		if (selected.length == 0)
			return;
		
		desc = (selected.length == 1)?
			'<>Se va a eliminar un usuario.':
			'<>Se van a eliminar ' + selected.length + ' usuarios.';
		desc += '<br />¿Estás seguro que quieres proceder?';

		APP.msgDialog ({
			icon: 'question',
			desc: desc,
			title: '¿Eliminar usuarios?',
			opts: {
				buttons: {
					'Sí, eliminar': function () { super_modify_users_remove_confirm (selected); },
					'Cancelar': null
				},
				width: '75%'
			}
		});
	}

	function super_modify_users () {
		APP.history.go ('super', ui.section_moduser, 'super-mod-user');
		shell.navShow ();
		shell.menuCollapse ();

		super_modify_users_populate ();
	}

	function super_modify_users_edit () {
	}

	function super_edit_user () {
		var selected = ui.moduser.select.find ('.selected');
		if (selected.length != 1)
			return;
		
		var user_id = selected.avaOption ('value');
		APP.charp.request ('supervisor_get_user_info', [user_id],
						   {
							   asObject: true,
							   success: function (user) {
								   APP.history.go ('super', ui.section_moduser, 'super-mod-user');
								   shell.navShow ();
							   }
						   });
	}

	function super_create_user () {
		APP.history.go ('super', ui.section_newuser, 'super-create-user');
		shell.navShow ();
		shell.menuCollapse ();

		ui.newuser_form.validate ().resetForm ();
		ui.newuser_login.val ('');
		ui.newuser_pass.val ('');
		ui.newuser_pass2.val ('');
		ui.newuser_type.val ('');
		ui.newuser_type.selectmenu ('refresh');
		ui.newuser_type_combo.removeClass ('error');
		ui.newuser_submit.button ('enable');
		ui.newuser_login.focus ();
	}

	function super_create_user_submit (form, evt) {
		evt.originalEvent.preventDefault ();

		ui.newuser_submit.button ('disable');

		var login = ui.newuser_login.val ();
		var pass = ui.newuser_pass.val ();
		var type = ui.newuser_type.val ();

		APP.charp.request ('user_create', [login, pass, type],
						   {
							   success: function () { super_create_user_success (login); },
							   error: super_create_user_error
						   });
	}

	function super_create_user_success (login) {
		APP.toast ('Usuario <i> ' + login + ' </i> creado con éxito.');
		shell.backGo ();
	}

	function super_create_user_error (err, ctx) {
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

	function super_chpass_submit (form, evt) {
		evt.originalEvent.preventDefault ();

		ui.super_chpass_submit.button ('disable');
		ui.super_chpass_cancel.button ('disable');

		var login = ui.super_chpass_login.val ();
		var pass = ui.super_chpass_pass.val ();

		var args = [login, pass];
		var as_anon = false;
		if (mod.chpass) {
			args.push (mod.chpass_chal, mod.chpass_solution);
			as_anon = true;
			delete mod.chpass_chal;
			delete mod.chpass_solution;
		}

		APP.charp.request ('user_password_change', args,
						   {
							   asAnon: as_anon,
							   success: function () { super_chpass_success (login); },
							   error: function (err) { return super_chpass_error (err, login); }
						   });
	}

	function super_chpass_error (err, login) {
		// In login chpass mode, user can only afford one error because of the one-time challenge.
		if (mod.chpass)
			super_chpass_finish ();

		ui.super_chpass_submit.button ('enable');
		ui.super_chpass_cancel.button ('enable');

		switch (err.key) {
		case 'SQL:USERUNK':
		case 'SQL:NOTFOUND':
			APP.msgDialog ({
				icon: 'no',
				desc: '<>El usuario con nombre <i>' + login + '</i> no existe.',
				sev: CHARP.ERROR_SEV['USER'],
				title: 'Usuario no existe',
				opts: { width: '75%' }
			});
			return;
		}
		return true;
	}

	function super_chpass_success (login) {
		APP.toast ('Contraseña para <i> ' + login + ' </i> cambiada con éxito.');
		super_chpass_finish ();
	}

	function super_chpass_finish () {
		if (mod.chpass) {
			mod.chpass = false;
			APP.loadModule ('login');
		} else {
			APP.history.back ('super-chpass-user', false);
			shell.navShow ();
		}

		ui.super_chpass_submit.button ('enable');
		ui.super_chpass_cancel.button ('enable');
	}

	function super_chpass_user () {
		if (mod.chpass) {
			APP.switchSection (ui.section_super_chpass);
			APP.switchPage ('super');
			shell.show (false);
		} else {
			APP.history.go ('super', ui.section_super_chpass, 'super-chpass-user');
			shell.navShow ();
			shell.show ();
		}

		ui.super_chpass_form.validate ().resetForm ();
		ui.super_chpass_login.val ('');
		ui.super_chpass_pass.val ('');
		ui.super_chpass_pass2.val ('');
		ui.super_chpass_submit.button ('enable');
		ui.super_chpass_cancel.button ('enable');
		ui.super_chpass_login.focus ();
	}

	function super_supervisor_check_created () {
		super_is_first = false;

		var cred = APP.charp.credentialsGet ();
		if (!cred.login) { // we are in activation process
			APP.charp.request ('supervisor_created', [],
							   {
								   asAnon: true,
								   success: super_supervisor_created_success
							   });
			return false;
		}
		return true;
	}

	function super_supervisor_created_success (is_created) {
		APP.hourglass.enable ();
		if (!is_created) {
			// operations supervisor not created. Create one immediately.
			super_is_first = true;
			APP.switchPage ('super');
			super_create_super ();
			return;
		}
		
		// operations supervisor present.
		
		if (mod.chpass) {
			// Login screen is in challenge routine, give the user
			// a dialog to change the password of an account.
			super_chpass_user ();
			return;
		}
		
		// No special mode. Go to login screen.
		APP.loadModule ('login');
	}

	var mod = {
		init: function () {
			mod.initialized = true;
			APP.loadModule ('super', layout_init);
		},

		onLoad: function () {
			if (!mod.loaded)
				return;

			mod.reset ();
		},

		reset: function () {
		},

		createUser: function () {
			super_create_user ();
		},

		checkSupervisorCreated: function () {
			return super_supervisor_check_created ();
		},

		modifyUsers: function () {
			super_modify_users ();
		}
	};

	APP.addModule (MOD_NAME, mod);
}) ();
