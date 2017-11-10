incluir standard.fth

\ Some definitions to make Forth more pallatable:
: // #10 parse 2drop ; immediate            // C-style single line comments
: " '"' parse postpone sliteral ; immediate // s" synonym.

// Spanish translation and more literal functions:
: define : ;
: entonces ['] jumpIfFalse compile, here 0 , ; immediate
: fin dup here swap - swap ! ; immediate
: si_no postpone ahead 1 cs-roll postpone fin ; immediate
: si ; // a NOP for syntactic sugar.
: salir quit ;
: guarda ! ;
: valor @ ;
: residuo mod ;
: incrementa 1 swap +! ;
: está #32 word find swap drop ; immediate

// Some convenience numbers to ease readability.
  60 constant 1min // A minute in seconds.
3600 constant 1hr // Number of seconds in one hour.

// Standard calculations will make things very pleasant to read.
define pesos 100 * ;
define centavos + ;
define minutos 1min * ;
define horas 1hr * ;

// Report an account item 
define registra type " | " type . " | " type . #10 emit ;

// Cancel all previous items
define _desc_cancel " __CANCEL__ " ;
define cancela_anteriores 0 0 _desc_cancel registra ;

// Call the truncDate method
define truncar_fecha js /APP.Util.truncDate{2} ;
