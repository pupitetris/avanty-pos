// This file is part of Microsafe AVANTY. -*- tab-width: 4; -*-
//
// Copyright © 2017 Microsafe, S.A. de C.V.
// Derechos Reservados (R) 2017 Microsafe, S.A. de C.V.

(function () {
	var MOD_NAME = 'devices';

	var devices_config = {};

	// ASCII control characters.
	var A = {
		NUL: '\x00',	SOH: '\x01',	STX: '\x02',	ETX: '\x03',
		EOT: '\x04',	ENQ: '\x05',	ACK: '\x06',	BEL: '\x07',
		 BS: '\x08',	TAB: '\x09',	 LF: '\x0A',	 VT: '\x0B',
		 FF: '\x0C',	 CR: '\x0D',	 SO: '\x0E',	 SI: '\x0F',
		DLE: '\x10',	DC1: '\x11',	DC2: '\x12',	DC3: '\x13',
		DC4: '\x14',	NAK: '\x15',	SYN: '\x16',	ETB: '\x17',
		CAN: '\x18',	 EM: '\x19',	SUB: '\x1A',	ESC: '\x1B',
		 FS: '\x1C',	 GS: '\x1D',	 RS: '\x1E',	 US: '\x1F',
		 SP: '\x20'
	}

	// 1px is 1/96 in
	var PX_PER_IN = 96;
	
	function px2int (px) {
		return parseInt (px.replace ('px', ''));
	}

	function chr (num) {
		if (! (num >= 0 && num <= 255))
			throw 'chr ' + num + ' out of bounds';
		return String.fromCharCode (num);
	}

	function css_font_weight (weight) {
		switch (weight) {
		case '100':
		case '200':
		case '300':
		case '400':
		case '500':
		case '600':
		case '700':
		case '800':
		case '900':
			return parseInt (weight);
		case 'normal': return 400;
		case 'bold': return 700;
		}
	}

	function css_color (color) {
		switch (color) {
		case 'rgb(255, 255, 255)'	: return 'white';
		case 'rgb(255, 0, 0)'		: return 'red';
		case 'rgb(0, 0, 0)'			: return 'black';
		case 'rgba(0, 0, 0, 0)'		: return 'transparent';
		}
		return color;
	}

	function css_parse_transform_matrix (transform) {
		if (transform == 'none')
			return [1, 0, 0, 1, 0, 0];

		return transform.substring (transform.indexOf ('(') + 1, transform.length - 1)
			.split (', ').map (function (n) { return parseInt (n); });
	}

	function escpos_get_css (element) {
		return {
			background_color		: css_color (element.css ('background-color')),
			color					: css_color (element.css ('color')),
			font_size				: px2int (element.css ('font-size')),
			font_style				: element.css ('font-style'),
			font_weight				: css_font_weight (element.css ('font-weight')),
			letter_spacing			: px2int (element.css ('letter-spacing')),
			position				: element.css ('position'),
			text_align				: element.css ('text-align'),
			text_decoration_line	: element.css ('text-decoration-line'),
			text_decoration_style	: element.css ('text-decoration-style'),
			text_transform			: element.css ('text-transform'),
			transform_matrix		: css_parse_transform_matrix (element.css ('transform')),
			white_space				: element.css ('white-space')
		}
	}

	// root is the container for the printing structure
	function escpos_reset_state (printer, root) {
		return {
			printer: printer,
			element: root,
			css: escpos_get_css (root),
			mode: 'standard',
			motion: {
				x: printer.defaults.motion.x, // 1/x'ths of an inch
				y: printer.defaults.motion.y  // 1/y'ths of an inch
			},
			standard: {
				upside_down: 0,
				line_spacing: printer.defaults.standard.line_spacing,
				unidirectional: 0,
				justification: 0
			},
			page: {
				print_direction: 0, // 0 left-right, 1 bottom-top, 2 right-left, 3 top-bottom
				line_spacing: printer.defaults.page.line_spacing,
				unidirectional: 1
			},
			char_spacing: 0,
			underline: 0,
			emphasis: 0,
			font: 0,
			char_size: { width: 1, height: 1 },
			double_strike: 0,
			reverse: 0,
			color: 0
		};
	}

	function escpos_text_apply_white_space (white_space, text) {
		switch (white_space) {
		case 'normal':
		case 'nowrap':
			// Collapse all white space.
			return text
				.replace (/\s+/g, ' ');
		case 'pre-line':
			// Collapse all white space, preserve line feeds.
			return text
				.replace (/[ \t]+/g, ' ')
				.replace (/ ?\n ?/g, '\n');
		}
		return text;
	}

	function escpos_text_capitalize (text) {
		var ret = '';
		var in_word = false;
		var c;
		for (var i = 0; c = text.charAt (i); i++) {
			if (!in_word) {
				if (c.match (/[a-záéíóúñü]/i)) {
					in_word = true;
					c = c.toUpperCase ();
				}
			} else {
				if (c.match (/[^a-záéíóúñü0-9]/i))
					in_word = false;
			}
			ret += c;
		}
		return ret;
	}

	function escpos_text_apply_transform (transform, text) {
		switch (transform) {
		case 'capitalize':
			return escpos_text_capitalize (text);
		case 'uppsercase':
			return text.toUpperCase ();
		case 'lowercase':
			return text.toLowerCase ();
		}
		return text;
	}

	function escpos_print_text (state, text) {
		text = escpos_text_apply_white_space (state.css.white_space, text);
		text = escpos_text_apply_transform (state.css.text_transform, text);
		return text;
	}

	function escpos_print_text_node (state, node) {
		var text = escpos_print_text (state, node.get (0).textContent);

		switch (state.css.white_space) {
		case 'normal':
		case 'nowrap':
			if (!node_find (node, node_prev, node_is_inline_and_not_br, true))
				text = text.replace (/^\s+/, '');
			if (text && !node_find (node, node_next, node_is_inline_and_not_br, true))
				text = text.replace (/\s+$/, '');
			break;
		case 'pre-line':
			if (!node_find (node, node_prev, node_is_inline_and_not_br, true))
				text = text.replace (/^[ \t]+/, '');
			if (text && !node_find (node, node_next, node_is_inline_and_not_br, true))
				text = text.replace (/[ \t]+$/, '');
			break;
		}

		return text;
	}

	function element_get_pseudo_content (element, pseudo) {
		var content = window.getComputedStyle (element.get (0), pseudo).getPropertyValue ('content');
		return (content == 'none')? '': content;
	}

	function node_name (node) {
		if (!node.get (0))
			return '';

		return node.get (0).nodeName.toUpperCase ();
	}

	function node_is_inline_and_not_br (node) {
		if (node_name (node) == 'BR')
			return false;
		return node_is_inline (node);
	}

	function node_is_inline (node) {
		if (!node.get (0))
			return false;

		if (node.get (0).nodeType == Node.TEXT_NODE)
			return true;

		if (node.get (0).nodeType != Node.ELEMENT_NODE)
			return false;

		return node.css ('display').indexOf ('inline') == 0;
	}

	function node_is_visible (node) {
		if (!node.get (0))
			return false;

		var type = node_type (node);

		if (type == Node.TEXT_NODE)
			return node.get (0).textContent.match (/[^\s]/) && node_is_visible (node.parent ());

		if (type != Node.ELEMENT_NODE) // comment or sth else.
			return false;
		
		if (!node.is (':visible'))
			return false;

		if (node_is_inline (node)) {
			if (node_name (node) == 'BR')
				return true;
			return node.width () > 0;
		}
		
		return node.height () > 0;
	}

	function node_find (node, move, criteria, stop_on_false) {
		for (node = move (node); node.length; node = move (node)) {
			var type = node_type (node);
			if (type != Node.ELEMENT_NODE && type != Node.TEXT_NODE)
				continue; // skip comments and alike.
			if (criteria (node))
				return node;
			else if (stop_on_false)
				break;
		}
		return undefined;
	}

	function node_type (node) {
		if (!node.get (0))
			return undefined;
		return node.get (0).nodeType;
	}

	function node_prev (node) {
		if (node_type (node) == Node.ELEMENT_NODE)
			return $(node.get (0).previousSibling);
		return node.prev ();
	}

	function node_next (node) {
		if (node_type (node) == Node.ELEMENT_NODE)
			return $(node.get (0).nextSibling);
		return node.next ();
	}

	function data_append (data1, data2) {
		for (var d of data2) {
			if (typeof data1[data1.length - 1] == 'string' && typeof d == 'string')
				data1[data1.length - 1] += d;
			else
				data1.push (d);
		}
	}

	function escpos_print_contents (printer, node, reset, state) {
		var data = [];
		node.contents ().each (function (i, node) {
			var node_data = escpos_print (printer, $(node), reset, state);
			if (node_data) data_append (data, node_data);
		});
		return data;
	}

	function escpos_state_get_horizontal_unit (state) {
		if (state.mode == 'standard')
			return state.motion.x;

		if (state.page.print_direction == 0 || state.page.print_direction == 2)
			return state.motion.x;
		return state.motion.y;
	}

	function escpos_state_get_vertical_unit (state) {
		if (state.mode == 'standard')
			return state.motion.y;

		if (state.page.print_direction == 0 || state.page.print_direction == 2)
			return state.motion.y;
		return state.motion.x;
	}

	function escpos_horizontal_pixels_to_units (state, pixels) {
		var unit = escpos_state_get_vertical_unit (state);
		return Math.round (pixels * unit / PX_PER_IN);
	}

	function escpos_vertical_pixels_to_units (state, pixels) {
		var unit = escpos_state_get_vertical_unit (state);
		return Math.round (pixels * unit / PX_PER_IN);
	}

	// Merge given state with what can be inferred from element.
	// Return new copy of state.
	function escpos_merge_state (state, element, reset) {
		var new_state = $.extend (true, {}, state);
		var css = escpos_get_css (element);
		new_state.css = css;
		new_state.element = element;

		new_state.char_spacing = escpos_horizontal_pixels_to_units (state, css.letter_spacing);

		new_state.underline = (css.text_decoration_line == 'none')? 0:
			APP.Util.objGet (css.text_decoration_style, 'double', { solid: 1, double: 2 });
		
		new_state.emphasis = (css.font_style == 'italic')? 1: 0;

		new_state.font = (css.font_size == 11)? 0: 1;

		new_state.char_size.width = Math.round (Math.abs (css.transform_matrix[0]));
		new_state.char_size.height = Math.round (Math.abs (css.transform_matrix[3]));

		new_state.double_strike = (css.font_weight >= 700)? 1: 0;

		new_state.standard.upside_down = (css.transform_matrix[0] < 0 && css.transform_matrix[3] < 0)? 1: 0;

		new_state.reverse = (css.color == reset.css.background_color &&
							 (css.background_color == reset.css.color ||
							  css.background_color == reset.printer.second_color))? 1: 0;

		new_state.color = (css[(new_state.reverse)? 'background_color' : 'color'] == reset.css.color)?
			0: 1;

		new_state.standard.justification = APP.Util.objGet (css.text_align, 'left', { left: 0, center: 1, right: 2 });

		return new_state;
	}

	function escpos_print_cmd (key, state) {
		switch (key) {
		case 'char_spacing'	: return A.ESC + ' ' + chr(state[key]);
		case 'underline'	: return A.ESC + '-' + chr(state[key]);
		case 'emphasis'		: return A.ESC + 'E' + chr(state[key]);
		case 'font'			: return A.ESC + 'M' + chr(state[key]);
		case 'char_size'	: return A.GS  + '!' + chr((state[key].width - 1) * 16 +
													   (state[key].height - 1));
		case 'double_strike': return A.ESC + 'G' + chr(state[key]);
		case 'upside_down'	: return A.ESC + '{' + chr(state[key]);
		case 'reverse'		: return A.GS  + 'B' + chr(state[key]);
		case 'color'		: return A.ESC + 'r' + chr(state[key]);
		case 'justification': return A.ESC + 'a' + chr(state.standard[key]);

		case 'initialize'	: return A.ESC + '@';
		case 'cut'			: return A.GS  + 'VA' +
				chr(escpos_vertical_pixels_to_units (state, state.printer.cutter_distance));
		case 'partial_cut'	: return A.GS  + 'VB' +
				chr(escpos_vertical_pixels_to_units (state, state.printer.cutter_distance));
		}
		return '';
	}

	function escpos_decode_code128C (data) {
		var chars = '{C';

		// Pad with a zero on the left if length is odd.
		if (data.length % 2 > 0) {
			console.warn ('CODE128C length is not even!');
			data = '0' + data;
		}

		for (var i = 0; i < data.length; i += 2)
			chars += chr (parseInt (data.substr (i, 2)));

		return chars;
	}

	function escpos_barcode_get_config (element, state) {
		var config = {};

		// HRI: Human Readable Interpretation
		var hri_above = false;
		var hri_below = false;
		var figs = element.find ('figcaption');
		figs.each (function (i, e) {
			if (node_name ($(e).next ()) == 'DIV')
				hri_above = true;
			if (node_name ($(e).prev ()) == 'DIV')
				hri_below = true;
		});

		var hri_pos = 0;
		if (hri_above) hri_pos += 1;
		if (hri_below) hri_pos += 2;

		config.hri_pos = hri_pos;

		if (state) {
			config.font = (state.css.font_size == 11)? 0: 1;
			config.height = escpos_vertical_pixels_to_units (state, element.find ('div').height ());
		}

		var width = parseInt (element.attr ('data-width'));
		if (!width) width = 2;
		config.width = width;

		var system = element.attr ('data-system');
		if (!system) system = 'CODE128C';
		config.system = system;

		return config;
	}

	function escpos_print_barcode (element, state) {
		var data = [];

		var config = escpos_barcode_get_config (element, state);

		data.push (A.GS + 'H' + chr(config.hri_pos));

		if (config.hri_pos)
			data.push (A.GS + 'f' + chr (config.font));

		data.push (A.GS + 'w' + chr(config.width));
		data.push (A.GS + 'h' + chr(config.height));

		var data_chars = element.attr ('data-chars');
		var chars = (config.system == 'CODE128C')?
			escpos_decode_code128C (data_chars) :
			decodeURIComponent (data_chars);

		// Barcode system
		var m = APP.Util.objGet (config.system, null,
			{
				UPCA	: 'A',
				UPCE	: 'B',
				JAN13	: 'C',
				EAN13	: 'C',
				JAN8	: 'D',
				EAN8	: 'D',
				CODE39	: 'E',
				ITF		: 'F',
				CODABAR	: 'G',
				CODE93	: 'H',
				CODE128	: 'I',
				CODE128C: 'I'
			});

		// Number of characters
		var n = APP.Util.objGet (config.system, null,
			{
				UPCA	: 12,
				UPCE	: 12,
				JAN13	: 13,
				EAN13	: 13,
				JAN8	: 8,
				EAN8	: 8,
				CODE39	: chars.length,
				ITF		: chars.length,
				CODABAR	: chars.length,
				CODE93	: chars.length,
				CODE128	: chars.length,
				CODE128C: chars.length
			});

		data.push (A.GS + 'k' + m + chr(n) + chars);

		return data;
	}

	function escpos_print_state_changes (olds, news) {
		var str = '';

		if (news.mode == 'standard') {
			if (olds.standard.justification != news.standard.justification)
				str += escpos_print_cmd ('justification', news);
			if (olds.standard.upside_down != news.standard.upside_down)
				str += escpos_print_cmd ('upside_down', news);
		}

		var keys = ['font', 'char_spacing', 'underline', 'emphasis', 'double_strike', 'reverse', 'color'];
		for (var key of keys)
			if (olds[key] != news[key])
				str += escpos_print_cmd (key, news);

		if (olds.char_size.width != news.char_size.width ||
			olds.char_size.height != news.char_size.height)
			str += escpos_print_cmd ('char_size', news);

		return str;
	}

	function escpos_print_element (printer, element, reset, state) {
		var data = [];

		if (!node_is_visible (element))
			// a non-displaying element doesn't render itself nor its descendants.
			return;

		var is_inline = node_is_inline (element);

		if (element != reset.element &&	!is_inline &&
			node_find (element, node_prev, node_is_visible, true))
			// If we are not inline and not the first visible node:
			data.push (A.LF);

		var new_state = escpos_merge_state (state, element, reset);
		var changes = escpos_print_state_changes (state, new_state);
		if (changes) data.push (changes);

		var before = element_get_pseudo_content (element, ':before')
		if (before)	data.push (escpos_print_text (state, before));

		var process_contents_flag = true;
		switch (node_name (element)) {
			// Special-case elements that render besides their css and contents.
			case 'ARTICLE':
				data.push (escpos_print_cmd ('initialize', new_state));
				break;
			case 'HR':
				var cmd = (element.css ('border-style') == 'dotted')? 'partial_cut': 'cut';
				data.push (escpos_print_cmd (cmd, new_state));
				break;
			case 'IMG':
				data.push ({
					type: 'raw',
					format: 'image',
					data: printer.basedir + '/' + element.attr ('src'),
					options: { language: state.printer.qz_type, dotDensity: 'double' }
				});
				break;
			case 'FIGURE':
				process_contents_flag = false;
				data_append (data, escpos_print_barcode (element, new_state));
				break;
			case 'BR': 
				data.push (A.LF);
				break;
		}

		if (process_contents_flag && element.contents ().length > 0)
			data_append (data, escpos_print_contents (printer, element, reset, new_state));

		var after = element_get_pseudo_content (element, ':after')
		if (after) data.push (escpos_print_text (state, after));

		if (element != reset.element && !is_inline &&
			node_find (element, node_next, node_is_visible))
			// If we are not inline and not the last visible node:
			data.push ((new_state.css.position == 'absolute')? A.CR: A.LF);

		if (changes) // use states in inverted order to generate reverting commands.
			data.push (escpos_print_state_changes (new_state, state));

		return data;
	}

	function escpos_print (printer, node, reset, state) {
		if (!reset) reset = escpos_reset_state (printer, node);
		if (!state)	state = escpos_reset_state (printer, node);
		
		switch (node_type (node)) {
			case (Node.COMMENT_NODE): return null;
			case (Node.TEXT_NODE): return escpos_print_text_node (state, node);
			case (Node.ELEMENT_NODE): return escpos_print_element (printer, node, reset, state);
		}

		console.warn ('Unrecognized node type ' + node.nodeType);
		return null;
	}

	var print_methods = {
		ESCPOS: escpos_print
	};

	function escpos_ticket_layout (ticket) {
		ticket.find ('figure').each (
			function (i, e) {
				var ele = $(e);
				var config = escpos_barcode_get_config (ele);

				var barcode, length;
				if (config.system == 'CODE128C') {
					var chars = ele.attr ('data-chars');
					if (!chars) chars = '';
					if (chars.length % 2 > 0)
						chars = '0' + chars;
					barcode = ' ' + chars;
					length = chars.length / 2 + 1;
				} else {
					// FIXME: this code is not ready.
					length = 0;
					barcode = ele.attr ('data-chars')
						.replace (/{.|%../g, function (m) {
							length ++;
							if (m == '{{')
								return '{';
							if (m[0] == '%') { // This works for CODE C, need for A & B at least.
								var n = parseInt (m.substr (1), 16);
								return APP.Util.padZeroes (n, 2);
							}
							return ' ';
						});
				}

				// width is a horizontal scale factor.
				if (config.width > 2)
					ele.find ('figcaption').css ('letter-spacing', (0.9 * (config.width - 2)) + 'ex');

				ele.find ('div').width ((0.125 + 0.0625 * length) * PX_PER_IN * config.width);
				ele.find ('figcaption').text (barcode);
			});

		// Logos and such.
		ticket.find ('img').each (
			function (i, e) {
				var ele = $(e);
				if (ele.hasClass ('processed'))
					return;
				ele.addClass ('processed');
				ele.css ('width', (ele.width () / 2) + 'px');
			});
	}

	// Dump data in a nice format so the stream can be analized easily.
	function escpos_debug_data (data) {
		var str = '';
		data.map (function (d) { str += d.toString (); });

		var map = {
			'%0A': '↓\n',
			'%0D': '←\n', //↵
			'%1B': '[ESC]',
			'%1D': '[GS]',
			'%20': '·',
			'%23': '#',
			'%2C': ',',
			'%3A': ':',
			'%40': '@',
			'%5B': '[',
			'%5D': ']'
		};
			
		return APP.Util.mapReplace (encodeURIComponent (str), map);
	}

	var qz_private_key;
	var qz_certificate;

	function qz_signature_promise (to_sign) {
		return function (resolve, reject) {
			try {
				var pk = KEYUTIL.getKey (qz_private_key);
				var sig = new KJUR.crypto.Signature ({ alg: 'SHA1withRSA' });
				sig.init (pk); 
				sig.updateString (to_sign);
				var hex = sig.sign ();
				resolve (stob64 (hextorstr (hex)));
			} catch (err) {
				console.error (err);
				reject (err);
			}
		};
	}

	function qz_certificate_promise (resolve, reject) {
		try {
			resolve (qz_certificate);
		} catch (err) {
			console.error (err);
			reject (err);
		}
	}

	function qz_sha_get_hash (str) {
		var sha = new jsSHA (str, 'ASCII');
		return sha.getHash ('SHA-256', 'HEX');
	}

	function qz_native_promise (resolver) {
		return new Promise (resolver);
	}

	function qz_error_handler (err) {
		console.log (err);
		APP.msgDialog ({
			icon: 'printer-error',
			desc: 'Fallo al conectar con el servidor de dispositivos.',
			msg: err.message,
			sev: CHARP.ERROR_SEV['INTERNAL'],
			title: 'Error de comunicación',
			opts: { width: '75%' }
		});
	}

	function qz_str_encode_to_raw_hex (printer, str) {
		var data = '';
		var bytes = iconv.encode (str, printer.qz_options.encoding);
		for (var b of bytes)
			data += ((b < 16)? '0': '') + b.toString (16);
		return { type: 'raw', format: 'hex', data: data };
	}

	var qz_conf;

	var mod = {
		init: function () {
			qz.api.setSha256Type (qz_sha_get_hash);
			qz.api.setPromiseType (qz_native_promise);
			qz.security.setSignaturePromise (qz_signature_promise);
			qz.security.setCertificatePromise (qz_certificate_promise);
			mod.initialized = true;
		},

		onLoad: function () {
			if (!mod.loaded)
				return;

			mod.reset ();
		},

		reset: function () {
		},

		// Dynamic layout and css adjustments to make tickets look good on screen.
		escposTicketLayout: escpos_ticket_layout,

		print: function (element, cb) {
			if (!devices_config.printer)
				throw 'devices: no printer configured';

			function do_print (conf) {
				var data = print_methods[devices_config.printer.type] (devices_config.printer, element);

				for (var i = 0; i < data.length; i++)
					if (typeof data[i] == 'string')
						data[i] = qz_str_encode_to_raw_hex (devices_config.printer, data[i]);

				qz.print (conf, data).catch (qz_error_handler).then (cb);
			}

			if (qz.websocket.isActive ())
				do_print (qz_conf);
			else
				qz.websocket.connect (devices_config.qz_connect).then (
					function () {
						qz_conf = qz.configs.create (devices_config.printer.name,
													 devices_config.printer.qz_options);
						do_print (qz_conf);
					})
				.catch (qz_error_handler);
		},

		configure: function (new_config) {
			devices_config = new_config;
		},

		setQzCredentials: function (key, cert) {
			qz_private_key = key;
			qz_certificate = cert;
		}
	};

	APP.addModule (MOD_NAME, mod);
}) ();
