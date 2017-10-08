// This file is part of the CHARP project. -*- tab-width: 4; -*-
//
// Copyright © 2011 - 2014
//   Free Software Foundation Europe, e.V.,
//   Talstrasse 110, 40217 Dsseldorf, Germany
//
// Licensed under the EUPL V.1.1. See the file LICENSE.txt for copying conditions.

CHARP.ERRORS['HTTP:CONNECT'].desc	=  'No fue posible contactar al servicio web.';
CHARP.ERRORS['HTTP:CONNECT'].msg	=  'Verifica que la conexión a internet funciona y vuelve a intentar.';
CHARP.ERRORS['HTTP:SRVERR'].desc	=  'El servidor web respondió con un error.';
CHARP.ERRORS['AJAX:JSON'].desc		=  'Los datos obtenidos del servidor están mal formados.';
CHARP.ERRORS['AJAX:UNK'].desc		=  'Un tipo de error no reconocido ha ocurrido.';

CHARP.ERROR_SEV_MSG = [
    undefined,
    /* INTERNAL */ 'Este es un error interno en el sistema. Anota la información proporcionada en este mensaje y llama a soporte para que se trabaje en una solución.',
    /* PERM */     'Estás tratando de acceder a datos a los que no tienes autorización. Si requieres mayor acceso, llama a soporte.',
    /* RETRY */    'Este es un error temporal, por favor vuelve a intentar inmediatamente o en unos minutos. Si el error persiste, llama a soporte.',
    /* USER */     'La información que proporcionaste es errónea. Corrije tus datos y vuelve a intentar.',
    /* EXIT */     'Este es un mensaje enviado para proceso por parte de la aplicación y no debe ser visible al usuario.'
];

if ($.validator) {
	// Validating messages in Spanish.
	$.validator.messages = {
		required: 'Este campo es obligatorio.',
		remote: 'Corrije este campo.',
		email: 'Ingresa una dirección e-mail válida.',
		url: 'Ingresa un URL válido.',
		date: 'Ingresa una fecha válida.',
		dateISO: 'Ingresa una fecha ISO válida.',
		number: 'Ingresa un número.',
		digits: 'Introduce sólo números.',
		creditcard: 'Ingresa un número de tarjeta válido.',
		equalTo: 'Ingresa el mismo valor de nuevo.',
		accept: 'Ingresa un valor con una extensión válida.',
		maxlength: $.validator.format ('Ingresa no más de {0} caracteres.'),
		minlength: $.validator.format ('Ingresa por lo menos {0} caracteres.'),
		range: $.validator.format ('Ingresa un valor entre {0} y {1}.'),
		rangelength: $.validator.format ('Ingresa un valor entre {0} y {1} caracteres.'),
		max: $.validator.format ('Ingresa un valor menor o igual a {0}.'),
		min: $.validator.format ('Ingresa un valor mayor o igual a {0}.')
	};
}
