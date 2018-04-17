// This file is part of Microsafe AVANTY. -*- tab-width: 4; -*-
//
// Copyright © 2017 Microsafe, S.A. de C.V.
// Derechos Reservados (R) 2017 Microsafe, S.A. de C.V.

(function () {
	var MOD_NAME = 'super';

	var ui = {};
	var shell;

	function report_filter_time_layout_init (prefix, name, filter) {
		var name_prefix = prefix + '-' + name;
		if ($('#super-report-' + name_prefix + '-h-sel').length == 0)
			return;

		filter.h_sel = $('#super-report-' + name_prefix + '-h-sel');
		filter.h = filter.section.find ('button[name="' + name + '_h"]');
		filter.h_txt = filter.h.find ('span');
		filter.m_sel = $('#super-report-' + name_prefix + '-m-sel');
		filter.m = filter.section.find ('button[name="' + name + '_m"]');
		filter.m_txt = filter.m.find ('span');

		function handle_select (option, sel, txt) {
			sel.find ('.avanty-option').avaOption ('selected', false);
			option.avaOption ('selected', true);
			sel.popup ('hide');
			txt.text (option.text ());
			filter.m.button ('enable');
		}

		filter.h_sel.popup ();
		filter.h_sel.avaSelect ();
		filter.h_sel.on ('avanty:optionSelect',
						 function (evt, option, selected) {
							 handle_select (option, filter.h_sel, filter.h_txt);
						 });
		filter.h.on ('click', function (evt) { filter.h_sel.popup ('toggle'); })

		filter.m_sel.popup ();
		filter.m_sel.avaSelect ();
		filter.m_sel.on ('avanty:optionSelect',
						 function (evt, option, selected) {
							 handle_select (option, filter.m_sel, filter.m_txt);
						 });
		filter.m.on ('click', function (evt) { filter.m_sel.popup ('toggle'); })

		function option_append (select, txt, opts) {
			var option = $('<div>' + txt + '</div>').avaOption (opts);
			select.append (option);
			return option;
		}

		var m_opt_0 = option_append (filter.m_sel, '00', { selected: true });
		option_append (filter.h_sel, '00', { selected: name == 'start' });
		for (var i = 1; i < 24; i++)
			option_append (filter.h_sel, APP.Util.padZeroes (i, 2));

		if (name == 'end') {
			filter.h_txt.text ('24');
			var opt = option_append (filter.h_sel, '24', { selected: true });
			filter.m.button ('disable');
			opt.on ('avanty:select',
					function (evt) {
						APP.later (function () {
							handle_select (m_opt_0, filter.m_sel, filter.m_txt);
							filter.m.button ('disable');
						}, 100);
					});
		}

		for (var i = 1; i < 60; i ++)
			option_append (filter.m_sel, APP.Util.padZeroes (i, 2));
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

		report.filter_start = { section: report.filter_section };
		report.filter_start.d = $('#super-report-' + prefix + '-start-d');
		report.filter_start.d_txt = report.filter_start.d.find ('span');
		report.filter_start.d_cal = $('#super-report-' + prefix + '-start-d-cal');
		report.filter_start.d_cal.popup ();

		report.filter_end = { section: report.filter_section };
		report.filter_end.d = $('#super-report-' + prefix + '-end-d');
		report.filter_end.d_txt = report.filter_end.d.find ('span');
		report.filter_end.d_cal = $('#super-report-' + prefix + '-end-d-cal');
		report.filter_end.d_cal.popup ();

		report.filter_end.d_error = report.filter_end.d.find ('.error');
		report.filter_end.d_error.hide ();

		report.filter_users = $('#super-report-' + prefix + '-users');
		report.filter_users.avaSelect ();
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
		report.filter_shifts.avaSelect ();
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
		report.filter_start.d_txt.text (todayStr);
		report.filter_end.d_txt.text (todayStr);

		report.filter_start.d.on ('click', function () {
			report.filter_start.d_cal.popup ('toggle');
		})
		report.filter_end.d.on ('click', function () {
			report.filter_end.d_cal.popup ('toggle');
		})

		var calopts = {
			minDate: APP.config.startDate, // activation date, recovered from DB during activation check.
			maxDate: 0,
			firstDay: APP.config.weekFirstDay,
			changeMonth: true,
			changeYear: true,
			dateFormat: 'yy/mm/dd'
		};

		report.filter_start.d_cal.datepicker ($.extend ({
			onSelect: function (date, inst) {
				super_report_filter_cal_selected (prefix, date, inst, report.filter_start); }
		}, calopts));

		report.filter_end.d_cal.datepicker ($.extend ({
			onSelect: function (date, inst) {
				super_report_filter_cal_selected (prefix, date, inst, report.filter_end); }
		}, calopts));

		// Initialize time filter controls if they are present.
		report_filter_time_layout_init (prefix, 'start', report.filter_start);
		report_filter_time_layout_init (prefix, 'end', report.filter_end);

		report.filter_cancel = $('#super-report-' + prefix + '-filter-cancel');
		report.filter_cancel.on ('click', function () { super_report_close (prefix); });

		report.section = $('#super-report-' + prefix);
		report.section.find ('button').button ();
		report.start = report.section.find ('.start');
		report.end = report.section.find ('.end');
		report.table = report.section.find ('tbody');
		report.reload = $('#super-report-' + prefix + '-reload');
		report.reload.on ('click', function () { super_report_reload (prefix); });
		report.close = $('#super-report-' + prefix + '-close');
		report.close.on ('click', function () { super_report_close (prefix); });

		return report;
	}

	function layout_init () {
		ui.sections_parent = $('#super-sections');
		ui.section_main = $('#super-main');

		mod.shell = shell = APP.shellCreate (ui.sections_parent);

		shell.ui.logout.on ('click', super_logout);

		shell.ui.user_create = $('#super-tab-user-create');
		// Note: APP.mod.super_users does not exist during init, hence the anonymous function:
		shell.ui.user_create.on ('click', function () { APP.mod.super_users.createUser (); });

		shell.ui.report_summary = $('#super-tab-report-summary');
		shell.ui.report_summary.on ('click', function () { super_report_filter ('summary'); });

		shell.ui.report_detail = $('#super-tab-report-detail');
		shell.ui.report_detail.on ('click', function () { super_report_filter ('detail'); });

		ui.report = {};
		ui.report.summary = report_layout_init ('summary');
		ui.report.detail = report_layout_init ('detail');
		
		ui.report.summary.received = ui.report.summary.section.find ('.received');
		ui.report.summary.change = ui.report.summary.section.find ('.change');
		ui.report.summary.charged = ui.report.summary.section.find ('.charged');
		ui.report.summary.balance = ui.report.summary.section.find ('.balance');
		ui.report.summary.charged_tickets = ui.report.summary.section.find ('.charged-tickets');
		ui.report.summary.printed_tickets = ui.report.summary.section.find ('.printed-tickets');
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

		ui.report.detail.cont = ui.report.detail.section.find ('.detail-cont');

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

	function super_main_message (msg) {
		ui.super_main_message.html (msg);
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

	function super_report_filter_select_all_or_none (prefix, button, select) {
		var state = button.data ('state');
		if (!state || state == 'all') {
			button.data ('state', 'none');
			button.find ('span').text ('Seleccionar ninguno');
			button.find ('img').prop ('src', button.find ('img').prop ('src').replace (/[^/.]+\.svg$/, 'none.svg'));
			select.find ('div').each (function (i, opt) { $(opt).avaOption ('selected', true); });
		} else {
			button.data ('state', 'all');
			button.find ('span').text ('Seleccionar todos');
			button.find ('img').prop ('src', button.find ('img').prop ('src').replace (/[^/.]+\.svg$/, 'all.svg'));
			select.find ('div').each (function (i, opt) { $(opt).avaOption ('selected', false); });
		}

		if (button.prop ('id') == 'super-report-' + prefix + '-users-all')
			super_report_filter_update_shifts (prefix);

		super_report_filter_validate_shifts (prefix);
	}

	var super_report_shifts = {};
	function super_report_filter_update_shifts (prefix) {
		var cashiers = {};
		var shifts = super_report_shifts[prefix];

		ui.report[prefix].filter_users.find ('.avanty-option').each (
			function (i, opt) {
				cashiers[$(opt).avaOption ('value')] = { selected: $(opt).avaOption ('selected') }
			});

		ui.report[prefix].filter_shifts.find ('.avanty-option').each (
			function (i, opt) {
				$(opt).avaOption ('selected', cashiers[shifts.byId[$(opt).avaOption ('value')].cashier].selected);
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
	
	function super_report_filter_cal_selected (prefix, date, inst, filter) {
		filter.d_cal.popup ('hide');

		filter.d_txt.text (date);
		inst.dpDiv.parent ().fadeOut ();

		super_report_filter_refresh (prefix);
	}

	function super_report_filter_get_date (date_ui) {
		var str = date_ui.d_txt.text ();
		if (!date_ui.h_txt)
			return new Date (str);

		var h_txt = date_ui.h_txt.text ();
		if (h_txt == '24')
			h_txt = '00';
		var date = new Date (str + ' ' + h_txt + ':' + date_ui.m_txt.text ());
		if (date_ui.h_txt.text () == '24')
			// Add a whole day.
			date.setTime (date.getTime () + 1000 * 60 * 60 * 24);
		return date;
	}

	function super_report_filter_validate_start_end (prefix) {
		var report = ui.report[prefix];
		var start = super_report_filter_get_date (report.filter_start);
		var end = super_report_filter_get_date (report.filter_end);

		if (start > end) {
			report.filter_end.d.addClass ('error');
			report.filter_end.d_error.show ();
			report.filter_shifts.empty ();
			report.filter_users.empty ();
			return undefined;
		}

		report.filter_end.d.removeClass ('error');
		report.filter_end.d_error.hide ();

		// Range is start <= x < end
		if (!report.filter_end.h) {
			// if we are only requesting date, add one whole day.
			end.setDate (end.getDate () + 1);
		}
		
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
				opts[$(opt).avaOption ('value')] = { selected: $(opt).avaOption ('selected') };
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
				var option = $('<div>' + val + '</div>').avaOption ({ value: val, selected: opts[val].selected });
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
				if (opt.avaOption ('selected'))
					shifts.push (parseInt (opt.avaOption ('value')));
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

	function super_report_detail_do (records) {
		ui.report.detail.start.text (super_report_params['detail'].dates.start.toLocaleString ());
		ui.report.detail.end.text (super_report_params['detail'].dates.end.toLocaleString ());
		
		APP.mod.report.shiftDetailReport (ui.report, 'detail', records);
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
			APP.loadModule ('super_users', function (mod) {
				if (mod.checkSupervisorCreated ()) {
					APP.hourglass.enable ();
					APP.switchPage (MOD_NAME);
					super_main ();
				}
			});
		}
	};

	APP.addModule (MOD_NAME, mod);
}) ();
