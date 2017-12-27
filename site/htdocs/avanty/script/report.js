// This file is part of Microsafe AVANTY. -*- tab-width: 4; -*-
//
// Copyright © 2017 Microsafe, S.A. de C.V.
// Derechos Reservados (R) 2017 Microsafe, S.A. de C.V.

// Module for report processing and formatting.
(function () {
	var MOD_NAME = 'report';

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
					rates[rate[name]] = rate;
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
				var shift_begin_ts;

				ui[prefix + '_table'].empty ();
				for (var rec of records) {
					if (rec.change) change += rec.change;

					if (rec.rate) {
						var rate = rates[rec.rate.name];
						rate.count ++;
						rate.amount += rec.amount;
					}

					switch (rec.concept) {
					case 'entry':
						printed_tickets ++;
						break;
					case 'exit':
					case 'lost':
						charged_tickets ++;
						charged += rec.amount;
						break;
					case 'shift_begin':
						num_deposits ++;
						deposit += rec.amount;
						if (num_deposits == 1) {
							shift_begin_ts = rec.timestamp.toLocaleString ();
							if (ui.tickets[prefix + '_begin_time'])
								ui.tickets[prefix + '_begin_time'].text (rec.timestamp.toLocaleString ());
						} else
							shift_begin_ts = '';
						break;
					case 'shift_end':
						ui.tickets[prefix + '_num'].text (rec.amount);
						ui.tickets[prefix + '_time'].text (rec.timestamp.toLocaleString ());
					}

					if (desc[rec.concept]) {
						pre += '<div class="desc">' + rec.timestamp.toLocaleString () + ' ' + desc[rec.concept] + '</div>\n' +
							'<div class="sum">$' + APP.Util.asMoney (rec.amount) + '</div>\n';
						ui[prefix + '_table'].append ($('<tr>' +
														'<td>' + rec.timestamp.toLocaleString () + '</td>' +
														'<th>' + desc[rec.concept] + '</th>' +
														'<td><s/></td><td class="money">' + APP.Util.asMoney (rec.amount) + '</td>' +
														'</tr>'));
					}
				}

				pre += '<div class="desc">' + shift_begin_ts + ' Dotación:</div>\n' +
					'<div class="sum">$' + APP.Util.asMoney (deposit) + '</div>\n';
				ui[prefix + '_table'].append ($('<tr>' +
												'<td style="text-align: right">' + shift_begin_ts + ' (' + num_deposits + ')</td>' +
												'<th>Dotación:</th>' +
												'<td><s/></td><td class="money">' + APP.Util.asMoney (deposit) + '</td>' +
												'</tr>'));
				
				ui[prefix + '_table'].append ($('<tr><th>Tarifas:</th><td colspan="3"></td></tr>'));
				for (var rate of rate_data) {
					pre += '<div class="desc">Tarifa: ' + rate.label_client + '</div>\n' +
						'<div class="sum">(' + rate.count + ') $' + APP.Util.asMoney (rate.amount) + '</div>\n';
					ui[prefix + '_table'].append ($('<tr>' +
													'<td style="text-align: right">(' + rate.count + ')</td>' +
													'<th>' + rate.label + ':</th>' +
													'<td><s/></td><td class="money">' + APP.Util.asMoney (rate.amount) + '</td>' +
													'</tr>'));
				}

				var received = charged + deposit + change;

				received = APP.Util.asMoney (received);
				pre += '<div class="sum">Recibido: $' + received + '</div><br />\n';
				ui[prefix + '_received'].text (received);

				change = APP.Util.asMoney (change);
				pre += '<div class="sum">Devuelto: $' + change + '</div><br />\n';
				ui[prefix + '_change'].text (change);

				charged = APP.Util.asMoney (charged);
				pre += '<br /><div class="sum">Cobrado: $' + charged + '</div>\n';
				ui[prefix + '_charged'].text (charged);

				pre += '<div class="sum">Boletos cobrados: ' + charged_tickets + '</div>';
				ui[prefix + '_charged_tickets'].text (charged_tickets);

				pre += '<div class="sum">Boletos emitidos: ' + printed_tickets + '</div>';
				ui[prefix + '_printed_tickets'].text (printed_tickets);

				ui.tickets[prefix + '_terminal'].text (APP.terminal.name);
				ui.tickets[prefix + '_user'].text (APP.charp.credentialsGet ().login);
				ui.tickets[prefix + '_items'].html (pre);
				APP.mod.devices.escposTicketLayout (ui.tickets[prefix]);
			});
		}

	};

	APP.addModule (MOD_NAME, mod);
}) ();
