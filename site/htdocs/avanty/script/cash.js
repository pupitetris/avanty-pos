// This file is part of Microsafe AVANTY. -*- tab-width: 4; -*-
//
// Copyright © 2017 Microsafe, S.A. de C.V.
// Derechos Reservados (R) 2017 Microsafe, S.A. de C.V.

(function () {
	var MOD_NAME = 'cash';

	var ui = {};
	var shell;

	function layout_init () {
		$.validator.addMethod ('validate-pass2', function (val, ele) {
			var pass_name = ele.name.substring (0, ele.name.length - 1).replace ('-', '_');
			var pass = ui[pass_name].val ();
			return pass == val;
		}, 'Las contraseñas deben de coincidir.');

		ui.sections_parent = $('#cash-sections');
		ui.section_main = $('#cash-main');

		shell = APP.shellCreate (ui.sections_parent);

		shell.ui.logout.on ('click', cash_logout);

		shell.ui.park_enter = $('#cash-tab-park-enter');
		shell.ui.park_exit = $('#cash-tab-park-exit');
		shell.ui.rent_enter = $('#cash-tab-rent-enter');
		shell.ui.rent_exit = $('#cash-tab-rent-exit');
		shell.ui.rent_search = $('#cash-tab-rent-search');
		shell.ui.rent_create = $('#cash-tab-rent-create');

		mod.loaded = true;
		mod.onLoad ();
	}

	function cash_logout () {
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
					'Sí, salir': cash_do_logout,
					'Cancelar': null
				},
				width: '75%'
			}
		});
	}

	function cash_do_logout () {
		APP.loadModule ('login');
	}

	function cash_main_message (msg) {
		ui.cash_main_message.html (msg);
	}

	function cash_main () {
		shell.show (true);
		shell.backShow ();
		APP.history.setHome (MOD_NAME, ui.section_main);
		APP.switchSection (ui.section_main);
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
			APP.hourglass.enable ();
			APP.switchPage (MOD_NAME);
			cash_main ();
		}
	};

	APP.addModule (MOD_NAME, mod);
}) ();
