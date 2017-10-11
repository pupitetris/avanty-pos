// This file is part of Microsafe AVANTY. -*- tab-width: 4; -*-
//
// Copyright © 2017 Microsafe, S.A. de C.V.
// Derechos Reservados (R) 2017 Microsafe, S.A. de C.V.

(function () {

	function loadCredentials () {
		var cred = APP.charp.credentialsLoad ();
		if (cred.login != null) {
			$('#login-username').val (cred.login);
			$('#login-passwd').val (cred.passwd);
		}
	}

	function setCredentials (login, pass, salt) {
		if (pass.indexOf (salt) != 0)
			pass = dcodeIO.bcrypt.hashSync (pass, salt);
		APP.charp.credentialsSet (login, pass, salt);
	}

	var MOD_NAME = 'login';

	var mod = {
		init: function () {
			mod.initialized = true;
			APP.appendPageAndLoadLayout (MOD_NAME, MOD_NAME + '.html', layoutInit);
		},

		onLoad: function () {
			if (!mod.loaded)
				return;

			APP.switchPage ($('#login'));
			APP.switchSection ($('#login-dialog'), $('#login-sections'));

			mod.reset ();
			loadCredentials ();
			$('#login-username').focus ();
		},

		reset: function () {
			loginButtonReset ();

			clearInputs ();

			APP.charp.credentialsSet (null, null, null);
		}
	};

	function loginButtonReset () {
		APP.buttonBusy ($('#login-button'), false);
	}

	function clearInputs () {
		$('#login-username,#login-passwd')
			.val ('')
			.blur ();
	}

	function layoutInit () {
		var loginButton = $('#login-button');
		var fileButton = $('#file-button');

		function login_try (new_login, pass, salt) {
			setCredentials (new_login, pass, salt);
			APP.charp.request ('user_auth', [], 
							   { 
								   success: login_success,
								   error: login_error
							   });
		}

		function login_success (data, ctx, charp, req) {
			if (data) {
				alert ('Autentificación exitosa.');
				APP.buttonBusy (loginButton, false);
			}
		}
		
		function login_error (err, ctx, charp) {
			loginButtonReset ();

			switch (err.key) {
			case 'SQL:USERUNK':
				$('#login-username').addClass ('error');
				$('#login-username').after ('<span class="error login-error">Usuario no encontrado. ¿Escribió bien su nombre de usuario?</span>');
				break;
			case 'SQL:REPFAIL':
				$('#login-passwd').addClass ('error');
				$('#login-passwd').after ('<span class="error login-error">Contraseña incorrecta.</span>');
				break;
			default:
				return charp.handleError (err);
			}
		}

		var form = $('.login-form form');

		function loginSubmit () {
			if (validator.form ()) {
				APP.buttonBusy (loginButton, true);

				var new_login = $('#login-username').val ();
				var pass = $('#login-passwd').val ();
				var cred = APP.charp.credentialsGet ();

				if (cred.login != null && cred.salt != null && cred.login == new_login) {
					login_try (new_login, pass, cred.salt);
				} else {
					// We have never logged in before or we have but with a different user.
					APP.charp.request ('salt_get', [new_login],
									   {
										   asAnon: true,
										   success: function (data, ctx, charp, req) {
											   login_try (new_login, pass, data);
										   },
										   error: login_error
									   });
				}
			}
			return false;
		}

		var validator = form.validate ({
			rules: {
				username: 'required',
				passwd: 'required'
			},
			messages: {
				username: 'Escriba su nombre de usuario.',
				passwd: 'Por favor escriba su contraseña.'
			},
			errorElement: 'span'
		});

		form.bind ('submit', loginSubmit);

		loginButton
			.button ()
			.bind ('click', loginSubmit);

		function loginFocus () {
			var errors = $('.login-error', $(this).parent ());
			if (errors.length > 0) {
				errors.remove ();
				$(this).removeClass ('error');
			}
			return true;
		}

		$('#login-username,#login-passwd')
			.bind ('focus', loginFocus)
			.bind ('keyup', function (ev) { if (ev.keyCode == 13) loginSubmit (); });

		function fileButtonClick () {
			if (APP.charp.cred.login == null)
				return alert ('Primero inicie sesión.');

			APP.charp.request ('file_image_test', [$('#file-filename').val ()], { 
				charpReplyHandler: function (url, ctx) {
					$('#file-img').attr ('src', url);
				}
			});
		}

		fileButton
			.button ()
			.bind ('click', fileButtonClick);

		$('#anon-button')
			.bind ('click', function () {
				APP.charp.request ('get_random_bytes', ['hola', 'adios'],
								   {
									   asAnon: true, 
									   success: function (data) {
										   $('#anon-button').text ('Request anónimo: ' + data[0].random);
									   }
								   });
			});

		$('#save-button')
			.bind ('click', function () {
				setCredentials ($('#login-username').val (),
								$('#login-passwd').val (),
								APP.charp.cred.salt);
				APP.charp.credentialsSave ();
			});

		$('#load-button')
			.bind ('click', function () {
				loadCredentials ();
			});

		$('#del-button')
			.bind ('click', function () {
				APP.charp.credentialsDelete ();
				APP.charp.credentialsSet (null, null, null);
				$('#login-username,#login-passwd')
					.val ('');
			});

		mod.loaded = true;
		mod.onLoad ();
	}

	APP.addModule (MOD_NAME, mod);
}) ();
