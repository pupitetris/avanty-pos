// This file is part of Microsafe AVANTY. -*- tab-width: 4; -*-
//
// Copyright © 2017 Microsafe, S.A. de C.V.
// Derechos Reservados (R) 2017 Microsafe, S.A. de C.V.

(function () {

	// jQuery extensions.
	(function ($) {
		// Extend jQuery so we can theme inputs.
		$.fn.input = function () {
			return this.addClass('ui-widget ui-widget-content ui-corner-all');
		};
	} (jQuery));

	function msg_dialog_append_p (parent, contents, className) {
		if (contents && typeof contents.selector != 'undefined') {
			contents.addClass (className);
			if (parent)
				parent.append (contents);
			return contents;
		}
		
		var p = $('<p />');
		if (className)
			p.addClass (className);

		if (typeof contents == 'string') {
			if (contents.indexOf ('<>') == 0)
				p.html (contents.substr (2));
			else
				p.text (contents);
		}

		if (parent)
			parent.append (p);
		return p;
	}

	function Shell () {
		return this;
	}

	(function () {

		function layout_init (sections_parent) {
			var ui = this.ui;

			ui.sections_parent = sections_parent;
			ui.shell = ui.sections_parent.find ('.shell');
			ui.shell.find ('button').button ();

			var lock = ui.shell.find ('.shell-lock');
			if (lock.length > 0) {
				ui.lock = lock;
				ui.lock.on ('click.shell', function () { APP.loadModule ('lock'); });
			}

			var unlock = ui.shell.find ('.shell-unlock');
			if (unlock.length > 0)
				ui.unlock = unlock;

			var logout = ui.shell.find ('.shell-logout');
			if (logout.length > 0)
				ui.logout = logout;

			var back = ui.shell.find ('.shell-back');
			if (back.length > 0) {
				ui.back = back;
				var that = this;
				ui.back.on ('click.shell', function () { that.backGo (); });
			}

			var menu = ui.shell.find ('.shell-menu');
			if (menu.length > 0) {
				var that = this;

				ui.menu = menu;
				ui.menu.tabs (
					{
						active: false,
						collapsible: true,
						show: { effect: 'drop', direction: 'up', duration: 200 },
						hide: { effect: 'drop', direction: 'up', duration: 200 },
						activate: function (evt, ui) {
							that._menu_collapsed = (ui.newTab.length == 0);
						}
					});

				$(window).on ('click.shell_menu',
							  function (evt) {
								  if (that.ui.menu.is (':hidden'))
									  return;
								  if ($(evt.target).closest (that.ui.menu).length < 1)
									  that.menuCollapse ();
							  });
			}

			var status = ui.shell.find ('.shell-status');
			if (status.length > 0)
				ui.status = status;
		}

		Shell.prototype = {
			init: function (sections_parent) {
				this.ui = {};
				this._menu_selected = 0;
				this._menu_collapsed = true;
				layout_init.call (this, sections_parent);
				return this;
			},

			show: function (show) {
				if (show) {
					this.ui.sections_parent.addClass ('with-shell');
					this.ui.shell.show ();
				} else {
					this.ui.sections_parent.removeClass ('with-shell');
					this.ui.shell.hide ();
				}
			},

			menuCollapse: function (collapse) {
				if (!this.ui.menu)
					return;

				if (collapse === undefined)
					collapse = true;

				if (this._menu_collapsed == collapse)
					return;

				this._menu_collapsed = collapse;
				
				if (collapse)
					this._menu_selected = this.ui.menu.tabs ('option', 'active');

				this.ui.menu.tabs ('option', 'active',
								   (collapse)?
								   false: this._menu_selected);
			},

			backShow: function () {
				if (!this.ui.back)
					return;
				
				if (APP.history.length () == 0)
					this.ui.back.hide ();
				else
					this.ui.back.show ();
			},

			backGo: function () {
				// deferr to allow for the button to gain focus and the keyboard to hide.
				var that = this;
				APP.later (function () {
					APP.history.back ();
					that.backShow ();
				});
			}
		}
	}) ();

	function Hourglass () {
		return this;
	}

	Hourglass.prototype = {
		// Provided div should start hidden.
		init: function (div) {
			if (!div) {
				div = this.getDefaultElement ();
				if (div.length == 0) {
					var that = this;
					window.setTimeout (function () { that.div = that.getDefaultElement (); }, 250);
				}
			}
			this.div = div;

			this.setEnabled (false);
			this.setShowing (false);

			return this;
		},

		getDefaultElement: function () {
			return $('#hourglass');
		},

		setEnabled: function (enabled) {
			this.enabled = enabled;
			if (this.showing) {
				if (this.enabled)
					this.div.show ();
				else
					this.div.hide ();
			}
			return this;
		},

		enable: function () { this.setEnabled (true); return this; },

		disable: function () { this.setEnabled (false); return this; },

		setShowing: function (showing) {
			this.showing = showing;
			if (this.enabled) {
				if (this.showing)
					this.div.show ();
				else
					this.div.hide ();
			}
			return this;
		},

		show: function () {	this.setShowing (true); return this; },

		hide: function () {	this.setShowing (false); return this; }
	};

	function Clock () {
		return this;
	}

	(function () {
		var sup = Hourglass.prototype;

		var interval;
		var interval_secs;
		var display_time;

		function update_clock () {
			if (!this.div || !this.div.length)
				return;

			var d = new Date ();

			var new_time =
				util.padZeroes (d.getHours (), 2) + ':' +
				util.padZeroes (d.getMinutes (), 2);
			if (this.useSeconds)
				new_time += ':' + util.padZeroes (d.getSeconds (), 2);

			var new_date =
				d.getFullYear () + '/' +
				util.padZeroes (d.getMonth() + 1, 2) + '/' +
				util.padZeroes (d.getDate (), 2)

			if (display_time) {
				if (display_time == new_time)
					return;
				set_interval.call (this, true, (this.useSeconds)? 1: 60);
			}

			display_time = new_time;
			this.time.text (new_time);
			this.date.text (new_date);
		}

		function set_interval (enable, secs) {
			// disable if an interval call is defined.
			if (!enable && interval) {
				window.clearInterval (interval);
				interval_secs = 0;
				interval = undefined;
				return;
			}
			
			// enable: sets the interval call, but will not if it is already there
			// and the time interval is the same.
			if (this.interval_secs != secs)
				// time interval has changed, so remove old interval call if it exists:
				set_interval.call (this, false);
			
			// we set the new interval, but only if none is currently running.
			if (!interval) {
				this.interval_secs = secs;
				var that = this;
				interval = window.setInterval (function () { update_clock.call (that); }, secs * 1000);
			}
			return;
		}

		function get_subelements (div) {
			this.date = div.find ('.date');
			this.time = div.find ('.time');
		}

		Clock.prototype = {
			__proto__: Hourglass.prototype,
			
			init: function (opts) {
				sup.init.call (this, opts.div);
				if (opts.div && opts.div.length)
					get_subelements.call (this, opts.div);
				this.useSeconds = opts.useSeconds;
				this.enable ();
				this.show ();
				return this;
			},
			
			getDefaultElement: function () {
				var div = $('#clock');
				if (div && div.length)
					get_subelements.call (this, div);
				return div;
			},

			setEnabled: function (enabled) {
				sup.setEnabled.call (this, enabled);
				if (enabled && this.showing) {
					set_interval.call (this, true, 1);
					return;
				}
				set_interval.call (this, false);
			},

			setShowing: function (showing) {
				sup.setShowing.call (this, showing);
				if (showing && this.enabled) {
					set_interval.call (this, true, 1);
					return;
				}
				set_interval.call (this, false);
			},

			// color as null reverts to default color.
			color: function (color) {
				if (color === undefined)
					return this.div.css ('color');
				this.div.css ('color', (color == null)? '': color);
			}
		};
	}) ();

	// Object that helps keeping track of the page-and-section movement
	// and allows the user to go back and forth.
	function History () {
		return this;
	}

	(function () {
		function index_of (process) {
			if (!process)
				return this._curr;

			var idx;
			for (idx = this._curr; idx < this._hist.length; idx++)
				if (this._hist[idx].process == process)
					break;
			return idx;
		}

		History.prototype = {
			// process is a string identifying the process that is changing page.
			// page is a string, usually the id of the module's page.
			push: function (page, section, process, data) {
				this._hist.splice (0, this._curr,
								   { page: page, section: section, process: process, data: data });
				this._curr = 0;
			},

			// You can go back on a specific process, or in general, in a cross-proces way.
			// Returns undefined if you can't pop for that process, or in general, any more.
			pop: function (process) {
				var idx = index_of.call (this, process);
				if (this._curr < this._hist.length)
					this._curr = idx + 1;
				return this._hist[idx];
			},

			// Clear history of matching process or all of it.
			clear: function (process) {
				if (!process) {
					this.init ();
					return;
				}

				for (var i = 0; i < this._hist.length; i++)
					if (this._hist[idx].process == process) {
						if (i < this._curr)
							this._curr --;
						this._hist.splice (i--, 1);
					}
			},
			
			// Just inspect the history, see what is the current slot, if any.
			get: function (process) {
				var idx = index_of.call (this, process);
				return this._hist[idx];
			},

			length: function () {
				return this._hist.length - this._curr;
			},

			setHome: function (page, section) {
				this._home = (page)?
					{ page: page, section: section } :
					undefined;
			},

			go: function (page, section, process) {
				APP.switchPage (page);
				APP.switchSection (section);

				var slot = this.get (process);
				if (slot && slot.page == page && slot.section == section)
					return;

				this.push (page, section, process);
			},

			// Returns true if history was able to change location.
			back: function (process) {
				this.pop (process);
				var slot = this.get (process);
				if (!slot) {
					if (process)
						return false;
					slot = this._home;
				}

				if (!slot)
					return false;

				APP.switchPage (slot.page);
				APP.switchSection (slot.section);
				return true;
			},

			init: function () {
				this._hist = [];
				this._curr = 0;
				return this;
			}
		}
	}) ();

	// CHARP busy handler
	function show_hourglass (busy) {
		APP.hourglass.setShowing (busy);
	}

	var util_money_re = new RegExp ('(-?[0-9]*)\.?([0-9]{0,2})');
	
	var util = {
		// Pad with zeroes to the left to the given width.
		// width < 0 pads to the right to abs(width) width.
		padZeroes: function (num, width) {
			var num_str = num.toString ();

			var to_the_right;
			if (width < 0) {
				to_the_right = true;
				width = -width;
			} else
				to_the_right = false;

			if (num_str.length > width)
				throw 'Number ' + num_str + ' too wide (' + width + ').';
			
			var str = '';
			for (var i = num_str.length; i < width; i++)
				str += '0';

			return (to_the_right)? num_str + str: str + num_str;
		},

		// num is an integer representing money in cents.
		asMoney: function (num) {
			return Math.floor (num / 100).toString () + '.' + util.padZeroes (num % 100, 2);
		},

		// parse a string containing pesos / cents representation and return integer in cents.
		parseMoney: function (str) {
			var match = str.match (util_money_re);
			if (!match)
				return 0;

			var num = parseInt (match[1] + match[2]) * Math.pow (10, 2 - match[2].length);
			if (isNaN (num))
				return 0;
			return num;
		},

		objGet: function (key, def, obj) {
			var res = obj[key];
			return (res === null || res === undefined)? obj[def]: res;
		},

		mapReplace: function (str, map) {
			var re = new RegExp (Object.keys (map).join ('|'), 'gi');
			return str.replace (re, function (m) { return map[m]; });	
		},

		getTimeSecs: function (date) {
			if (!date) date = new Date ();
			return Math.floor (date.getTime () / 1000);
		}
	}

	var hid_handler;

	function hid_handler_send () {
		if (hid_handler.str.length > 0)
			$(document).trigger ('avanty:HID', [ hid_handler.str ]);
		
		hid_handler.str = '';
		hid_handler.timeoutH = undefined;
	}

	function hid_handler_keypress (evt) {
		var c = String.fromCharCode (evt.which);
		hid_handler.str += c;

		if (c == '\r') {
			if (hid_handler.timeoutH)
				window.clearTimeout (hid_handler.timeoutH);
			hid_handler_send ();
			return;
		}
		
		if (!hid_handler.timeoutH)
			hid_handler.timeoutH = window.setTimeout (hid_handler_send, hid_handler.timeout);
	}

	function hid_handler_start (start) {
		if (start === false) {
			if (hid_handler) {
				hid_handler.active = false;
				if (hid_handler.timeoutH)
					window.clearTimeout (hid_handler.timeoutH);
				$(document).off ('keypress.hidHandler');
			}
			return;
		}
		
		if (hid_handler && hid_handler.active)
			return;
		
		hid_handler = {
			active: true,
			str: '',
			timeout: 250,
			timeoutH: undefined
		};
		
		$(document).on ('keypress.hidHandler', hid_handler_keypress);
	}

	var current_page;

	// Public functions
	window.APP = {
		// This is where modules are registered:
		mod: {},
		
		// Our service objects:
		    charp: new     CHARP ().init (),
		hourglass: new Hourglass ().init (),
			clock: new     Clock ().init ({useSeconds: true}),
		  history: new   History ().init (),
		 terminal: {},   // Terminal info. See login_configure_terminal.
			 Util: util, // Our string-related utility functions.

		shellCreate: function (sections_parent) {
			return new Shell ().init (sections_parent);
		},

		toast: function (msg) {
			var toast = $('body > .toast');

			if (!msg) {
				toast.hide ();
				return;
			}
				
			function toast_hide () {
				toast.fadeOut (250);
			}

			var cont = toast.children ('span');
			cont.on ('click', toast_hide);

			var label = cont.children ('span');
			label.html (msg);

			toast.fadeIn (100);

			window.setTimeout (toast_hide, 3500);
		},

		extendClass: function (childClass, superClass) {
			childClass.prototype.__proto__ = superClass.prototype;
		},

		loadModule: function (name, cb, errCb) {
			if (APP.mod[name]) {
				if (!APP.mod[name].initialized && APP.mod[name].init)
					APP.mod[name].init ();

				if (APP.mod[name].onLoad)
					APP.mod[name].onLoad ();
				if (cb) cb (APP.mod[name]);
			} else {
				var add = '';
				if (APP.DEVEL)
					add = '?' + Math.random ().toString ().substr (2);
				else
					add = '?' + APP.VERSION;
				$.ajax ({ dataType: 'script',
						  url: 'script/' + name + '.js' + add, 
						  success: function () {
							  if (APP.mod[name] && APP.mod[name].init)
								  APP.mod[name].init ();
							  if (cb)
								  cb (APP.mod[name]);
						  },
						  error: (errCb)? errCb:
						  function () {
							  APP.msgDialog ({ icon: 'error',
											   title: 'Error al cargar módulo.',
											   desc: 'El módulo `' + name + '` tuvo problemas al cargar.',
											   sev: 'Contacta a soporte para reportar el problema.'
											 });
						  }
						});
			}
		},

		addModule: function (name, obj) {
			APP.mod[name] = obj;
		},

		loadLayout: function (div, html_file, cb) {
			var add = '';
			if (APP.DEVEL)
				add = '?' + Math.random ().toString ().substr (2);
			else
				add = '?' + APP.VERSION;

			div.load ('pages/' + html_file + add, cb);
		},

		appendPageAndLoadLayout: function (page, html_file, load_cb) {
			var div = document.createElement ('div');
			div.id = page;
			div.className = 'page';
			$('#cont').append (div);
			APP.loadLayout ($(div), html_file, load_cb);
		},

		switchPage: function (page) {	
			APP.hidHandlerStart (false);

			if (current_page == page)
				return;

			var page_ele = $('#' + page);
			if (page_ele.length == 0)
				throw 'Page element #' + page + ' not found.';

			$('#cont > .page').hide ();
			page_ele.show ();
			current_page = page;
		},

		switchSection: function (div) {
			APP.hidHandlerStart (false);

			div.parent ().find ('> .section').hide ();
			div.show ();

			div.trigger ('avanty:switchSectionEnter');
		},

		setTitle: function (text) {
			var str = '';
			if (text && text != '')
				str = ' - ' + text.toString ();
			$('title').text (APP.title + str);
		},

		later: function (fn, ms) {
			if (!ms) ms = 50;

			function call_later () {
				if (fn () === true) // try again.
					window.setTimeout (call_later, ms);
			}
			window.setTimeout (call_later, ms);
		},

		eleBusy: function (ele, setBusy, append) {
			if (setBusy) {
				var html = '<img class="spinner" src="img/spinner.gif" />';
				if (append)
					ele.append (html);
				else
					ele.prepend (html);
				ele.addClass ('busy');
			} else {
				$('img.spinner', ele).remove ();
				ele.removeClass ('busy');
			}
		},

		buttonBusy: function (button, setBusy, append) {
			if (setBusy === undefined)
				setBusy = true;
			if (append === undefined)
				append = true;

			if (setBusy) {
				button.button ('disable');
				APP.eleBusy ($('.ui-button-text', button), true, append);
			} else {
				button.button ('enable');
				button.mouseout ();
			}
		},

		mexDate2ISO: function (mex) {
			return mex.replace (new RegExp ('([0-9]{2})/([0-9]{2})/([0-9]{4})'), '$3-$2-$1');
		},

		msgDialog: function (opts) {
			var div = (opts.div)? opts.div: $('<div/>');

			if (opts.icon) {
				var img_file = opts.icon.toString ();
				if (img_file.indexOf ('.') < 0)
					img_file += '.svg';
				div.append ('<div class="icon"><img src="img/icons/' + img_file + '" alt="" /></div>');
			}
			if (opts.desc)
				msg_dialog_append_p (div, opts.desc, 'desc');
			if (opts.msg)
				msg_dialog_append_p (div, opts.msg, 'msg');
			if (opts.sev)
				msg_dialog_append_p (div, (typeof opts.sev == 'number')?
								  CHARP.ERROR_SEV_MSG[opts.sev]: opts.sev.toString (), 'error-sev');

			if (div.parent ().length == 0)
				$('#dialogs').append (div);

			var dialogOpts = CHARP.extendObj ({
				title: opts.title,
				draggable: false,
				modal: true,
				resizable: false,
				minWidth: 632,
				appendTo: $('#dialogs')
			}, opts.opts);

			if (!dialogOpts.buttons)
				dialogOpts.buttons = { 'Cerrar': null };

			function getButton (evt) {
				var node = $(evt.target);
				return (node.hasClass ('ui-button-text'))?
					node.parent (): node;
			}

			function dialogClose (evt) {
				var button = getButton (evt);
				APP.msgDialogClose (div);
				if (opts.cb)
					opts.cb ($(this), evt, opts);
			}

			$.each (dialogOpts.buttons, function (k, v) {
				var isArray = (dialogOpts.buttons.length !== undefined);
				var click_cb = (isArray)? v.click: v;

				var new_click_cb = function (evt) {
					var res;
					if (click_cb) res = click_cb (getButton (evt), div, opts);
					if (res === undefined || res === true)
						dialogClose (evt);
				}

				if (isArray)
					v.click = new_click_cb;
				else
					dialogOpts.buttons[k] = new_click_cb;
			});

			div.dialog (dialogOpts);
			return div;
		},

		msgDialogClose: function (div) {
			div.dialog ('close');
			div.remove ();
		},

		// attach to avanty:HID event on document to get notifications.
		hidHandlerStart: hid_handler_start,

		argsParse: function () {
			var search = window.location.search;
			var args = {};
			var pairs = search.substr (1).split (/[;&]/);
			for (var i = 0, pair; pair = pairs[i]; i++) {
				var keyval = pair.split ('=');
				args[keyval[0]] = decodeURIComponent (keyval[1]);
			}
			return args;
		},

		title: '',
		DEVEL: true,
		VERSION: '0.5',

		main: function () {
			APP.config = {
				maxTender: 50000 // Biggest tender that can be received by the POS.
			};

			$.validator.addMethod ('money', function (val, ele) {
				var re = new RegExp ('^[0-9]+(\.[0-9][05])?$');
				return re.exec (val);
			}, 'Pesos y centavos (opcionales).');
			
			$.validator.addMethod ('validate-login', function (val, ele) { 
				var re = new RegExp ('^[a-zA-Z0-9_.áéíóúñÁÉÚÍÓÚÑüÜ]+$');
				return re.exec (val);
			}, 'La clave tiene caracteres no válidos.');

			$.validator.addMethod ('pass-confirm', function (val, ele, other_pass) {
				return other_pass.val () == val;
			}, 'Las contraseñas deben de coincidir.');

			$.validator.addMethod ('charge-min', function (val, ele, total_ele) {
				return APP.Util.parseMoney (total_ele.text ()) <= APP.Util.parseMoney (val);
			}, 'Monto insuficiente.');

			// Make sure the change is not bigger than the biggest of bills/coins.
			$.validator.addMethod ('charge-max', function (val, ele, total_ele) {
				return APP.Util.parseMoney (val) - APP.Util.parseMoney (total_ele.text ()) <= APP.config.maxTender;
			}, 'Monto excedido.');

			APP.toast (false);
			$('body').show ();

			APP.charp.setBusyCB (show_hourglass);

			var dev_conf = {
				qz_connect: {
					host: 'localhost',
					port: { secure: [8181] },
					usingSecure: true,
					keepAlive: 60,
					retries: 0,
					delay: 0
				},
				printer: {
					name: 'BTP-R180',
					type: 'ESCPOS',
					basedir: 'C:/avanty/site/htdocs/avanty/',
					qz_type: 'escp',
					qz_options: {
						encoding: 'cp437'
					},
					cutter_distance: 48, // 1/96ths of an inch
					defaults: {
						  motion: { x: 180, y: 180 },
						standard: { line_spacing: 30 }, // 1/6 in
						    page: { line_spacing: 30 }  // 1/6 in
					}
				}
			};

			// APP.loadModule ('fetch'); // You may want to load this module for a cached catalog fetcher.

			APP.loadModule ('devices', // Printer and HIDs.
							function (mod) { mod.configure (dev_conf) });

			APP.loadModule ('activate');
		}
	};

	$(document).ready (function () {
		if (document.documentElement.requestFullscreen)
			document.documentElement.requestFullscreen ();

		if (!APP.DEVEL) {
			window.onbeforeunload = function () { return 'Por favor confirme que desea cerrar la aplicación.' };
		}

		// This should be defined by you, it's your entry point.
		if (APP.main)
			APP.main ();
	});
}) ();
