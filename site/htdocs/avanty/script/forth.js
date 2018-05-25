// This file is part of Microsafe AVANTY. -*- tab-width: 4; -*-
//
// Copyright © 2017 Microsafe, S.A. de C.V.
// Derechos Reservados (R) 2017 Microsafe, S.A. de C.V.

// js-forth interpreter thanks to Brendan Maginnis <brendan.maginnis@gmail.com>
// https://github.com/brendanator/jsForth

!function t(n,e,s){function r(i,o){if(!e[i]){if(!n[i]){var u="function"==typeof require&&require;if(!o&&u)return u(i,!0);if(a)return a(i,!0);var c=new Error("Cannot find module '"+i+"'");throw c.code="MODULE_NOT_FOUND",c}var p=e[i]={exports:{}};n[i][0].call(p.exports,function(t){var e=n[i][1][t];return r(e||t)},p,p.exports,t,n,e,s)}return e[i].exports}for(var a="function"==typeof require&&require,i=0;i<s.length;i++)r(s[i]);return r}({1:[function(t,n,e){!function(){

	var forth;
	var Forth;
	var file_cache = {};
	var has_run;

	function forth_new_res () {
		var res = {
			errors: [],
			output: [],
			run: function (str, error_cb) { return mod.run (str, error_cb, res); }
		};
		return res;
	}

	function forth_run (str, res) {
		if (!res)
			res = forth_new_res ();

		function onForthOutput (error, output) {
			res.errors.push (error);
			res.output.push (output);
		}

		forth.run (str, onForthOutput);
		return res;
	}

	var include_re = new RegExp ('(?:^ *|\n| +)(incluir +([^ \n]+))');
	
	// Sanitize, deal with "incluir" directives and other preprocessing.
	function forth_preprocess (data, cb, error_cb) {
		data = data.replace (/\r\n/g, '\n').replace (/\t/g, '    ');

		var match = data.match (include_re);
		if (!match) {
			if (cb) cb (data);
			return;
		}

		function match_replace (loaded_data) {
			var start = match.index + match[0].indexOf (match[1]);
			var replaced = data.substr (0, start) + loaded_data + data.substr (start + match[1].length);
			forth_preprocess (replaced, cb, error_cb);
		}

		var script_name = match[2].replace (/\.+\/+/g, '');
		var load = forth_load (script_name, match_replace, error_cb);
		if (!load) // Cache miss: async loading.
			return;

		match_replace (load);
	}

	function forth_load (script_name, cb, error_cb) {
		if (file_cache[script_name])
			return file_cache[script_name];

		function preprocess_done (data) {
			file_cache[script_name] = data;
			if (cb) cb (data);
		}

		function success (data) {
			forth_preprocess (data, preprocess_done, error_cb);
		}

		function error (err) {
			if (!error_cb)
				return true;
			error_cb (err);
		}
			
		APP.charp.request ('rate_get_script', [script_name],
						   { success: success, error: error });
	}

	function forth_reset (cb, error_cb) {
		// has_run: flag to ignore subsequent reset requests until something is run.
		if (!has_run) {
			if (cb) cb ();
			return;
		}
		has_run = 0;

		forth = Forth ();
		
		function run (script) {
			var res;
			try {
				res = forth_run (script);
			} catch (e) {
				if (error_cb)
					error_cb ('Reset run: ' + e.toString ());
				if (res)
					res.exception = e;
			}
			if (cb) cb (res);
		}

		var script = forth_load ('_avanty', run, error_cb);
		if (script)	run (script);
	}

	var mod = {
		init: function (cb) {
			mod.initialized = true;
			Forth = t('js-forth');
			has_run = 1; // force reset.
			forth_reset (function () {
				mod.loaded = true;
				mod.onLoad ();
				if (cb) cb (mod);
			});
		},

		onLoad: function () {
			if (mod.loaded)
				mod.reset ()
		},
		
		reset: function (cb, error_cb, empty_cache) {
			if (empty_cache)
				file_cache = {};
			forth_reset (cb, error_cb);
		},

		// Define a set of key-value constants in the interpreter.
		setConstants: function (values, error_cb, res) {
			var cons = [];
			for (var key of Object.keys (values))
				cons.push (values[key] + ' constant ' + key);

			return mod.run (cons.join ('\n'), error_cb, res);
		},

		load: function (script_name, cb, error_cb) {
			var script = forth_load (script_name, cb, error_cb);
			if (script) cb (script);
		},

		// if res is not defined, a new one will be created.
		run: function (str, error_cb, res) {
			has_run ++;
			try {
				res = forth_run (str, res);
			} catch (e) {
				if (error_cb)
					error_cb ('Run: ' + e.toString ());
				if (res)
					res.exception = e;
			}

			return res;
		}
	}
	
	APP.addModule ('forth', mod);

}()},{"js-forth":6}],2:[function(t,n,e){n.exports=function(t){return t.defjs("true",function(){t.stack.push(-1)}),t.defjs("false",function(){t.stack.push(0)}),t.defjs("and",function(){var n=t.stack.pop();t.stack.push(t.stack.pop()&n)}),t.defjs("or",function(){var n=t.stack.pop();t.stack.push(t.stack.pop()|n)}),t.defjs("xor",function(){var n=t.stack.pop();t.stack.push(t.stack.pop()^n)}),t.defjs("invert",function(){t.stack.push(~t.stack.pop())}),t.defjs("=",function(){var n=t.stack.pop();t.stack.push(t.stack.pop()==n?-1:0)}),t.defjs("<>",function(){var n=t.stack.pop();t.stack.push(t.stack.pop()!=n?-1:0)}),t.defjs("<",function(){var n=t.stack.pop();t.stack.push(t.stack.pop()<n?-1:0)}),t.defjs(">",function(){var n=t.stack.pop();t.stack.push(t.stack.pop()>n?-1:0)}),t.defjs("<=",function(){var n=t.stack.pop();t.stack.push(t.stack.pop()<=n?-1:0)}),t.defjs(">=",function(){var n=t.stack.pop();t.stack.push(t.stack.pop()>=n?-1:0)}),t.defjs("within",function(){var n=t.stack.pop(),e=t.stack.pop(),s=t.stack.pop(),r=e<n&&e<=s&&s<n||e>n&&(e<=s||s<n);t.stack.push(r?-1:0)}),t}},{}],3:[function(t,n,e){n.exports=function(t){function n(){t.returnStack.push(t.dataSpace[t.instructionPointer++]);var n=t.stack.pop();t.returnStack.push(t.stack.pop()),t.returnStack.push(n)}function e(){t.stack.peek(1)!==t.stack.peek(2)?n():(t.stack.pop(),t.stack.pop(),t.instructionPointer=t.dataSpace[t.instructionPointer])}function s(){var n,e=t.stack.pop(),s=0|t.returnStack.pop(),r=0|t.returnStack.pop();e>0?(s>r&&(r>>>=0,s>>>=0),n=s<r&&s+e>=r):e<0?(s<r&&(s>>>=0,r>>>=0),n=s>=r&&s+e<r):n=!1,n?(t.returnStack.pop(),t.instructionPointer++):(t.returnStack.push(0|r),t.returnStack.push(s+e|0),t.instructionPointer+=t.dataSpace[t.instructionPointer])}function r(){var n=t._latest(),e=t.instructionPointer;t.dataSpace[n+1]=function(){t.stack.push(n+2),t.returnStack.push(t.instructionPointer),t.instructionPointer=e},t.instructionPointer=t.returnStack.pop()}t.defjs("jump",function(){t.instructionPointer+=t.dataSpace[t.instructionPointer]}),t.defjs("jumpIfFalse",function(){t.stack.pop()?t.instructionPointer++:t.instructionPointer+=t.dataSpace[t.instructionPointer]}),t.defjs("do",function(){t.dataSpace.push(n),t.dataSpace.push(0),t.stack.push(t.dataSpace.length-1)},!0),t.defjs("?do",function(){t.dataSpace.push(e),t.dataSpace.push(0),t.stack.push(t.dataSpace.length-1)},!0);var a=t.defjs("+loop",function(){t.dataSpace.push(s);var n=t.stack.pop();t.dataSpace.push(n-t.dataSpace.length+1),t.dataSpace[n]=t.dataSpace.length},!0);return t.defjs("loop",function(){t.dataSpace.push(t._lit),t.dataSpace.push(1),a()},!0),t.defjs("unloop",function(){t.returnStack.pop(),t.returnStack.pop(),t.returnStack.pop()}),t.defjs("leave",function(){t.returnStack.pop(),t.returnStack.pop(),t.instructionPointer=t.returnStack.pop()}),t.defjs("i",function(){t.stack.push(t.returnStack.peek())}),t.defjs("j",function(){t.stack.push(t.returnStack.peek(4))}),t.defjs("recurse",function(){t.dataSpace.push(t.dataSpace[t._latest()+1])},!0),t.defjs("does>",function(){t.dataSpace.push(r)},!0),t}},{}],4:[function(t,n,e){var s=t("./stack.js");n.exports=function(t){return t.instructionPointer=0,t.dataSpace=[],t.returnStack=new s("Return Stack"),t.stack=new s("Stack"),t}},{"./stack.js":15}],5:[function(require,module,exports){function Header(t,n,e,s,r){this.link=t,this.name=n,this.immediate=e||!1,this.hidden=s||!1,this.executionToken=r}function Definitions(f){function defheader(t,n,e){f.dataSpace.push(new Header(latest(),t,n,e,f.dataSpace.length+1)),latest(f.dataSpace.length-1)}var latest=function(){return null};f.defjs=function(t,n,e,s){return defheader(s||t,e),f.dataSpace.push(n),n},f.defvar=function(t,n){defheader(t);var e=f.dataSpace.length+1;return f.dataSpace.push(function(){f.stack.push(e)}),f.dataSpace.push(n),function(t){if(void 0===t)return f.dataSpace[e];f.dataSpace[e]=t}},latest=f.defvar("latest",f.dataSpace.length),f.compiling=f.defvar("state",0),f.compileEnter=function compileEnter(name){var instruction=f.dataSpace.length+1,enter;try{enter=eval(`(function ${name}(){f.returnStack.push(f.instructionPointer);f.instructionPointer = instruction;})`)}catch(t){enter=function(){f.returnStack.push(f.instructionPointer),f.instructionPointer=instruction}}return f.dataSpace.push(enter),enter},f.findDefinition=function(t){for(var n=latest();null!==n;){var e=f.dataSpace[n];if(e.name&&e.name.toLowerCase()==t.toLowerCase()&&!e.hidden)return e;n=e.link}return n},f.defjs(":",function(){var t=f._readWord();defheader(t,!1,!0),f.compileEnter(t),f.compiling(!0)}),f.defjs(":noname",function(){defheader(null,!1,!0),f.stack.push(f.dataSpace.length),f.compileEnter("_noname_"),f.compiling(!0)});var exit=f.defjs("exit",function(){f.instructionPointer=f.returnStack.pop()});f.defjs(";",function(){f.dataSpace.push(exit),f.dataSpace[latest()].hidden=!1,f.compiling(!1)},!0),f.defjs("find",function(){var t=f.stack.pop(),n=t;if("number"==typeof t){var e=t,s=f._getAddress(e);n="";for(var r=1;r<=s;r++)n+=String.fromCharCode(f._getAddress(e+r))}var a=f.findDefinition(n);a?(f.stack.push(a.executionToken),f.stack.push(a.immediate?1:-1)):(f.stack.push(t),f.stack.push(0))}),f.defjs(">body",function(){f.stack.push(f.stack.pop()+1)}),f.defjs("create",function(){defheader(f._readWord());var t=f.dataSpace.length+1;f.dataSpace.push(function(){f.stack.push(t)})}),f.defjs("allot",function(){f.dataSpace.length+=f.stack.pop()}),f.defjs(",",function(){f.dataSpace.push(f.stack.pop())}),f.defjs("compile,",function(){f.dataSpace.push(f.dataSpace[f.stack.pop()])}),f.defjs("[",function(){f.compiling(!1)},!0),f.defjs("]",function(){f.compiling(!0)}),f.defjs("immediate",function(){f.dataSpace[latest()].immediate=!0}),f.defjs("hidden",function(){var t=f.dataSpace[f.stack.pop()];t.hidden=!t.hidden}),f.defjs("'",function(){f.stack.push(f.findDefinition(f._readWord()).executionToken)});var _lit=f.defjs("lit",function(){f.stack.push(f.dataSpace[f.instructionPointer]),f.instructionPointer++});return f.defjs("[']",function(){f.dataSpace.push(f._lit),f.dataSpace.push(f.findDefinition(f._readWord()).executionToken)},!0),f.defjs("marker",function(){var t=latest(),n=f.dataSpace.length;defheader(f._readWord()),f.dataSpace.push(function(){latest(t),f.dataSpace.length=n})}),f._latest=latest,f._lit=_lit,f}module.exports=Definitions},{}],6:[function(t,n,e){var s=t("./data.js"),r=t("./definitions.js"),a=t("./numeric-operations.js"),i=t("./boolean-operations.js"),o=t("./stack-operations.js"),u=t("./memory-operations.js"),c=t("./control-structures.js"),p=t("./js-interop.js"),f=t("./input.js"),h=t("./output.js"),d=t("./interpreter.js");n.exports=function(){var t={};return s(t),r(t),f(t),a(t),i(t),o(t),u(t),c(t),h(t),p(t),d(t),t}},{"./boolean-operations.js":2,"./control-structures.js":3,"./data.js":4,"./definitions.js":5,"./input.js":8,"./interpreter.js":9,"./js-interop.js":10,"./memory-operations.js":11,"./numeric-operations.js":12,"./output.js":13,"./stack-operations.js":14}],7:[function(t,n,e){n.exports={EndOfInput:{},WaitingOnInput:{}}},{}],8:[function(t,n,e){function s(t,n,e,r,a){function i(){var n=c+r();return n<e?(r(r()+1),t.charAt(n)):null}function o(t,n){t=t||" ".charCodeAt(0);var e=u(),s=r();if(n)for(;e.charCodeAt(s)===t&&s<e.length;)s++;for(var a=s;e.charCodeAt(a)!==t&&a<e.length;)a++;r(a+1);var i=e.substring(s,a);return[c+s,i.length,i]}function u(){return p>0?t.substring(c,c+p):""}var c=n,p=-1;return{readWord:function(t){return o(t,!0)[2]},readKey:i,parse:o,refill:function(){return c+=p+1,(-1==(p=t.substring(c).search(/\n/))||c+p>e)&&(p=e-c),r(0),c<e},inputBuffer:u,source:function(){return[c,p]},charCodeAt:function(n){return t.charCodeAt(n)},subInput:function(n,e){return s(t,n,n+e,r,-1)},sBackslashQuote:function(){for(var t="";;){var n=i();if('"'===n)break;if("\\"===n){var e=i();switch(e){case"a":t+=String.fromCharCode(7);break;case"b":t+=String.fromCharCode(8);break;case"e":t+=String.fromCharCode(27);break;case"f":t+=String.fromCharCode(12);break;case"l":t+=String.fromCharCode(10);break;case"m":t+=String.fromCharCode(13)+String.fromCharCode(10);break;case"n":t+=String.fromCharCode(10);break;case"q":t+=String.fromCharCode(34);break;case"r":t+=String.fromCharCode(13);break;case"t":t+=String.fromCharCode(9);break;case"v":t+=String.fromCharCode(11);break;case"z":t+=String.fromCharCode(0);break;case'"':t+=String.fromCharCode(34);break;case"x":t+=String.fromCharCode(parseInt(i()+i(),16));break;case"\\":t+=String.fromCharCode(92);break;default:t+=e}}else t+=n}return t},sourceId:a}}var r=t("./input-exceptions.js");n.exports=function(t){function n(n){return t._currentInput.readWord(n)}function e(t,n){var e=0;if("-"!==t[0]){for(var s=0;s<t.length;s++)e*=n,e+=parseInt(t[s],n);return e}for(var r=1;r<t.length;r++)e*=n,e-=parseInt(t[r],n);return e}function a(){t._currentInput&&p.push({input:t._currentInput,toIn:o(),instructionPointer:t.instructionPointer})}function i(){var n=p.pop();n?(t._currentInput=n.input,o(n.toIn),t.instructionPointer=n.instructionPointer,t.currentInstruction=t.dataSpace[t.instructionPointer++]):t._currentInput=null}t._base=t.defvar("base",10);var o=t.defvar(">in",0);t.defjs("source",function(){var n=t._currentInput.source();t.stack.push((1<<31)+n[0]),t.stack.push(n[1])}),t.defjs("source-id",function(){t.stack.push(t._currentInput.sourceId)}),t.defjs("refill",function(){t.stack.push(t._currentInput.refill())}),t.defjs("key",function(){t.stack.push(t._currentInput.readKey().charCodeAt(0))}),t.defjs("parse",function(){var n=t._currentInput.parse(t.stack.pop(),!1);t.stack.push((1<<31)+n[0]),t.stack.push(n[1])}),t.defjs("parse-name",function(){var n=t._currentInput.parse(" ".charCodeAt(0),!0);t.stack.push((1<<31)+n[0]),t.stack.push(n[1])});var u=t.dataSpace.length;t.dataSpace.length+=128,t.defjs("word",function(){var e=n(t.stack.pop()),s=Math.min(e.length,127);t.dataSpace[u]=s;for(var r=0;r<s;r++)t.dataSpace[u+r+1]=e.charCodeAt(r);t.stack.push(u)}),t.defjs('s\\"',function(){var n=t._currentInput.sBackslashQuote(),e=t.dataSpace.length+1;t.dataSpace.push(function(){t.stack.push(e),t.stack.push(n.length),t.instructionPointer+=n.length});for(var s=0;s<n.length;s++)t.dataSpace.push(n[s])},!0),t.defjs("char",function(){t.stack.push(n().charCodeAt(0))}),t.defjs("accept",function(){var n=t.stack.pop(),e=t.stack.pop();throw t.currentInstruction=function(){t._currentInput.refill();var s=t._currentInput.inputBuffer().substring(0,n).split("\n")[0];t.stack.push(s.length);for(var r=0;r<s.length;r++)t._setAddress(e+r,s[r]);i()},r.WaitingOnInput});var c="",p=[];return t.defjs("save-input",function(){a();for(var n=0;n<p.length;n++)t.stack.push(p[n]);t.stack.push(p.length),p.pop()}),t.defjs("restore-input",function(){p.length=0;for(var n=t.stack.pop()-1;n>=0;n--)p[n]=t.stack.pop();var e=p.pop();t._currentInput=e.input,o(e.toIn),t.stack.push(0)}),t._readWord=n,t._newInput=function(n,e){a();var r=c.length;c+=n,t._currentInput=s(c,r,c.length,o,e)},t._subInput=function(n,e){a(),t._currentInput=t._currentInput.subInput(n,e)},t._popInput=i,t._parseFloatInBase=function(n){var s;if("'"===n[0]&&3===n.length&&"'"==n[2])return n.charCodeAt(1);"#"===n[0]?(n=n.substring(1),s=10):"$"===n[0]?(n=n.substring(1),s=16):"%"===n[0]?(n=n.substring(1),s=2):s=t._base();var r=n.split(/\./),a=0;""!==r[0]&&(a=e(r[0],s));var i=0;return r.length>1&&""!==r[1]&&(i=e(r[1],s)*Math.pow(s,-r[1].length)),a>=0?a+i:a-i},t._INPUT_SOURCE=1<<31,t}},{"./input-exceptions.js":7}],9:[function(t,n,e){var s=t("./input-exceptions.js");n.exports=function(t){function n(){for(;t._currentInput;)try{for(;;)t.currentInstruction(),t.currentInstruction=t.dataSpace[t.instructionPointer++]}catch(n){if(n!==s.EndOfInput)throw n;t._popInput()}}function e(){for(var n="    "+t.currentInstruction.name+" @ "+(t.instructionPointer-1),e=t.returnStack.length-1;e>=0;e--){var s=t.returnStack[e];n+="\n    "+t.dataSpace[s-1].name+" @ "+(s-1)}return n}function r(){for(var n=t._readWord();!n;){if(!t._currentInput.refill())throw s.EndOfInput;n=t._readWord()}var e=t.findDefinition(n);if(e){if(!t.compiling()||e.immediate)return void t.dataSpace[e.executionToken]();t.dataSpace.push(t.dataSpace[e.executionToken])}else{var r=t._parseFloatInBase(n);if(isNaN(r))throw"Word not defined: ("+n+")";t.compiling()?(t.dataSpace.push(t._lit),t.dataSpace.push(r)):t.stack.push(r)}}t._evaluate=t.defjs("evaluate",function(){var n=t.stack.pop(),e=t.stack.pop();if(e<0){var s=e-t._INPUT_SOURCE;t._subInput(s,n)}else{for(var r="",i=0;i<n;i++)r+=String.fromCharCode(t._getAddress(e+i));t._newInput(r,-1)}t.instructionPointer=a});var a=t.dataSpace.length+1;t.defjs("interpret",function(){t.instructionPointer=a,r()});var i=t.defjs("quit",function(){t.compiling(!1),t.returnStack.clear(),t.instructionPointer=a}),o=t.defjs("abort",function(n){throw t.stack.clear(),n||""});return t.defjs('abort"',function(){var n=t._currentInput.parse('"'.charCodeAt(0))[2];t.dataSpace.push(function(){t.stack.pop()&&o(n)})},!0),t.defjs("execute",function(){t.dataSpace[t.stack.pop()]()}),t.currentInstruction=i,t.run=function(r,a,o){t.outputCallback=a,t._newInput(r,o||0),t._output="";try{n()}catch(n){if(n!==s.WaitingOnInput)throw console.error("Exception "+n+" at:\n"+e()),console.error(t._currentInput.inputBuffer()),console.error(t._output),t.currentInstruction=i,t.stack.clear(),a(n,t._output),n}a(null,t._output)},t}},{"./input-exceptions.js":7}],10:[function(t,n,e){(function(t){n.exports=function(n){function e(t){for(var e=n.stack.pop(),s=parseInt(t.match(/\{(\d*)\}/)[1]||0),r=[null],a=0;a<s;a++)r.push(n.stack.pop());return new(Function.prototype.bind.apply(e,r))}function s(t){for(var e=parseInt(t.match(/\{(\d*)\}/)[1]||0),s=n.stack.pop(),r=(t=t.match(/[^\{]*/)[0])?s[t]:s,a=[],i=0;i<e;i++)a.push(n.stack.pop());return r.apply(s,a)}function r(t){if(t.startsWith("/"))n.stack.push(u);else if(!t.startsWith("."))throw"js interop call must start with '/' or '.'";for(var r=t.length>1?t.substring(1).split("."):[],c=0;c<r.length;c++){var p=r[c];p.match(a)?n.stack.pop()[p.substring(0,p.length-1)]=n.stack.pop():p.match(i)?n.stack.push(e(p)):p.match(o)?n.stack.push(s(p)):n.stack.push(n.stack.pop()[p])}}var a=/(^[A-Za-z$_][\w$_]*!$)|(^\d+!$)/,i=/new\{\d*\}$/,o=/((^[A-Za-z$_][\w$_]*)|(^\d+))?\{\d*\}$/,u="undefined"!=typeof window&&"undefined"!=typeof navigator&&window.document?window:t,c=n.defjs("js",function(){r(n.stack.pop())});return n.defjs("js",function(){n.compiling()?(n.dataSpace.push(n._lit),n.dataSpace.push(n._readWord()),n.dataSpace.push(c)):r(n._readWord())},!0),n.defjs(">js-string",function(){for(var t=n.stack.pop(),e=n.stack.pop(),s="",r=0;r<t;r++)s+=String.fromCharCode(n._getAddress(e+r));n.stack.push(s)}),n}}).call(this,"undefined"!=typeof global?global:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{})},{}],11:[function(t,n,e){n.exports=function(t){function n(n){if(n<0)return t._currentInput.charCodeAt(n-t._INPUT_SOURCE);var e=t.dataSpace[n];return"string"==typeof e?e.charCodeAt(0):e}function e(n,e){if(n<0)throw"Illegal attempt to change input";t.dataSpace[n]=e}return t.defjs("!",function(){e(t.stack.pop(),t.stack.pop())}),t.defjs("@",function(){var e=t.stack.pop();t.stack.push(n(e))}),t.defjs("+!",function(){var n=t.stack.pop(),e=t.stack.pop();t.dataSpace[n]=t.dataSpace[n]+e}),t.defjs("-!",function(){var n=t.stack.pop(),e=t.stack.pop();t.dataSpace[n]=t.dataSpace[n]-e}),t.defjs("here",function(){t.stack.push(t.dataSpace.length)}),t._getAddress=n,t._setAddress=e,t}},{}],12:[function(t,n,e){var s=t("long");n.exports=function(t){return t.defjs("+",function(){var n=t.stack.pop();t.stack.push(t.stack.pop()+n|0)}),t.defjs("-",function(){var n=t.stack.pop();t.stack.push(t.stack.pop()-n|0)}),t.defjs("*",function(){var n=t.stack.pop();t.stack.push(t.stack.pop()*n|0)}),t.defjs("/",function(){var n=t.stack.pop(),e=t.stack.pop();t.stack.push(Math.trunc(e/n))}),t.defjs("2*",function(){t.stack.push(t.stack.pop()<<1)}),t.defjs("2/",function(){t.stack.push(t.stack.pop()>>1)}),t.defjs("mod",function(){var n=t.stack.pop();t.stack.push(t.stack.pop()%n)}),t.defjs("s>d",function(){var n=s.fromInt(t.stack.pop());t.stack.push(n.low),t.stack.push(n.high)}),t.defjs("*/",function(){var n=s.fromInt(t.stack.pop()),e=s.fromInt(t.stack.pop()),r=s.fromInt(t.stack.pop()),a=e.mul(r).div(n).toInt();t.stack.push(a)}),t.defjs("m*",function(){var n=s.fromInt(t.stack.pop()),e=s.fromInt(t.stack.pop()),r=n.mul(e);t.stack.push(r.low),t.stack.push(r.high)}),t.defjs("*/mod",function(){var n=s.fromInt(t.stack.pop()),e=s.fromInt(t.stack.pop()),r=s.fromInt(t.stack.pop()),a=e.mul(r),i=a.div(n).toInt(),o=a.mod(n).toInt();t.stack.push(o),t.stack.push(i)}),t.defjs("um*",function(){var n=s.fromInt(t.stack.pop(),!0),e=s.fromInt(t.stack.pop(),!0),r=n.mul(e);t.stack.push(r.low),t.stack.push(r.high)}),t.defjs("um/mod",function(){var n=s.fromInt(t.stack.pop()),e=t.stack.pop(),r=t.stack.pop(),a=new s(r,e,!0),i=a.div(n).toInt(),o=a.mod(n).toInt();t.stack.push(o),t.stack.push(i)}),t.defjs("fm/mod",function(){var n=s.fromInt(t.stack.pop()),e=t.stack.pop(),r=t.stack.pop(),a=new s(r,e),i=a.div(n).toInt(),o=a.mod(n).toInt();t.stack.push(o),t.stack.push(i)}),t.defjs("sm/rem",function(){var n=s.fromInt(t.stack.pop()),e=t.stack.pop(),r=t.stack.pop(),a=new s(r,e),i=a.div(n).toInt(),o=a.mod(n).toInt();t.stack.push(o),t.stack.push(i)}),t.defjs("abs",function(){t.stack.push(0|Math.abs(t.stack.pop()))}),t.defjs("lshift",function(){var n=t.stack.pop(),e=t.stack.pop();t.stack.push(e<<n)}),t.defjs("rshift",function(){var n=t.stack.pop(),e=t.stack.pop();t.stack.push(e>>>n)}),t.defjs("max",function(){t.stack.push(Math.max(t.stack.pop(),t.stack.pop()))}),t.defjs("min",function(){t.stack.push(Math.min(t.stack.pop(),t.stack.pop()))}),t.defjs("negate",function(){t.stack.push(-t.stack.pop())}),t}},{long:16}],13:[function(t,n,e){var s=t("long");n.exports=function(t){t._output="",t.defjs("cr",function(){t._output+="\n"}),t.defjs(".",function(){var n,e=t.stack.pop();n=void 0===e?"undefined":null===e?"null":e.toString(t._base()),t._output+=n}),t.defjs(".r",function(){var n,e=t.stack.pop(),s=t.stack.pop();for(n=void 0===s?"undefined":null===s?"null":s.toString(t._base());n.length<e;)n=" "+n;t._output+=n}),t.defjs("emit",function(){var n=t.stack.pop();t._output+="number"==typeof n?String.fromCharCode(n):n}),t.defjs("type",function(){for(var n=t.stack.pop(),e=t.stack.pop(),s=0;s<n;s++){var r=t._getAddress(e+s);t._output+="number"==typeof r?String.fromCharCode(r):r}});var n=t.dataSpace.length,e="";return t.dataSpace.length+=128,t.defjs("<#",function(){e=""}),t.defjs("hold",function(){var n=t.stack.pop();"number"==typeof n&&(n=String.fromCharCode(n)),e+=n}),t.defjs("#>",function(){t.stack.pop(),t.stack.pop();for(var s=0;s<e.length;s++)t.dataSpace[n+s]=e[e.length-s-1];t.stack.push(n),t.stack.push(e.length)}),t.defjs("sign",function(){t.stack.pop()<0&&(e+="-")}),t.defjs("#",function(){var n=t.stack.pop(),r=t.stack.pop(),a=new s(r,n,!0),i=s.fromInt(t._base());e+=a.mod(i).toString(i).toUpperCase(),a=a.div(i),t.stack.push(a.smallPart),t.stack.push(a.bigPart)}),t.defjs("#S",function(){var n=t.stack.pop(),r=t.stack.pop(),a=new s(r,n,!0),i=s.fromInt(t._base());if(a.compare(s.ZERO))for(;a.compare(s.ZERO);)e+=a.mod(i).toString(i).toUpperCase(),a=a.div(i);else e+="0";t.stack.push(0),t.stack.push(0)}),t.defjs(">number",function(){for(var n=s.fromInt(t._base()),e=t.stack.pop(),r=t.stack.pop(),a=t.stack.pop(),i=t.stack.pop(),o=new s(i,a,!0),u=e,c=0;c<e;c++){var p=parseInt(String.fromCharCode(t._getAddress(r)),n);if(isNaN(p))break;r++,u--,o=o.mul(n).add(s.fromInt(p))}t.stack.push(o.low),t.stack.push(o.high),t.stack.push(r),t.stack.push(u)}),t}},{long:16}],14:[function(t,n,e){n.exports=function(t){return t.defjs("drop",function(){t.stack.pop()}),t.defjs("swap",function(){var n=t.stack.pop(),e=t.stack.pop();t.stack.push(n),t.stack.push(e)}),t.defjs("dup",function(){t.stack.push(t.stack.peek())}),t.defjs("over",function(){t.stack.push(t.stack.peek(2))}),t.defjs("pick",function(){t.stack.push(t.stack.peek(t.stack.pop()+1))}),t.defjs("rot",function(){var n=t.stack.pop(),e=t.stack.pop(),s=t.stack.pop();t.stack.push(e),t.stack.push(n),t.stack.push(s)}),t.defjs("-rot",function(){var n=t.stack.pop(),e=t.stack.pop(),s=t.stack.pop();t.stack.push(n),t.stack.push(s),t.stack.push(e)}),t.defjs("roll",function(){var n=t.stack.pop();t.stack.roll(n)}),t.defjs("2drop",function(){t.stack.pop(),t.stack.pop()}),t.defjs("2dup",function(){t.stack.push(t.stack.peek(2)),t.stack.push(t.stack.peek(2))}),t.defjs("2over",function(){t.stack.push(t.stack.peek(4)),t.stack.push(t.stack.peek(4))}),t.defjs("2swap",function(){var n=t.stack.pop(),e=t.stack.pop(),s=t.stack.pop(),r=t.stack.pop();t.stack.push(e),t.stack.push(n),t.stack.push(r),t.stack.push(s)}),t.defjs("?dup",function(){var n=t.stack.peek();0!==n&&t.stack.push(n)}),t.defjs("depth",function(){t.stack.push(t.stack.length())}),t.defjs(">r",function(){t.returnStack.push(t.stack.pop())}),t.defjs("r>",function(){t.stack.push(t.returnStack.pop())}),t.defjs("r@",function(){t.stack.push(t.returnStack.peek())}),t.defjs("2r>",function(){var n=t.returnStack.pop();t.stack.push(t.returnStack.pop()),t.stack.push(n)}),t.defjs("2>r",function(){var n=t.stack.pop();t.returnStack.push(t.stack.pop()),t.returnStack.push(n)}),t.defjs("2r@",function(){t.stack.push(t.returnStack.peek(2)),t.stack.push(t.returnStack.peek(1))}),t}},{}],15:[function(t,n,e){n.exports=function(t){var n=[];this.pop=function(){if(n.length>0)return n.pop();throw"Stack empty: "+t},this.push=function(t){n.push(t)},this.peek=function(e){var s=n.length-(e||1);if(0<=s&&s<n.length)return n[s];throw"Attempted to peek at invalid stack index "+s+": "+t},this.roll=function(e){if(0!==e){var s=n.length-e-1;if(!(0<=s&&s<n.length))throw"Attempted to roll more elements than in stack "+e+": "+t;var r=n.splice(s,1)[0];n.push(r)}},this.length=function(){return n.length},this.clear=function(){n.length=0},this.toString=function(){return n.toString()}}},{}],16:[function(t,n,e){!function(e,s){"function"==typeof define&&define.amd?define([],s):"function"==typeof t&&"object"==typeof n&&n&&n.exports?n.exports=s():(e.dcodeIO=e.dcodeIO||{}).Long=s()}(this,function(){"use strict";function t(t,n,e){this.low=0|t,this.high=0|n,this.unsigned=!!e}function n(t){return!0===(t&&t.__isLong__)}function e(t,n){var e,s,a;return n?(t>>>=0,(a=0<=t&&t<256)&&(s=u[t])?s:(e=r(t,(0|t)<0?-1:0,!0),a&&(u[t]=e),e)):(t|=0,(a=-128<=t&&t<128)&&(s=o[t])?s:(e=r(t,t<0?-1:0,!1),a&&(o[t]=e),e))}function s(t,n){if(isNaN(t)||!isFinite(t))return n?l:k;if(n){if(t<0)return l;if(t>=f)return S}else{if(t<=-h)return _;if(t+1>=h)return j}return t<0?s(-t,n).neg():r(t%p|0,t/p|0,n)}function r(n,e,s){return new t(n,e,s)}function a(t,n,e){if(0===t.length)throw Error("empty string");if("NaN"===t||"Infinity"===t||"+Infinity"===t||"-Infinity"===t)return k;if("number"==typeof n?(e=n,n=!1):n=!!n,(e=e||10)<2||36<e)throw RangeError("radix");var r;if((r=t.indexOf("-"))>0)throw Error("interior hyphen");if(0===r)return a(t.substring(1),n,e).neg();for(var i=s(c(e,8)),o=k,u=0;u<t.length;u+=8){var p=Math.min(8,t.length-u),f=parseInt(t.substring(u,u+p),e);if(p<8){var h=s(c(e,p));o=o.mul(h).add(s(f))}else o=(o=o.mul(i)).add(s(f))}return o.unsigned=n,o}function i(n){return n instanceof t?n:"number"==typeof n?s(n):"string"==typeof n?a(n):r(n.low,n.high,n.unsigned)}t.prototype.__isLong__,Object.defineProperty(t.prototype,"__isLong__",{value:!0,enumerable:!1,configurable:!1}),t.isLong=n;var o={},u={};t.fromInt=e,t.fromNumber=s,t.fromBits=r;var c=Math.pow;t.fromString=a,t.fromValue=i;var p=4294967296,f=p*p,h=f/2,d=e(1<<24),k=e(0);t.ZERO=k;var l=e(0,!0);t.UZERO=l;var g=e(1);t.ONE=g;var v=e(1,!0);t.UONE=v;var m=e(-1);t.NEG_ONE=m;var j=r(-1,2147483647,!1);t.MAX_VALUE=j;var S=r(-1,-1,!0);t.MAX_UNSIGNED_VALUE=S;var _=r(0,-2147483648,!1);t.MIN_VALUE=_;var I=t.prototype;return I.toInt=function(){return this.unsigned?this.low>>>0:this.low},I.toNumber=function(){return this.unsigned?(this.high>>>0)*p+(this.low>>>0):this.high*p+(this.low>>>0)},I.toString=function(t){if((t=t||10)<2||36<t)throw RangeError("radix");if(this.isZero())return"0";if(this.isNegative()){if(this.eq(_)){var n=s(t),e=this.div(n),r=e.mul(n).sub(this);return e.toString(t)+r.toInt().toString(t)}return"-"+this.neg().toString(t)}for(var a=s(c(t,6),this.unsigned),i=this,o="";;){var u=i.div(a),p=(i.sub(u.mul(a)).toInt()>>>0).toString(t);if((i=u).isZero())return p+o;for(;p.length<6;)p="0"+p;o=""+p+o}},I.getHighBits=function(){return this.high},I.getHighBitsUnsigned=function(){return this.high>>>0},I.getLowBits=function(){return this.low},I.getLowBitsUnsigned=function(){return this.low>>>0},I.getNumBitsAbs=function(){if(this.isNegative())return this.eq(_)?64:this.neg().getNumBitsAbs();for(var t=0!=this.high?this.high:this.low,n=31;n>0&&0==(t&1<<n);n--);return 0!=this.high?n+33:n+1},I.isZero=function(){return 0===this.high&&0===this.low},I.isNegative=function(){return!this.unsigned&&this.high<0},I.isPositive=function(){return this.unsigned||this.high>=0},I.isOdd=function(){return 1==(1&this.low)},I.isEven=function(){return 0==(1&this.low)},I.equals=function(t){return n(t)||(t=i(t)),(this.unsigned===t.unsigned||this.high>>>31!=1||t.high>>>31!=1)&&(this.high===t.high&&this.low===t.low)},I.eq=I.equals,I.notEquals=function(t){return!this.eq(t)},I.neq=I.notEquals,I.lessThan=function(t){return this.comp(t)<0},I.lt=I.lessThan,I.lessThanOrEqual=function(t){return this.comp(t)<=0},I.lte=I.lessThanOrEqual,I.greaterThan=function(t){return this.comp(t)>0},I.gt=I.greaterThan,I.greaterThanOrEqual=function(t){return this.comp(t)>=0},I.gte=I.greaterThanOrEqual,I.compare=function(t){if(n(t)||(t=i(t)),this.eq(t))return 0;var e=this.isNegative(),s=t.isNegative();return e&&!s?-1:!e&&s?1:this.unsigned?t.high>>>0>this.high>>>0||t.high===this.high&&t.low>>>0>this.low>>>0?-1:1:this.sub(t).isNegative()?-1:1},I.comp=I.compare,I.negate=function(){return!this.unsigned&&this.eq(_)?_:this.not().add(g)},I.neg=I.negate,I.add=function(t){n(t)||(t=i(t));var e=this.high>>>16,s=65535&this.high,a=this.low>>>16,o=65535&this.low,u=t.high>>>16,c=65535&t.high,p=t.low>>>16,f=0,h=0,d=0,k=0;return k+=o+(65535&t.low),d+=k>>>16,k&=65535,d+=a+p,h+=d>>>16,d&=65535,h+=s+c,f+=h>>>16,h&=65535,f+=e+u,f&=65535,r(d<<16|k,f<<16|h,this.unsigned)},I.subtract=function(t){return n(t)||(t=i(t)),this.add(t.neg())},I.sub=I.subtract,I.multiply=function(t){if(this.isZero())return k;if(n(t)||(t=i(t)),t.isZero())return k;if(this.eq(_))return t.isOdd()?_:k;if(t.eq(_))return this.isOdd()?_:k;if(this.isNegative())return t.isNegative()?this.neg().mul(t.neg()):this.neg().mul(t).neg();if(t.isNegative())return this.mul(t.neg()).neg();if(this.lt(d)&&t.lt(d))return s(this.toNumber()*t.toNumber(),this.unsigned);var e=this.high>>>16,a=65535&this.high,o=this.low>>>16,u=65535&this.low,c=t.high>>>16,p=65535&t.high,f=t.low>>>16,h=65535&t.low,l=0,g=0,v=0,m=0;return m+=u*h,v+=m>>>16,m&=65535,v+=o*h,g+=v>>>16,v&=65535,v+=u*f,g+=v>>>16,v&=65535,g+=a*h,l+=g>>>16,g&=65535,g+=o*f,l+=g>>>16,g&=65535,g+=u*p,l+=g>>>16,g&=65535,l+=e*h+a*f+o*p+u*c,l&=65535,r(v<<16|m,l<<16|g,this.unsigned)},I.mul=I.multiply,I.divide=function(t){if(n(t)||(t=i(t)),t.isZero())throw Error("division by zero");if(this.isZero())return this.unsigned?l:k;var e,r,a;if(this.unsigned){if(t.unsigned||(t=t.toUnsigned()),t.gt(this))return l;if(t.gt(this.shru(1)))return v;a=l}else{if(this.eq(_))return t.eq(g)||t.eq(m)?_:t.eq(_)?g:(e=this.shr(1).div(t).shl(1),e.eq(k)?t.isNegative()?g:m:(r=this.sub(t.mul(e)),a=e.add(r.div(t))));if(t.eq(_))return this.unsigned?l:k;if(this.isNegative())return t.isNegative()?this.neg().div(t.neg()):this.neg().div(t).neg();if(t.isNegative())return this.div(t.neg()).neg();a=k}for(r=this;r.gte(t);){e=Math.max(1,Math.floor(r.toNumber()/t.toNumber()));for(var o=Math.ceil(Math.log(e)/Math.LN2),u=o<=48?1:c(2,o-48),p=s(e),f=p.mul(t);f.isNegative()||f.gt(r);)f=(p=s(e-=u,this.unsigned)).mul(t);p.isZero()&&(p=g),a=a.add(p),r=r.sub(f)}return a},I.div=I.divide,I.modulo=function(t){return n(t)||(t=i(t)),this.sub(this.div(t).mul(t))},I.mod=I.modulo,I.not=function(){return r(~this.low,~this.high,this.unsigned)},I.and=function(t){return n(t)||(t=i(t)),r(this.low&t.low,this.high&t.high,this.unsigned)},I.or=function(t){return n(t)||(t=i(t)),r(this.low|t.low,this.high|t.high,this.unsigned)},I.xor=function(t){return n(t)||(t=i(t)),r(this.low^t.low,this.high^t.high,this.unsigned)},I.shiftLeft=function(t){return n(t)&&(t=t.toInt()),0==(t&=63)?this:t<32?r(this.low<<t,this.high<<t|this.low>>>32-t,this.unsigned):r(0,this.low<<t-32,this.unsigned)},I.shl=I.shiftLeft,I.shiftRight=function(t){return n(t)&&(t=t.toInt()),0==(t&=63)?this:t<32?r(this.low>>>t|this.high<<32-t,this.high>>t,this.unsigned):r(this.high>>t-32,this.high>=0?0:-1,this.unsigned)},I.shr=I.shiftRight,I.shiftRightUnsigned=function(t){if(n(t)&&(t=t.toInt()),0===(t&=63))return this;var e=this.high;return t<32?r(this.low>>>t|e<<32-t,e>>>t,this.unsigned):32===t?r(e,0,this.unsigned):r(e>>>t-32,0,this.unsigned)},I.shru=I.shiftRightUnsigned,I.toSigned=function(){return this.unsigned?r(this.low,this.high,!1):this},I.toUnsigned=function(){return this.unsigned?this:r(this.low,this.high,!0)},I.toBytes=function(t){return t?this.toBytesLE():this.toBytesBE()},I.toBytesLE=function(){var t=this.high,n=this.low;return[255&n,n>>>8&255,n>>>16&255,n>>>24&255,255&t,t>>>8&255,t>>>16&255,t>>>24&255]},I.toBytesBE=function(){var t=this.high,n=this.low;return[t>>>24&255,t>>>16&255,t>>>8&255,255&t,n>>>24&255,n>>>16&255,n>>>8&255,255&n]},t})},{}]},{},[1]);
