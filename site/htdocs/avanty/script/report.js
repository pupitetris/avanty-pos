// This file is part of Microsafe AVANTY. -*- tab-width: 4; -*-
//
// Copyright © 2017 Microsafe, S.A. de C.V.
// Derechos Reservados (R) 2017 Microsafe, S.A. de C.V.

// Module for report processing and formatting.
(function () {
	var MOD_NAME = 'report';

	function render_shift_ids (shift_ids) {
		if (shift_ids.length == 0)
			return '---';

		var shift_str = '';

		var end = shift_ids[0];
		var count = 1;

		shift_str += end;

		for (var i = 1, id = shift_ids[1]; id; id = shift_ids[++i]) {
			if (id == end + 1) {
				end = id;
				count ++;
			}
			if (id > end + 1 || i == shift_ids.length - 1) {

				var post = ' ' + id;
				if (i == shift_ids.length - 1)
					post = '';

				switch (count) {
				case 1:
					shift_str += ' ' + id;
					break;
				case 2:
					shift_str += ' ' + end + post;
					break;
				default:
					shift_str += '-' + end + post;
				}
				end = id;
				count = 1;
			}
		}

		return shift_str;
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

				var shift_ids_str = render_shift_ids (shift_ids);
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
		}

	};

	APP.addModule (MOD_NAME, mod);
}) ();
