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
		
		var login = ui[name + '_login'] = section.find ('input[name="' + name + '-login"]');
		login.input ();

		var pass = ui[name + '_pass'] = section.find ('input[name="' + name + '-pass"]');
		pass.input ();

		var pass2 = ui[name + '_pass2'] = section.find ('input[name="' + name + '-pass2"]');
		pass2.input ();

		var submit = ui[name + '_submit'] = section.find ('button[type="submit"]');
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

	function layout_init () {
		ui.sections_parent = $('#super-sections');
		ui.section_main = $('#super-main');

		shell = APP.shellCreate (ui.sections_parent);

		shell.ui.logout.on ('click', super_logout);

		shell.ui.user_create = $('#super-tab-user-create');
		shell.ui.user_create.on ('click', super_create_user);

		shell.ui.report_summary = $('#super-tab-report-summary');
		shell.ui.report_summary.on ('click', super_report_summary_filter);

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

		ui.report.summary_filter_section = $('#super-report-summary-filter');
		ui.report.summary_filter_section.find ('button').button ();
		ui.report.summary_filter_form = ui.report.summary_filter_section.find ('form');
		ui.report.summary_filter_form.on ('submit', super_report_summary_filter_submit);
		ui.report.summary_filter_submit = ui.report.summary_filter_form.find ('button[type="submit"]');
		ui.report.summary_filter_error = ui.report.summary_filter_submit.find ('.error');
		ui.report.summary_filter_error.hide ();
		ui.report.summary_filter_start_d = $('#super-report-summary-start-d');
		ui.report.summary_filter_start_d_txt = ui.report.summary_filter_start_d.find ('span');
		ui.report.summary_filter_start_d_cal = $('#super-report-summary-start-d-cal');
		ui.report.summary_filter_end_d = $('#super-report-summary-end-d');
		ui.report.summary_filter_end_d_txt = ui.report.summary_filter_end_d.find ('span');
		ui.report.summary_filter_end_d_error = ui.report.summary_filter_end_d.find ('.error');
		ui.report.summary_filter_end_d_error.hide ();
		ui.report.summary_filter_end_d_cal = $('#super-report-summary-end-d-cal');

		ui.report.summary_filter_users = $('#super-report-summary-users');
		ui.report.summary_filter_users_all = $('#super-report-summary-users-all');
		ui.report.summary_filter_users_all.on ('click', function () {
			super_report_summary_filter_select_all_or_none (ui.report.summary_filter_users_all, ui.report.summary_filter_users);
		});
		ui.report.summary_filter_shifts = $('#super-report-summary-shifts');
		ui.report.summary_filter_shifts_all = $('#super-report-summary-shifts-all');
		ui.report.summary_filter_shifts_all.on ('click', function () {
			super_report_summary_filter_select_all_or_none (ui.report.summary_filter_shifts_all, ui.report.summary_filter_shifts);
		});

		var now = new Date ();
		var todayStr = now.getFullYear () + '/' +
			APP.Util.padZeroes (now.getMonth () + 1, 2) + '/' +
			APP.Util.padZeroes (now.getDate (), 2);
		ui.report.summary_filter_start_d_txt.text (todayStr);
		ui.report.summary_filter_end_d_txt.text (todayStr);

		ui.report.summary_filter_start_d.on ('click', function () {
			super_report_summary_filter_cal_toggle (ui.report.summary_filter_start_d_cal, ui.report.summary_filter_end_d_cal);
		})
		ui.report.summary_filter_end_d.on ('click', function () {
			super_report_summary_filter_cal_toggle (ui.report.summary_filter_end_d_cal, ui.report.summary_filter_start_d_cal);
		})

		var calopts = {
			minDate: APP.config.startDate, // activation date, recovered from DB during activation check.
			maxDate: 0,
			firstDay: APP.config.weekFirstDay,
			changeMonth: true,
			changeYear: true,
			dateFormat: 'yy/mm/dd'
		};

		ui.report.summary_filter_start_d_cal.datepicker ($.extend ({
			onSelect: function (date, inst) {
				super_report_summary_filter_cal_selected (date, inst, ui.report.summary_filter_start_d_txt); }
		}, calopts));

		ui.report.summary_filter_end_d_cal.datepicker ($.extend ({
			onSelect: function (date, inst) {
				super_report_summary_filter_cal_selected (date, inst, ui.report.summary_filter_end_d_txt); }
		}, calopts));

		ui.report.summary_filter_cancel = $('#super-report-summary-filter-cancel');
		ui.report.summary_filter_cancel.on ('click', super_report_summary_close);

		ui.report.summary = $('#super-report-summary');
		ui.report.summary.find ('button').button ();
		ui.report.summary_start = ui.report.summary.find ('.start');
		ui.report.summary_end = ui.report.summary.find ('.end');
		ui.report.summary_table = ui.report.summary.find ('tbody');
		ui.report.summary_received = ui.report.summary.find ('.received');
		ui.report.summary_change = ui.report.summary.find ('.change');
		ui.report.summary_charged = ui.report.summary.find ('.charged');
		ui.report.summary_balance = ui.report.summary.find ('.balance');
		ui.report.summary_charged_tickets = ui.report.summary.find ('.charged-tickets');
		ui.report.summary_printed_tickets = ui.report.summary.find ('.printed-tickets');
		ui.report.summary_reload = $('#super-report-summary-reload');
		ui.report.summary_reload.on ('click', super_report_summary_reload);
		ui.report.summary_print = $('#super-report-summary-print');
		ui.report.summary_print.on ('click', super_report_summary_print);
		ui.report.summary_close = $('#super-report-summary-close');
		ui.report.summary_close.on ('click', super_report_summary_close);
		
		ui.report.tickets = {};
		ui.report.tickets.summary = $('#super-ticket-report-summary');
		ui.report.tickets.summary_timestamp = ui.report.tickets.summary.find ('.ts');
		ui.report.tickets.summary_start = ui.report.tickets.summary.find ('.start');
		ui.report.tickets.summary_end = ui.report.tickets.summary.find ('.end');
		ui.report.tickets.summary_terminal = ui.report.tickets.summary.find ('.term');
		ui.report.tickets.summary_user = ui.report.tickets.summary.find ('.user');
		ui.report.tickets.summary_items = ui.report.tickets.summary.find ('.items span');

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
						 ' Versión: ' + APP.config.version +
						 ' Terminal: ' + APP.terminal.name, true);
		shell.menuCollapse (false);

		APP.history.setHome (MOD_NAME, ui.section_main);
		APP.switchSection (ui.section_main);
	}

	function super_report_summary_filter () {
		APP.history.go (MOD_NAME, ui.report.summary_filter_section, 'super-report-summary');
		shell.navShow ();
		shell.menuCollapse ();

		super_report_summary_filter_refresh (function () {
			ui.report.summary_filter_users_all.data ('state', 'all');
			ui.report.summary_filter_shifts_all.data ('state', 'all');
			super_report_summary_filter_select_all_or_none (ui.report.summary_filter_users_all, ui.report.summary_filter_users);
			super_report_summary_filter_select_all_or_none (ui.report.summary_filter_shifts_all, ui.report.summary_filter_shifts);
		});
	}

	function super_report_summary_filter_window_click (evt, cal1, cal2) {
		if ($(evt.target).closest (cal1).length < 1)
			super_report_summary_filter_cal_toggle (cal1, cal2);
	}

	function super_report_summary_filter_select_all_or_none (button, select) {
		var state = button.data ('state');
		if (!state || state == 'all') {
			button.data ('state', 'none');
			button.find ('span').text ('Seleccionar ninguno');
			button.find ('img').prop ('src', button.find ('img').prop ('src').replace (/[^/.]+\.svg$/, 'none.svg'));
			select.find ('option').each (function (i, opt) { $(opt).prop ('selected', true); });
		} else {
			button.data ('state', 'all');
			button.find ('span').text ('Seleccionar todos');
			button.find ('img').prop ('src', button.find ('img').prop ('src').replace (/[^/.]+\.svg$/, 'all.svg'));
			select.find ('option').each (function (i, opt) { $(opt).prop ('selected', false); });
		}

		if (button.prop ('id') == 'super-report-summary-users-all')
			super_report_summary_filter_update_shifts ();

		super_report_summary_filter_validate_shifts ();
	}

	function super_report_summary_filter_cal_toggle (cal1, cal2) {
		$(window).off ('click.super_report_summary_toggle');
		if (cal1.is (':hidden')) {
			APP.later (function () {
				$(window).on ('click.super_report_summary_toggle',
							  function (evt) { super_report_summary_filter_window_click (evt, cal1, cal2); });
 			}, 200);
			cal1.show ('drop', { direction: 'up' }, 200);
			cal2.hide ();
		} else {
			cal1.hide ('drop', { direction: 'up' }, 200);
		}
	}

	var super_report_summary_shifts;
	function super_report_summary_filter_update_shifts () {
		var cashiers = {};
		var shifts = super_report_summary_shifts;

		ui.report.summary_filter_users.find ('option').each (
			function (i, opt) {
				cashiers[opt.value] = { selected: opt.selected? true: false }
			});

		ui.report.summary_filter_shifts.find ('option').each (
			function (i, opt) {
				$(opt).prop ('selected', cashiers[shifts.byId[opt.value].cashier].selected);
			});
	}

	function super_report_summary_filter_validate_shifts () {
		if (ui.report.summary_filter_shifts.find ('option:selected').length == 0) {
			ui.report.summary_filter_submit.addClass ('error');
			ui.report.summary_filter_error.show ();
			return false;
		}
		
		ui.report.summary_filter_submit.removeClass ('error');
		ui.report.summary_filter_error.hide ();
		return true;
	}		

	function super_report_summary_filter_multi_select_mousedown (evt) {
		evt.preventDefault ();
		var option = $(evt.target);
		var select = option.parent ();
		var originalScrollTop = select.scrollTop ();
		option.prop ('selected', option.prop ('selected') ? false : true);
		select.focus ();
		window.setTimeout (function () {
			select.scrollTop (originalScrollTop);
			if (select.prop ('id') == ui.report.summary_filter_users.prop ('id'))
				super_report_summary_filter_update_shifts ();

			super_report_summary_filter_validate_shifts ();
		}, 0);
		
		return false;
	}
	
	function super_report_summary_filter_cal_selected (date, inst, txt) {
		$(window).off ('click.super_report_summary_toggle');

		txt.text (date);
		inst.dpDiv.parent ().fadeOut ();

		super_report_summary_filter_refresh ();
	}

	function super_report_summary_filter_validate_start_end () {
		var start = new Date (ui.report.summary_filter_start_d_txt.text ());
		var end = new Date (ui.report.summary_filter_end_d_txt.text ());

		if (start > end) {
			ui.report.summary_filter_end_d.addClass ('error');
			ui.report.summary_filter_end_d_error.show ();
			ui.report.summary_filter_shifts.empty ();
			ui.report.summary_filter_users.empty ();
			return undefined;
		}

		ui.report.summary_filter_end_d.removeClass ('error');
		ui.report.summary_filter_end_d_error.hide ();

		end.setDate (end.getDate () + 1); // Range is start <= x < end
		return { start: start, end: end };
	}

	function super_report_summary_filter_refresh (cb) {
		var res = super_report_summary_filter_validate_start_end ();
		if (!res)
			return;

		APP.charp.request ('supervisor_get_shifts', [res.start, res.end],
						   function (shifts) { super_report_summary_filter_refresh_success (shifts, cb); });
	}

	function super_report_summary_select_populate (select, key) {
		var opts = {};
		var shifts = super_report_summary_shifts;

		select.find ('option').each (
			function (i, opt) {
				opts[opt.value] = { selected: opt.selected };
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
				var option = $('<option value="' + val + '"' +
								 ((opts[val].selected)? ' selected="selected"': '') +
							   '>' + val + '</option>');
				option.on ('mousedown', super_report_summary_filter_multi_select_mousedown);
				select.append (option);
			}
	}

	function super_report_summary_filter_refresh_success (shifts, cb) {
		var dict = {};
		for (var shift of shifts)
			dict[shift.shift_id] = shift;
		shifts.byId = dict;
		super_report_summary_shifts = shifts;
		
		super_report_summary_select_populate (ui.report.summary_filter_users, 'cashier');
		super_report_summary_select_populate (ui.report.summary_filter_shifts, 'shift_id');

		if (shifts.length > 0) {
			ui.report.summary_filter_users_all.button ('enable');
			ui.report.summary_filter_shifts_all.button ('enable');
		} else {
			ui.report.summary_filter_users_all.button ('disable');
			ui.report.summary_filter_shifts_all.button ('disable');
		}

		if (cb)	cb ();
	}

	var super_report_summary_params;
	var super_report_summary_params_str;
	var super_report_summary_records;
	function super_report_summary_filter_submit (evt) {
		evt.preventDefault ();

		var dates = super_report_summary_filter_validate_start_end ();
		if (!dates)
			return;

		if (!super_report_summary_filter_validate_shifts ())
			return;

		APP.history.go (MOD_NAME, ui.report.summary, 'super-report-summary');
		shell.navShow ();

		var shifts = [];
		ui.report.summary_filter_shifts.find ('option').each (
			function (i, opt) {
				var opt = $(opt);
				if (opt.is (':selected'))
					shifts.push (parseInt (opt.prop ('value')));
			});
		if (shifts.length == 0)
			shifts = null;
		
		var params = { dates: dates, shifts: shifts };
		var params_str = JSON.stringify (params);
		if (super_report_summary_params_str && params_str == super_report_summary_params_str) {
			super_report_summary_do (super_report_summary_records);
			return;
		}

		super_report_summary_request (params, params_str);
	}

	function super_report_summary_request (params, params_str) {
		APP.charp.request ('supervisor_summary_report', [params.dates.start, params.dates.end, params.shifts],
						   function (records) {
							   super_report_summary_params = params;
							   super_report_summary_params_str = params_str;
							   super_report_summary_records = records; 
							   super_report_summary_do (records)
						   });
	}

	function super_report_summary_do (records) {
		ui.report.tickets.summary_timestamp.text (new Date ().toLocaleString ());
		ui.report.tickets.summary_start.text (super_report_summary_params.dates.start.toLocaleString ());
		ui.report.tickets.summary_end.text (super_report_summary_params.dates.end.toLocaleString ());

		ui.report.summary_start.text (super_report_summary_params.dates.start.toLocaleString ());
		ui.report.summary_end.text (super_report_summary_params.dates.end.toLocaleString ());

		APP.mod.report.shiftSummaryReport (ui.report, 'summary', records);
	}

	function super_report_summary_reload () {
		ui.report.summary_reload.button ('disable');
		super_report_summary_request (super_report_summary_params, super_report_summary_params_str);
		APP.later (function () {
			ui.report.summary_reload.button ('enable');
		}, 1000);
	}

	function super_report_summary_print () {
		APP.mod.devices.print (ui.report.tickets.summary);
	}

	function super_report_summary_close () {
		APP.history.back ('super-report-summary');
		shell.navShow ();
		shell.menuCollapse (false);
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
