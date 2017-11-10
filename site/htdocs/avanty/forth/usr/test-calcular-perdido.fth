// Declaramos las variables que vamos a usar:

variable noches // Número de noches transcurridos desde que el auto ingresó

define calcular

// Cobrar costo base del boleto extraviado
1 costo_extraviado desc_extraviado registra

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
noches valor costo_extraviado_día desc_extraviado_día registra

;
