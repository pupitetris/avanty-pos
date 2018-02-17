// This file is part of Microsafe AVANTY. -*- tab-width: 4; -*-
//
// Copyright © 2017 Microsafe, S.A. de C.V.
// Derechos Reservados (R) 2017 Microsafe, S.A. de C.V.

(function () {
	var MOD_NAME = 'super';

	var super_is_first; // True when supervisor creation is required, right after activation.

	var ui = {};
	var shell;

	function newuser_layout_init (name, validator_options) {
		var section = ui['section_' + name] = $('#super-' + name);
		
		section.find ('button').button ();

		var login = ui[name + '_login'] = section.find ('input[name="' + name + '-login"]');
		login.input ();

		var pass = ui[name + '_pass'] = section.find ('input[name="' + name + '-pass"]');
		pass.input ();

		var pass2 = ui[name + '_pass2'] = section.find ('input[name="' + name + '-pass2"]');
		pass2.input ();

		ui[name + '_submit'] = section.find ('button[type="submit"]');

		var cancel = section.find ('button[type="button"]');
		if (cancel.length > 0) {
			ui[name + '_cancel'] = cancel;
			cancel.on ('click', function () { shell.backGo (); });
		}

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
			passwd: true,
			minlength: 8,
			maxlength: 255
		};
		rules[name + '-pass2'] = {
			'pass-confirm': pass
		};

		validator_options.rules = rules;
		validator_options.ignore = '';

		form.validate (validator_options);
	}

	function report_layout_init (prefix) {
		var report = {};

		report.filter_section = $('#super-report-' + prefix + '-filter');
		report.filter_section.find ('button').button ();
		report.filter_form = report.filter_section.find ('form');
		report.filter_form.on ('submit', function (evt) { super_report_filter_submit (prefix, evt); });
		report.filter_submit = report.filter_form.find ('button[type="submit"]');
		report.filter_error = report.filter_submit.find ('.error');
		report.filter_error.hide ();
		report.filter_start_d = $('#super-report-' + prefix + '-start-d');
		report.filter_start_d_txt = report.filter_start_d.find ('span');
		report.filter_start_d_cal = $('#super-report-' + prefix + '-start-d-cal');
		report.filter_end_d = $('#super-report-' + prefix + '-end-d');
		report.filter_end_d_txt = report.filter_end_d.find ('span');
		report.filter_end_d_error = report.filter_end_d.find ('.error');
		report.filter_end_d_error.hide ();
		report.filter_end_d_cal = $('#super-report-' + prefix + '-end-d-cal');

		report.filter_users = $('#super-report-' + prefix + '-users');
		report.filter_users.ava_select ();
		report.filter_users.on ('avanty:optionSelect',
								function (evt, option, selected) {
									super_report_filter_select_toggled (prefix, evt, option, selected);
								});
		report.filter_users_all = $('#super-report-' + prefix + '-users-all');
		report.filter_users_all.on ('click',
									function () {
										super_report_filter_select_all_or_none (prefix, report.filter_users_all, report.filter_users);
									});
		report.filter_shifts = $('#super-report-' + prefix + '-shifts');
		report.filter_shifts.ava_select ();
		report.filter_shifts.on ('avanty:optionSelect',
										   function (evt, option, selected) {
											   super_report_filter_select_toggled (prefix, evt, option, selected);
										   });
		report.filter_shifts_all = $('#super-report-' + prefix + '-shifts-all');
		report.filter_shifts_all.on ('click',
									 function () {
										 super_report_filter_select_all_or_none (prefix, report.filter_shifts_all, report.filter_shifts);
									 });

		var now = new Date ();
		var todayStr = now.getFullYear () + '/' +
			APP.Util.padZeroes (now.getMonth () + 1, 2) + '/' +
			APP.Util.padZeroes (now.getDate (), 2);
		report.filter_start_d_txt.text (todayStr);
		report.filter_end_d_txt.text (todayStr);

		report.filter_start_d.on ('click', function () {
			super_report_filter_cal_toggle (report.filter_start_d_cal, report.filter_end_d_cal);
		})
		report.filter_end_d.on ('click', function () {
			super_report_filter_cal_toggle (report.filter_end_d_cal, report.filter_start_d_cal);
		})

		var calopts = {
			minDate: APP.config.startDate, // activation date, recovered from DB during activation check.
			maxDate: 0,
			firstDay: APP.config.weekFirstDay,
			changeMonth: true,
			changeYear: true,
			dateFormat: 'yy/mm/dd'
		};

		report.filter_start_d_cal.datepicker ($.extend ({
			onSelect: function (date, inst) {
				super_report_filter_cal_selected (prefix, date, inst, report.filter_start_d_txt); }
		}, calopts));

		report.filter_end_d_cal.datepicker ($.extend ({
			onSelect: function (date, inst) {
				super_report_filter_cal_selected (prefix, date, inst, report.filter_end_d_txt); }
		}, calopts));

		report.filter_cancel = $('#super-report-' + prefix + '-filter-cancel');
		report.filter_cancel.on ('click', function () { super_report_close (prefix); });

		report.section = $('#super-report-summary');
		report.section.find ('button').button ();
		report.start = report.section.find ('.start');
		report.end = report.section.find ('.end');
		report.table = report.section.find ('tbody');
		report.received = report.section.find ('.received');
		report.change = report.section.find ('.change');
		report.charged = report.section.find ('.charged');
		report.balance = report.section.find ('.balance');
		report.charged_tickets = report.section.find ('.charged-tickets');
		report.printed_tickets = report.section.find ('.printed-tickets');
		report.reload = $('#super-report-' + prefix + '-reload');
		report.reload.on ('click', function () { super_report_reload (prefix); });
		report.close = $('#super-report-' + prefix + '-close');
		report.close.on ('click', function () { super_report_close (prefix); });

		return report;
	}

	function layout_init () {
		ui.sections_parent = $('#super-sections');
		ui.section_main = $('#super-main');

		shell = APP.shellCreate (ui.sections_parent);

		shell.ui.logout.on ('click', super_logout);

		shell.ui.user_create = $('#super-tab-user-create');
		shell.ui.user_create.on ('click', super_create_user);

		shell.ui.report_summary = $('#super-tab-report-summary');
		shell.ui.report_summary.on ('click', function () { super_report_filter ('summary'); });

		shell.ui.report_detail = $('#super-tab-detail-summary');
		shell.ui.report_detail.on ('click', function () { super_report_filter ('detail'); });

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
		ui.newuser_type_combo = ui.newuser_type.next ();

		newuser_layout_init ('super_chpass', { submitHandler: super_chpass_submit });
		ui.super_chpass_cancel = ui.section_super_chpass.find ('button[type="button"]');
		ui.super_chpass_cancel.button ();
		ui.super_chpass_cancel.on ('click', super_chpass_finish);

		ui.report = {};
		ui.report.summary = report_layout_init ('summary');
		ui.report.detail = report_layout_init ('detail');
		
		ui.report.summary.print = $('#super-report-summary-print');
		ui.report.summary.print.on ('click', super_report_summary_print);

		ui.report.tickets = {};
		ui.report.tickets.summary = {};
		ui.report.tickets.summary.section = $('#super-ticket-report-summary');
		ui.report.tickets.summary.timestamp = ui.report.tickets.summary.section.find ('.ts');
		ui.report.tickets.summary.start = ui.report.tickets.summary.section.find ('.start');
		ui.report.tickets.summary.end = ui.report.tickets.summary.section.find ('.end');
		ui.report.tickets.summary.terminal = ui.report.tickets.summary.section.find ('.term');
		ui.report.tickets.summary.user = ui.report.tickets.summary.section.find ('.user');
		ui.report.tickets.summary.items = ui.report.tickets.summary.section.find ('.items');

		mod.loaded = true;
		mod.onLoad ();
	}

	function super_logout () {
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
					'Sí, salir': super_do_logout,
					'Cancelar': null
				},
				width: '75%',
				open: function() { $(this).siblings('.ui-dialog-buttonpane').find('button:eq(1)').focus(); }
			}
		});
	}

	function super_do_logout () {
		APP.loadModule ('login');
	}

	function super_chpass_user () {
		if (mod.chpass) {
			APP.switchSection (ui.section_super_chpass);
			APP.switchPage (MOD_NAME);
			shell.show (false);
		} else {
			APP.history.go (MOD_NAME, ui.section_super_chpass, 'super-chpass-user');
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

	function super_create_user () {
		APP.history.go (MOD_NAME, ui.section_newuser, 'super-create-user');
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

	function super_create_user_success (login) {
		APP.toast ('Usuario <i> ' + login + ' </i> creado con éxito.');
		shell.backGo ();
	}

	function super_main_message (msg) {
		ui.super_main_message.html (msg);
	}

	function super_supervisor_created_success (is_created) {
		APP.hourglass.enable ();
		if (!is_created) {
			// operations supervisor not created. Create one immediately.
			super_is_first = true;
			APP.switchPage (MOD_NAME);
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

	function super_main () {
		shell.show ();
		shell.navShow ();
		shell.setStatus (APP.config.establishment +
						 ' Terminal: ' + APP.terminal.name, true);
		shell.menuCollapse (false);

		APP.history.setHome (MOD_NAME, ui.section_main);
		APP.switchSection (ui.section_main);
	}

	function super_report_filter (prefix) {
		APP.history.go (MOD_NAME, ui.report[prefix].filter_section, 'super-report-' + prefix);
		shell.navShow ();
		shell.menuCollapse ();

		super_report_filter_refresh (prefix, function () {
			ui.report[prefix].filter_users_all.data ('state', 'all');
			ui.report[prefix].filter_shifts_all.data ('state', 'all');
			super_report_filter_select_all_or_none (prefix,
													ui.report[prefix].filter_users_all,
													ui.report[prefix].filter_users);
			super_report_filter_select_all_or_none (prefix,
													ui.report[prefix].filter_shifts_all,
													ui.report[prefix].filter_shifts);
		});
	}

	function super_report_filter_window_click (evt, cal1, cal2) {
		if ($(evt.target).closest (cal1).length < 1)
			super_report_filter_cal_toggle (cal1, cal2);
	}

	function super_report_filter_select_all_or_none (prefix, button, select) {
		var state = button.data ('state');
		if (!state || state == 'all') {
			button.data ('state', 'none');
			button.find ('span').text ('Seleccionar ninguno');
			button.find ('img').prop ('src', button.find ('img').prop ('src').replace (/[^/.]+\.svg$/, 'none.svg'));
			select.find ('div').each (function (i, opt) { $(opt).ava_option ('selected', true); });
		} else {
			button.data ('state', 'all');
			button.find ('span').text ('Seleccionar todos');
			button.find ('img').prop ('src', button.find ('img').prop ('src').replace (/[^/.]+\.svg$/, 'all.svg'));
			select.find ('div').each (function (i, opt) { $(opt).ava_option ('selected', false); });
		}

		if (button.prop ('id') == 'super-report-' + prefix + '-users-all')
			super_report_filter_update_shifts (prefix);

		super_report_filter_validate_shifts (prefix);
	}

	function super_report_filter_cal_toggle (cal1, cal2) {
		$(window).off ('click.super_report_toggle');
		if (cal1.is (':hidden')) {
			APP.later (function () {
				$(window).on ('click.super_report_toggle',
							  function (evt) { super_report_filter_window_click (evt, cal1, cal2); });
 			}, 200);
			cal1.show ('drop', { direction: 'up' }, 200);
			cal2.hide ();
		} else {
			cal1.hide ('drop', { direction: 'up' }, 200);
		}
	}

	var super_report_shifts = {};
	function super_report_filter_update_shifts (prefix) {
		var cashiers = {};
		var shifts = super_report_shifts[prefix];

		ui.report[prefix].filter_users.find ('.avanty-option').each (
			function (i, opt) {
				cashiers[$(opt).ava_option ('value')] = { selected: $(opt).ava_option ('selected') }
			});

		ui.report[prefix].filter_shifts.find ('.avanty-option').each (
			function (i, opt) {
				$(opt).ava_option ('selected', cashiers[shifts.byId[$(opt).ava_option ('value')].cashier].selected);
			});
	}

	function super_report_filter_validate_shifts (prefix) {
		if (ui.report[prefix].filter_shifts.find ('.selected').length == 0) {
			ui.report[prefix].filter_submit.addClass ('error');
			ui.report[prefix].filter_error.show ();
			return false;
		}
		
		ui.report[prefix].filter_submit.removeClass ('error');
		ui.report[prefix].filter_error.hide ();
		return true;
	}		

	function super_report_filter_select_toggled (prefix, evt, option, selected) {
		var select = option.parent ();
		window.setTimeout (function () {
			if (select.prop ('id') == ui.report[prefix].filter_users.prop ('id'))
				super_report_filter_update_shifts (prefix);

			super_report_filter_validate_shifts (prefix);
		}, 0);
	}
	
	function super_report_filter_cal_selected (prefix, date, inst, txt) {
		$(window).off ('click.super_report_toggle');

		txt.text (date);
		inst.dpDiv.parent ().fadeOut ();

		super_report_filter_refresh (prefix);
	}

	function super_report_filter_validate_start_end (prefix) {
		var start = new Date (ui.report[prefix].filter_start_d_txt.text ());
		var end = new Date (ui.report[prefix].filter_end_d_txt.text ());

		if (start > end) {
			ui.report[prefix].filter_end_d.addClass ('error');
			ui.report[prefix].filter_end_d_error.show ();
			ui.report[prefix].filter_shifts.empty ();
			ui.report[prefix].filter_users.empty ();
			return undefined;
		}

		ui.report[prefix].filter_end_d.removeClass ('error');
		ui.report[prefix].filter_end_d_error.hide ();

		end.setDate (end.getDate () + 1); // Range is start <= x < end
		return { start: start, end: end };
	}

	function super_report_filter_refresh (prefix, cb) {
		var res = super_report_filter_validate_start_end (prefix);
		if (!res)
			return;

		APP.charp.request ('supervisor_get_shifts', [res.start, res.end],
						   function (shifts) { super_report_filter_refresh_success (prefix, shifts, cb); });
	}

	function super_report_select_populate (prefix, select, key) {
		var opts = {};
		var shifts = super_report_shifts[prefix];

		select.find ('.avanty-option').each (
			function (i, opt) {
				opts[$(opt).ava_option ('value')] = { selected: $(opt).ava_option ('selected') };
			});
		for (var shift of shifts) {
			if (opts[shift[key]])
				opts[shift[key]].found = true;
			else
				opts[shift[key]] = { found: true, selected: true };
		}

		select.empty ();
		select.data ('opts', opts);
		for (var val of Object.keys (opts).sort ())
			if (opts[val].found) {
				var option = $('<div>' + val + '</div>').ava_option ({ value: val, selected: opts[val].selected });
				select.append (option);
			}
	}

	function super_report_filter_refresh_success (prefix, shifts, cb) {
		var dict = {};
		for (var shift of shifts)
			dict[shift.shift_id] = shift;
		shifts.byId = dict;
		super_report_shifts[prefix] = shifts;
		
		super_report_select_populate (prefix, ui.report[prefix].filter_users, 'cashier');
		super_report_select_populate (prefix, ui.report[prefix].filter_shifts, 'shift_id');

		if (shifts.length > 0) {
			ui.report[prefix].filter_users_all.button ('enable');
			ui.report[prefix].filter_shifts_all.button ('enable');
		} else {
			ui.report[prefix].filter_users_all.button ('disable');
			ui.report[prefix].filter_shifts_all.button ('disable');
		}

		if (cb)	cb ();
	}

	var super_report_params = {};
	var super_report_params_str = {};
	var super_report_records = {};
	function super_report_filter_submit (prefix, evt) {
		evt.preventDefault ();

		var dates = super_report_filter_validate_start_end (prefix);
		if (!dates)
			return;

		if (!super_report_filter_validate_shifts (prefix))
			return;

		APP.history.go (MOD_NAME, ui.report[prefix].section, 'super-report-' + prefix);
		shell.navShow ();

		var shifts = [];
		ui.report[prefix].filter_shifts.find ('.avanty-option').each (
			function (i, opt) {
				var opt = $(opt);
				if (opt.ava_option ('selected'))
					shifts.push (parseInt (opt.ava_option ('value')));
			});
		if (shifts.length == 0)
			shifts = null;
		
		var params = { dates: dates, shifts: shifts };
		var params_str = JSON.stringify (params);
		if (super_report_params_str[prefix] && params_str == super_report_params_str[prefix]) {
			super_report_do (prefix, super_report_records[prefix])
			return;
		}

		super_report_request (prefix, params, params_str);
	}

	function super_report_request (prefix, params, params_str) {
		APP.charp.request ('supervisor_summary_report', [params.dates.start, params.dates.end, params.shifts],
						   function (records) {
							   super_report_params[prefix] = params;
							   super_report_params_str[prefix] = params_str;
							   super_report_records[prefix] = records; 
							   super_report_do (prefix, records)
						   });
	}

	function super_report_do (prefix, records) {
		switch (prefix) {
		case 'summary':
			return super_report_summary_do (super_report_records[prefix]);
		case 'detail':
			return super_report_detail_do (super_report_records[prefix]);
		}

		throw 'invalid prefix ' + prefix;
	}

	function super_report_summary_do (records) {
		ui.report.tickets.summary.timestamp.text (new Date ().toLocaleString ());
		ui.report.tickets.summary.start.text (super_report_params['summary'].dates.start.toLocaleString ());
		ui.report.tickets.summary.end.text (super_report_params['summary'].dates.end.toLocaleString ());

		ui.report.summary.start.text (super_report_params['summary'].dates.start.toLocaleString ());
		ui.report.summary.end.text (super_report_params['summary'].dates.end.toLocaleString ());

		APP.mod.report.shiftSummaryReport (ui.report, 'summary', records);
	}

	function super_report_reload (prefix) {
		ui.report[prefix].reload.button ('disable');
		super_report_request (prefix, super_report_params[prefix], super_report_params_str[prefix]);
		APP.later (function () {
			ui.report[prefix].reload.button ('enable');
		}, 1000);
	}

	function super_report_close (prefix) {
		APP.history.back ('super-report-' + prefix);
		shell.navShow ();
		shell.menuCollapse (false);
	}

	function super_report_summary_print () {
		APP.mod.devices.print (ui.report.tickets.summary);
	}

	var mod = {
		init: function () {
			mod.initialized = true;
			APP.loadModule ('report');
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
			if (!cred.login) { // we are in activation process
				APP.charp.request ('supervisor_created', [],
								   {
									   asAnon: true,
									   success: super_supervisor_created_success
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
