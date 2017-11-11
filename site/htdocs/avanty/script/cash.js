// This file is part of Microsafe AVANTY. -*- tab-width: 4; -*-
//
// Copyright © 2017 Microsafe, S.A. de C.V.
// Derechos Reservados (R) 2017 Microsafe, S.A. de C.V.

(function () {
	var MOD_NAME = 'cash';

	var ui = {};
	var shell;
	var forth;

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
			ele.button ('disable');
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
			'pass-confirm': pass
		};

		validator_options.rules = rules;
		validator_options.ignore = '';

		var form = ui[name + '_form'] = section.find ('form');
		form.attr ('autocomplete', 'off');
		form.validate (validator_options);
	}

	function park_charge_layout_init (prefix) {
		var id = prefix.replace (/_/g, '-');

		var section = ui['section_' + prefix + '_charge'] = $('#cash-'+ id + '-charge');
		section.on ('avanty:switchSectionEnter', function () { cash_park_charge_reset (prefix); });
		section.find ('button').button ();
		section.find ('input').input ();

		var form = ui[prefix + '_charge_form'] = section.find ('form');

		var total = ui[prefix + '_charge_total'] = form.find ('.total');

		var rules = {};
		rules['cash-' + id + '-charge-amount'] =
			{
				required: true,
				maxlength: 8,
				'charge-min': total,
				'charge-max': total
			};

		form.validate ({
			submitHandler: function (form, evt) { cash_park_charge_submit (prefix, form, evt); },
			rules: rules
		});

		ui[prefix + '_charge_table'] = form.find ('tbody');
		ui[prefix + '_charge_change'] = form.find ('.change');

		var amount = ui[prefix + '_charge_amount'] = form.find ('input[name="cash-' + id + '-charge-amount"]');
		amount.on ('input', function () { cash_park_charge_amount_input (prefix); });
		amount.on ('change', function () { cash_park_charge_amount_change (prefix); });

		ui[prefix + '_charge_submit'] = form.find ('button[type="submit"]');

		ui[prefix + '_charge_print'] = $('#cash-' + id + '-charge-print');
		ui[prefix + '_charge_print'].on ('click', cash_park_charge_print);

		ui[prefix + '_charge_close'] = $('#cash-' + id + '-charge-close');
		ui[prefix + '_charge_close'].on ('click', function () { cash_park_charge_close ('cash-' + id); });

		ui[prefix + '_charge_detail'] = section.find ('.detail');

		ui[prefix + '_entry_date'] = $('#cash-' + id + '-entry-date');
		ui[prefix + '_charge_date'] = $('#cash-' + id + '-charge-date');
		ui[prefix + '_duration'] = $('#cash-' + id + '-duration');
	}

	function layout_init () {
		ui.sections_parent = $('#cash-sections');

		shell = APP.shellCreate (ui.sections_parent);

		shell.ui.logout.on ('click', cash_logout);

		shell.ui.park_entry = $('#cash-tab-park-entry');
		shell.ui.park_entry.on ('click', cash_park_entry);

		shell.ui.park_exit = $('#cash-tab-park-exit');
		shell.ui.park_exit.on ('click', cash_park_exit);

		shell.ui.park_lost = $('#cash-tab-park-lost');
		shell.ui.park_lost.on ('click', cash_park_lost);

		shell.ui.rent_entry = $('#cash-tab-rent-entry');
		shell.ui.rent_exit = $('#cash-tab-rent-exit');
		shell.ui.rent_search = $('#cash-tab-rent-search');
		shell.ui.rent_create = $('#cash-tab-rent-create');

		shell.ui.user_chpass = $('#cash-tab-user-chpass');
		shell.ui.user_chpass.on ('click', cash_chpass);

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
		ui.section_park_exit.on ('avanty:switchSectionEnter', cash_park_exit_reset);
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

		park_charge_layout_init ('park_exit');

		ui.section_park_lost = $('#cash-park-lost');
		ui.section_park_lost.on ('avanty:switchSectionEnter', cash_park_lost_reset);
		ui.section_park_lost.find ('button').button ();

		ui.park_lost_form = ui.section_park_lost.find ('form');
		ui.park_lost_form.on ('submit', cash_park_lost_submit);

		ui.park_lost_date = $('#cash-park-lost-date');
		ui.park_lost_date.datepicker (
			{
				maxDate: 0,
				firstDay: APP.config.weekFirstDay
			});

		ui.park_lost_submit = ui.section_park_lost.find ('button[type="submit"]');

		park_charge_layout_init ('park_lost');

		// ui.section_chpass is defined inside here:
		pass_layout_init ('chpass', { submitHandler: cash_chpass_submit });
		ui.section_chpass.on ('avanty:switchSectionEnter', cash_chpass_reset);

		ui.tickets = {};
		ui.tickets.entry = $('#cash-ticket-entry');
		ui.tickets.entry_time = ui.tickets.entry.find ('time');
		ui.tickets.entry_terminal = ui.tickets.entry.find ('.term');
		ui.tickets.entry_barcode = ui.tickets.entry.find ('figure');

		ui.tickets.exit = $('#cash-ticket-exit');
		ui.tickets.exit_entry_time = ui.tickets.exit.find ('time:eq(0)');
		ui.tickets.exit_charge_time = ui.tickets.exit.find ('time:eq(1)');
		ui.tickets.exit_duration = ui.tickets.exit.find ('time:eq(2)');
		ui.tickets.exit_terminal = ui.tickets.exit.find ('.term');
		ui.tickets.exit_items = ui.tickets.exit.find ('.items');

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

	function cash_chpass () {
		if (APP.mod.login.isFirst) {
			// This is the first login for the user. Setup page accordingly.
			chpass_title = ui.chpass_title.text ();
			ui.chpass_title.text ('Establece una contraseña propia');
			shell.show (false);
			APP.switchSection (ui.section_chpass);
		} else {
			ui.chpass_orig_pass.val ('');
			ui.chpass_pass.val ('');
			ui.chpass_pass2.val ('');
			ui.chpass_submit.button ('enable');

			APP.history.go (MOD_NAME, ui.section_chpass, 'cash-change-password');
			shell.navShow ();
			shell.menuCollapse ();
		}
	}

	function cash_chpass_reset () {
		ui.chpass_form.validate ().resetForm ();
		
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
		ui.chpass_orig_pass.val ('');
		ui.chpass_pass.val ('');
		ui.chpass_pass2.val ('');

		APP.toast ('Contraseña cambiada con éxito.');
		if (APP.mod.login.isFirst) {
			// End of first login exception. Restore and go back to main screen.
			APP.mod.login.isFirst = false;
			ui.chpass_title.text (chpass_title);
			cash_main ();
		} else
			shell.backGo ();
	}

	function cash_park_entry () {
		var barcode_fields = {
			terminalId: APP.terminal.id,
			entryDate: new Date ()
		}

		var barcode = APP.mod.barcode.generate (barcode_fields);

		ui.tickets.entry_time.text (barcode_fields.entryDate.toLocaleString ());
		ui.tickets.entry_terminal.text (APP.terminal.name);
		ui.tickets.entry_barcode.attr ('data-chars', barcode);

		APP.mod.devices.escposTicketLayout (ui.tickets.entry);
		APP.mod.devices.print (ui.tickets.entry);
	}

	function cash_park_exit () {
		ui.park_exit_barcode.val ('');

		APP.history.go (MOD_NAME, ui.section_park_exit, 'cash-park-exit');
		shell.navShow ();
		shell.menuCollapse ();
	}

	function cash_park_exit_reset () {
		ui.park_exit_form.validate ().resetForm ();
		if (ui.park_exit_barcode.val () != '')
			ui.park_exit_barcode.select ();

		APP.later (function () {
			if (ui.section_park_exit.is (':hidden')) return true;
			ui.park_exit_barcode.focus ();
		});
	}

	function cash_park_exit_hid (evt, str) {
		APP.history.back ('cash-park-exit', false);
		shell.navShow ();

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

	function cash_forth_error (error) {
		console.error (error);

		APP.msgDialog ({
			icon: 'error',
			desc: 'Falla interna al evaluar tarifa.',
			msg: error,
			sev: CHARP.ERROR_SEV['INTERNAL'],
			title: 'Falla en tarifa',
			opts: { width: '75%' }
		});
	}

	function cash_park_exit_submit (form, evt) {
		if (evt.originalEvent) evt.originalEvent.preventDefault ();

		forth.reset (cash_park_exit_charge, cash_forth_error);
	}

	var cash_charge_date;
	var cash_entry_date;

	function cash_park_exit_charge () {
		var barcode_fields = APP.mod.barcode.parse (ui.park_exit_barcode.val ());

		function check_error (err) {
			if (err.key == 'SQL:DATADUP') { // ticket already charged
				APP.msgDialog ({
					icon: 'no',
					desc: 'El ticket que presentó ya fue cobrado con anterioridad.',
					sev: CHARP.ERROR_SEV['USER'],
					title: 'Ticket ya procesado',
					opts: { width: '75%' }
				});
				return;
			}
			return true;
		}

		function check_success () {
			var delta_secs = APP.Util.getTimeSecs (cash_charge_date) - APP.Util.getTimeSecs (cash_entry_date);

			ui.park_exit_entry_date.text (barcode_fields.entryDate.toLocaleString ());
			ui.park_exit_charge_date.text (cash_charge_date.toLocaleString ());

			ui.tickets.exit_entry_time.text (barcode_fields.entryDate.toLocaleString ());
			ui.tickets.exit_charge_time.text (cash_charge_date.toLocaleString ());
			ui.tickets.exit_terminal.text (APP.terminal.name);

			var duration = delta_secs;
			var segs = duration % 60;
			duration = (duration - segs) / 60;
			var mins = duration % 60;
			duration = (duration - mins) / 60;
			var hrs = duration % 24;
			duration = (duration - hrs) / 24;
			var days = duration % 7;
			var weeks = (duration - days) / 7;

			duration =
				((weeks > 0)? weeks + ' semanas ': '') +
				((days > 0)? days + ' días ': '') +
				((hrs > 0)? hrs + ' hr. ': '') +
				mins + ' mins. ' + segs + ' seg.';

			ui.park_exit_duration.text (duration);
			ui.tickets.exit_duration.text (duration);

			var cons = {
				tiempo_registrado: delta_secs,
			};

			forth.setConstants (cons, cash_forth_error);
			forth.load ('test.fth',
						function (script) { cash_park_charge_rate ('park_exit', script, 'cash-park-exit'); },
						cash_forth_error);
		}

		cash_entry_date = barcode_fields.entryDate;
		cash_charge_date = new Date ();

		// Before displaying, register on DB that we will start charging. Optionally, if the ticket has
		// already been charged, an error will rise.
		APP.charp.request ('cashier_park_charge_check', [barcode_fields.terminalId, barcode_fields.entryDate],
						   {
							   success: check_success,
							   error: check_error
						   });
	}

	function cash_park_charge_rate (prefix, script, process) {
		// Run script and Update rate stuff
		var res = forth.run (script, cash_forth_error);

		if (!res)
			return;

		// convert to 2D array.
		var records = res.output.join ('').replace (/\n$/, '').split ('\n')
			.map (function (s) {
				return s.split (/ *\| */)
					.map (function (e, i) {
						return (i==0)? e: parseInt (e);
					})});

		// Manage CANCEL directive.
		for (var i = 0; i < records.length; i++)
			if (records[i][0] == '__CANCEL__') {
				records.splice (0, i + 1);
				i = -1;
			}
		
		ui[prefix + '_charge_table'].empty ();
		var pre = '';
		var total = 0;
		for (var rec of records) {
			var subtotal = rec[1] * rec[2];
			total += subtotal;

			pre += '<div class="desc">' + APP.Util.padString (rec[0], 30) + '</div>\n' +
				'<div class="sum">' + rec[2] + ' x ' +
				APP.Util.asMoney (rec[1]) + ' = ' +
				APP.Util.padString (APP.Util.asMoney (subtotal), 6) + '</div>\n';

			ui[prefix + '_charge_table'].append ($('<tr>' +
												'<th><span>' + rec[0] + '</span></th>' +
												'<td><s/></td><td class="money">' + APP.Util.asMoney (rec[1]) + '</td>' +
												'<td class="qty">' + rec[2] + '</td>' +
												'<td><s/></td><td class="money"><span>' + APP.Util.asMoney (subtotal) + '</span></td>' +
												'</tr>'));
		}

		total = APP.Util.asMoney (total);
		pre += '<div class="sum">Total = ' + APP.Util.padString (total, 6) + '</div>';
		ui.tickets.exit_items.html (pre);
		ui[prefix + '_charge_total'].text (total);

		ui[prefix + '_charge_amount'].val ('');

		APP.mod.devices.escposTicketLayout (ui.tickets.exit);

		APP.history.go (MOD_NAME, ui['section_' + prefix + '_charge'], process);
		shell.navShow ();
	}

	// Canonize value to include cents if none were introduced.
	function cash_park_charge_amount_change (prefix) {
		var amount = APP.Util.parseMoney (ui[prefix + '_charge_amount'].val ());
		ui[prefix + '_charge_amount'].val (APP.Util.asMoney (amount));
	}

	function cash_park_charge_amount_input (prefix) {
		var total = APP.Util.parseMoney (ui[prefix + '_charge_total'].text ());
		var amount = APP.Util.parseMoney (ui[prefix + '_charge_amount'].val ());
		var change = amount - total;
		ui[prefix + '_charge_change'].text ((change < 0)? '-.--': APP.Util.asMoney (change));
	}

	function cash_park_charge_reset (prefix) {
		ui[prefix + '_charge_form'].validate ().resetForm ();
		ui[prefix + '_charge_amount'].input ('enable');
		ui[prefix + '_charge_submit'].button ('enable');
		ui[prefix + '_charge_print'].button ('disable');
		ui[prefix + '_charge_close'].button ('disable');

		APP.later (function () {
			if (ui['section_' + prefix + '_charge'].is (':hidden')) return true;
			ui[prefix + '_charge_amount'].focus ();
		});
	}

	function cash_park_charge_submit (prefix, form, evt) {
		evt.originalEvent.preventDefault ();

		var ui_amount = ui[prefix + '_charge_amount'];
		if (ui_amount.is (':disabled')) // avoid re-submitting.
			return false;

		var ui_submit = ui[prefix + '_charge_submit'];

		ui_amount.input ('disable');
		ui_submit.button ('disable');

		var amount = APP.Util.parseMoney (ui_amount.val ());
		var change = APP.Util.parseMoney (ui[prefix + '_charge_change'].text ());
 		
		var rate_name;
		var ticket_type;

		switch (prefix) {
		case 'park_exit':
			rate_name = APP.config.defaultRateName;
			ticket_type = 'exit';
			break;
		case 'park_lost':
			rate_name = APP.config.lostRateName;
			ticket_type = 'lost';
			break;
		}

		APP.charp.request ('cashier_park_charge',
						   [ cash_entry_date, cash_charge_date, ticket_type, rate_name, 'tender', amount, change, null ],
						   {
							   success: function () { cash_park_charge_success (prefix); },
							   error: function () {
								   ui_submit.button ('enable');
								   ui_amount.input ('enable');
								   return true;
							   }
						   });
	}

	function cash_park_charge_success (prefix) {
		APP.hidHandlerStart ();
		ui[prefix + '_charge_print'].button ('enable');
		ui[prefix + '_charge_close'].button ('enable');
	}

	function cash_park_charge_print () {
		APP.mod.devices.print (ui.tickets.exit);
	}

	function cash_park_charge_close (process) {
		APP.history.back (process);
		shell.navShow ();
		shell.menuCollapse (false);
	}

	function cash_park_lost () {
		APP.history.go (MOD_NAME, ui.section_park_lost, 'cash-park-lost');
		shell.navShow ();
		shell.menuCollapse ();
	}

	function cash_park_lost_reset () {
	}

	function cash_park_lost_submit (evt) {
		if (evt) evt.preventDefault ();

		forth.reset (cash_park_lost_charge, cash_forth_error);
	}

	function cash_park_lost_charge () {
		cash_entry_date = ui.park_lost_date.datepicker ('getDate');
		cash_charge_date = new Date ();

		var cons = {
			fecha_ingreso: APP.Util.getTimeSecs (cash_entry_date),
			ahora: APP.Util.getTimeSecs ()
		};

		forth.setConstants (cons, cash_forth_error);
		forth.load ('test-perdido.fth',
					function (script) { cash_park_charge_rate ('park_lost', script, 'cash-park-lost'); },
					cash_forth_error);

		// The entry date comes from the date picker without HMS, so we set those of the
		// charge date so that it is unique when it goes into the database. Otherwise, you
		// would only be able to charge one lost ticket per day.
		cash_entry_date.setHours (cash_charge_date.getHours ());
		cash_entry_date.setMinutes (cash_charge_date.getMinutes ());
		cash_entry_date.setSeconds (cash_charge_date.getSeconds ());
	}

	function cash_main () {
		if (APP.mod.login.isFirst) {
			// This is the first login for the user. Force a password change.
			cash_chpass ();
			return;
		}

		shell.show (true);
		shell.navShow ();

		APP.history.setHome (MOD_NAME, ui.section_main);
		APP.switchSection (ui.section_main);
	}

	function cash_main_reset () {
		shell.setStatus ('');
		ui.section_main.children ('div').hide ();

		shell.setStatus (APP.config.establishment +
						 ' Versión: ' + APP.config.version +
						 ' Terminal: ' + APP.terminal.name, true);

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
			shell.setStatus ('Turno iniciado.');

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

	function cash_shift_begin () {
		APP.history.go (MOD_NAME, ui.section_shift_begin, 'cash-shift-begin');
		shell.navShow ();

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

		shell.backGo ();

		ui.shift_begin_submit.button ('enable');
		ui.shift_begin_amount.val ('');
	}

	function cash_shift_begin_error (err) {
		ui.shift_begin_submit.button ('enable');
		ui.shift_begin_amount.focus ();
		if (err.key == 'SQL:DATADUP') {
			APP.msgDialog ({
				icon: 'shift',
				desc: 'Finaliza tu turno en la otra terminal para poder iniciar otro aquí.',
				sev: CHARP.ERROR_SEV['USER'],
				title: 'Turno sin finalizar en otra terminal',
				opts: { width: '75%' }
			});
			return;
		}
		return true;
	}

	var mod = {
		init: function () {
			mod.initialized = true;
			APP.loadModule ('barcode');
			APP.loadModule ('forth', function (mod) { forth = mod; });
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
