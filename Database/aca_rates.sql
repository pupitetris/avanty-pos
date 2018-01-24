DELETE FROM rate WHERE type <> 'system';
COPY rate ( name, type, is_active, position, label, label_client, description )
		 	FROM STDIN WITH ( FORMAT csv, DELIMITER '|', NULL 'NULL', QUOTE '''' );
'vips-desc'|'fragment'|TRUE|0|NULL|NULL|''
'vips-param'|'fragment'|TRUE|0|NULL|NULL|''
'vips-calcular'|'fragment'|TRUE|0|NULL|NULL|''
'vips-calcular-perdido'|'fragment'|TRUE|0|NULL|NULL|''
'perdido'|'lost'|TRUE|0|'Boleto perdido'|'Bol. perdido'|''
'vips-sellado'|'regular'|TRUE|0|'Con boleto sellado'|'Bol. sellado'|''
'vips-sin-sello'|'regular'|TRUE|1|'Sin boleto sellado'|'Normal'|''
\.
UPDATE rate SET script = '
define desc_primera_fracción " Primeras horas o fracción " ;
define desc_primera_fracción_sellado " Cliente VIPS, 2hrs " ;
define desc_fracción " Fracción de 30min " ;
define desc_tarifa_diaria_máxima " Cobro máximo permitido " ;
define desc_perdido " Boleto perdido " ;
define desc_perdido_día " Pernocta " ;
' WHERE name = 'vips-desc';

UPDATE rate SET script = '
define costo_primera_fracción 18 pesos ;
define costo_primera_fracción_sellado 0 pesos ;
define costo_fracción 9 pesos ;
define costo_perdido 150 pesos ;
define costo_perdido_día 150 pesos ;

define duración_primera_fracción 1 hora ;
define duración_primera_fracción_sellado 2 horas ;
define duración_primer_periodo 3 horas ;
define duración_fracción 30 minutos ; 
define tarifa_diaria_máxima 0 pesos ;
' WHERE name = 'vips-param';

UPDATE rate SET script = '
// Declaramos las variables que vamos a usar:

variable tiempo_contado // Tiempo contabilizado para el primer periodo.
variable restante       // Será el tiempo registrado menos la primer hora.
variable fracciones     // Número de fracciones de tiempo por cobrar.
variable total          // El total, para ver si nos pasamos de la tarifa diara máxima.

define calcular

// Se cobra la primera fracción:
si está sellado entonces
	1 costo_primera_fracción_sellado desc_primera_fracción_sellado registra
	si tiempo_registrado duración_primera_fracción_sellado <= entonces
		salir
	fin

	tiempo_registrado duración_primera_fracción_sellado - restante guarda
	duración_primera_fracción_sellado tiempo_contado guarda
si_no
	tiempo_registrado restante guarda
	0 tiempo_contado guarda
fin

si tiempo_registrado duración_primer_periodo <= entonces
	restante valor duración_primera_fracción / fracciones guarda
	// Si no se registró la salida en el minuto exacto de la última fracción, sumar una fracción adicional.
	si restante valor duración_fracción residuo 0 > entonces
		fracciones incrementa
	fin

	fracciones valor costo_primera_fracción desc_primera_fracción registra
	salir
fin

duración_primer_periodo tiempo_contado valor - duración_primera_fracción / costo_primera_fracción desc_primera_fracción registra
tiempo_registrado duración_primer_periodo - restante guarda

// Calculamos cuántas fracciones adicionales se registraron:
restante valor duración_fracción / fracciones guarda

// Si no se registró la salida en el minuto exacto de la última fracción, sumar una fracción adicional.
si restante valor duración_fracción residuo 0 > entonces
	fracciones incrementa
fin

fracciones valor costo_fracción desc_fracción registra

;
' WHERE name = 'vips-calcular';

UPDATE rate SET script = '
// Declaramos las variables que vamos a usar:

variable noches // Número de noches transcurridos desde que el auto ingresó

define calcular

// Cobrar costo base del boleto perdido
1 costo_perdido desc_perdido registra

// Calcular las noches transcurridas desde el día que ingresó el auto
2 ahora truncar_fecha         // Se trunca la hora actual hasta días.
2 fecha_ingreso truncar_fecha // Se trunca la hora del ingreso hasta días.
- 24 horas /                  // Se restan los resultados y dividen entre 24 horas.
noches guarda                 // El resultado es el número de noches. Guardar en variable "noches".

// Si no pasó ni una noche, terminamos.
si noches valor 1 < entonces
	salir
fin

// Se cobra el número de noches transcurridas que se calculó.
noches valor costo_perdido_día desc_perdido_día registra

;
' WHERE name = 'vips-calcular-perdido';

UPDATE rate SET script = '
incluir vips-desc
incluir vips-param
incluir vips-calcular-perdido

calcular
' WHERE name = 'perdido';

UPDATE rate SET script = '
incluir vips-desc
incluir vips-param

define sellado verdadero ;
                             
incluir vips-calcular

calcular
' WHERE name = 'vips-sellado';

UPDATE rate SET script = '
incluir vips-desc
incluir vips-param
incluir vips-calcular
                             
calcular
' WHERE name = 'vips-sin-sello';

