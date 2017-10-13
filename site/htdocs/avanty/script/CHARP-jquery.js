// This file is part of Microsafe AVANTY. -*- tab-width: 4; -*-
//
// Copyright © 2017 Microsafe, S.A. de C.V.
// Derechos Reservados (R) 2017 Microsafe, S.A. de C.V.

CHARP.extendObj = function (obj, add) {
	return $.extend ({}, obj, add);
}

CHARP.paramsUriEncode = function (params) {
	return $.param (params);
}

CHARP.ajaxPost = function (url, params, successCb, completeCb) {
	$.ajax ({ 
		type: 'POST',
		url: url,
		cache: false,
		data: params,
		dataType: 'json',
		global: false,
		success: successCb,
		complete: completeCb,
	});
}
