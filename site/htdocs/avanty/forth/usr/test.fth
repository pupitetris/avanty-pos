define desc_primera_hora " La primera hora o fracción " ;
define desc_fracción " Fracción de 30min " ;
define desc_tarifa_diaria_máxima " Cobro máximo permitido " ;
define desc_extraviado " Boleto extraviado " ;

define costo_primera_hora 32 pesos ;
define costo_fracción 16 pesos ;
define costo_extraviado 360 pesos ;

define duración_fracción 30 minutos ; 
define tarifa_diaria_máxima 360 pesos ;


// Declaramos las variables que vamos a usar:

variable restante   // Será el tiempo registrado menos la primer hora.
variable fracciones // Número de fracciones de tiempo por cobrar.
variable total      // El total, para ver si nos pasamos de la tarifa diara máxima.

define cálculo:

// Se cobra la primer hora o fracción:
1 costo_primera_hora desc_primera_hora registra

// Si el tiempo registrado es menor a una hora, terminamos.
tiempo_registrado 1hr <= entonces salir fin

// El tiempo restante es el tiempo registrado menos una hora.
tiempo_registrado 1hr - restante guarda

// Calculamos cuántas fracciones adicionales se registraron:
restante valor duración_fracción / fracciones guarda

// Si no se registró la salida en el minuto exacto de la última fracción, sumar una fracción adicional.
restante valor duración_fracción residuo 0 > entonces
    fracciones incrementa
fin

fracciones valor costo_fracción desc_fracción registra

// Calcula el total: número de fracciones por su costo mas lo de la primer hora.
fracciones valor costo_fracción * costo_primera_hora + total guarda

// Si el total obtenido es mayor a la tarifa máxima diaria, marcamos lo ya reportado como cancelado
// y reportamos la tarifa máxima
total valor tarifa_diaria_máxima > entonces
    cancela_anteriores
    1 tarifa_diaria_máxima desc_tarifa_diaria_máxima registra
fin

está extraviado entonces
    1 costo_extraviado desc_extraviado registra
fin

; cálculo:
