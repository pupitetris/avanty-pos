// This file is part of Microsafe AVANTY. -*- tab-width: 4; -*-
//
// Copyright © 2017 Microsafe, S.A. de C.V.
// Derechos Reservados (R) 2017 Microsafe, S.A. de C.V.

(function () {
	var MOD_NAME = 'cash';

	var ui = {};
	var shell;

	function obj_search (obj, path) {
		if (!path)
			return obj;

		var idx;
		while ((idx = path.indexOf ('.')) >= 0) {
			var key = path.substr (0, idx);
			if (!obj.hasOwnProperty (key)) // search failed
				return null;
			obj = obj[key];
			path = path.substr (idx + 1);
		}
		return obj[path];
	}

	function cash_disable_buttons (ids) {
		var prev_state = {};
		for (var id of ids) {
			var ele = obj_search (ui, id);
			prev_state[id] = ele.is (':disabled');
			ele.button ('disabled');
		}
		return prev_state;
	}

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
		validator_options.ignore = '';

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

		shell = APP.shellCreate (ui.sections_parent);

		shell.ui.logout.on ('click', cash_logout);

		shell.ui.park_entry = $('#cash-tab-park-entry');
		shell.ui.park_entry.on ('click', cash_park_entry);

		shell.ui.park_exit = $('#cash-tab-park-exit');
		shell.ui.park_exit.on ('click', cash_park_exit);

		shell.ui.rent_entry = $('#cash-tab-rent-entry');
		shell.ui.rent_exit = $('#cash-tab-rent-exit');
		shell.ui.rent_search = $('#cash-tab-rent-search');
		shell.ui.rent_create = $('#cash-tab-rent-create');

		shell.ui.user_shift_begin = $('#cash-tab-user-shift-begin');
		shell.ui.user_shift_begin.on ('click', cash_shift_begin);

		shell.ui.user_shift_end = $('#cash-tab-user-shift-end');

		shell.ui.username = shell.ui.shell.find ('.username');

		ui.section_main = $('#cash-main');
		ui.section_main.on ('avanty:switchSectionEnter', cash_main_reset);
		ui.section_main.find ('button').button ();

		ui.main_noshift = $('#cash-main-noshift');
		ui.main_noshift.on ('click', cash_shift_begin);

		ui.section_shift_begin = $('#cash-shift-begin');
		ui.section_shift_begin.find ('button').button ();
		ui.section_shift_begin.find ('input').input ();

		ui.shift_begin_form = ui.section_shift_begin.find ('form');
		ui.shift_begin_form.validate ({
			submitHandler: cash_shift_begin_submit,
			rules: {
				'shift-begin-amount': { required: true, money: true }
			},
			messages: {
				'shift-begin-amount': { required: 'Escribe 0 (cero) si no hay dotación.' }
			}
		});

		ui.shift_begin_amount = ui.section_shift_begin.find ('input[name="shift-begin-amount"]');
		ui.shift_begin_submit = ui.section_shift_begin.find ('button');

		ui.section_park_exit = $('#cash-park-exit');
		ui.section_park_exit.find ('button').button ();
		ui.section_park_exit.find ('input').input ();

		ui.park_exit_form = ui.section_park_exit.find ('form');
		ui.park_exit_form.validate ({
			submitHandler: cash_park_exit_submit,
			rules: {
				'cash-park-exit-barcode': { required: true, minlength: 15, maxlength: 20, digits: true, barcode: true }
			},
			messages: {
				'cash-park-exit-barcode': { required: 'Selecciona este campo y presenta el ticket al sensor.' }
			}
		});

		ui.park_exit_barcode = ui.section_park_exit.find ('input[name="cash-park-exit-barcode"]');
		ui.park_exit_submit = ui.section_park_exit.find ('button');

		pass_layout_init ('chpass', { submitHandler: cash_chpass_submit });

		ui.tickets = {};
		ui.tickets.entry = $('#cash-ticket-entry');
		ui.tickets.entry_time = ui.tickets.entry.find ('time');
		ui.tickets.entry_terminal = ui.tickets.entry.find ('.term');
		ui.tickets.entry_barcode = ui.tickets.entry.find ('figure');
		APP.later (function () { APP.mod.devices.escposTicketLayout (ui.tickets.entry); });

		$(document).on ('avanty:HID', cash_park_exit_hid);

		mod.loaded = true;
		mod.onLoad ();
	}

	function cash_logout () {
		var desc;
		var icon;
		
		if (APP.terminal.shiftUser == APP.charp.credentialsGet ().login) {
			desc = '<>No has finalizado tu turno.<br /><br />¿Estás seguro que quieres salir?';
			icon = 'shift';
		} else if (APP.history.length () > 0) {
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
				width: '75%',
				open: function() { $(this).siblings('.ui-dialog-buttonpane').find('button:eq(1)').focus(); }
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

		APP.later (function () {
			if (ui.section_chpass.is (':hidden')) return true;
			ui.chpass_orig_pass.focus ();
		});
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
		APP.toast ('Contraseña cambiada con éxito.');
		if (APP.mod.login.is_first) {
			// End of first login exception. Restore and go back to main screen.
			APP.mod.login.is_first = false;
			ui.chpass_title.text (chpass_title);
			cash_main ();
		} else
			APP.history.back ();
	}

	function cash_park_entry () {
		var ticket = {
			terminalId: APP.terminal.id,
			entryDate: new Date ()
		}

		var barcode = APP.mod.barcode.generate (ticket);

		ui.tickets.entry_time.text (ticket.entryDate.toLocaleString ());
		ui.tickets.entry_terminal.text (APP.terminal.name);
		ui.tickets.entry_barcode.attr ('data-chars', barcode);

		APP.mod.devices.escposTicketLayout (ui.tickets.entry);
		APP.mod.devices.print (ui.tickets.entry);
	}

	function cash_park_exit () {
		APP.history.go (MOD_NAME, ui.section_park_exit, 'cash-park-exit');
		shell.backShow ();

		ui.park_exit_form.validate ().resetForm ();
		ui.park_exit_barcode.val ('');
		ui.park_exit_submit.button ('enable');

		APP.later (function () {
			if (ui.section_park_exit.is (':hidden')) return true;
			ui.park_exit_barcode.focus ();
		});
	}

	function cash_park_exit_hid (evt, str) {
		cash_park_exit ();

		APP.later (function () {
			if (ui.section_park_exit.is (':hidden')) return true;

			if (str.substr (str.length - 1, 1) == '\r') {
				str = str.substr (0, str.length - 1);
				ui.park_exit_barcode.val (str);
				ui.park_exit_form.trigger ('submit');
			} else
				ui.park_exit_barcode.val (str);
		});
	}

	function cash_park_exit_submit (form, evt) {
		if (evt.originalEvent) evt.originalEvent.preventDefault ();

		ui.park_exit_submit.button ('disable');
		var barcode_fields = APP.mod.barcode.parse (ui.park_exit_barcode.val ());
		// aplicar tarifa.
		1;
	}

	function cash_main_reset () {
		shell.ui.status.text ('');
		ui.section_main.children ('div').hide ();
		if (!APP.terminal.shiftUser) {
			// No shift is started in this terminal. Recommend user to start his shift.
			shell.ui.user_shift_begin.button ('enable');
			shell.ui.shell.find ('button.requires-shift').button ('disable');
			ui.main_noshift.show ();
		} else if (APP.terminal.shiftUser != APP.charp.credentialsGet ().login) {
			// There's a shift running for another user. Can't operate nor start shift.
			shell.ui.user_shift_begin.button ('disable');
			shell.ui.shell.find ('button.requires-shift').button ('disable');
			ui.main_othershift.show ();
		} else {
			// Our shift is running.
			shell.ui.status.text ('Turno iniciado.');

			// Can't begin it again, right?
			shell.ui.user_shift_begin.button ('disable');

			// Enable shift-dependent actions.
			shell.ui.shell.find ('button.requires-shift').button ('enable');

			// Open the menu to save the user from this chore.
			shell.menuCollapse (false);

			// Listen to any keyboard input sent from HID devices:
			APP.hidHandlerStart ();
		}
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

		cash_main_reset ();
	}

	function cash_shift_begin () {
		APP.history.go (MOD_NAME, ui.section_shift_begin, 'cash-shift-begin');
		shell.backShow ();

		APP.later (function () {
			if (ui.section_shift_begin.is (':hidden')) return true;
			ui.shift_begin_amount.focus ();
		});
	}

	function cash_shift_begin_submit (form, evt) {
		evt.originalEvent.preventDefault ();

		ui.shift_begin_submit.button ('disable');

		var amount = Math.floor (ui.shift_begin_amount.val () * 100);
		APP.charp.request ('cashier_shift_begin', [amount],
						   {
							   success: cash_shift_begin_success,
							   error: cash_shift_begin_error
						   });
	}

	function cash_shift_begin_success () {
		var amount = ui.shift_begin_amount.val ();
		var suffix = (parseFloat (amount) == 0)? 'sin dotación.': 'con <s/>' + amount + ' de dotación.';
		APP.toast ('Se inició el turno ' + suffix);

		APP.terminal.shiftUser = APP.charp.credentialsGet ().login;
		cash_main_reset ();

		APP.history.back ();
		shell.backShow ();

		ui.shift_begin_submit.button ('enable');
		ui.shift_begin_amount.val ('');
	}

	function cash_shift_begin_error () {
		ui.shift_begin_submit.button ('enable');
		ui.shift_begin_amount.focus ();
		return true;
	}

	var mod = {
		init: function () {
			mod.initialized = true;
			APP.loadModule ('barcode');
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
			var cred = APP.charp.credentialsGet ();
			shell.ui.username.text (cred.login);
			cash_main ();
		}
	};

	APP.addModule (MOD_NAME, mod);
}) ();
