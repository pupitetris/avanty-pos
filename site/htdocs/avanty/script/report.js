// This file is part of Microsafe AVANTY. -*- tab-width: 4; -*-
//
// Copyright © 2017 Microsafe, S.A. de C.V.
// Derechos Reservados (R) 2017 Microsafe, S.A. de C.V.

// Module for report processing and formatting.
(function () {
	var MOD_NAME = 'report';

	// Render a minimal string listing an array of numbers, but using dash to abbreviate ranges.
	// Ex: [1, 2, 5, 6, 7, 8, 9, 11, 22] -> "1, 2, 5 - 9, 11, 22"
	// For the tickets.
	function render_number_list (numbers) {
		if (numbers.length == 0)
			return '---';

		var str = '';

		var end = numbers[0];
		var count = 1;

		str += end;

		for (var i = 1, id = numbers[1]; id; id = numbers[++i]) {
			if (id == end + 1) {
				end = id;
				count ++;
			}
			if (id > end + 1 || i == numbers.length - 1) {

				var post = ' ' + id;
				if (i == numbers.length - 1)
					post = '';

				switch (count) {
				case 1:
					str += ' ' + id;
					break;
				case 2:
					str += ' ' + end + post;
					break;
				default:
					str += '-' + end + post;
				}
				end = id;
				count = 1;
			}
		}

		return str;
	}

	function find_ui (ui, prefix, key) {
		var ele = ui[prefix + '_' + key];
		if (ele) return ele;

		if (ui[prefix] && ui[prefix][key])
			return ui[prefix][key];

		return undefined;
	}

	var mod = {
		init: function () {
			mod.initialized = true;
		},

		onLoad: function () {
			if (!mod.loaded)
				return;

			mod.reset ();
		},

		reset: function () {
			APP.switchPage (MOD_NAME);
			APP.switchSection (ui.section_first, ui.sections_parent);
		},

		shiftSummaryReport: function (ui, prefix, records) {
			APP.fetch ('rates_get', 'REPORT', [], true, function (rate_data) {
				var rates = {};
				for (var rate of rate_data) {
					rates[rate.name] = rate;
					rate.count = 0;
					rate.amount = 0;
				}
				
				var desc = {
					deposit: 'Depósito:'
				};

				var charged = 0;
				var change = 0;
				var deposit = 0;
				var num_deposits = 0;
				var charged_tickets = 0;
				var printed_tickets = 0;
				var pre = '';
				var shift_begin_ts = '';
				var shift_ids = [];
				var last_shift_id = 0;

				var table = find_ui (ui, prefix, 'table');
				table.empty ();

				for (var rec of records) {
					if (rec.rate) {
						var rate = rates[rec.rate];
						rate.count ++;
						rate.amount += rec.amount;
					}

					switch (rec.concept) {
					case 'entry':
						if (rec.terminal_name == APP.terminal.name)
							printed_tickets ++;
						if (!rec.rate)
							break;
					case 'exit':
					case 'lost':
						charged_tickets ++;
						charged += rec.amount;
						if (rec.change)
							change += rec.change;
						break;
					case 'shift_begin':
						num_deposits ++;
						deposit += rec.amount;
						last_shift_id = (rec.shift_id)? rec.shift_id: rec.change;
						shift_ids.push (last_shift_id);
						if (shift_ids.length == 1) {
							shift_begin_ts = rec.timestamp.toLocaleString ();
							if (find_ui (ui.tickets, prefix, 'begin_time'))
								find_ui (ui.tickets, prefix, 'begin_time').text (shift_begin_ts);
						} else
							shift_begin_ts = '';
						break;
					case 'shift_end':
						if (find_ui (ui.tickets, prefix, 'num'))
							find_ui (ui.tickets, prefix, 'num').text (rec.amount);
						if (find_ui (ui.tickets, prefix, 'time'))
							find_ui (ui.tickets, prefix, 'time').text (rec.timestamp.toLocaleString ());
						break;
					case 'deposit':
						if (rec.shift_id && rec.shift_id != last_shift_id) // New shift record coming, this is the initial deposit.
							break;
						num_deposits ++;
						deposit += rec.amount;
						break;
					default:
						if (!desc[rec.concept]) {
							console.warn ('Unknown concept ' + rec.concept);
							break;
						}

						pre += '<div class="desc">' + rec.timestamp.toLocaleString () + ' ' + desc[rec.concept] + '</div>\n' +
							'<div class="sum">$' + APP.Util.asMoney (rec.amount) + '</div>\n';
						table.append ($('<tr>' +
										'<td>' + rec.timestamp.toLocaleString () + '</td>' +
										'<th>' + desc[rec.concept] + '</th>' +
										'<td><s/></td><td class="money">' + APP.Util.asMoney (rec.amount) + '</td>' +
										'</tr>'));
					}

				}

				var shift_ids_str = render_number_list (shift_ids);
				if (find_ui (ui.tickets, prefix, 'shift_id'))
					find_ui (ui.tickets, prefix, 'shift_id').text (shift_ids_str);
				if (find_ui (ui, prefix, 'shift_id'))
					find_ui (ui, prefix, 'shift_id').text (shift_ids_str);

				var deposit_str = (num_deposits > 1)? 'Dotaciones:': 'Dotación:';
				pre += '<div class="desc">' + shift_begin_ts + ' ' + deposit_str + '</div>\n' +
					'<div class="sum">$' + APP.Util.asMoney (deposit) + '</div>\n';
				table.append ($('<tr>' +
								'<td style="text-align: right">' + shift_begin_ts + ' (' + num_deposits + ')</td>' +
								'<th>' + deposit_str + '</th>' +
								'<td><s/></td><td class="money">' + APP.Util.asMoney (deposit) + '</td>' +
								'</tr>'));
				
				table.append ($('<tr><th>Cobros por tarifa:</th><td colspan="3"></td></tr>'));
				for (var rate of rate_data) {
					pre += '<div class="desc">Tarifa: ' + rate.label_client + '</div>\n' +
						'<div class="sum">(' + rate.count + ') $' + APP.Util.asMoney (rate.amount) + '</div>\n';
					table.append ($('<tr>' +
									'<td style="text-align: right">(' + rate.count + ')</td>' +
									'<th>' + rate.label + ':</th>' +
									'<td><s/></td><td class="money">' + APP.Util.asMoney (rate.amount) + '</td>' +
									'</tr>'));
				}

				var received = charged + deposit + change;
				var balance = received - change;

				received = APP.Util.asMoney (received);
				pre += '<br /><div class="sum">Recibido: $' + received + '</div><br />\n';
				find_ui (ui, prefix, 'received').text (received);

				change = APP.Util.asMoney (change);
				pre += '<div class="sum">Devuelto: $' + change + '</div><br />\n';
				find_ui (ui, prefix, 'change').text (change);

				charged = APP.Util.asMoney (charged);
				pre += '<div class="sum">Cobrado: $' + charged + '</div><br />\n';
				find_ui (ui, prefix, 'charged').text (charged);

				balance = APP.Util.asMoney (balance);
				pre += '<div class="sum">Balance: $' + balance + '</div>\n';
				find_ui (ui, prefix, 'balance').text (balance);

				pre += '<div class="sum">Boletos cobrados: ' + charged_tickets + '</div>';
				find_ui (ui, prefix, 'charged_tickets').text (charged_tickets);

				pre += '<div class="sum">Boletos emitidos: ' + printed_tickets + '</div>';
				find_ui (ui, prefix, 'printed_tickets').text (printed_tickets);

				find_ui (ui.tickets, prefix, 'terminal').text (APP.terminal.name);
				find_ui (ui.tickets, prefix, 'user').text (APP.charp.credentialsGet ().login);
				find_ui (ui.tickets, prefix, 'items').html (pre);

				var ticket = ui.tickets[prefix];
				if (!ticket.length)
					ticket = ticket.section;
				APP.mod.devices.layoutTicket (ticket);
			});
		},

		// options are for DataTable
		shiftDetailReport: function (ui, prefix, records, options) {
			APP.fetch ('rates_get', 'REPORT', [], true, function (rate_data) {

				var rates = {unknown: { label_client: 'Desconocido'} };
				for (var rate of rate_data)
					rates[rate.name] = rate;

				var table = find_ui (ui, prefix, 'table');
				
				function td_create (val, td_class) {
					if (val === null || val === undefined)
						val = '';
					else {
						switch (td_class) {
						case 'money': val = APP.Util.asMoney (val); break;
						case 'date': val = val.getFullYear () + '/' + (val.getMonth () + 1) + '/' + val.getDate () + ' ' +
								APP.Util.padString (val.getHours ().toString (), 2) + ':' +
								APP.Util.padZeroes (val.getMinutes (), 2) + ':' +
								APP.Util.padZeroes (val.getSeconds (), 2);
							break;
						}
					}
					var class_str = (td_class === undefined)? '': ' class="' + td_class + '"';
					
					return $('<td' + class_str + '>' + ((val === null || val === undefined)? '': val.toString ()) + '</td>');
				}

				var shift_colors = {};
				function get_shift_color (shift_id) {
					if (!shift_colors[shift_id])
						shift_colors[shift_id] = '#' + window.MD5 (shift_id.toString ()).replace (/[0-9abc]/g, '').substring (0, 3);
					return shift_colors[shift_id];
				}

				var concept2label = {
					deposit: 'Depósito',
					shift_begin: 'Inicio turno',
					entry: 'Entrada',
					exit: 'Salida',
					shift_end: 'Fin turno'
				};
				var real_table = table.get (0);
				if (real_table.tagName == 'TBODY')
					real_table = real_table.parentElement;
				real_table = $(real_table);

				if (real_table.hasClass ('dataTable'))
					real_table.avaDataTable ().destroy ();
				table.empty ();

				var last_shift_id = 0;
				for (var rec of records) {
					switch (rec.concept) {
					case 'deposit':
						if (rec.shift_id != last_shift_id)
							continue;
						break;
					case 'shift_begin':
						last_shift_id = rec.shift_id;
						break;
					}

					var rate = APP.Util.objGet (rec.rate, 'unknown', rates);
					var rate_label = (rate)? rate.label_client: null;
					var tr = $('<tr />');
					tr.append (td_create (rec.timestamp, 'date'));
					tr.append (td_create (rec.terminal_name));
					tr.append (td_create (rec.shift_id, 'num'));
					tr.append (td_create (rec.cashier));
					tr.append (td_create (APP.Util.objGet (rec.concept, null, concept2label), 'concept'));
					tr.append (td_create (rate_label));
					tr.append (td_create (rec.amount, 'money'));
					tr.append (td_create (rec.change, 'money'));

					tr.css ('background-color', get_shift_color (rec.shift_id));

					table.append (tr);
				}

				real_table.avaDataTable (options);
			});
		}
	};

	APP.addModule (MOD_NAME, mod);
}) ();
