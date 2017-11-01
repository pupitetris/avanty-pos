// This file is part of Microsafe AVANTY. -*- tab-width: 4; -*-
//
// Copyright © 2017 Microsafe, S.A. de C.V.
// Derechos Reservados (R) 2017 Microsafe, S.A. de C.V.

(function () {
	var MOD_NAME = 'cash';

	var ui = {};
	var shell;

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
		validator_options.ignore = "";

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
		ui.section_main = $('#cash-main');

		shell = APP.shellCreate (ui.sections_parent);

		shell.ui.logout.on ('click', cash_logout);

		shell.ui.park_entry = $('#cash-tab-park-entry');
		shell.ui.park_entry.on ('click', cash_park_entry);

		shell.ui.park_exit = $('#cash-tab-park-exit');
		shell.ui.rent_entry = $('#cash-tab-rent-entry');
		shell.ui.rent_exit = $('#cash-tab-rent-exit');
		shell.ui.rent_search = $('#cash-tab-rent-search');
		shell.ui.rent_create = $('#cash-tab-rent-create');

		pass_layout_init ('chpass', { submitHandler: cash_chpass_submit });

		ui.tickets = {};
		ui.tickets.entry = $('#cash-ticket-entry');
		ui.tickets.entry_time = ui.tickets.entry.find ('time');
		ui.tickets.entry_terminal = ui.tickets.entry.find ('.term');
		ui.tickets.entry_barcode = ui.tickets.entry.find ('figure');
		APP.later (function () { APP.mod.devices.escposTicketLayout (ui.tickets.entry); }, 100);

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
		if (APP.mod.login.is_first) {
			// End of first login exception. Restore and go back to main screen.
			APP.mod.login.is_first = false;
			ui.chpass_title.text (chpass_title);
			cash_main ();
		} else
			APP.history.back ();
	}

	// entry and exit in seconds since epoch.
	function barcode_get_type_and_length (entry, exit) {
		if (!exit) return '0'; // No exit yet; it's an entry ticket.

		var exit_delta = exit - entry;
		if (exit_delta < 0)
			throw 'ticket exitDate is smaller than entryDate.';

		if (exit_delta < 1000)
			return '3' + APP.String.padZeroes (exit_delta, 3);

		if (exit_delta < 10000)
			return '4' + APP.String.padZeroes (exit_delta, 4);

		if (exit_delta < 100000)
			return '5' + APP.String.padZeroes (exit_delta, 5);

		// Too many seconds, go for minutes:
		exit_delta = Math.floor (exit_delta / 60);
		if (exit_delta < 100000)
			return '8' + APP.String.padZeroes (exit_delta, 5);

		// Too many minutes, go for hours:
		exit_delta = Math.floor (exit_delta / 60);
		// This may fail, but it would be a +11 year stay:
		return '9' + APP.String.padZeroes (exit_delta, 5);
	}

	// partial barcode with the checksum missing.
	function barcode_collect_bytes (barcode, count) {
		var advance = Math.floor (barcode.length / 2) - 1;
		var len = barcode.length;
		var pos = advance;
		var need = 1;
		var got = 0;
		var num = 0;
		var bytes = '';
		while (bytes.length < count) {
			var digit = parseInt(barcode[pos]);
			if (num < 10 || num * 10 + digit < 256) {
				num = num * 10 + digit;
				pos = (pos + advance) % len;
			}

			got ++;
			if (got > need) {
				bytes += String.fromCharCode (num);
				num = 0;
				got = 0;
				need = (need + 1) % 3; // 2^8-1 has 3 digits.
			}
		}
		return bytes;
	}

	// partial barcode with the checksum missing.
	function barcode_calc_checksum (barcode) {
		// First, collect bytes for the salt from barcode, trying to get a nice variety of values.
		// bcrypt requires 22 base64 characters for the salt. That's 16 bytes:
		var bytes = barcode_collect_bytes (barcode, 16);

		// Convert to Base64 and trim trailing padding chars (=). For 16 bytes, that's always two:
		// Also non-conformingly replace + with . or bcrypt will complain.
		var base64 = btoa (bytes).substr (0, 22).replace (/\+/g, '.');

		// OK, we got our proper salt, configured for 2^8 bcrypt iterations:
		var salt = '$2a$08$' + base64;

		// Now encrypt our secret with the salt.
		var crypt = dcodeIO.bcrypt.hashSync ('secret', salt);

		// Get hash part and fix non-conforming use of . for +
		var hash64 = crypt.substr (30).replace (/\./g, '+');

		// Decode the base64 hash and get the 10th byte. That's our number.
		var c = atob (hash64).charCodeAt (10);

		return APP.String.padZeroes (c, 3);
	}

	function barcode_get (ticket) {
		// Field 1: terminal ID
		var barcode = APP.String.padZeroes (ticket.terminalId, 2);

		// Field 2: timestamp
		var entry_time = Math.floor (ticket.entryDate.getTime () / 1000);

		// That magic number is secs since epoch for 2017-01-01 00:00:00-00:00
		barcode += APP.String.padZeroes (entry_time - 1483228800, 9); 

		// Fields 3 & 4: ticket type and stay length.
		var exit_time = (!ticket.exitDate)? 0: Math.floor (ticket.exitDate.getTime () / 1000);
		barcode += barcode_get_type_and_length (entry_time, exit_time);

		barcode += barcode_calc_checksum (barcode);

		if (barcode.length % 2 > 0)
			barcode += '0';
		
		return barcode;
	}

	function cash_park_entry () {
		var ticket = {
			terminalId: APP.terminalId,
			entryDate: new Date ()
		}

		var barcode = barcode_get (ticket);

		ui.tickets.entry_time.text (ticket.entryDate.toLocaleString ());
		ui.tickets.entry_terminal.text (APP.terminalName);
		ui.tickets.entry_barcode.attr ('data-chars', barcode);

		APP.mod.devices.escposTicketLayout (ui.tickets.entry);
		APP.mod.devices.print (ui.tickets.entry);
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
