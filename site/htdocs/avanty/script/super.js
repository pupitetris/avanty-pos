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
			minlength: 8,
			maxlength: 255
		};
		rules[name + '-pass2'] = {
			'pass-confirm': { param: pass }
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
		shell.ui.report_summary.on ('click', super_report_summary);

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
		ui.report.summary = $('#super-report-summary');
		for (var c of ['shift_begin', 'shift_end', 'entry', 'exit', 'lost',
					   'shift_begin_amount', 'charge', 'change', 'deposit', 'total'])
			ui.report[c] = ui.report.summary.find ('.' + c);
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
			shell.show (true);
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
		} else
			shell.backGo ();

		ui.super_chpass_submit.button ('enable');
		ui.super_chpass_cancel.button ('enable');
	}

	function super_create_super () {
		APP.switchSection (ui.section_newsuper);

		if (super_is_first)
			shell.show (false);
		else
			shell.show (true);

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
		shell.show (true);
		shell.navShow ();
		shell.setStatus (APP.config.establishment +
						 ' Versión: ' + APP.config.version +
						 ' Terminal: ' + APP.terminal.name, true);
		shell.menuCollapse (false);

		APP.history.setHome (MOD_NAME, ui.section_main);
		APP.switchSection (ui.section_main);
	}

	function super_report_summary () {
		APP.history.go (MOD_NAME, ui.section_report, 'super-report-summary');
		shell.navShow ();
		shell.menuCollapse ();

		if (super_report_records) {
			super_report_summary_do (super_report_records);
			return;
		}

		super_report_summary_request ();
	}

	function super_report_summary_request () {
		APP.charp.request ('supervisor_terminal_report', [APP.terminal.id], super_report_summary_do);
	}

	var super_report_records;

	function super_report_summary_do (records) {
		super_report_records = records;

		var summary = {
			shift_begin: '',
			shift_end: '',
			entry: 0,
			exit: 0,
			lost: 0,
			shift_begin_amount: 0,
			charge: 0,
			change: 0,
			deposit: 0,
			total: 0
		};
		
		for (var rec of records) {
			switch (rec.concept) {
			case 'shift_begin':
				summary.shift_begin_amount = rec.amount;
			case 'shift_end':
				summary[rec.concept] = rec.start.toLocaleString ();
				break;
			case 'entry':
				summary.entry ++;
				if (rec.amount)
					summary.charge += rec.amount;
				if (rec.end)
					summary.exit ++;
				break;
			case 'deposit':
				summary.deposit += rec.amount;
				break;
			case 'lost':
				summary.lost ++;
				summary.charge += amount;
				break;
			}
			if (rec.change)
				summary.change += rec.change;
		}
		summary.total = summary.charge + summary.deposit + summary.shift_begin_amount;

		var i = 0;
		$.each (summary,
				function (k, v) {
					var str = ui.report[k].hasClass ('money')? APP.Util.asMoney (v): v.toString ();
					ui.report[k].text (str);
					$(ui.tickets.report_summary_items.get (i)).text (str);
					i++;
				});

		ui.tickets.report_summary_term.text (APP.terminal.name);
		APP.mod.devices.escposTicketLayout (ui.tickets.report_summary);
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
