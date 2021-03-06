# -*- tab-width: 8; -*-
package CHARP;

use utf8;

our %ERROR_DESCS = (
    'DBI:CONNECT'	=> 'No fue posible contactar a la base de datos.',
    'DBI:PREPARE'	=> 'Una sentencia SQL falló al ser preparada.',
    'DBI:EXECUTE'	=> 'La sentencia SQL no pudo ser ejecutada.',
    'CGI:REQPARM'	=> 'Faltan parámetros en petición HTTP.',
    'CGI:NOTPOST'	=> 'Método HTTP no es POST.',
    'CGI:PATHUNK'	=> 'Dirección HTTP no reconocida.',
    'CGI:BADPARAM'	=> '%s: Parámetros malformados `%s`.',
    'CGI:NUMPARAM'	=> '%s: %s parámetros requeridos, se entregaron %s.',
    'CGI:BINDPARAM'	=> '%s: No se pudo asociar el parámetro %s (`%s`) de `%s`.',
    'CGI:FILESEND'	=> 'Error al enviar archivo.',
    'CGI:CMDUNK'	=> 'Comando CGI `%s` desconocido.',
    'CGI:CMDNUMPARAM'	=> 'Comando CGI %s: %s parámetros requeridos, se entregaron %s.',
    'CGI:CMDERR'	=> 'Comando CGI falló al ser ejecutado.',
    'SQL:USERUNK'	=> 'Usuario `%s` con status `%s` no encontrado.',
    'SQL:USERDIS'	=> 'El usuario `%s` está deshabilitado.',
    'SQL:PROCUNK'	=> 'Función `%s` desconocida.',
    'SQL:REQUNK'	=> 'Petición no encontrada.',
    'SQL:REPFAIL'	=> 'Firma errónea. Verificar nombre de usuario y contraseña.',
    'SQL:ASSERT'	=> 'Parámetros erróneos (`%s`).',
    'SQL:USERPARAMPERM'	=> 'El usuario %s no tiene permiso de realizar esta operación.',
    'SQL:USERPERM'	=> 'La cuenta no tiene los permisos necesarios para realizar esta operación.',
    'SQL:MAILFAIL'	=> 'Hubo un error al intentar enviar un mensaje de correo a <%s>. Revisar que la dirección esté bien escrita.',
    'SQL:DATADUP'	=> 'Los datos no pudieron ser insertados por duplicidad.',
    'SQL:NOTFOUND'	=> 'Información no encontrada.',
    'SQL:EXIT'		=> '%s',
    'SQL:SUCCESS'	=> 'Petición exitosa.'
);

our %STRS = (
    'CGI:FILESEND:MISSING:MSG' => '%s: Parámetro `filename` faltante.',
    'CGI:FILESEND:OPENFAIL:MSG' => '%s: Error al abrir `%s` (%s).',
    'CGI:FILESEND:NOTFOUND:MSG' => '%s: Archivo `%s` no encontrado.',
    'CGI:CMDERR:BADPATH' => 'Ruta `%s` inválida.',
    'CGI:CMDERR:PATHNOTFOUND' => 'Ruta `%s` no encontrada.'
);    

1;
