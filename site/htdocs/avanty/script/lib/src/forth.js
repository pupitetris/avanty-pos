(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// This file is part of Microsafe AVANTY. -*- tab-width: 4; -*-
//
// Copyright © 2017 Microsafe, S.A. de C.V.
// Derechos Reservados (R) 2017 Microsafe, S.A. de C.V.

(function () {
	var mod = require ('js-forth');

	mod.init = function () {
		mod.initialized = true;
	};

	mod.onLoad = function () {
		if (!mod.loaded)
			return;

		mod.reset ();
	};

	mod.reset = function () {
	};

	APP.addModule ('forth', mod);
}) ();

},{"js-forth":6}],2:[function(require,module,exports){
function ComparisonOperations(f) {
    f.defjs("true", function _true() {
        f.stack.push(-1);
    });

    f.defjs("false", function _false() {
        f.stack.push(0);
    });

    f.defjs("and", function and() {
        var first = f.stack.pop();
        f.stack.push(f.stack.pop() & first);
    });

    f.defjs("or", function or() {
        var first = f.stack.pop();
        f.stack.push(f.stack.pop() | first);
    });

    f.defjs("xor", function xor() {
        var first = f.stack.pop();
        f.stack.push(f.stack.pop() ^ first);
    });

    f.defjs("invert", function invert() {
        f.stack.push(~f.stack.pop());
    });

    f.defjs("=", function equal() {
        var first = f.stack.pop();
        f.stack.push((f.stack.pop() == first) ? -1 : 0);
    });

    f.defjs("<>", function notEqual() {
        var first = f.stack.pop();
        f.stack.push((f.stack.pop() != first) ? -1 : 0);
    });

    f.defjs("<", function lessThan() {
        var first = f.stack.pop();
        f.stack.push((f.stack.pop() < first) ? -1 : 0);
    });

    f.defjs(">", function greaterThan() {
        var first = f.stack.pop();
        f.stack.push((f.stack.pop() > first) ? -1 : 0);
    });

    f.defjs("<=", function lessThanEqual() {
        var first = f.stack.pop();
        f.stack.push((f.stack.pop() <= first) ? -1 : 0);
    });

    f.defjs(">=", function greaterThanEqual() {
        var first = f.stack.pop();
        f.stack.push((f.stack.pop() >= first) ? -1 : 0);
    });

    f.defjs("within", function within() {
        var upperLimit = f.stack.pop();
        var lowerLimit = f.stack.pop();
        var value = f.stack.pop();
        var result = (lowerLimit < upperLimit && lowerLimit <= value && value < upperLimit ||
            lowerLimit > upperLimit && (lowerLimit <= value || value < upperLimit));
        f.stack.push(result ? -1 : 0);
    });

    return f;
}

module.exports = ComparisonOperations;
},{}],3:[function(require,module,exports){
function ControlStructures(f) {
    // if, else, then
    f.defjs("jump", function jump() {
        f.instructionPointer += f.dataSpace[f.instructionPointer];
    });

    f.defjs("jumpIfFalse", function jumpIfFalse() {
        if (!f.stack.pop()) {
            f.instructionPointer += f.dataSpace[f.instructionPointer];
        } else {
            f.instructionPointer++; // Skip the offset
        }
    });


    // do, loop, +loop, unloop, leave, i, j
    function _do() {
        f.returnStack.push(f.dataSpace[f.instructionPointer++]);
        var top = f.stack.pop();
        f.returnStack.push(f.stack.pop());
        f.returnStack.push(top);
    }

    f.defjs("do", function compileDo() {
        f.dataSpace.push(_do);
        f.dataSpace.push(0); // Dummy endLoop
        f.stack.push(f.dataSpace.length - 1);
    }, true); // Immediate

    function questionDo() {
        if (f.stack.peek(1) !== f.stack.peek(2)) {
            _do();
        } else {
            f.stack.pop();
            f.stack.pop();
            f.instructionPointer = f.dataSpace[f.instructionPointer];
        }
    }

    f.defjs("?do", function compileQuestionDo() {
        f.dataSpace.push(questionDo);
        f.dataSpace.push(0); // Dummy endLoop
        f.stack.push(f.dataSpace.length - 1);
    }, true); // Immediate

    function plusLoop() {
        var step = f.stack.pop();
        var index = f.returnStack.pop() | 0;
        var limit = f.returnStack.pop() | 0;

        var exitLoop;
        if (step > 0) {
            if (index > limit) { // Overflow, so do unsigned
                limit = limit >>> 0;
                index = index >>> 0;
            }
            exitLoop = index < limit && index + step >= limit;
        } else if (step < 0) {
            if (index < limit) {
                index = index >>> 0;
                limit = limit >>> 0;
            }
            exitLoop = index >= limit && index + step < limit;
        } else {
            exitLoop = false;
        }

        if (exitLoop) {
            f.returnStack.pop();
            f.instructionPointer++;
        } else {
            f.returnStack.push(limit | 0);
            f.returnStack.push(index + step | 0);
            f.instructionPointer += f.dataSpace[f.instructionPointer];
        }
    }

    var compilePlusLoop = f.defjs("+loop", function compilePlusLoop() {
        f.dataSpace.push(plusLoop);
        var doPosition = f.stack.pop();
        f.dataSpace.push(doPosition - f.dataSpace.length + 1);
        f.dataSpace[doPosition] = f.dataSpace.length;
    }, true); // Immediate

    f.defjs("loop", function loop() {
        f.dataSpace.push(f._lit);
        f.dataSpace.push(1);
        compilePlusLoop();
    }, true); // Immediate

    f.defjs("unloop", function unloop() {
        f.returnStack.pop();
        f.returnStack.pop();
        f.returnStack.pop();
    });

    f.defjs("leave", function leave() {
        f.returnStack.pop();
        f.returnStack.pop();
        f.instructionPointer = f.returnStack.pop();
    });

    f.defjs("i", function i() {
        f.stack.push(f.returnStack.peek());
    });

    f.defjs("j", function j() {
        f.stack.push(f.returnStack.peek(4));
    });


    // recurse
    f.defjs("recurse", function recurse() {
        f.dataSpace.push(f.dataSpace[f._latest() + 1]);
    }, true); // Immediate


    // does
    function _does() {
        var wordPosition = f._latest();
        var doDoesPosition = f.instructionPointer;

        f.dataSpace[wordPosition + 1] = function doDoes() {
            f.stack.push(wordPosition + 2);
            f.returnStack.push(f.instructionPointer);
            f.instructionPointer = doDoesPosition;
        };

        f.instructionPointer = f.returnStack.pop();
    }

    f.defjs("does>", function compileDoes() {
        f.dataSpace.push(_does);
    }, true); // Immediate

    return f;
}

module.exports = ControlStructures;
},{}],4:[function(require,module,exports){
var Stack = require("./stack.js");

function Data(f) {
    f.instructionPointer = 0;
    f.dataSpace = [];
    f.returnStack = new Stack("Return Stack");
    f.stack = new Stack("Stack");

    return f;
}

module.exports = Data;
},{"./stack.js":15}],5:[function(require,module,exports){
function Header(link, name, immediate, hidden, executionToken) {
    this.link = link;
    this.name = name;
    this.immediate = immediate || false;
    this.hidden = hidden || false;
    this.executionToken = executionToken;
}

function Definitions(f) {

    // Temporary definition until latest is defined as a variable
    var latest = function latest() {
        return null;
    };

    function defheader(name, immediate, hidden) {
        f.dataSpace.push(new Header(latest(), name, immediate, hidden, f.dataSpace.length + 1));
        latest(f.dataSpace.length - 1);
    }

    f.defjs = function defjs(name, fn, immediate, displayName) {
        defheader(displayName || name, immediate);
        f.dataSpace.push(fn);
        return fn;
    };

    f.defvar = function defvar(name, initial) {
        defheader(name);
        var varAddress = f.dataSpace.length + 1;
        f.dataSpace.push(function variable() {
            f.stack.push(varAddress);
        });
        f.dataSpace.push(initial);

        return function(value) {
            if (value !== undefined)
                f.dataSpace[varAddress] = value;
            else
                return f.dataSpace[varAddress];
        };
    };

    latest = f.defvar("latest", f.dataSpace.length); // Replace existing function definition
    f.compiling = f.defvar("state", 0);

    f.compileEnter = function compileEnter(name) {
        var instruction = f.dataSpace.length + 1;

        var enter;
        try {
            enter = eval(`(
                function ${name}() {
                    f.returnStack.push(f.instructionPointer);
                    f.instructionPointer = instruction;
                })
            `);
        } catch (e) {
            // Failback for names that are invalid identifiers
            enter = function enter() {
                f.returnStack.push(f.instructionPointer);
                f.instructionPointer = instruction;
            };
        }

        f.dataSpace.push(enter);
        return enter;
    };

    f.findDefinition = function findDefinition(word) {
        var current = latest();
        while (current !== null) {
            var wordDefinition = f.dataSpace[current];
            // Case insensitive
            if (wordDefinition.name && wordDefinition.name.toLowerCase() == word.toLowerCase() && !wordDefinition.hidden)
                return wordDefinition;
            current = wordDefinition.link;
        }
        return current;
    };

    f.defjs(":", function colon() {
        var name = f._readWord();
        defheader(name, false, true);
        f.compileEnter(name);
        f.compiling(true);
    });

    f.defjs(":noname", function noname() {
        defheader(null, false, true);
        f.stack.push(f.dataSpace.length);
        f.compileEnter("_noname_");
        f.compiling(true);
    });

    var exit = f.defjs("exit", function exit() {
        f.instructionPointer = f.returnStack.pop();
    });

    f.defjs(";", function semicolon() {
        f.dataSpace.push(exit);
        f.dataSpace[latest()].hidden = false;
        f.compiling(false);
    }, true); // Immediate

    f.defjs("find", function find() {
        var input = f.stack.pop();
        var word = input;
        if (typeof input === "number") {
            var startPosition = input;
            var length = f._getAddress(startPosition);
            word = "";
            for (var i = 1; i <= length; i++) {
                word += String.fromCharCode(f._getAddress(startPosition + i));
            }
        }
        var definition = f.findDefinition(word);
        if (definition) {
            f.stack.push(definition.executionToken);
            f.stack.push(definition.immediate ? 1 : -1);
        } else {
            f.stack.push(input);
            f.stack.push(0);
        }
    });

    // Converts an execution token into the data field address
    f.defjs(">body", function dataFieldAddress() {
        f.stack.push(f.stack.pop() + 1);
    });

    f.defjs("create", function create() {
        defheader(f._readWord());
        var dataFieldAddress = f.dataSpace.length + 1;
        f.dataSpace.push(function pushDataFieldAddress() {
            f.stack.push(dataFieldAddress);
        });
    });

    f.defjs("allot", function allot() {
        f.dataSpace.length += f.stack.pop();
    });

    f.defjs(",", function comma() {
        f.dataSpace.push(f.stack.pop());
    });

    f.defjs("compile,", function compileComma() {
        f.dataSpace.push(f.dataSpace[f.stack.pop()]);
    });

    f.defjs("[", function lbrac() {
        f.compiling(false); // Immediate
    }, true); // Immediate

    f.defjs("]", function rbrac() {
        f.compiling(true); // Compile
    });

    f.defjs("immediate", function immediate() {
        var wordDefinition = f.dataSpace[latest()];
        wordDefinition.immediate = true;
    });

    f.defjs("hidden", function hidden() {
        var wordDefinition = f.dataSpace[f.stack.pop()];
        wordDefinition.hidden = !wordDefinition.hidden;
    });

    f.defjs("'", function tick() {
        f.stack.push(f.findDefinition(f._readWord()).executionToken);
    });

    var _lit = f.defjs("lit", function lit() {
        f.stack.push(f.dataSpace[f.instructionPointer]);
        f.instructionPointer++;
    });

    f.defjs("[']", function bracketTick() {
        f.dataSpace.push(f._lit);
        f.dataSpace.push(f.findDefinition(f._readWord()).executionToken);
    }, true);

    f.defjs("marker", function marker() {
        var savedLatest = latest();
        var savedLength = f.dataSpace.length;

        defheader(f._readWord());
        f.dataSpace.push(function marker() {
            latest(savedLatest);
            f.dataSpace.length = savedLength;
        });
    });

    f._latest = latest;
    f._lit = _lit;
    return f;
}

module.exports = Definitions;
},{}],6:[function(require,module,exports){
var Data = require("./data.js");
var Definitions = require("./definitions.js");
var NumericOperations = require("./numeric-operations.js");
var BooleanOperations = require("./boolean-operations.js");
var StackOperations = require("./stack-operations.js");
var MemoryOperations = require("./memory-operations.js");
var ControlStructures = require("./control-structures.js");
var JsInterop = require("./js-interop.js");
var Input = require("./input.js");
var Output = require("./output.js");
//var Include = require("./include.js");
var Interpreter = require("./interpreter.js");

function Forth() {
    var forth = {};

    Data(forth);
    Definitions(forth);
    Input(forth);
    NumericOperations(forth);
    BooleanOperations(forth);
    StackOperations(forth);
    MemoryOperations(forth);
    ControlStructures(forth);
    Output(forth);
    JsInterop(forth);
    //Include(forth);
    Interpreter(forth);

    return forth;
}

module.exports = Forth;

},{"./boolean-operations.js":2,"./control-structures.js":3,"./data.js":4,"./definitions.js":5,"./input.js":8,"./interpreter.js":9,"./js-interop.js":10,"./memory-operations.js":11,"./numeric-operations.js":12,"./output.js":13,"./stack-operations.js":14}],7:[function(require,module,exports){
module.exports = {
    EndOfInput: {},
    WaitingOnInput: {}
};
},{}],8:[function(require,module,exports){
var InputExceptions = require("./input-exceptions.js");

function InputWindow(input, startPosition, endPosition, toIn, sourceId) {
    var inputBufferPosition = startPosition;
    var inputBufferLength = -1;

    function refill() {
        inputBufferPosition += inputBufferLength + 1;

        inputBufferLength = input.substring(inputBufferPosition).search(/\n/);
        if (inputBufferLength == -1 || inputBufferPosition + inputBufferLength > endPosition)
            inputBufferLength = endPosition - inputBufferPosition;

        toIn(0);
        return inputBufferPosition < endPosition;
    }

    function readKey() {
        var keyPosition = inputBufferPosition + toIn();
        if (keyPosition < endPosition) {
            toIn(toIn() + 1);
            return input.charAt(keyPosition);
        } else {
            return null;
        }
    }

    function parse(delimiter, skipLeading) {
        delimiter = delimiter || " ".charCodeAt(0);
        var inputBuf = inputBuffer();

        var startPosition = toIn();
        if (skipLeading) {
            while (inputBuf.charCodeAt(startPosition) === delimiter && startPosition < inputBuf.length) {
                startPosition++;
            }
        }

        var endPosition = startPosition;
        while (inputBuf.charCodeAt(endPosition) !== delimiter && endPosition < inputBuf.length) {
            endPosition++;
        }

        toIn(endPosition + 1);
        var result = inputBuf.substring(startPosition, endPosition);
        return [inputBufferPosition + startPosition, result.length, result];
    }

    function readWord(delimiter) {
        return parse(delimiter, true)[2];
    }

    function sBackslashQuote() {
        var string = "";

        while (true) {
            var char = readKey();

            if (char === "\"") {
                break;
            } else if (char === "\\") {
                var nextChar = readKey();
                switch (nextChar) {
                    case "a":
                        string += String.fromCharCode(7);
                        break;
                    case "b":
                        string += String.fromCharCode(8);
                        break;
                    case "e":
                        string += String.fromCharCode(27);
                        break;
                    case "f":
                        string += String.fromCharCode(12);
                        break;
                    case "l":
                        string += String.fromCharCode(10);
                        break;
                    case "m":
                        string += String.fromCharCode(13) + String.fromCharCode(10);
                        break;
                    case "n":
                        string += String.fromCharCode(10);
                        break;
                    case "q":
                        string += String.fromCharCode(34);
                        break;
                    case "r":
                        string += String.fromCharCode(13);
                        break;
                    case "t":
                        string += String.fromCharCode(9);
                        break;
                    case "v":
                        string += String.fromCharCode(11);
                        break;
                    case "z":
                        string += String.fromCharCode(0);
                        break;
                    case "\"":
                        string += String.fromCharCode(34);
                        break;
                    case "x":
                        string += String.fromCharCode(parseInt(readKey() + readKey(), 16));
                        break;
                    case "\\":
                        string += String.fromCharCode(92);
                        break;
                    default:
                        // Be lenient
                        string += nextChar;
                }
            } else {
                string += char;
            }
        }

        return string;
    }

    function source() {
        return [inputBufferPosition, inputBufferLength];
    }

    function inputBuffer() {
        if (inputBufferLength > 0)
            return input.substring(inputBufferPosition, inputBufferPosition + inputBufferLength);
        else
            return "";
    }

    function subInput(position, length) {
        return InputWindow(input, position, position + length, toIn, -1);
    }

    function charCodeAt(index) {
        return input.charCodeAt(index);
    }

    return {
        readWord: readWord,
        readKey: readKey,
        parse: parse,
        refill: refill,
        inputBuffer: inputBuffer,
        source: source,
        charCodeAt: charCodeAt,
        subInput: subInput,
        sBackslashQuote: sBackslashQuote,
        sourceId: sourceId
    };
}

function Input(f) {
    f._base = f.defvar("base", 10);

    // Input buffer pointer
    var toIn = f.defvar(">in", 0);

    // Address offset to indicate input addresses
    var INPUT_SOURCE = 1 << 31;

    f.defjs("source", function source() {
        var positionLength = f._currentInput.source();
        f.stack.push(INPUT_SOURCE + positionLength[0]);
        f.stack.push(positionLength[1]);
    });

    f.defjs("source-id", function sourceId() {
        f.stack.push(f._currentInput.sourceId);
    });

    f.defjs("refill", function refill() {
        f.stack.push(f._currentInput.refill());
    });

    f.defjs("key", function key() {
        f.stack.push(f._currentInput.readKey().charCodeAt(0));
    });

    f.defjs("parse", function parse() {
        var addressLength = f._currentInput.parse(f.stack.pop(), false);
        f.stack.push(INPUT_SOURCE + addressLength[0]);
        f.stack.push(addressLength[1]);
    });

    f.defjs("parse-name", function parse() {
        var addressLength = f._currentInput.parse(" ".charCodeAt(0), true);
        f.stack.push(INPUT_SOURCE + addressLength[0]);
        f.stack.push(addressLength[1]);
    });

    function readWord(delimiter) {
        return f._currentInput.readWord(delimiter);
    }

    var wordBufferStart = f.dataSpace.length;
    f.dataSpace.length += 128;
    f.defjs("word", function word() {
        var delimiter = f.stack.pop();
        var word = readWord(delimiter);
        var length = Math.min(word.length, 127);
        f.dataSpace[wordBufferStart] = length;
        for (var i = 0; i < length; i++) {
            f.dataSpace[wordBufferStart + i + 1] = word.charCodeAt(i);
        }

        f.stack.push(wordBufferStart);
    });

    f.defjs("s\\\"", function sBackslashQuote() {
        var string = f._currentInput.sBackslashQuote();
        var stringAddress = f.dataSpace.length + 1;
        f.dataSpace.push(function() {
            f.stack.push(stringAddress);
            f.stack.push(string.length);

            // Jump over compiled string
            f.instructionPointer += string.length;
        });

        for (var i = 0; i < string.length; i++) {
            f.dataSpace.push(string[i]);
        }
    }, true); // Immediate

    f.defjs("char", function char() {
        f.stack.push(readWord().charCodeAt(0));
    });

    f.defjs("accept", function accept() {

        var maxLength = f.stack.pop();
        var address = f.stack.pop();

        f.currentInstruction = function acceptCallback() {
            f._currentInput.refill();
            var received = f._currentInput.inputBuffer().substring(0, maxLength).split("\n")[0];

            f.stack.push(received.length);
            for (var i = 0; i < received.length; i++) {
                f._setAddress(address + i, received[i]);
            }

            popInput();
        };

        throw InputExceptions.WaitingOnInput;
    });

    // returns NaN if any characters are invalid in base
    function parseIntStrict(num, base) {
        var int = 0;
        if (num[0] !== "-") { // Positive
            for (var i = 0; i < num.length; i++) {
                int *= base;
                int += parseInt(num[i], base);
            }
            return int;
        } else {
            for (var j = 1; j < num.length; j++) {
                int *= base;
                int -= parseInt(num[j], base);
            }
            return int;
        }
    }

    // Parse a float in the current base
    function _parseFloatInBase(string) {
        var base;
        if (string[0] === "'" && string.length === 3 && string[2] == "'") { // 'a'
            return string.charCodeAt(1);
        } else if (string[0] === "#") { // decimal - #1234567890
            string = string.substring(1);
            base = 10;
        } else if (string[0] === "$") { // hex - $ff00ff
            string = string.substring(1);
            base = 16;
        } else if (string[0] === "%") { // binary - %10110110
            string = string.substring(1);
            base = 2;
        } else {
            base = f._base();
        }

        var num = string.split(/\./);

        var integerPart = 0;
        if (num[0] !== '') {
            integerPart = parseIntStrict(num[0], base);
        }

        var fractionalPart = 0;
        if (num.length > 1 && num[1] !== '') {
            fractionalPart = parseIntStrict(num[1], base) * Math.pow(base, -num[1].length);
        }

        if (integerPart >= 0) {
            return integerPart + fractionalPart;
        } else {
            return integerPart - fractionalPart;
        }
    }

    var inputString = "";

    function newInput(input, sourceId) {
        saveCurrentInput();
        var startPosition = inputString.length;
        inputString += input;
        f._currentInput = InputWindow(inputString, startPosition, inputString.length, toIn, sourceId);
    }

    var inputStack = [];

    function subInput(position, length) {
        saveCurrentInput();
        f._currentInput = f._currentInput.subInput(position, length);
    }

    function saveCurrentInput() {
        if (f._currentInput) {
            inputStack.push({
                input: f._currentInput,
                toIn: toIn(),
                instructionPointer: f.instructionPointer
            });
        }
    }

    function popInput() {
        var savedInput = inputStack.pop();
        if (savedInput) {
            f._currentInput = savedInput.input;
            toIn(savedInput.toIn);
            f.instructionPointer = savedInput.instructionPointer;
            f.currentInstruction = f.dataSpace[f.instructionPointer++];
        } else {
            f._currentInput = null;
        }
    }

    f.defjs("save-input", function saveInput() {
        saveCurrentInput();
        for (var i = 0; i < inputStack.length; i++) {
            f.stack.push(inputStack[i]);
        }
        f.stack.push(inputStack.length);
        inputStack.pop();
    });

    f.defjs("restore-input", function restoreInput() {
        inputStack.length = 0;

        var length = f.stack.pop();
        for (var i = length - 1; i >= 0; i--) {
            inputStack[i] = f.stack.pop();
        }

        var savedInput = inputStack.pop();
        f._currentInput = savedInput.input;
        toIn(savedInput.toIn);

        f.stack.push(0);
    });

    f._readWord = readWord;
    f._newInput = newInput;
    f._subInput = subInput;
    f._popInput = popInput;
    f._parseFloatInBase = _parseFloatInBase;
    f._INPUT_SOURCE = INPUT_SOURCE;
    return f;
}

module.exports = Input;
},{"./input-exceptions.js":7}],9:[function(require,module,exports){
var InputExceptions = require("./input-exceptions.js");

function Interpreter(f) {
    function run(input, outputCallback, sourceId) {
        f.outputCallback = outputCallback;

        f._newInput(input, sourceId || 0);
        f._output = "";

        try {
            runInterpreter();
        } catch (err) {
            if (err !== InputExceptions.WaitingOnInput) {
                console.error("Exception " + err + " at:\n" + printStackTrace());
                console.error(f._currentInput.inputBuffer());
                console.error(f._output);
                f.currentInstruction = quit;
                f.stack.clear();
                outputCallback(err, f._output);
                throw err;
            }
        }

        outputCallback(null, f._output);
    }

    function runInterpreter() {
        // Run while there is still input to consume 
        while (f._currentInput) {
            try {
                // As js doesn't support tail call optimisation the
                // run function uses a trampoline to execute forth code
                while (true) {
                    f.currentInstruction();
                    f.currentInstruction = f.dataSpace[f.instructionPointer++];
                }
            } catch (err) {
                if (err === InputExceptions.EndOfInput) {
                    f._popInput();
                } else {
                    throw err;
                }
            }
        }
    }

    function printStackTrace() {
        var stackTrace = "    " + f.currentInstruction.name + " @ " + (f.instructionPointer - 1);
        for (var i = f.returnStack.length - 1; i >= 0; i--) {
            var instruction = f.returnStack[i];
            stackTrace += "\n    " + f.dataSpace[instruction - 1].name + " @ " + (instruction - 1);
        }
        return stackTrace;
    }

    f._evaluate = f.defjs("evaluate", function evaluate() {
        var length = f.stack.pop();
        var address = f.stack.pop();
        if (address < 0) {
            var position = address - f._INPUT_SOURCE;
            f._subInput(position, length);
        } else {
            var string = "";
            for (var i = 0; i < length; i++) {
                string += String.fromCharCode(f._getAddress(address + i));
            }
            f._newInput(string, -1);
        }

        f.instructionPointer = interpretInstruction;
    });

    function interpretWord() {
        var word = f._readWord();
        while (!word) {
            if (!f._currentInput.refill()) throw InputExceptions.EndOfInput;
            word = f._readWord();
        }

        var definition = f.findDefinition(word);
        if (definition) {
            if (!f.compiling() || definition.immediate) {
                f.dataSpace[definition.executionToken]();
                return;
            } else {
                f.dataSpace.push(f.dataSpace[definition.executionToken]);
            }
        } else {
            var num = f._parseFloatInBase(word);
            if (isNaN(num)) throw "Word not defined: " + word;
            if (f.compiling()) {
                f.dataSpace.push(f._lit);
                f.dataSpace.push(num);
            } else {
                f.stack.push(num);
            }
        }
    }

    var interpretInstruction = f.dataSpace.length + 1;
    f.defjs("interpret", function interpret() {
        f.instructionPointer = interpretInstruction; // Loop after interpret word is called
        interpretWord();
    });

    var quit = f.defjs("quit", function quit() {
        f.compiling(false); // Enter interpretation state
        f.returnStack.clear(); // Clear return stack
        f.instructionPointer = interpretInstruction; // Run the interpreter
    });

    var abort = f.defjs("abort", function abort(error) {
        f.stack.clear();
        throw error || "";
    });

    f.defjs('abort"', function abortQuote() {
        var error = f._currentInput.parse('"'.charCodeAt(0))[2];
        f.dataSpace.push(function abortQuote() {
            if (f.stack.pop())
                abort(error);
        });
    }, true); // Immediate

    f.defjs("execute", function execute() {
        f.dataSpace[f.stack.pop()]();
    });

    // Set initial instruction
    f.currentInstruction = quit;
    f.run = run;

    return f;
}

module.exports = Interpreter;
},{"./input-exceptions.js":7}],10:[function(require,module,exports){
(function (global){
function JsInterop(f) {
    // Interop
    //   - new with params          js .new{1}
    //   - global variable access   js /document
    //   - array access             js .0.2
    //   - property access/setting  js .name  js .name!
    //   - function calling         js .sin{1} .{2}  >>  obj = pop, f = obj[name], f.call(obj, pop(), pop())
    //   - method calling           js /document.getElementById{1}
    //
    // When compiling it should resolve global names immediately.
    function jsNewCall(path) {
        var constructor = f.stack.pop();
        var argsCount = parseInt(path.match(/\{(\d*)\}/)[1] || 0);
        var args = [null]; // new replaces the first argument with this
        for (var j = 0; j < argsCount; j++) {
            args.push(f.stack.pop());
        }
        // Use new operator with any number of arguments
        return new(Function.prototype.bind.apply(constructor, args))();
    }

    function jsFunctionCall(path) {
        var argsCount = parseInt(path.match(/\{(\d*)\}/)[1] || 0);
        var obj = f.stack.pop();
        path = path.match(/[^\{]*/)[0];
        var func = path ? obj[path] : obj;
        var args = [];
        for (var j = 0; j < argsCount; j++) {
            args.push(f.stack.pop());
        }
        return func.apply(obj, args);
    }

    var jsAssignmentRegex = /(^[A-Za-z$_][\w$_]*!$)|(^\d+!$)/; // name!
    var jsNewCallRegex = /new\{\d*\}$/; // new{2}
    var jsFunctionCallRegex = /((^[A-Za-z$_][\w$_]*)|(^\d+))?\{\d*\}$/; // getElementById{1}

    var globl = (typeof window !== 'undefined' && typeof navigator !== 'undefined' && window.document) ? window : global;

    function jsInterop(js) {
        if (js.startsWith("/")) { // Add global to f.stack
            f.stack.push(globl);
        } else if (!js.startsWith(".")) {
            throw "js interop call must start with '/' or '.'";
        }

        var paths = js.length > 1 ? js.substring(1).split(".") : [];

        for (var i = 0; i < paths.length; i++) {
            var path = paths[i];

            if (path.match(jsAssignmentRegex)) {
                f.stack.pop()[path.substring(0, path.length - 1)] = f.stack.pop();
            } else if (path.match(jsNewCallRegex)) {
                f.stack.push(jsNewCall(path));
            } else if (path.match(jsFunctionCallRegex)) {
                f.stack.push(jsFunctionCall(path));
            } else { // Property access
                f.stack.push(f.stack.pop()[path]);
            }
        }
    }

    var JS = f.defjs("js", function js() {
        jsInterop(f.stack.pop());
    });

    f.defjs("js", function js() {
        if (f.compiling()) {
            f.dataSpace.push(f._lit);
            f.dataSpace.push(f._readWord());
            f.dataSpace.push(JS);
        } else {
            jsInterop(f._readWord());
        }
    }, true);

    f.defjs(">js-string", function toJsString() {
        var length = f.stack.pop();
        var address = f.stack.pop();
        var string = "";
        for (var i = 0; i < length; i++) {
            string += String.fromCharCode(f._getAddress(address + i));
        }
        f.stack.push(string);
    })

    return f;
}

module.exports = JsInterop;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],11:[function(require,module,exports){
function MemoryOperations(f) {
    function getAddress(address) {
        if (address < 0) {
            return f._currentInput.charCodeAt(address - f._INPUT_SOURCE);
        } else {
            var value = f.dataSpace[address];
            if (typeof value == "string")
                return value.charCodeAt(0);
            else
                return value;
        }
    }

    function setAddress(address, value) {
        if (address < 0) {
            throw "Illegal attempt to change input";
        } else {
            f.dataSpace[address] = value;
        }
    }

    f.defjs("!", function store() {
        var address = f.stack.pop();
        var data = f.stack.pop();
        setAddress(address, data);
    });

    f.defjs("@", function fetch() {
        var address = f.stack.pop();
        f.stack.push(getAddress(address));
    });

    f.defjs("+!", function addStore() {
        var address = f.stack.pop();
        var data = f.stack.pop();
        f.dataSpace[address] = f.dataSpace[address] + data;
    });

    f.defjs("-!", function subtractStore() {
        var address = f.stack.pop();
        var data = f.stack.pop();
        f.dataSpace[address] = f.dataSpace[address] - data;
    });

    f.defjs("here", function here() {
        f.stack.push(f.dataSpace.length);
    });

    f._getAddress = getAddress;
    f._setAddress = setAddress;
    return f;
}

module.exports = MemoryOperations;
},{}],12:[function(require,module,exports){
var Long = require("long");

function NumericOperations(f) {
    f.defjs("+", function plus() {
        var first = f.stack.pop();
        f.stack.push(f.stack.pop() + first | 0);
    });

    f.defjs("-", function minus() {
        var first = f.stack.pop();
        f.stack.push(f.stack.pop() - first | 0);
    });

    f.defjs("*", function multiply() {
        var first = f.stack.pop();
        f.stack.push(f.stack.pop() * first | 0);
    });

    f.defjs("/", function divide() {
        var first = f.stack.pop();
        var second = f.stack.pop();
        f.stack.push(Math.trunc(second / first));
    });

    f.defjs("2*", function inc() {
        f.stack.push(f.stack.pop() << 1);
    });

    f.defjs("2/", function inc() {
        f.stack.push(f.stack.pop() >> 1);
    });

    f.defjs("mod", function mod() {
        var first = f.stack.pop();
        f.stack.push(f.stack.pop() % first);
    });

    f.defjs("s>d", function singleToDouble() {
        var value = Long.fromInt(f.stack.pop());
        f.stack.push(value.low);
        f.stack.push(value.high);
    });

    f.defjs("*/", function multiplyDivide() {
        var divisor = Long.fromInt(f.stack.pop());
        var first = Long.fromInt(f.stack.pop());
        var second = Long.fromInt(f.stack.pop());
        var quotient = first.mul(second).div(divisor).toInt();
        f.stack.push(quotient);
    });

    f.defjs("m*", function() {
        var first = Long.fromInt(f.stack.pop());
        var second = Long.fromInt(f.stack.pop());
        var result = first.mul(second);
        f.stack.push(result.low);
        f.stack.push(result.high);
    });

    f.defjs("*/mod", function multiplyDivideMod() {
        var divisor = Long.fromInt(f.stack.pop());
        var first = Long.fromInt(f.stack.pop());
        var second = Long.fromInt(f.stack.pop());
        var mult = first.mul(second);
        var quotient = mult.div(divisor).toInt();
        var mod = mult.mod(divisor).toInt();
        f.stack.push(mod);
        f.stack.push(quotient);
    });

    f.defjs("um*", function() {
        var first = Long.fromInt(f.stack.pop(), true);
        var second = Long.fromInt(f.stack.pop(), true);
        var result = first.mul(second);
        f.stack.push(result.low);
        f.stack.push(result.high);
    });

    f.defjs("um/mod", function unsignedDivideMod() {
        var divisor = Long.fromInt(f.stack.pop());
        var bigPart = f.stack.pop();
        var smallPart = f.stack.pop();
        var long = new Long(smallPart, bigPart, true);
        var quotient = long.div(divisor).toInt();
        var mod = long.mod(divisor).toInt();
        f.stack.push(mod);
        f.stack.push(quotient);
    });

    f.defjs("fm/mod", function flooredDivideMod() {
        var divisor = Long.fromInt(f.stack.pop());
        var bigPart = f.stack.pop();
        var smallPart = f.stack.pop();
        var long = new Long(smallPart, bigPart);
        var quotient = long.div(divisor).toInt();
        var mod = long.mod(divisor).toInt();
        f.stack.push(mod);
        f.stack.push(quotient);
    });

    f.defjs("sm/rem", function symmetricDivideRem() {
        var divisor = Long.fromInt(f.stack.pop());
        var bigPart = f.stack.pop();
        var smallPart = f.stack.pop();
        var long = new Long(smallPart, bigPart);
        var quotient = long.div(divisor).toInt();
        var mod = long.mod(divisor).toInt();
        f.stack.push(mod);
        f.stack.push(quotient);
    });

    f.defjs("abs", function abs() {
        f.stack.push(Math.abs(f.stack.pop()) | 0);
    });

    f.defjs("lshift", function lshift() {
        var shift = f.stack.pop();
        var num = f.stack.pop();
        f.stack.push(num << shift);
    });

    f.defjs("rshift", function rshift() {
        var shift = f.stack.pop();
        var num = f.stack.pop();
        f.stack.push(num >>> shift);
    });

    f.defjs("max", function max() {
        f.stack.push(Math.max(f.stack.pop(), f.stack.pop()));
    });

    f.defjs("min", function min() {
        f.stack.push(Math.min(f.stack.pop(), f.stack.pop()));
    });

    f.defjs("negate", function negate() {
        f.stack.push(-f.stack.pop());
    });

    return f;
}

module.exports = NumericOperations;
},{"long":16}],13:[function(require,module,exports){
var Long = require("long");

function Output(f) {

    f._output = "";

    f.defjs("cr", function cr() {
        f._output += "\n";
    });

    f.defjs(".", function dot() {
        var value;
        var top = f.stack.pop();

        if (typeof top === "undefined")
            value = "undefined";
        else if (top === null)
            value = "null";
        else
            value = top.toString(f._base()); // Output numbers in current base

        f._output += value + " ";
    });

    f.defjs(".r", function dotR() {
        var value;
        var width = f.stack.pop();
        var top = f.stack.pop();

        if (typeof top === "undefined")
            value = "undefined";
        else if (top === null)
            value = "null";
        else
            value = top.toString(f._base()); // Output numbers in current base

        while (value.length < width) {
            value = " " + value;
        }
        f._output += value + " ";
    });

    f.defjs("emit", function emit() {
        var value = f.stack.pop();
        if (typeof value === "number")
            f._output += String.fromCharCode(value);
        else
            f._output += value;
    });

    f.defjs("type", function type() {
        var length = f.stack.pop();
        var address = f.stack.pop();
        for (var i = 0; i < length; i++) {
            var value = f._getAddress(address + i);
            if (typeof value === "number") {
                f._output += String.fromCharCode(value);
            } else
                f._output += value;
        }
    });

    // Numeric output
    var numericOutputStart = f.dataSpace.length;
    var numericOutput = "";
    f.dataSpace.length += 128;

    f.defjs("<#", function initialiseNumericOutput() {
        numericOutput = "";
    });

    f.defjs("hold", function hold() {
        var value = f.stack.pop();
        if (typeof value === "number")
            value = String.fromCharCode(value);
        numericOutput += value;
    });

    f.defjs("#>", function finishNumericOutput() {
        f.stack.pop();
        f.stack.pop();
        for (var i = 0; i < numericOutput.length; i++) {
            f.dataSpace[numericOutputStart + i] = numericOutput[numericOutput.length - i - 1];
        }
        f.stack.push(numericOutputStart);
        f.stack.push(numericOutput.length);
    });

    f.defjs("sign", function sign() {
        if (f.stack.pop() < 0)
            numericOutput += "-";
    });

    f.defjs("#", function writeNextNumericOutput() {
        var bigPart = f.stack.pop();
        var smallPart = f.stack.pop();
        var value = new Long(smallPart, bigPart, true);
        var base = Long.fromInt(f._base());

        numericOutput += value.mod(base).toString(base).toUpperCase();
        value = value.div(base);

        f.stack.push(value.smallPart);
        f.stack.push(value.bigPart);
    });

    f.defjs("#S", function writeAllNumericOutput() {
        var bigPart = f.stack.pop();
        var smallPart = f.stack.pop();
        var value = new Long(smallPart, bigPart, true);
        var base = Long.fromInt(f._base());

        if (value.compare(Long.ZERO)) {
            while (value.compare(Long.ZERO)) {
                numericOutput += value.mod(base).toString(base).toUpperCase();
                value = value.div(base);
            }
        } else {
            numericOutput += "0";
        }

        f.stack.push(0);
        f.stack.push(0);
    });

    f.defjs(">number", function toNumber() {
        var base = Long.fromInt(f._base());
        var length = f.stack.pop();
        var address = f.stack.pop();
        var bigPart = f.stack.pop();
        var smallPart = f.stack.pop();
        var value = new Long(smallPart, bigPart, true);
        var unconverted = length;

        for (var i = 0; i < length; i++) {
            var next = parseInt(String.fromCharCode(f._getAddress(address)), base);

            if (isNaN(next)) {
                break;
            } else {
                address++;
                unconverted--;
                value = value.mul(base).add(Long.fromInt(next));
            }
        }

        f.stack.push(value.low);
        f.stack.push(value.high);
        f.stack.push(address);
        f.stack.push(unconverted);
    });

    return f;
}

module.exports = Output;
},{"long":16}],14:[function(require,module,exports){
function StackOperations(f) {
    f.defjs("drop", function drop() {
        f.stack.pop();
    });

    f.defjs("swap", function swap() {
        var first = f.stack.pop();
        var second = f.stack.pop();
        f.stack.push(first);
        f.stack.push(second);
    });

    f.defjs("dup", function dup() {
        f.stack.push(f.stack.peek());
    });

    f.defjs("over", function over() {
        f.stack.push(f.stack.peek(2));
    });

    f.defjs("pick", function pick() {
        f.stack.push(f.stack.peek(f.stack.pop() + 1));
    });

    f.defjs("rot", function rot() {
        var first = f.stack.pop();
        var second = f.stack.pop();
        var third = f.stack.pop();
        f.stack.push(second);
        f.stack.push(first);
        f.stack.push(third);
    });

    f.defjs("-rot", function backRot() {
        var first = f.stack.pop();
        var second = f.stack.pop();
        var third = f.stack.pop();
        f.stack.push(first);
        f.stack.push(third);
        f.stack.push(second);
    });

    f.defjs("roll", function roll() {
        var num = f.stack.pop();
        f.stack.roll(num);
    });

    f.defjs("2drop", function twoDrop() {
        f.stack.pop();
        f.stack.pop();
    });

    f.defjs("2dup", function twoDup() {
        f.stack.push(f.stack.peek(2));
        f.stack.push(f.stack.peek(2));
    });

    f.defjs("2over", function twoOver() {
        f.stack.push(f.stack.peek(4));
        f.stack.push(f.stack.peek(4));
    });

    f.defjs("2swap", function twoSwap() {
        var first = f.stack.pop();
        var second = f.stack.pop();
        var third = f.stack.pop();
        var fourth = f.stack.pop();
        f.stack.push(second);
        f.stack.push(first);
        f.stack.push(fourth);
        f.stack.push(third);
    });

    f.defjs("?dup", function nonZeroDup() {
        var first = f.stack.peek();
        if (first !== 0) f.stack.push(first);
    });

    f.defjs("depth", function depth() {
        f.stack.push(f.stack.length());
    });

    // Return f.stack
    f.defjs(">r", function toR() {
        f.returnStack.push(f.stack.pop());
    });

    f.defjs("r>", function rFrom() {
        f.stack.push(f.returnStack.pop());
    });

    f.defjs("r@", function rFetch() {
        f.stack.push(f.returnStack.peek());
    });

    f.defjs("2r>", function twoRFrom() {
        var top = f.returnStack.pop();
        f.stack.push(f.returnStack.pop());
        f.stack.push(top);
    });

    f.defjs("2>r", function twoToR() {
        var top = f.stack.pop();
        f.returnStack.push(f.stack.pop());
        f.returnStack.push(top);
    });

    f.defjs("2r@", function twoRFetch() {
        f.stack.push(f.returnStack.peek(2));
        f.stack.push(f.returnStack.peek(1));
    });

    return f;
}

module.exports = StackOperations;
},{}],15:[function(require,module,exports){
function Stack(name) {
    var data = [];

    this.pop = function() {
        if (data.length > 0)
            return data.pop();
        else {
            throw "Stack empty: " + name;
        }
    };

    this.push = function(element) {
        data.push(element);
    };

    this.peek = function(offset) {
        var index = data.length - (offset || 1);
        if (0 <= index && index < data.length)
            return data[index];
        else
            throw "Attempted to peek at invalid stack index " + index + ": " + name;
    };

    this.roll = function(num) {
        if (num === 0) return;

        var index = data.length - num - 1;
        if (0 <= index && index < data.length) {
            var newTop = data.splice(index, 1)[0];
            data.push(newTop);
        } else
            throw "Attempted to roll more elements than in stack " + num + ": " + name;
    };

    this.length = function() {
        return data.length;
    };

    this.clear = function() {
        data.length = 0;
    };

    this.toString = function() {
        return data.toString();
    };
}

module.exports = Stack;
},{}],16:[function(require,module,exports){
/*
 Copyright 2013 Daniel Wirtz <dcode@dcode.io>
 Copyright 2009 The Closure Library Authors. All Rights Reserved.

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS-IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

/**
 * @license long.js (c) 2013 Daniel Wirtz <dcode@dcode.io>
 * Released under the Apache License, Version 2.0
 * see: https://github.com/dcodeIO/long.js for details
 */
(function(global, factory) {

    /* AMD */ if (typeof define === 'function' && define["amd"])
        define([], factory);
    /* CommonJS */ else if (typeof require === 'function' && typeof module === "object" && module && module["exports"])
        module["exports"] = factory();
    /* Global */ else
        (global["dcodeIO"] = global["dcodeIO"] || {})["Long"] = factory();

})(this, function() {
    "use strict";

    /**
     * Constructs a 64 bit two's-complement integer, given its low and high 32 bit values as *signed* integers.
     *  See the from* functions below for more convenient ways of constructing Longs.
     * @exports Long
     * @class A Long class for representing a 64 bit two's-complement integer value.
     * @param {number} low The low (signed) 32 bits of the long
     * @param {number} high The high (signed) 32 bits of the long
     * @param {boolean=} unsigned Whether unsigned or not, defaults to `false` for signed
     * @constructor
     */
    function Long(low, high, unsigned) {

        /**
         * The low 32 bits as a signed value.
         * @type {number}
         */
        this.low = low | 0;

        /**
         * The high 32 bits as a signed value.
         * @type {number}
         */
        this.high = high | 0;

        /**
         * Whether unsigned or not.
         * @type {boolean}
         */
        this.unsigned = !!unsigned;
    }

    // The internal representation of a long is the two given signed, 32-bit values.
    // We use 32-bit pieces because these are the size of integers on which
    // Javascript performs bit-operations.  For operations like addition and
    // multiplication, we split each number into 16 bit pieces, which can easily be
    // multiplied within Javascript's floating-point representation without overflow
    // or change in sign.
    //
    // In the algorithms below, we frequently reduce the negative case to the
    // positive case by negating the input(s) and then post-processing the result.
    // Note that we must ALWAYS check specially whether those values are MIN_VALUE
    // (-2^63) because -MIN_VALUE == MIN_VALUE (since 2^63 cannot be represented as
    // a positive number, it overflows back into a negative).  Not handling this
    // case would often result in infinite recursion.
    //
    // Common constant values ZERO, ONE, NEG_ONE, etc. are defined below the from*
    // methods on which they depend.

    /**
     * An indicator used to reliably determine if an object is a Long or not.
     * @type {boolean}
     * @const
     * @private
     */
    Long.prototype.__isLong__;

    Object.defineProperty(Long.prototype, "__isLong__", {
        value: true,
        enumerable: false,
        configurable: false
    });

    /**
     * @function
     * @param {*} obj Object
     * @returns {boolean}
     * @inner
     */
    function isLong(obj) {
        return (obj && obj["__isLong__"]) === true;
    }

    /**
     * Tests if the specified object is a Long.
     * @function
     * @param {*} obj Object
     * @returns {boolean}
     */
    Long.isLong = isLong;

    /**
     * A cache of the Long representations of small integer values.
     * @type {!Object}
     * @inner
     */
    var INT_CACHE = {};

    /**
     * A cache of the Long representations of small unsigned integer values.
     * @type {!Object}
     * @inner
     */
    var UINT_CACHE = {};

    /**
     * @param {number} value
     * @param {boolean=} unsigned
     * @returns {!Long}
     * @inner
     */
    function fromInt(value, unsigned) {
        var obj, cachedObj, cache;
        if (unsigned) {
            value >>>= 0;
            if (cache = (0 <= value && value < 256)) {
                cachedObj = UINT_CACHE[value];
                if (cachedObj)
                    return cachedObj;
            }
            obj = fromBits(value, (value | 0) < 0 ? -1 : 0, true);
            if (cache)
                UINT_CACHE[value] = obj;
            return obj;
        } else {
            value |= 0;
            if (cache = (-128 <= value && value < 128)) {
                cachedObj = INT_CACHE[value];
                if (cachedObj)
                    return cachedObj;
            }
            obj = fromBits(value, value < 0 ? -1 : 0, false);
            if (cache)
                INT_CACHE[value] = obj;
            return obj;
        }
    }

    /**
     * Returns a Long representing the given 32 bit integer value.
     * @function
     * @param {number} value The 32 bit integer in question
     * @param {boolean=} unsigned Whether unsigned or not, defaults to `false` for signed
     * @returns {!Long} The corresponding Long value
     */
    Long.fromInt = fromInt;

    /**
     * @param {number} value
     * @param {boolean=} unsigned
     * @returns {!Long}
     * @inner
     */
    function fromNumber(value, unsigned) {
        if (isNaN(value) || !isFinite(value))
            return unsigned ? UZERO : ZERO;
        if (unsigned) {
            if (value < 0)
                return UZERO;
            if (value >= TWO_PWR_64_DBL)
                return MAX_UNSIGNED_VALUE;
        } else {
            if (value <= -TWO_PWR_63_DBL)
                return MIN_VALUE;
            if (value + 1 >= TWO_PWR_63_DBL)
                return MAX_VALUE;
        }
        if (value < 0)
            return fromNumber(-value, unsigned).neg();
        return fromBits((value % TWO_PWR_32_DBL) | 0, (value / TWO_PWR_32_DBL) | 0, unsigned);
    }

    /**
     * Returns a Long representing the given value, provided that it is a finite number. Otherwise, zero is returned.
     * @function
     * @param {number} value The number in question
     * @param {boolean=} unsigned Whether unsigned or not, defaults to `false` for signed
     * @returns {!Long} The corresponding Long value
     */
    Long.fromNumber = fromNumber;

    /**
     * @param {number} lowBits
     * @param {number} highBits
     * @param {boolean=} unsigned
     * @returns {!Long}
     * @inner
     */
    function fromBits(lowBits, highBits, unsigned) {
        return new Long(lowBits, highBits, unsigned);
    }

    /**
     * Returns a Long representing the 64 bit integer that comes by concatenating the given low and high bits. Each is
     *  assumed to use 32 bits.
     * @function
     * @param {number} lowBits The low 32 bits
     * @param {number} highBits The high 32 bits
     * @param {boolean=} unsigned Whether unsigned or not, defaults to `false` for signed
     * @returns {!Long} The corresponding Long value
     */
    Long.fromBits = fromBits;

    /**
     * @function
     * @param {number} base
     * @param {number} exponent
     * @returns {number}
     * @inner
     */
    var pow_dbl = Math.pow; // Used 4 times (4*8 to 15+4)

    /**
     * @param {string} str
     * @param {(boolean|number)=} unsigned
     * @param {number=} radix
     * @returns {!Long}
     * @inner
     */
    function fromString(str, unsigned, radix) {
        if (str.length === 0)
            throw Error('empty string');
        if (str === "NaN" || str === "Infinity" || str === "+Infinity" || str === "-Infinity")
            return ZERO;
        if (typeof unsigned === 'number') {
            // For goog.math.long compatibility
            radix = unsigned,
            unsigned = false;
        } else {
            unsigned = !! unsigned;
        }
        radix = radix || 10;
        if (radix < 2 || 36 < radix)
            throw RangeError('radix');

        var p;
        if ((p = str.indexOf('-')) > 0)
            throw Error('interior hyphen');
        else if (p === 0) {
            return fromString(str.substring(1), unsigned, radix).neg();
        }

        // Do several (8) digits each time through the loop, so as to
        // minimize the calls to the very expensive emulated div.
        var radixToPower = fromNumber(pow_dbl(radix, 8));

        var result = ZERO;
        for (var i = 0; i < str.length; i += 8) {
            var size = Math.min(8, str.length - i),
                value = parseInt(str.substring(i, i + size), radix);
            if (size < 8) {
                var power = fromNumber(pow_dbl(radix, size));
                result = result.mul(power).add(fromNumber(value));
            } else {
                result = result.mul(radixToPower);
                result = result.add(fromNumber(value));
            }
        }
        result.unsigned = unsigned;
        return result;
    }

    /**
     * Returns a Long representation of the given string, written using the specified radix.
     * @function
     * @param {string} str The textual representation of the Long
     * @param {(boolean|number)=} unsigned Whether unsigned or not, defaults to `false` for signed
     * @param {number=} radix The radix in which the text is written (2-36), defaults to 10
     * @returns {!Long} The corresponding Long value
     */
    Long.fromString = fromString;

    /**
     * @function
     * @param {!Long|number|string|!{low: number, high: number, unsigned: boolean}} val
     * @returns {!Long}
     * @inner
     */
    function fromValue(val) {
        if (val /* is compatible */ instanceof Long)
            return val;
        if (typeof val === 'number')
            return fromNumber(val);
        if (typeof val === 'string')
            return fromString(val);
        // Throws for non-objects, converts non-instanceof Long:
        return fromBits(val.low, val.high, val.unsigned);
    }

    /**
     * Converts the specified value to a Long.
     * @function
     * @param {!Long|number|string|!{low: number, high: number, unsigned: boolean}} val Value
     * @returns {!Long}
     */
    Long.fromValue = fromValue;

    // NOTE: the compiler should inline these constant values below and then remove these variables, so there should be
    // no runtime penalty for these.

    /**
     * @type {number}
     * @const
     * @inner
     */
    var TWO_PWR_16_DBL = 1 << 16;

    /**
     * @type {number}
     * @const
     * @inner
     */
    var TWO_PWR_24_DBL = 1 << 24;

    /**
     * @type {number}
     * @const
     * @inner
     */
    var TWO_PWR_32_DBL = TWO_PWR_16_DBL * TWO_PWR_16_DBL;

    /**
     * @type {number}
     * @const
     * @inner
     */
    var TWO_PWR_64_DBL = TWO_PWR_32_DBL * TWO_PWR_32_DBL;

    /**
     * @type {number}
     * @const
     * @inner
     */
    var TWO_PWR_63_DBL = TWO_PWR_64_DBL / 2;

    /**
     * @type {!Long}
     * @const
     * @inner
     */
    var TWO_PWR_24 = fromInt(TWO_PWR_24_DBL);

    /**
     * @type {!Long}
     * @inner
     */
    var ZERO = fromInt(0);

    /**
     * Signed zero.
     * @type {!Long}
     */
    Long.ZERO = ZERO;

    /**
     * @type {!Long}
     * @inner
     */
    var UZERO = fromInt(0, true);

    /**
     * Unsigned zero.
     * @type {!Long}
     */
    Long.UZERO = UZERO;

    /**
     * @type {!Long}
     * @inner
     */
    var ONE = fromInt(1);

    /**
     * Signed one.
     * @type {!Long}
     */
    Long.ONE = ONE;

    /**
     * @type {!Long}
     * @inner
     */
    var UONE = fromInt(1, true);

    /**
     * Unsigned one.
     * @type {!Long}
     */
    Long.UONE = UONE;

    /**
     * @type {!Long}
     * @inner
     */
    var NEG_ONE = fromInt(-1);

    /**
     * Signed negative one.
     * @type {!Long}
     */
    Long.NEG_ONE = NEG_ONE;

    /**
     * @type {!Long}
     * @inner
     */
    var MAX_VALUE = fromBits(0xFFFFFFFF|0, 0x7FFFFFFF|0, false);

    /**
     * Maximum signed value.
     * @type {!Long}
     */
    Long.MAX_VALUE = MAX_VALUE;

    /**
     * @type {!Long}
     * @inner
     */
    var MAX_UNSIGNED_VALUE = fromBits(0xFFFFFFFF|0, 0xFFFFFFFF|0, true);

    /**
     * Maximum unsigned value.
     * @type {!Long}
     */
    Long.MAX_UNSIGNED_VALUE = MAX_UNSIGNED_VALUE;

    /**
     * @type {!Long}
     * @inner
     */
    var MIN_VALUE = fromBits(0, 0x80000000|0, false);

    /**
     * Minimum signed value.
     * @type {!Long}
     */
    Long.MIN_VALUE = MIN_VALUE;

    /**
     * @alias Long.prototype
     * @inner
     */
    var LongPrototype = Long.prototype;

    /**
     * Converts the Long to a 32 bit integer, assuming it is a 32 bit integer.
     * @returns {number}
     */
    LongPrototype.toInt = function toInt() {
        return this.unsigned ? this.low >>> 0 : this.low;
    };

    /**
     * Converts the Long to a the nearest floating-point representation of this value (double, 53 bit mantissa).
     * @returns {number}
     */
    LongPrototype.toNumber = function toNumber() {
        if (this.unsigned)
            return ((this.high >>> 0) * TWO_PWR_32_DBL) + (this.low >>> 0);
        return this.high * TWO_PWR_32_DBL + (this.low >>> 0);
    };

    /**
     * Converts the Long to a string written in the specified radix.
     * @param {number=} radix Radix (2-36), defaults to 10
     * @returns {string}
     * @override
     * @throws {RangeError} If `radix` is out of range
     */
    LongPrototype.toString = function toString(radix) {
        radix = radix || 10;
        if (radix < 2 || 36 < radix)
            throw RangeError('radix');
        if (this.isZero())
            return '0';
        if (this.isNegative()) { // Unsigned Longs are never negative
            if (this.eq(MIN_VALUE)) {
                // We need to change the Long value before it can be negated, so we remove
                // the bottom-most digit in this base and then recurse to do the rest.
                var radixLong = fromNumber(radix),
                    div = this.div(radixLong),
                    rem1 = div.mul(radixLong).sub(this);
                return div.toString(radix) + rem1.toInt().toString(radix);
            } else
                return '-' + this.neg().toString(radix);
        }

        // Do several (6) digits each time through the loop, so as to
        // minimize the calls to the very expensive emulated div.
        var radixToPower = fromNumber(pow_dbl(radix, 6), this.unsigned),
            rem = this;
        var result = '';
        while (true) {
            var remDiv = rem.div(radixToPower),
                intval = rem.sub(remDiv.mul(radixToPower)).toInt() >>> 0,
                digits = intval.toString(radix);
            rem = remDiv;
            if (rem.isZero())
                return digits + result;
            else {
                while (digits.length < 6)
                    digits = '0' + digits;
                result = '' + digits + result;
            }
        }
    };

    /**
     * Gets the high 32 bits as a signed integer.
     * @returns {number} Signed high bits
     */
    LongPrototype.getHighBits = function getHighBits() {
        return this.high;
    };

    /**
     * Gets the high 32 bits as an unsigned integer.
     * @returns {number} Unsigned high bits
     */
    LongPrototype.getHighBitsUnsigned = function getHighBitsUnsigned() {
        return this.high >>> 0;
    };

    /**
     * Gets the low 32 bits as a signed integer.
     * @returns {number} Signed low bits
     */
    LongPrototype.getLowBits = function getLowBits() {
        return this.low;
    };

    /**
     * Gets the low 32 bits as an unsigned integer.
     * @returns {number} Unsigned low bits
     */
    LongPrototype.getLowBitsUnsigned = function getLowBitsUnsigned() {
        return this.low >>> 0;
    };

    /**
     * Gets the number of bits needed to represent the absolute value of this Long.
     * @returns {number}
     */
    LongPrototype.getNumBitsAbs = function getNumBitsAbs() {
        if (this.isNegative()) // Unsigned Longs are never negative
            return this.eq(MIN_VALUE) ? 64 : this.neg().getNumBitsAbs();
        var val = this.high != 0 ? this.high : this.low;
        for (var bit = 31; bit > 0; bit--)
            if ((val & (1 << bit)) != 0)
                break;
        return this.high != 0 ? bit + 33 : bit + 1;
    };

    /**
     * Tests if this Long's value equals zero.
     * @returns {boolean}
     */
    LongPrototype.isZero = function isZero() {
        return this.high === 0 && this.low === 0;
    };

    /**
     * Tests if this Long's value is negative.
     * @returns {boolean}
     */
    LongPrototype.isNegative = function isNegative() {
        return !this.unsigned && this.high < 0;
    };

    /**
     * Tests if this Long's value is positive.
     * @returns {boolean}
     */
    LongPrototype.isPositive = function isPositive() {
        return this.unsigned || this.high >= 0;
    };

    /**
     * Tests if this Long's value is odd.
     * @returns {boolean}
     */
    LongPrototype.isOdd = function isOdd() {
        return (this.low & 1) === 1;
    };

    /**
     * Tests if this Long's value is even.
     * @returns {boolean}
     */
    LongPrototype.isEven = function isEven() {
        return (this.low & 1) === 0;
    };

    /**
     * Tests if this Long's value equals the specified's.
     * @param {!Long|number|string} other Other value
     * @returns {boolean}
     */
    LongPrototype.equals = function equals(other) {
        if (!isLong(other))
            other = fromValue(other);
        if (this.unsigned !== other.unsigned && (this.high >>> 31) === 1 && (other.high >>> 31) === 1)
            return false;
        return this.high === other.high && this.low === other.low;
    };

    /**
     * Tests if this Long's value equals the specified's. This is an alias of {@link Long#equals}.
     * @function
     * @param {!Long|number|string} other Other value
     * @returns {boolean}
     */
    LongPrototype.eq = LongPrototype.equals;

    /**
     * Tests if this Long's value differs from the specified's.
     * @param {!Long|number|string} other Other value
     * @returns {boolean}
     */
    LongPrototype.notEquals = function notEquals(other) {
        return !this.eq(/* validates */ other);
    };

    /**
     * Tests if this Long's value differs from the specified's. This is an alias of {@link Long#notEquals}.
     * @function
     * @param {!Long|number|string} other Other value
     * @returns {boolean}
     */
    LongPrototype.neq = LongPrototype.notEquals;

    /**
     * Tests if this Long's value is less than the specified's.
     * @param {!Long|number|string} other Other value
     * @returns {boolean}
     */
    LongPrototype.lessThan = function lessThan(other) {
        return this.comp(/* validates */ other) < 0;
    };

    /**
     * Tests if this Long's value is less than the specified's. This is an alias of {@link Long#lessThan}.
     * @function
     * @param {!Long|number|string} other Other value
     * @returns {boolean}
     */
    LongPrototype.lt = LongPrototype.lessThan;

    /**
     * Tests if this Long's value is less than or equal the specified's.
     * @param {!Long|number|string} other Other value
     * @returns {boolean}
     */
    LongPrototype.lessThanOrEqual = function lessThanOrEqual(other) {
        return this.comp(/* validates */ other) <= 0;
    };

    /**
     * Tests if this Long's value is less than or equal the specified's. This is an alias of {@link Long#lessThanOrEqual}.
     * @function
     * @param {!Long|number|string} other Other value
     * @returns {boolean}
     */
    LongPrototype.lte = LongPrototype.lessThanOrEqual;

    /**
     * Tests if this Long's value is greater than the specified's.
     * @param {!Long|number|string} other Other value
     * @returns {boolean}
     */
    LongPrototype.greaterThan = function greaterThan(other) {
        return this.comp(/* validates */ other) > 0;
    };

    /**
     * Tests if this Long's value is greater than the specified's. This is an alias of {@link Long#greaterThan}.
     * @function
     * @param {!Long|number|string} other Other value
     * @returns {boolean}
     */
    LongPrototype.gt = LongPrototype.greaterThan;

    /**
     * Tests if this Long's value is greater than or equal the specified's.
     * @param {!Long|number|string} other Other value
     * @returns {boolean}
     */
    LongPrototype.greaterThanOrEqual = function greaterThanOrEqual(other) {
        return this.comp(/* validates */ other) >= 0;
    };

    /**
     * Tests if this Long's value is greater than or equal the specified's. This is an alias of {@link Long#greaterThanOrEqual}.
     * @function
     * @param {!Long|number|string} other Other value
     * @returns {boolean}
     */
    LongPrototype.gte = LongPrototype.greaterThanOrEqual;

    /**
     * Compares this Long's value with the specified's.
     * @param {!Long|number|string} other Other value
     * @returns {number} 0 if they are the same, 1 if the this is greater and -1
     *  if the given one is greater
     */
    LongPrototype.compare = function compare(other) {
        if (!isLong(other))
            other = fromValue(other);
        if (this.eq(other))
            return 0;
        var thisNeg = this.isNegative(),
            otherNeg = other.isNegative();
        if (thisNeg && !otherNeg)
            return -1;
        if (!thisNeg && otherNeg)
            return 1;
        // At this point the sign bits are the same
        if (!this.unsigned)
            return this.sub(other).isNegative() ? -1 : 1;
        // Both are positive if at least one is unsigned
        return (other.high >>> 0) > (this.high >>> 0) || (other.high === this.high && (other.low >>> 0) > (this.low >>> 0)) ? -1 : 1;
    };

    /**
     * Compares this Long's value with the specified's. This is an alias of {@link Long#compare}.
     * @function
     * @param {!Long|number|string} other Other value
     * @returns {number} 0 if they are the same, 1 if the this is greater and -1
     *  if the given one is greater
     */
    LongPrototype.comp = LongPrototype.compare;

    /**
     * Negates this Long's value.
     * @returns {!Long} Negated Long
     */
    LongPrototype.negate = function negate() {
        if (!this.unsigned && this.eq(MIN_VALUE))
            return MIN_VALUE;
        return this.not().add(ONE);
    };

    /**
     * Negates this Long's value. This is an alias of {@link Long#negate}.
     * @function
     * @returns {!Long} Negated Long
     */
    LongPrototype.neg = LongPrototype.negate;

    /**
     * Returns the sum of this and the specified Long.
     * @param {!Long|number|string} addend Addend
     * @returns {!Long} Sum
     */
    LongPrototype.add = function add(addend) {
        if (!isLong(addend))
            addend = fromValue(addend);

        // Divide each number into 4 chunks of 16 bits, and then sum the chunks.

        var a48 = this.high >>> 16;
        var a32 = this.high & 0xFFFF;
        var a16 = this.low >>> 16;
        var a00 = this.low & 0xFFFF;

        var b48 = addend.high >>> 16;
        var b32 = addend.high & 0xFFFF;
        var b16 = addend.low >>> 16;
        var b00 = addend.low & 0xFFFF;

        var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
        c00 += a00 + b00;
        c16 += c00 >>> 16;
        c00 &= 0xFFFF;
        c16 += a16 + b16;
        c32 += c16 >>> 16;
        c16 &= 0xFFFF;
        c32 += a32 + b32;
        c48 += c32 >>> 16;
        c32 &= 0xFFFF;
        c48 += a48 + b48;
        c48 &= 0xFFFF;
        return fromBits((c16 << 16) | c00, (c48 << 16) | c32, this.unsigned);
    };

    /**
     * Returns the difference of this and the specified Long.
     * @param {!Long|number|string} subtrahend Subtrahend
     * @returns {!Long} Difference
     */
    LongPrototype.subtract = function subtract(subtrahend) {
        if (!isLong(subtrahend))
            subtrahend = fromValue(subtrahend);
        return this.add(subtrahend.neg());
    };

    /**
     * Returns the difference of this and the specified Long. This is an alias of {@link Long#subtract}.
     * @function
     * @param {!Long|number|string} subtrahend Subtrahend
     * @returns {!Long} Difference
     */
    LongPrototype.sub = LongPrototype.subtract;

    /**
     * Returns the product of this and the specified Long.
     * @param {!Long|number|string} multiplier Multiplier
     * @returns {!Long} Product
     */
    LongPrototype.multiply = function multiply(multiplier) {
        if (this.isZero())
            return ZERO;
        if (!isLong(multiplier))
            multiplier = fromValue(multiplier);
        if (multiplier.isZero())
            return ZERO;
        if (this.eq(MIN_VALUE))
            return multiplier.isOdd() ? MIN_VALUE : ZERO;
        if (multiplier.eq(MIN_VALUE))
            return this.isOdd() ? MIN_VALUE : ZERO;

        if (this.isNegative()) {
            if (multiplier.isNegative())
                return this.neg().mul(multiplier.neg());
            else
                return this.neg().mul(multiplier).neg();
        } else if (multiplier.isNegative())
            return this.mul(multiplier.neg()).neg();

        // If both longs are small, use float multiplication
        if (this.lt(TWO_PWR_24) && multiplier.lt(TWO_PWR_24))
            return fromNumber(this.toNumber() * multiplier.toNumber(), this.unsigned);

        // Divide each long into 4 chunks of 16 bits, and then add up 4x4 products.
        // We can skip products that would overflow.

        var a48 = this.high >>> 16;
        var a32 = this.high & 0xFFFF;
        var a16 = this.low >>> 16;
        var a00 = this.low & 0xFFFF;

        var b48 = multiplier.high >>> 16;
        var b32 = multiplier.high & 0xFFFF;
        var b16 = multiplier.low >>> 16;
        var b00 = multiplier.low & 0xFFFF;

        var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
        c00 += a00 * b00;
        c16 += c00 >>> 16;
        c00 &= 0xFFFF;
        c16 += a16 * b00;
        c32 += c16 >>> 16;
        c16 &= 0xFFFF;
        c16 += a00 * b16;
        c32 += c16 >>> 16;
        c16 &= 0xFFFF;
        c32 += a32 * b00;
        c48 += c32 >>> 16;
        c32 &= 0xFFFF;
        c32 += a16 * b16;
        c48 += c32 >>> 16;
        c32 &= 0xFFFF;
        c32 += a00 * b32;
        c48 += c32 >>> 16;
        c32 &= 0xFFFF;
        c48 += a48 * b00 + a32 * b16 + a16 * b32 + a00 * b48;
        c48 &= 0xFFFF;
        return fromBits((c16 << 16) | c00, (c48 << 16) | c32, this.unsigned);
    };

    /**
     * Returns the product of this and the specified Long. This is an alias of {@link Long#multiply}.
     * @function
     * @param {!Long|number|string} multiplier Multiplier
     * @returns {!Long} Product
     */
    LongPrototype.mul = LongPrototype.multiply;

    /**
     * Returns this Long divided by the specified. The result is signed if this Long is signed or
     *  unsigned if this Long is unsigned.
     * @param {!Long|number|string} divisor Divisor
     * @returns {!Long} Quotient
     */
    LongPrototype.divide = function divide(divisor) {
        if (!isLong(divisor))
            divisor = fromValue(divisor);
        if (divisor.isZero())
            throw Error('division by zero');
        if (this.isZero())
            return this.unsigned ? UZERO : ZERO;
        var approx, rem, res;
        if (!this.unsigned) {
            // This section is only relevant for signed longs and is derived from the
            // closure library as a whole.
            if (this.eq(MIN_VALUE)) {
                if (divisor.eq(ONE) || divisor.eq(NEG_ONE))
                    return MIN_VALUE;  // recall that -MIN_VALUE == MIN_VALUE
                else if (divisor.eq(MIN_VALUE))
                    return ONE;
                else {
                    // At this point, we have |other| >= 2, so |this/other| < |MIN_VALUE|.
                    var halfThis = this.shr(1);
                    approx = halfThis.div(divisor).shl(1);
                    if (approx.eq(ZERO)) {
                        return divisor.isNegative() ? ONE : NEG_ONE;
                    } else {
                        rem = this.sub(divisor.mul(approx));
                        res = approx.add(rem.div(divisor));
                        return res;
                    }
                }
            } else if (divisor.eq(MIN_VALUE))
                return this.unsigned ? UZERO : ZERO;
            if (this.isNegative()) {
                if (divisor.isNegative())
                    return this.neg().div(divisor.neg());
                return this.neg().div(divisor).neg();
            } else if (divisor.isNegative())
                return this.div(divisor.neg()).neg();
            res = ZERO;
        } else {
            // The algorithm below has not been made for unsigned longs. It's therefore
            // required to take special care of the MSB prior to running it.
            if (!divisor.unsigned)
                divisor = divisor.toUnsigned();
            if (divisor.gt(this))
                return UZERO;
            if (divisor.gt(this.shru(1))) // 15 >>> 1 = 7 ; with divisor = 8 ; true
                return UONE;
            res = UZERO;
        }

        // Repeat the following until the remainder is less than other:  find a
        // floating-point that approximates remainder / other *from below*, add this
        // into the result, and subtract it from the remainder.  It is critical that
        // the approximate value is less than or equal to the real value so that the
        // remainder never becomes negative.
        rem = this;
        while (rem.gte(divisor)) {
            // Approximate the result of division. This may be a little greater or
            // smaller than the actual value.
            approx = Math.max(1, Math.floor(rem.toNumber() / divisor.toNumber()));

            // We will tweak the approximate result by changing it in the 48-th digit or
            // the smallest non-fractional digit, whichever is larger.
            var log2 = Math.ceil(Math.log(approx) / Math.LN2),
                delta = (log2 <= 48) ? 1 : pow_dbl(2, log2 - 48),

            // Decrease the approximation until it is smaller than the remainder.  Note
            // that if it is too large, the product overflows and is negative.
                approxRes = fromNumber(approx),
                approxRem = approxRes.mul(divisor);
            while (approxRem.isNegative() || approxRem.gt(rem)) {
                approx -= delta;
                approxRes = fromNumber(approx, this.unsigned);
                approxRem = approxRes.mul(divisor);
            }

            // We know the answer can't be zero... and actually, zero would cause
            // infinite recursion since we would make no progress.
            if (approxRes.isZero())
                approxRes = ONE;

            res = res.add(approxRes);
            rem = rem.sub(approxRem);
        }
        return res;
    };

    /**
     * Returns this Long divided by the specified. This is an alias of {@link Long#divide}.
     * @function
     * @param {!Long|number|string} divisor Divisor
     * @returns {!Long} Quotient
     */
    LongPrototype.div = LongPrototype.divide;

    /**
     * Returns this Long modulo the specified.
     * @param {!Long|number|string} divisor Divisor
     * @returns {!Long} Remainder
     */
    LongPrototype.modulo = function modulo(divisor) {
        if (!isLong(divisor))
            divisor = fromValue(divisor);
        return this.sub(this.div(divisor).mul(divisor));
    };

    /**
     * Returns this Long modulo the specified. This is an alias of {@link Long#modulo}.
     * @function
     * @param {!Long|number|string} divisor Divisor
     * @returns {!Long} Remainder
     */
    LongPrototype.mod = LongPrototype.modulo;

    /**
     * Returns the bitwise NOT of this Long.
     * @returns {!Long}
     */
    LongPrototype.not = function not() {
        return fromBits(~this.low, ~this.high, this.unsigned);
    };

    /**
     * Returns the bitwise AND of this Long and the specified.
     * @param {!Long|number|string} other Other Long
     * @returns {!Long}
     */
    LongPrototype.and = function and(other) {
        if (!isLong(other))
            other = fromValue(other);
        return fromBits(this.low & other.low, this.high & other.high, this.unsigned);
    };

    /**
     * Returns the bitwise OR of this Long and the specified.
     * @param {!Long|number|string} other Other Long
     * @returns {!Long}
     */
    LongPrototype.or = function or(other) {
        if (!isLong(other))
            other = fromValue(other);
        return fromBits(this.low | other.low, this.high | other.high, this.unsigned);
    };

    /**
     * Returns the bitwise XOR of this Long and the given one.
     * @param {!Long|number|string} other Other Long
     * @returns {!Long}
     */
    LongPrototype.xor = function xor(other) {
        if (!isLong(other))
            other = fromValue(other);
        return fromBits(this.low ^ other.low, this.high ^ other.high, this.unsigned);
    };

    /**
     * Returns this Long with bits shifted to the left by the given amount.
     * @param {number|!Long} numBits Number of bits
     * @returns {!Long} Shifted Long
     */
    LongPrototype.shiftLeft = function shiftLeft(numBits) {
        if (isLong(numBits))
            numBits = numBits.toInt();
        if ((numBits &= 63) === 0)
            return this;
        else if (numBits < 32)
            return fromBits(this.low << numBits, (this.high << numBits) | (this.low >>> (32 - numBits)), this.unsigned);
        else
            return fromBits(0, this.low << (numBits - 32), this.unsigned);
    };

    /**
     * Returns this Long with bits shifted to the left by the given amount. This is an alias of {@link Long#shiftLeft}.
     * @function
     * @param {number|!Long} numBits Number of bits
     * @returns {!Long} Shifted Long
     */
    LongPrototype.shl = LongPrototype.shiftLeft;

    /**
     * Returns this Long with bits arithmetically shifted to the right by the given amount.
     * @param {number|!Long} numBits Number of bits
     * @returns {!Long} Shifted Long
     */
    LongPrototype.shiftRight = function shiftRight(numBits) {
        if (isLong(numBits))
            numBits = numBits.toInt();
        if ((numBits &= 63) === 0)
            return this;
        else if (numBits < 32)
            return fromBits((this.low >>> numBits) | (this.high << (32 - numBits)), this.high >> numBits, this.unsigned);
        else
            return fromBits(this.high >> (numBits - 32), this.high >= 0 ? 0 : -1, this.unsigned);
    };

    /**
     * Returns this Long with bits arithmetically shifted to the right by the given amount. This is an alias of {@link Long#shiftRight}.
     * @function
     * @param {number|!Long} numBits Number of bits
     * @returns {!Long} Shifted Long
     */
    LongPrototype.shr = LongPrototype.shiftRight;

    /**
     * Returns this Long with bits logically shifted to the right by the given amount.
     * @param {number|!Long} numBits Number of bits
     * @returns {!Long} Shifted Long
     */
    LongPrototype.shiftRightUnsigned = function shiftRightUnsigned(numBits) {
        if (isLong(numBits))
            numBits = numBits.toInt();
        numBits &= 63;
        if (numBits === 0)
            return this;
        else {
            var high = this.high;
            if (numBits < 32) {
                var low = this.low;
                return fromBits((low >>> numBits) | (high << (32 - numBits)), high >>> numBits, this.unsigned);
            } else if (numBits === 32)
                return fromBits(high, 0, this.unsigned);
            else
                return fromBits(high >>> (numBits - 32), 0, this.unsigned);
        }
    };

    /**
     * Returns this Long with bits logically shifted to the right by the given amount. This is an alias of {@link Long#shiftRightUnsigned}.
     * @function
     * @param {number|!Long} numBits Number of bits
     * @returns {!Long} Shifted Long
     */
    LongPrototype.shru = LongPrototype.shiftRightUnsigned;

    /**
     * Converts this Long to signed.
     * @returns {!Long} Signed long
     */
    LongPrototype.toSigned = function toSigned() {
        if (!this.unsigned)
            return this;
        return fromBits(this.low, this.high, false);
    };

    /**
     * Converts this Long to unsigned.
     * @returns {!Long} Unsigned long
     */
    LongPrototype.toUnsigned = function toUnsigned() {
        if (this.unsigned)
            return this;
        return fromBits(this.low, this.high, true);
    };

    /**
     * Converts this Long to its byte representation.
     * @param {boolean=} le Whether little or big endian, defaults to big endian
     * @returns {!Array.<number>} Byte representation
     */
    LongPrototype.toBytes = function(le) {
        return le ? this.toBytesLE() : this.toBytesBE();
    }

    /**
     * Converts this Long to its little endian byte representation.
     * @returns {!Array.<number>} Little endian byte representation
     */
    LongPrototype.toBytesLE = function() {
        var hi = this.high,
            lo = this.low;
        return [
             lo         & 0xff,
            (lo >>>  8) & 0xff,
            (lo >>> 16) & 0xff,
            (lo >>> 24) & 0xff,
             hi         & 0xff,
            (hi >>>  8) & 0xff,
            (hi >>> 16) & 0xff,
            (hi >>> 24) & 0xff
        ];
    }

    /**
     * Converts this Long to its big endian byte representation.
     * @returns {!Array.<number>} Big endian byte representation
     */
    LongPrototype.toBytesBE = function() {
        var hi = this.high,
            lo = this.low;
        return [
            (hi >>> 24) & 0xff,
            (hi >>> 16) & 0xff,
            (hi >>>  8) & 0xff,
             hi         & 0xff,
            (lo >>> 24) & 0xff,
            (lo >>> 16) & 0xff,
            (lo >>>  8) & 0xff,
             lo         & 0xff
        ];
    }

    return Long;
});

},{}]},{},[1]);
