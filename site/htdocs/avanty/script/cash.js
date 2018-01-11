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

		var submit = ui[name + '_submit'] = section.find ('button[type="submit"]');
		submit.button ();

		var cancel = section.find ('button[type="button"]');
		if (cancel.length > 0) {
			ui[name + '_cancel'] = section.find ('button[type="button"]');
			cancel.button ();
		}

		ui[name + '_title'] = section.find ('h2');

		var rules = {};

		rules['orig-pass'] = {
			required: true,
		};
		rules[name + '-pass'] = {
			required: true,
			passwd: true,
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
		var process = 'cash-' + id;

		var section = ui['section_' + prefix + '_charge'] = $('#cash-'+ id + '-charge');
		section.on ('avanty:switchSectionEnter', function () { cash_park_charge_reset (prefix); });
		section.find ('button').button ();
		section.find ('input').input ();

		var form = ui[prefix + '_charge_form'] = section.find ('form');

		var total = ui[prefix + '_charge_total'] = form.find ('.total');

		var rules = {};
		rules['cash-' + id + '-charge-received'] =
			{
				required: true,
				maxlength: 8,
				'charge-min': total,
				'charge-max': total
			};

		form.validate ({
			submitHandler: function (form, evt) { cash_park_charge_submit (process, prefix, form, evt); },
			rules: rules
		});

		ui[prefix + '_charge_table'] = form.find ('tbody');
		ui[prefix + '_charge_change'] = form.find ('.change');

		var received = ui[prefix + '_charge_received'] = form.find ('input[name="cash-' + id + '-charge-received"]');
		received.on ('input', function () { cash_park_charge_received_input (prefix); });
		received.on ('change', function () { cash_park_charge_received_change (prefix); });

		ui[prefix + '_charge_submit'] = form.find ('button[type="submit"]');

		ui[prefix + '_charge_print'] = $('#cash-' + id + '-charge-print');
		ui[prefix + '_charge_print'].on ('click', cash_park_charge_print);

		ui[prefix + '_charge_close'] = $('#cash-' + id + '-charge-close');
		ui[prefix + '_charge_close'].on ('click', function () { cash_park_charge_close (process); });
		ui[prefix + '_charge_close_html'] = ui[prefix + '_charge_close'].html ();

		ui[prefix + '_charge_detail'] = section.find ('.detail');

		ui[prefix + '_entry_date'] = $('#cash-' + id + '-entry-date');
		ui[prefix + '_charge_date'] = $('#cash-' + id + '-charge-date');
		ui[prefix + '_duration'] = $('#cash-' + id + '-duration');
	}

	function layout_tickets () {
		ui.tickets = {};
		ui.tickets.entry = $('#cash-ticket-entry');
		ui.tickets.entry_time = ui.tickets.entry.find ('time');
		ui.tickets.entry_terminal = ui.tickets.entry.find ('.term');
		ui.tickets.entry_consecutive = ui.tickets.entry.find ('.consecutive');
		ui.tickets.entry_barcode = ui.tickets.entry.find ('figure');
		ui.tickets.entry.find ('h1').text (APP.config.establishment);

		ui.tickets.exit = $('#cash-ticket-exit');
		ui.tickets.exit_entry_time = ui.tickets.exit.find ('time:eq(0)');
		ui.tickets.exit_charge_time = ui.tickets.exit.find ('time:eq(1)');
		ui.tickets.exit_duration = ui.tickets.exit.find ('time:eq(2)');
		ui.tickets.exit_items = ui.tickets.exit.find ('.items');
		ui.tickets.exit.find ('h1').text (APP.config.establishment);
		ui.tickets.exit.find ('address').text (APP.config.fiscal_address);
		ui.tickets.exit.find ('.fiscal').text (APP.config.fiscal_code);
		ui.tickets.exit.find ('.tax').text (APP.config.tax_percent);
		ui.tickets.exit.find ('.closing').text (APP.config.ticket_closing);

		ui.tickets.shift_end = $('#cash-ticket-shift-end');
		ui.tickets.shift_end_shift_id = ui.tickets.shift_end.find ('.shift_id');
		ui.tickets.shift_end_begin_time = ui.tickets.shift_end.find ('time:eq(0)');
		ui.tickets.shift_end_time = ui.tickets.shift_end.find ('time:eq(1)');
		ui.tickets.shift_end_num = ui.tickets.shift_end.find ('.num');
		ui.tickets.shift_end_terminal = ui.tickets.shift_end.find ('.term');
		ui.tickets.shift_end_user = ui.tickets.shift_end.find ('.user');
		ui.tickets.shift_end_items = ui.tickets.shift_end.find ('.items');
		ui.tickets.shift_end.find ('h1').text (APP.config.establishment);

		ui.tickets.shift_report = $('#cash-ticket-shift-report');
		ui.tickets.shift_report_shift_id = ui.tickets.shift_report.find ('.shift_id');
		ui.tickets.shift_report_begin_time = ui.tickets.shift_report.find ('time:eq(0)');
		ui.tickets.shift_report_time = ui.tickets.shift_report.find ('time:eq(1)');
		ui.tickets.shift_report_num = ui.tickets.shift_report.find ('.num');
		ui.tickets.shift_report_terminal = ui.tickets.shift_report.find ('.term');
		ui.tickets.shift_report_user = ui.tickets.shift_report.find ('.user');
		ui.tickets.shift_report_items = ui.tickets.shift_report.find ('.items');
		ui.tickets.shift_report.find ('h1').text (APP.config.establishment);
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

		shell.ui.user_shift_report = $('#cash-tab-user-shift-report');
		shell.ui.user_shift_report.on ('click', cash_shift_report);

		shell.ui.user_shift_begin = $('#cash-tab-user-shift-begin');
		shell.ui.user_shift_begin.on ('click', cash_shift_begin);

		shell.ui.user_shift_end = $('#cash-tab-user-shift-end');
		shell.ui.user_shift_end.on ('click', cash_shift_end);

		shell.ui.username = shell.ui.shell.find ('.username');

		ui.section_main = $('#cash-main');
		ui.section_main.on ('avanty:switchSectionEnter', cash_main_reset);
		ui.section_main.find ('button').button ();

		ui.main_noshift = $('#cash-main-noshift');
		ui.main_noshift.on ('click', cash_shift_begin);

		ui.section_shift_report = $('#cash-shift-report');
		ui.section_shift_report.find ('button').button ();
		ui.shift_report_table = ui.section_shift_report.find ('tbody');
		ui.shift_report_shift_id = ui.section_shift_report.find ('.shift_id');
		ui.shift_report_received = ui.section_shift_report.find ('.received');
		ui.shift_report_change = ui.section_shift_report.find ('.change');
		ui.shift_report_charged = ui.section_shift_report.find ('.charged');
		ui.shift_report_balance = ui.section_shift_report.find ('.balance');
		ui.shift_report_charged_tickets = ui.section_shift_report.find ('.charged-tickets');
		ui.shift_report_printed_tickets = ui.section_shift_report.find ('.printed-tickets');
		ui.shift_report_print = $('#cash-shift-report-print');
		ui.shift_report_print.on ('click', cash_shift_report_print);
		ui.shift_report_continue = $('#cash-shift-report-continue');
		ui.shift_report_continue.on ('click', cash_shift_report_continue);

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

		ui.section_shift_end = $('#cash-shift-end');
		ui.section_shift_end.find ('button').button ();
		ui.shift_end_table = ui.section_shift_end.find ('tbody');
		ui.shift_end_shift_id = ui.section_shift_end.find ('.shift_id');
		ui.shift_end_received = ui.section_shift_end.find ('.received');
		ui.shift_end_change = ui.section_shift_end.find ('.change');
		ui.shift_end_charged = ui.section_shift_end.find ('.charged');
		ui.shift_end_balance = ui.section_shift_end.find ('.balance');
		ui.shift_end_charged_tickets = ui.section_shift_end.find ('.charged-tickets');
		ui.shift_end_printed_tickets = ui.section_shift_end.find ('.printed-tickets');
		ui.shift_end_print = $('#cash-shift-end-print');
		ui.shift_end_print.on ('click', cash_shift_end_print);
		ui.shift_end_continue = $('#cash-shift-end-continue');
		ui.shift_end_continue.on ('click', cash_shift_end_continue);
		ui.shift_end_quit = $('#cash-shift-end-quit');
		ui.shift_end_quit.on ('click', cash_shift_end_quit);

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
		ui.park_exit_submit = ui.section_park_exit.find ('button[type="submit"]');
		ui.park_exit_cancel = ui.section_park_exit.find ('button[type="button"]');
		ui.park_exit_cancel.on ('click', cash_park_exit_cancel);

		park_charge_layout_init ('park_exit');

		ui.section_park_exit_rate = $('#cash-park-rate');
		ui.section_park_exit_rate.on ('avanty:switchSectionEnter', cash_park_exit_rate_reset);
		ui.park_exit_rate_form = ui.section_park_exit_rate.find ('form');
		ui.park_exit_rate_buttons = ui.park_exit_rate_form.find ('div');

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

		ui.park_lost_cancel = ui.section_park_lost.find ('button[type="button"]');
		ui.park_lost_cancel.on ('click', cash_park_lost_cancel);
		ui.park_lost_submit = ui.section_park_lost.find ('button[type="submit"]');

		park_charge_layout_init ('park_lost');

		// ui.section_chpass is defined inside here:
		pass_layout_init ('chpass', { submitHandler: cash_chpass_submit });
		ui.section_chpass.on ('avanty:switchSectionEnter', cash_chpass_reset);
		ui.chpass_cancel.on ('click', cash_chpass_cancel);

		APP.loadLayout (ui.sections_parent.find ('.ticket-cont'), 'cash-tickets.html', layout_tickets);
		
		mod.loaded = true;
		mod.onLoad ();
	}

	function cash_logout () {
		var desc;
		var icon;
		
		var buttons = [];
		if (APP.history.length () > 0) {
			desc = '<>Parece que dejaste actividades pendientes.<br /><br />¿Estás seguro que quieres salir?';
			icon = 'warning';
		} else if (APP.terminal.shiftUser == APP.charp.credentialsGet ().login) {
			desc = '<>No has finalizado tu turno.<br /><br />¿Estás seguro que quieres salir?';
			icon = 'shift';
			buttons.push ({
				text: 'Finalizar turno',
				'class': 'button-left',
				click: function () { APP.later (cash_shift_end); }
			});
		} else {
			desc = '¿Estás seguro que quieres salir?';
			icon = 'question';
		}

		buttons.push ({ text: 'Sí, salir', click: cash_do_logout });
		buttons.push ({ text: 'Cancelar', click: null });

		APP.msgDialog ({
			icon: icon,
			desc: desc,
			title: 'Cerrar sesión',
			opts: {
				buttons: buttons,
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
			ui.chpass_orig_pass.val ('');
			ui.chpass_orig_pass.focus ();
		});
	}

	function cash_chpass_cancel () {
		APP.history.back ('cash-change-password', false);
		shell.navShow ();
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

		var passwd = ui.chpass_pass.val ();
		APP.charp.request ('this_user_password_change', [passwd],
						   {
							   success: function (salt) {
								   cred.passwd = APP.mod.login.passwordHash (passwd, salt);
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
		} else {
			APP.history.back ('cash-change-password', false);
			shell.navShow ();
		}
	}

	function cash_park_entry () {
		var entry_date = new Date ();

		APP.charp.request ('cashier_park_entry', [entry_date],
						   function (entry_consecutive) { cash_park_entry_print (entry_date, entry_consecutive); });
	}

	function cash_park_entry_print (entry_date, entry_consecutive) {
		var barcode_fields = {
			terminalId: APP.terminal.id,
			entryDate: entry_date
		}

		var barcode = APP.mod.barcode.generate (barcode_fields);

		ui.tickets.entry_time.text (barcode_fields.entryDate.toLocaleString ());
		ui.tickets.entry_terminal.text (APP.terminal.name);
		ui.tickets.entry_consecutive.text (entry_consecutive);
		ui.tickets.entry_barcode.attr ('data-chars', barcode);

		APP.mod.devices.layoutTicket (ui.tickets.entry);
		APP.mod.devices.print (ui.tickets.entry);
	}

	function cash_park_exit () {
		shell.ui.park_exit.button ('disable');
		shell.ui.park_lost.button ('disable');

		ui.park_exit_barcode.val ('');

		APP.history.go (MOD_NAME, ui.section_park_exit, 'cash-park-exit');
		shell.navShow ();
		shell.menuCollapse ();
		APP.mod.devices.hidHandler.on (function (evt, str) { cash_park_exit_hid (evt, str, 'cash-park-exit'); }, 'cash');
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

	function cash_park_exit_hid (evt, str, process) {
		APP.history.back (process, false);
		shell.navShow ();

		cash_park_exit ();

		APP.later (function () {
			if (ui.section_park_exit.is (':hidden')) return true;

			ui.park_exit_barcode.val (str);
			ui.park_exit_form.trigger ('submit');
		});
	}

	function cash_park_exit_cancel () {
		APP.history.back ('cash-park-exit');
		shell.navShow ();
	}

	function cash_park_exit_submit (form, evt) {
		if (evt.originalEvent) evt.originalEvent.preventDefault ();
	
		function check_error (err) {
			if (err.key == 'SQL:DATADUP') { // ticket already charged
				APP.msgDialog ({
					icon: 'no',
					desc: 'El ticket que presentó ya fue cobrado con anterioridad.',
					sev: CHARP.ERROR_SEV['USER'],
					title: 'Ticket ya procesado',
					opts: {
						width: '75%',
						buttons: {
							'Cerrar': cash_park_exit_cancel
						}
					}
				});
				return;
			}
			return true;
		}

		function check_success () {
			APP.history.go (MOD_NAME, ui.section_park_exit_rate, 'cash-park-exit');

			APP.charp.request ('cashier_park_get_rates', ['regular'],
							   cash_park_exit_rate_success);
		}

		// Before displaying, register on DB that we will start charging. Optionally, if the ticket has
		// already been charged, an error will rise.
		var barcode_fields = APP.mod.barcode.parse (ui.park_exit_barcode.val ());
		APP.charp.request ('cashier_park_charge_check', [barcode_fields.terminalId, barcode_fields.entryDate],
						   {
							   success: check_success,
							   error: check_error
						   });
	}

	function cash_forth_error (error) {
		console.error (error);

		forth.reset ();

		APP.msgDialog ({
			icon: 'error',
			desc: 'Falla interna al evaluar tarifa.',
			msg: error,
			sev: CHARP.ERROR_SEV['INTERNAL'],
			title: 'Falla en tarifa',
			opts: { width: '75%' }
		});
	}

	function cash_park_exit_rate_reset () {
		forth.reset (null, cash_forth_error);
	}

	function cash_park_exit_rate_success (rates) {
		ui.park_exit_rate_buttons.empty ();
		for (var rate of rates) {
			var button = $('<button type="button">' + rate.label + '</button>');
			ui.park_exit_rate_buttons.append (button);
			button.button ();
			button.val (rate.name);
			button.data ('label', rate.label_client);
			button.on ('click', function () {
				cash_park_exit_charge ($(this).val (), $(this).data ('label'));
			});
		}

		var button = $('<button class="button-icon" type="button"><img src="img/symbolic/close.svg" />Cancelar</button>');
		ui.park_exit_rate_buttons.append (button);
		button.button ();
		button.on ('click' , cash_park_exit_cancel);
	}

	var cash_charge_state = [];
	function cash_charge_state_get (key) {
		return cash_charge_state[cash_charge_state.length - 1][key];
	}

	function cash_calculate_duration (delta_secs) {
		var duration = delta_secs;
		var segs = duration % 60;
		duration = (duration - segs) / 60;
		var mins = duration % 60;
		duration = (duration - mins) / 60;
		var hrs = duration % 24;
		duration = (duration - hrs) / 24;
		var days = duration % 7;
		var weeks = (duration - days) / 7;

		var res =
			((weeks > 0)? weeks + ' semana' + ((weeks == 1)? '': 's') + ' ': '') +
			((days > 0)? days + ' día' + ((days == 1)? '': 's') + ' ': '') +
			((hrs > 0)? hrs + ' hr. ': '') +
			((mins > 0)? mins + ' min. ': '') +
			((segs > 0)? segs + ' seg. ': '');
		return res;
	}

	function cash_park_exit_charge (rate_name, rate_label) {
		var barcode_fields = APP.mod.barcode.parse (ui.park_exit_barcode.val ());

		var entry_date = barcode_fields.entryDate;
		var charge_date = new Date ();
		cash_charge_state.push ({
			entry_date: entry_date,
			entry_terminal: barcode_fields.terminalId,
			charge_date: charge_date,
			rate_name: rate_name,
			rate_label: rate_label,
			charge_function: cash_park_exit_charge
		});

		ui.park_exit_entry_date.text (barcode_fields.entryDate.toLocaleString ());
		ui.park_exit_charge_date.text (charge_date.toLocaleString ());

		ui.tickets.exit_entry_time.text (barcode_fields.entryDate.toLocaleString ());
		ui.tickets.exit_charge_time.text (charge_date.toLocaleString ());

		var delta_secs = APP.Util.getTimeSecs (charge_date) - APP.Util.getTimeSecs (entry_date);
		var duration = cash_calculate_duration (delta_secs);
		ui.park_exit_duration.text (duration);
		ui.tickets.exit_duration.text (duration);

		forth.setConstants ({ tiempo_registrado: delta_secs }, cash_forth_error);
		forth.load (rate_name,
					function (script) { cash_park_charge_rate ('park_exit', script, 'cash-park-exit'); },
					cash_forth_error);
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
		
		var pre = '';
		var total = 0;
		var table = ui[prefix + '_charge_table'];

		table.empty ();
		for (var rec of records) {
			var subtotal = rec[1] * rec[2];
			total += subtotal;

			pre += '<div class="desc">' + APP.Util.padString (rec[0], 30) + '</div>\n' +
				'<div class="sum">' + rec[2] + ' x ' +
				APP.Util.asMoney (rec[1]) + ' = ' +
				APP.Util.padString (APP.Util.asMoney (subtotal), 7) + '</div>\n';

			table.append ($('<tr>' +
							'<th><span>' + rec[0] + '</span></th>' +
							'<td><s/></td><td class="money">' + APP.Util.asMoney (rec[1]) + '</td>' +
							'<td class="qty">' + rec[2] + '</td>' +
							'<td><s/></td><td class="money"><span>' + APP.Util.asMoney (subtotal) + '</span></td>' +
							'</tr>'));
		}

		total = APP.Util.asMoney (total);
		pre += '<div class="sum">Total = ' + APP.Util.padString (total, 7) + '</div>';
		ui.tickets.exit_items.html (pre);

		ui[prefix + '_charge_total'].text (total);
		APP.mod.devices.display ('client',
								 'Tarifa: ' + cash_charge_state_get ('rate_label') + '\n' +
								 ' Total: $' + total);

		ui[prefix + '_charge_received'].val ('');
		ui[prefix + '_charge_change'].text ('');

		APP.history.go (MOD_NAME, ui['section_' + prefix + '_charge'], process);
		shell.navShow ();
	}

	// Canonize value to include cents if none were introduced.
	function cash_park_charge_received_change (prefix) {
		var received = APP.Util.parseMoney (ui[prefix + '_charge_received'].val ());
		ui[prefix + '_charge_received'].val (APP.Util.asMoney (received));
	}

	function cash_park_charge_received_input (prefix) {
		var total = APP.Util.parseMoney (ui[prefix + '_charge_total'].text ());
		var received = APP.Util.parseMoney (ui[prefix + '_charge_received'].val ());
		var change = received - total;
		ui[prefix + '_charge_change'].text ((change < 0)? '-.--': APP.Util.asMoney (change));
	}

	function cash_park_charge_reset (prefix) {
		ui[prefix + '_charge_form'].validate ().resetForm ();
		ui[prefix + '_charge_received'].input ('enable');
		ui[prefix + '_charge_submit'].button ('enable');
		ui[prefix + '_charge_print'].button ('disable');
		ui[prefix + '_charge_close'].html (ui[prefix + '_charge_close_html']).addClass ('button-icon');

		APP.later (function () {
			if (ui['section_' + prefix + '_charge'].is (':hidden')) return true;
			ui[prefix + '_charge_received'].focus ();
		});
	}

	function cash_park_charge_submit (process, prefix, form, evt) {
		evt.originalEvent.preventDefault ();

		var ui_received = ui[prefix + '_charge_received'];
		if (ui_received.is (':disabled')) // avoid re-submitting.
			return false;

		var ui_submit = ui[prefix + '_charge_submit'];

		ui_received.input ('disable');
		ui_submit.button ('disable');

		var change_val = ui[prefix + '_charge_change'].text ();

		var amount = APP.Util.parseMoney (ui[prefix + '_charge_total'].text ());
		var change = APP.Util.parseMoney (change_val);
 		
		var ticket_type;

		switch (prefix) {
		case 'park_exit':
			ticket_type = 'entry';
			break;
		case 'park_lost':
			ticket_type = 'lost';
			break;
		}

		function success () {
			var received_val = ui_received.val ();

			var pre = ui.tickets.exit_items.html ();
			pre += '<div class="sum">Recibido = ' + APP.Util.padString (received_val, 7) + '</div>';
			pre += '<div class="sum">Cambio = ' + APP.Util.padString (change_val, 7) + '</div>';
			ui.tickets.exit_items.html (pre);

			APP.mod.devices.layoutTicket (ui.tickets.exit);

			var width = (received_val.length > change_val.length)? received_val.length: change_val.length;
			APP.mod.devices.openDrawer ('main', function () {
				APP.mod.devices.display ('client',
										 'Recibido: $' + APP.Util.padString (received_val, width) + '\n' +
										 '  Cambio: $' + APP.Util.padString (change_val, width));
				APP.mod.devices.openBoom ('exit');
			});

			cash_park_charge_success (process, prefix);
		}

		APP.charp.request ('cashier_park_charge',
						   [ cash_charge_state_get ('entry_terminal'),
							 cash_charge_state_get ('entry_date'),
							 cash_charge_state_get ('charge_date'),
							 ticket_type, cash_charge_state_get ('rate_name'),
							 'tender', amount, change, null ],
						   {
							   success: success,
							   error: function (err) { cash_park_charge_error (err, ui_submit, ui_received); }
						   });
	}

	function cash_park_charge_error (err, ui_submit, ui_received) {
		ui_submit.button ('enable');
		ui_received.input ('enable');

		if (err.type == 'USERPERM' && err.parms[0] == 'last_event') {
			APP.msgDialog ({
				icon: 'warning',
				desc: '<>Se ha realizado otra operación en el transcurso de este cobro.<br/><br/>La tarifa se va a recalcular.',
				title: 'Cálculo de tarifa',
				opts: { width: '60%' }
			});

			var state = cash_charge_state.pop ();
			state.charge_function (state.rate_name, state.rate_label);
			return false;
		}

		return true;
	}

	function cash_park_charge_success (process, prefix) {
		cash_charge_state.pop ();
		ui[prefix + '_charge_print'].button ('enable');
		ui[prefix + '_charge_close'].text ('Concluir').removeClass ('button-icon');
		APP.mod.devices.hidHandler.on (function (evt, str) { cash_park_exit_hid (evt, str, process); }, 'cash');
	}

	function cash_park_charge_print () {
		APP.mod.devices.print (ui.tickets.exit);
	}

	function cash_park_charge_close (process) {
		APP.mod.devices.display ('client', '');
		APP.history.back (process);
		shell.navShow ();
		shell.menuCollapse (false);
	}

	function cash_park_lost () {
		shell.ui.park_exit.button ('disable');
		shell.ui.park_lost.button ('disable');

		APP.history.go (MOD_NAME, ui.section_park_lost, 'cash-park-lost');
		shell.navShow ();
		shell.menuCollapse ();
	}

	function cash_park_lost_reset () {
		ui.park_lost_date.datepicker ('setDate', new Date ());
	}

	function cash_park_lost_cancel () {
		APP.history.back ('cash-park-lost');
		shell.navShow ();
	}

	function cash_park_lost_submit (evt) {
		if (evt) evt.preventDefault ();

		forth.reset (cash_park_lost_charge, cash_forth_error);
	}

	function cash_park_lost_charge () {
		function success (rate) {
			if (!rate) {
				APP.msgDialog ({
					icon: 'error',
					desc: 'No se encontró la tarifa de boleto perdido.',
					msg: 'La configuración no cuenta con una tarifa para boletos perdidos.',
					sev: CHARP.ERROR_SEV['INTERNAL'],
					title: 'Falla en tarifa',
					opts: { width: '75%' }
				});
				return;
			}

			var entry_date = ui.park_lost_date.datepicker ('getDate');
			var charge_date = new Date ();
			cash_charge_state.push ({
				entry_date: entry_date,
				entry_terminal: APP.terminal.id,
				charge_date: charge_date,
				rate_name: rate.name,
				rate_label: rate.label_client,
				charge_function: cash_park_lost_charge
			});

			ui.tickets.exit_entry_time.text (entry_date.toLocaleDateString ());
			ui.tickets.exit_charge_time.text (charge_date.toLocaleString ());

			var cons = {
				fecha_ingreso: APP.Util.getTimeSecs (entry_date),
				ahora: APP.Util.getTimeSecs ()
			};

			// The entry date comes from the date picker without HMS, so we set those of the
			// charge date so that it is unique when it goes into the database. Otherwise, you
			// would only be able to charge one lost ticket per day.
			entry_date.setHours (charge_date.getHours ());
			entry_date.setMinutes (charge_date.getMinutes ());
			entry_date.setSeconds (charge_date.getSeconds ());

			var delta_secs = APP.Util.getTimeSecs (charge_date) - APP.Util.getTimeSecs (entry_date) + 24 * 60 * 60;
			var duration = cash_calculate_duration (delta_secs);
			ui.tickets.exit_duration.text (duration);

			forth.setConstants (cons, cash_forth_error);
			forth.load (rate.name,
						function (script) { cash_park_charge_rate ('park_lost', script, 'cash-park-lost'); },
						cash_forth_error);

		}

		APP.charp.request ('cashier_park_get_rates', ['lost'],
						   {
							   asObject: true,
							   success: success
						   });
	}

	function cash_main () {
		if (APP.mod.login.isFirst) {
			// This is the first login for the user. Force a password change.
			cash_chpass ();
			return;
		}

		shell.show ();
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

			APP.mod.devices.hidHandler.on (function (evt, str) { cash_park_exit_hid (evt, str, 'cash-park-exit'); }, 'cash');
			APP.mod.devices.display ('client', 'Bienvenido', null, { align: 'center' });

			shell.ui.park_exit.button ('enable');
			shell.ui.park_lost.button ('enable');
		}
	}

	function cash_shift_report () {
		APP.charp.request ('cashier_shift_report', [], cash_shift_report_success);
	}

	function cash_shift_report_success (records) {
		APP.mod.report.shiftSummaryReport (ui, 'shift_report', records);

		APP.history.go (MOD_NAME, ui.section_shift_report, 'cash-shift-report');
		shell.navShow ();
		shell.menuCollapse ();
	}

	function cash_shift_report_print () {
		APP.mod.devices.print (ui.tickets.shift_report);
	}

	function cash_shift_report_continue () {
		APP.history.back ('cash-shift-report');
		shell.navShow ();
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
		APP.mod.devices.openDrawer ('main');
		APP.toast ('Se inició el turno ' + suffix);

		APP.history.back ('cash-shift-begin', false);
		shell.navShow ();

		APP.terminal.shiftUser = APP.charp.credentialsGet ().login;
		cash_main_reset ();

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

	function cash_shift_end () {
		APP.msgDialog ({
			icon: 'shift',
			desc: 'Al finalizar turno se efectuará el corte de caja. ¿Deseas continuar?',
			title: 'Finalizar turno',
			opts: {
				buttons: {
					'Sí, finalizar turno ahora.':
					function () {
						APP.charp.request ('cashier_shift_end', [], cash_shift_end_success);
					},
					'Cancelar': null
				}
			}
		});
	}

	function cash_shift_end_success (records) {
		APP.terminal.shiftUser = null;
		shell.setStatus ('');
		shell.menuCollapse ();
		shell.show (false); // Hide shell.

		APP.mod.report.shiftSummaryReport (ui, 'shift_end', records);

		ui.shift_end_print.button ('enable');
		ui.shift_end_continue.button ('disable');
		ui.shift_end_quit.button ('disable');

		APP.history.go (MOD_NAME, ui.section_shift_end, 'cash-shift-end');
		shell.navShow ();
		shell.menuCollapse ();
	}

	function cash_shift_end_print () {
		// print ticket
		ui.shift_end_continue.button ('enable');
		ui.shift_end_quit.button ('enable');

		APP.mod.devices.print (ui.tickets.shift_end,
							   function () {
								   APP.mod.devices.openDrawer ('main');
							   });
	}

	function cash_shift_end_continue () {
		APP.history.back ('cash-shift-end');
		shell.navShow ();
		shell.show ();
	}

	function cash_shift_end_quit () {
		cash_shift_end_continue ();
		cash_logout ();
	}

	var mod = {
		init: function () {
			mod.initialized = true;
			APP.loadModule ('report');
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
