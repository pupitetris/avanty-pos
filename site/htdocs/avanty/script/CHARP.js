// This file is part of Microsafe AVANTY. -*- tab-width: 4; -*-
//
// Copyright © 2017 Microsafe, S.A. de C.V.
// Derechos Reservados (R) 2017 Microsafe, S.A. de C.V.

function CHARP () {
	this.cred = { login: null, passwd: null, salt: null };
	this.BASE_URL = window.location.protocol + '//' + window.location.hostname + (window.location.port? ':' + window.location.port: '') + '/';
};

CHARP.ERROR_SEV = {
	INTERNAL: 1,
	PERM: 2,
	RETRY: 3,
	USER: 4,
	EXIT: 5
};

CHARP.ERROR_LEVELS = {
	DATA : 1,
	SQL  : 2,
	DBI  : 3,
	CGI  : 4,
	HTTP : 5,
	AJAX : 6
};

CHARP.ERRORS = {
	'HTTP:CONNECT': {
		code: -1,
		sev: CHARP.ERROR_SEV.RETRY,
	},
	'HTTP:SRVERR': {
		code: -2,
		sev: CHARP.ERROR_SEV.INTERNAL,
	},
	'AJAX:JSON': {
		code: -3,
		sev: CHARP.ERROR_SEV.INTERNAL,
	},
	'AJAX:UNK': {
		code: -4,
		sev: CHARP.ERROR_SEV.INTERNAL,
	}
};

(function () {
	for (var key in CHARP.ERRORS) {
		var lvl = key.split (':')[0];
		var err = CHARP.ERRORS[key];
		err.level = CHARP.ERROR_LEVELS[lvl];
		err.key = key;
	}

	var timestamptz_re = new RegExp ('^([^+-]+)([+-]\\d+)');
	function cast_timestamptz_surf (datum) {
		var parts = datum.split (/ /);
		var match = parts[1].match (timestamptz_re);
		var msecs = new Date (parts[0] + 'T' + match[1]).getTime ();
		// Surf parses these ISO dates as UTC, so we manually add the offset:
		msecs -= parseInt (match[2]) * 1000 * 60 * 60;
		return new Date (msecs);
	}

	var bad_date_parser;
	function cast_datum (datum, type) {
		if (datum === null) return null;
		switch (type) {
		case 'bool': return (datum)? true: false;
		case 'timestamp':
		case 'timestamptz':
			switch (bad_date_parser) {
			case 0:
				// Compliant browser
				return new Date (datum);
			case 1:
				// Firefox
				return new Date (datum + '00');
			case 2:
				// Surf
				return cast_timestamptz_surf (datum);
			default:
				bad_date_parser = 0;
				var d = new Date (datum);
				if (!isNaN (d)) return d;
				bad_date_parser = 1;
				d = new Date (datum + '00');
				if (!isNaN (d)) return d;
				bad_date_parser = 2;
				return cast_timestamptz_surf (datum);
			}
		}
		// text or a number or some other thing.
		return datum;
	}

	function reply_process_data (data, ctx) {
		if (!data.fields || !data.data || ctx.asArray)
			// Probably a file or some raw data, or we asked for the data as-is (for performance).
			return data;
		
		var prefix = (ctx.asAnon)? 'anon_' : '';
		if (data.fields.length == 1 && data.fields[0].name == prefix + ctx.reqData.res)
			return cast_datum (data.data[0][0], data.fields[0].type);

		var res = [];
		for (var i = 0, d; d = data.data[i]; i++) {
			var o = {};
			for (var j = 0, f; f = data.fields[j]; j++)
				o[f.name] = cast_datum (d[j], f.type);
			res.push (o);
		}
		
		if (ctx.asObject) {
			switch (res.length) {
			case 0: return undefined;
			case 1: return res[0];
			default:
				console.warn ('Requested data asObject, but result has more than one row.');
			}
		}

		return res;
	}

	CHARP.prototype = {
		handleError: function (err, ctx) {
			if (ctx) {
				if (!err.ctx)
					err.ctx = ctx;
				if (ctx.error && !ctx.error (err, ctx, this))
					return;
			}

			return APP.msgDialog ({ icon: (err.sev < 3)? 'error': 'warning',
									desc: err.desc,
									msg: '<><pre>' + err.ctx.reqData.res + ': ' + err.statestr + 
									((err.state)? ' (' + err.state + ')' : '') + 
									((err.msg)? '<br />' + err.msg : '') +
									'<br /><br /></pre>',
									sev: err.sev,
									title: 'Error ' + err.key + '(' + err.code + ')',
									opts: {
										resizable: true,
										height: 'auto',
										minHeight: 400,
										maxHeight: 700,
										width: 750,
										minWidth: 750,
										maxWidth: 1000
									} });
		},

		handleAjaxStatus: function (req, status, ctx) {
			var err;
			switch (status) {
			case 'success':
				return;
			case 'error':
				if (req.status == 0 && req.responseText == '')
					err = CHARP.ERRORS['HTTP:CONNECT'];
				else
					err = CHARP.extendObj ({ msg: 'Error HTTP: ' + req.statusText + ' (' + req.status + ').' }, CHARP.ERRORS['HTTP:SRVERR']);
				break;
			case 'parsererror':
				err = CHARP.ERRORS['AJAX:JSON'];
				if (APP.config.DEVEL)
					err = CHARP.extendObj ({ msg: 'Datos: `' + req.responseText + '`.' }, err);
				break;
			default:
				err = CHARP.extendObj ({ msg: 'Error desconocido: (' + status + ').' }, CHARP.ERRORS['AJAX:UNK']);
			}
			this.handleError (err, ctx);
		},

		replySuccess: function (data, status, req, ctx) {
			this.setBusy (false);

			if (status != 'success')
				return;

			if (!data)
				return this.handleError (CHARP.ERRORS['AJAX:JSON'], ctx);

			if (data.error)
				return this.handleError (data.error, ctx);

			if (!ctx.success)
				reurn;

			return ctx.success (reply_process_data (data, ctx), ctx, this, req);
		},

		replyComplete: function (req, status, ctx) {
			this.setBusy (false);

			if (ctx.complete)
				ctx.complete (status, ctx, req);

			this.handleAjaxStatus (req, status, ctx);
		},

		reply: function (chal, ctx) {
			var url = this.BASE_URL + 'reply';

			var sha = new jsSHA (this.cred.login.toString () + chal.toString () +
								 this.cred.passwd.toString (), 'ASCII');
			var hash = sha.getHash ('SHA-256', 'HEX');
			var params = {
				login: this.cred.login,
				chal: chal,
				hash: hash
			};

			if (ctx.charpReplyHandler)
				return ctx.charpReplyHandler (url + '?' + CHARP.paramsUriEncode (params), ctx);

			this.setBusy (true);
			var charp = this;
			CHARP.ajaxPost (url, params, 
							function (data, status, req) { return charp.replySuccess (data, status, req, ctx); },
							function (req, status) { return charp.replyComplete (req, status, ctx); });
		},

		requestSuccess: function (data, status, req, ctx) {
			this.setBusy (false);

			if (ctx.asAnon)
				return this.replySuccess (data, status, req, ctx);

			if (status == 'success') {
				if (data) {
					if (data.error)
						return this.handleError (data.error, ctx);
					if (data.chal)
						this.reply (data.chal, ctx);
				}
			}
		},
		
		requestComplete: function (req, status, ctx) {
			this.setBusy (false);

			if (ctx.req_complete)
				ctx.req_complete (status, ctx, req);

			this.handleAjaxStatus (req, status, ctx);
		},

		request: function (resource, params, ctx) {
			if (!ctx)
				ctx = {};
			else if (typeof ctx == 'function')
				ctx = {success: ctx};

			params = params.map (function (p) {
				if (p instanceof Date) return p.toISOString ();
				return p;
			});

			var data = {
				login: this.cred.login,
				res: resource,
				params: JSON.stringify (params)
			};

			if (this.cred.login == '!anonymous')
				ctx.asAnon = true;

			if (ctx.asAnon)
				data.anon = 1;

			ctx.reqData = data;

			this.setBusy (true);
			var charp = this;
			CHARP.ajaxPost (this.BASE_URL + 'request', data, 
							function (data, status, req) { return charp.requestSuccess (data, status, req, ctx); },
							function (req, status) { return charp.requestComplete (req, status, ctx); });
		},

		credentialsGet: function () {
			var cred = {
				login: this.cred.login,
				passwd: this.cred.passwd,
				salt: this.cred.salt
			};
			return cred;
		},

		credentialsSet: function (login_or_cred, passwd_hash, salt) {
			if (typeof login_or_cred == 'object' && login_or_cred != null) {
				var cred = login_or_cred;
				if (('login') in cred) this.cred.login = cred.login;
				if (('passwd') in cred) this.cred.passwd = cred.passwd;
				if (('salt') in cred) this.cred.salt = cred.salt;
				return;
			}

			var login = login_or_cred;

			this.cred.login = login;
			this.cred.passwd = passwd_hash;
			this.cred.salt = salt;
		},

		credentialsSave: function () {
			localStorage.setItem ('charp_login', this.cred.login);
			localStorage.setItem ('charp_passwd', this.cred.passwd);
			localStorage.setItem ('charp_salt', this.cred.salt);
		},

		credentialsLoad: function () {
			this.cred.login = localStorage.getItem ('charp_login');
			this.cred.passwd = localStorage.getItem ('charp_passwd');
			this.cred.salt = localStorage.getItem ('charp_salt');
			return this.cred;
		},
		
		credentialsDelete: function () {
			localStorage.removeItem ('charp_login');
			localStorage.removeItem ('charp_passwd');
			localStorage.removeItem ('charp_salt');
		},

		passwordHash: function (pass, salt) {
			if (pass.indexOf (salt) == 0)
				return pass;
			return dcodeIO.bcrypt.hashSync (pass, salt);
		},
		
		setBusyCB: function (cb) {
			// This will be called with a boolean param (busy or not busy) for ui feedback.
			this.busyCB = cb;
		},

		setBusy: function (busy) {
			if (!this.busyCB)
				return;
			this.busyCB (busy);
		},

		init: function (charp) {
			if (charp) { // Clone
				this.BASE_URL = charp.BASE_URL;

				var cred = charp.credentialsGet ();
				this.cred.login = cred.login;
				this.cred.passwd = cred.passwd;
				this.cred.salt = cred.salt;
			}
			return this;
		}
	};
}) ();
