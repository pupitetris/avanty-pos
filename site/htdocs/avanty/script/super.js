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

		ui.section_report = $('#super-report');
		ui.section_report.find ('button').button ();
		ui.report = {};

		ui.report.summary_filter_section = $('#super-report-summary-filter');
		ui.report.summary_filter_section.find ('form');
		ui.report.summary_filter_section.find ('button').button ();
		ui.report.summary_filter_start_d = $('#super-report-summary-start-d');
		ui.report.summary_filter_start_d_txt = ui.report.summary_filter_start_d.find ('span');
		ui.report.summary_filter_start_d_cal = $('#super-report-summary-start-d-cal');
		ui.report.summary_filter_end_d = $('#super-report-summary-end-d');
		ui.report.summary_filter_end_d_txt = ui.report.summary_filter_end_d.find ('span');
		ui.report.summary_filter_end_d_cal = $('#super-report-summary-end-d-cal');

		ui.report.summary_filter_users = $('#super-report-summary-users');
		ui.report.summary_filter_shifts = $('#super-report-summary-shifts');

		var now = new Date ();
		var todayStr = now.getFullYear () + '/' +
			APP.Util.padZeroes (now.getMonth () + 1, 2) + '/' +
			APP.Util.padZeroes (now.getDate (), 2);
		ui.report.summary_filter_start_d_txt.text (todayStr);
		ui.report.summary_filter_end_d_txt.text (todayStr);

		function cal_toggle (cal1, cal2) {
			if (cal1.is (':hidden')) {
				cal1.show ('drop', { direction: 'up' }, 200);
				cal2.hide ();
			} else {
				cal1.hide ('drop', { direction: 'up' }, 200);
			}
		}

		ui.report.summary_filter_start_d.on ('click', function () {
			cal_toggle (ui.report.summary_filter_start_d_cal, ui.report.summary_filter_end_d_cal);
		})
		ui.report.summary_filter_end_d.on ('click', function () {
			cal_toggle (ui.report.summary_filter_end_d_cal, ui.report.summary_filter_start_d_cal);
		})

		var calopts = {
			minDate: APP.config.startDate, // activation date, recovered from DB during activation check.
			maxDate: 0,
			firstDay: APP.config.weekFirstDay,
			changeMonth: true,
			changeYear: true,
			dateFormat: 'yy/mm/dd'
		};

		function cal_selected (date, inst, txt) {
			txt.text (date);
			inst.dpDiv.parent ().fadeOut ();
		}

		ui.report.summary_filter_start_d_cal.datepicker ($.extend ({
			onSelect: function (date, inst) { cal_selected (date, inst, ui.report.summary_filter_start_d_txt); }
		}, calopts));
		ui.report.summary_filter_end_d_cal.datepicker ($.extend ({
			onSelect: function (date, inst) { cal_selected (date, inst, ui.report.summary_filter_end_d_txt); }
		}, calopts));

/*
		ui.report.summary_filter_start_h = ui.report.summary_filter_section.find ('select[name="start_h"]');
		ui.report.summary_filter_start_m = ui.report.summary_filter_section.find ('select[name="start_m"]');
		ui.report.summary_filter_start_ampm = ui.report.summary_filter_section.find ('select[name="start_ampm"]');
		ui.report.summary_filter_end_h = ui.report.summary_filter_section.find ('select[name="end_h"]');
		ui.report.summary_filter_end_m = ui.report.summary_filter_section.find ('select[name="end_m"]');
		ui.report.summary_filter_end_ampm = ui.report.summary_filter_section.find ('select[name="end_ampm"]');

		for (var i = 1; i <= 12; i++) {
			var num = APP.Util.padZeroes (i, 2);
			ui.report.summary_filter_start_h.append ($('<option value="' + i + '">' + num + '</option>'));
			ui.report.summary_filter_end_h.append ($('<option value="' + i + '">' + num + '</option>'));
		}

		for (var i = 0; i < 60; i += 5) {
			var num = APP.Util.padZeroes (i, 2);
			ui.report.summary_filter_start_m.append ($('<option value="' + i + '">' + num + '</option>'));
			ui.report.summary_filter_end_m.append ($('<option value="' + i + '">' + num + '</option>'));
		}

		ui.report.summary_filter_start_h.selectmenu ();
		ui.report.summary_filter_start_m.selectmenu ();
		ui.report.summary_filter_start_ampm.selectmenu ();
		ui.report.summary_filter_end_h.selectmenu ();
		ui.report.summary_filter_end_m.selectmenu ();
		ui.report.summary_filter_end_ampm.selectmenu ();
*/

		function multi_select_mousedown (e) {
			e.preventDefault ();
			var originalScrollTop = $(this).parent ().scrollTop ();
			$(this).prop ('selected', $(this).prop ('selected') ? false : true);
			var self = this;
			$(this).parent ().focus ();
			window.setTimeout (function () {
				$(self).parent ().scrollTop (originalScrollTop);
			}, 0);
			
			return false;
		}

		ui.report.summary_filter_users.find ('option').on ('mousedown', multi_select_mousedown);
		ui.report.summary_filter_shifts.find ('option').on ('mousedown', multi_select_mousedown);

		ui.report.summary = $('#super-report-summary');
		ui.report.summary_table = ui.report.summary.find ('tbody');
		ui.report.summary_charged = ui.report.summary.find ('.charged');
		ui.report.summary_received = ui.report.summary.find ('.received');
		ui.report.summary_change = ui.report.summary.find ('.change');
		ui.report.summary_charged_tickets = ui.report.summary.find ('.charged-tickets');
		ui.report.summary_printed_tickets = ui.report.summary.find ('.printed-tickets');
		ui.report.summary_reload = $('#super-report-summary-reload');
		ui.report.summary_reload.on ('click', super_report_summary_reload);
		ui.report.summary_print = $('#super-report-summary-print');
		ui.report.summary_print.on ('click', super_report_summary_print);
		ui.report.summary_close = $('#super-report-summary-close');
		ui.report.summary_close.on ('click', super_report_summary_close);
		
		ui.tickets = {};
		ui.tickets.report_summary = $('#super-ticket-report-summary');
		ui.tickets.report_summary_term = ui.tickets.report_summary.find ('.term');
		ui.tickets.report_summary_items = ui.tickets.report_summary.find ('.items span');

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
	}

	function super_report_summary () {
		APP.history.go (MOD_NAME, ui.section_report, 'super-report-summary');
		shell.navShow ();

		if (super_report_records) {
			super_report_summary_do (super_report_records);
			return;
		}

		super_report_summary_request ();
	}

	function super_report_summary_request () {
		APP.charp.request ('supervisor_terminal_report', [APP.terminal.id], super_report_summary_do);
	}

	function super_report_summary_do (records) {
		APP.mod.report.shiftSummaryReport (ui.report, 'shift_report', records);

		ui.tickets.report_summary_term.text (APP.terminal.name);
		APP.mod.devices.layoutTicket (ui.tickets.report_summary);
	}

	function super_report_summary_reload () {
		ui.report.summary_reload.button ('disable');
		super_report_summary_request ();
		APP.later (function () {
			ui.report.summary_reload.button ('enable');
		}, 1000);
	}

	function super_report_summary_print () {
		APP.mod.devices.print (ui.tickets.report_summary);
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
