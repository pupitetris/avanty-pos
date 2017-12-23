// This file is part of Microsafe AVANTY. -*- tab-width: 4; -*-
//
// Copyright © 2017 Microsafe, S.A. de C.V.
// Derechos Reservados (R) 2017 Microsafe, S.A. de C.V.

(function () {
	var MOD_NAME = 'barcode';

	// Secs since epoch for 2017-01-01 00:00:00-00:00
	var AVANTY_EPOCH = 1483228800;

	var barcode_valid_re = new RegExp ('^([0-9]{15}0|[0-9]{18}|[0-9]{20})$');

	// entry and exit in seconds since epoch.
	function barcode_get_type_and_length (entry, exit) {
		if (!exit) return '0'; // No exit yet; it's an entry ticket.

		var exit_delta = exit - entry;
		if (exit_delta < 0)
			throw 'ticket exitDate is smaller than entryDate.';

		if (exit_delta < 1000)
			return '3' + APP.Util.padZeroes (exit_delta, 3);

		if (exit_delta < 10000)
			return '4' + exit_delta;

		if (exit_delta < 100000)
			return '5' + exit_delta;

		// Too many seconds, go for minutes:
		exit_delta = Math.floor (exit_delta / 60);
		if (exit_delta < 100000)
			return '8' + APP.Util.padZeroes (exit_delta, 5);

		// Too many minutes, go for hours:
		exit_delta = Math.floor (exit_delta / 60);
		// This may fail, but it would be a >11 year stay:
		return '9' + APP.Util.padZeroes (exit_delta, 5);
	}

	// barcode: partial barcode without the checksum.
	function barcode_collect_bytes (barcode, count) {
		var advance = Math.floor (barcode.length / 2) - 1;
		var len = barcode.length;
		var pos = advance;
		var need = 1;   // number of digits needed to form the next byte.
		var got = 0;    // number of digits we got already.
		var num = 0;    // the number we are currently collecting.
		var bytes = ''; // resulting string.
		while (bytes.length < count) {
			var digit = parseInt(barcode[pos]);
			if (num < 10 || num * 10 + digit < 256) {
				num = num * 10 + digit;
				pos = (pos + advance) % len;
			}

			got ++;
			if (got > need) {
				bytes += String.fromCharCode (num);
				num = got = 0;
				need = (need + 1) % 3; // 2^8-1 has 3 digits.
			}
		}
		return bytes;
	}

	// barcode: partial barcode without the checksum.
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
		var crypt = dcodeIO.bcrypt.hashSync (APP.config.barcodeSecret, salt);

		// Get hash part and fix non-conforming use of . for +
		var hash64 = crypt.substr (29).replace (/\./g, '+');

		// Decode the base64 hash and get the 10th byte. That's our number.
		var c = atob (hash64).charCodeAt (10);

		return APP.Util.padZeroes (c, 3);
	}

	// Receives a ticket object and returns the barcode digit string to print on the ticket.
	function barcode_generate (fields) {
		// Field 1: terminal ID
		var barcode = APP.Util.padZeroes (fields.terminalId, 2);

		// Field 2: timestamp
		var entry_time = Math.floor (fields.entryDate.getTime () / 1000);

		barcode += APP.Util.padZeroes (entry_time - AVANTY_EPOCH, 9); 

		// Fields 3 & 4: ticket type and stay length
		var exit_time = (!fields.exitDate)? 0: Math.floor (fields.exitDate.getTime () / 1000);
		barcode += barcode_get_type_and_length (entry_time, exit_time);

		// Field 5: signature
		barcode += barcode_calc_checksum (barcode);

		if (barcode.length % 2 > 0)
			barcode += '0';
		
		return barcode;
	}

	// Returns a fields object detailing the information in the barcode.
	function barcode_parse (barcode) {
		var fields = { isValid: true };

		if (!barcode_valid_re.exec (barcode)) {
			if (barcode.length < 16)
				barcode = APP.Util.padZeroes (barcode, -16);
			barcode = barcode.replace (/[^0-9]/g, '0');
			fields.isValid = false;
		}
		
		// Field 1: terminal ID
		fields.terminalId = parseInt (barcode.substr (0, 2));

		// Field 2: timestamp
		var entry_secs = parseInt (barcode.substr (2, 9)) + AVANTY_EPOCH;
		fields.entryDate = new Date (entry_secs * 1000);

		// Fields 3 & 4: ticket type and stay length.
		var type_digit = parseInt (barcode.substr (11, 1));
		var multiplier, exit_field_len;
		switch (type_digit) {
		case 0:
			fields.type = 'entry';
			exit_field_len = 0;
			break;
		case 3:
		case 4:
		case 5:
			fields.type = 'exit';
			multiplier = 1; // seconds
			exit_field_len = type_digit;
			break;
		case 8:
			fields.type = 'exit';
			multiplier = 60; // minutes
			exit_field_len = 5;
			break;
		case 9:
			fields.type = 'exit';
			multiplier = 3600; // hours
			exit_field_len = 5;
			break;
		default:
			fields.isValid = false;
		}

		if (fields.type == 'exit') {
			var secs = parseInt (barcode.substr (12, exit_field_len)) * multiplier;
			fields.exitDate = new Date ((entry_secs + secs) * 1000);
		}

		// Field 5: signature
		if (fields.isValid) {
			var chk = barcode_calc_checksum (barcode.substr (0, 12 + exit_field_len));
			if (chk != barcode.substr (12 + exit_field_len, 3))
				fields.isValid = false;
		}

		return fields;
	}

	function barcode_validate (val, ele) {
		return barcode_parse (val).isValid;
	}

	var mod = {
		init: function () {
			mod.initialized = true;
			$.validator.addMethod ('barcode', barcode_validate, 'El código ingresado no es válido.');
		},

		onLoad: function () {
		},

		generate: function (fields) {
			return barcode_generate (fields);
		},

		parse: function (barcode) {
			return barcode_parse (barcode);
		}
	};

	APP.addModule (MOD_NAME, mod);
}) ();
