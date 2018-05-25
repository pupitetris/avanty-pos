// This file is part of Microsafe AVANTY. -*- tab-width: 4; -*-
//
// Copyright © 2017-2018 Microsafe, S.A. de C.V.
// Derechos Reservados (R) 2017-2018 Microsafe, S.A. de C.V.

(function () {
	var MOD_NAME = 'rate_edit';

	var ui = {};
	var forth;

	function layout_init () {
		mod.loaded = true;
		mod.onLoad ();
	}

	// Regenerate the rate script based on the rate's steps.
	function rate_edit_render_rate_script (rate) {
		var script = '';
		for (var step of rate.steps) {
			script += 'define desc " ' + step.desc + ' " ; ';
			for (var param of step.params) {
				var value;
				switch (typeof param.value) {
				case 'undefined': value = '0'; break;
				case 'string': value = '"' + param.value + '"'; break;
				default:
					value = param.value.toString ();
				}
				script += value + ' ';
			}
			script += 'desc ' + step.func + '\n';
		}
		return script;
	}

	// Factorized code.
	function rate_edit_parse_functions (script) {
		var res = forth.run (script);
		var funcs = JSON.parse ('[' + res.output.join ('') + '0]');
		funcs.pop ();
		for (var f of funcs)
			f.params.reverse ();
		return funcs;
	}

	function rate_edit_get_rates (cb) {
		APP.charp.request ('rate_edit_get_rates', [],
						   function (rates) {
							   for (var r of rates)
								   r.steps = rate_edit_parse_functions (r.script);
							   if (cb)
								   cb (rates);
						   });
	}

	function rate_edit_get_functions (cb) {
		forth.load ('_json_proto',
					function (script) {
						var funcs = rate_edit_parse_functions (script);
						if (cb)
							cb (funcs);
					});
	}

	function rate_edit_forth_reset (cb) {
		forth.reset (function () {
			forth.load ('_json',
						function (script) {
							forth.run (script);
							cb ();
						});
		});
	}

	var mod = {
		init: function () {
			mod.initialized = true;
			APP.loadModule ('forth', undefined, undefined,
							function (mod) {
								forth = mod;
								rate_edit_forth_reset ();
							});
		},

		onLoad: function () {
			if (!mod.loaded)
				return;

			mod.reset ();
		},

		reset: function () {
		}
	};

	APP.addModule (MOD_NAME, mod);
}) ();
