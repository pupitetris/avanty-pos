BEGIN TRANSACTION;

	SET CONSTRAINTS ALL DEFERRED;
    
    DELETE FROM account;
	ALTER SEQUENCE account_user_id_seq RESTART;
    INSERT INTO account VALUES (DEFAULT, NULL, 'supervisor', '$2a$08$dcVj2sdh6IU5ixUg5m5i2e', 
                                pgcrypto.crypt('S_n2Dnw?3T_SNTkx', '$2a$08$dcVj2sdh6IU5ixUg5m5i2e'), 
                                NULL, 'active', TRUE, CURRENT_TIMESTAMP);
                                
	DELETE FROM user_supervisor;
	INSERT INTO user_supervisor VALUES (currval('account_user_id_seq'));
    
    DELETE FROM terminal;
    ALTER SEQUENCE terminal_terminal_id_seq RESTART;
    INSERT INTO terminal VALUES (DEFAULT, 'user_pos', 'POS1', '127.0.0.1', 
'-----BEGIN RSA PRIVATE KEY-----
MIIEpgIBAAKCAQEAwL1togiafREfSIcx8Bx3IsqChSRoSVDpyGZvg2trfqDP3TQX
bTSkWyhZF5y48kyyb23j1yAb15iR9YdLmqQFcoW8tUPOXAOHsadpWFyOdyjmMPil
Y0wvbWFEVqSprrN6pxP61h8CLzo4BXkBCbayuUnM1HlhshOzf+Vo2I/lDa7NxcRk
2N38lHlwIyo1NZ6Kypb19fbraE+LnwJvYbF4mdDp10/xtAntMpmXMQdy0q1KMyvn
/v3Gj5tymSbmVsDbe1mJevfkI0SquY4b1nvH5GTHOidjA7+1ID0otVjWCuDjEu1g
Zzcrj9s0DnwBGRmzisu3I/mqyd7g3EIZLlCKPQIDAQABAoIBAQC7VOJEBPyy5ntz
cQPWjrQ0uoPViKdb6yruvrFQGI4oS4D9TO4gFHRSrYq6andP+b/MkhBLPUgSapYj
AFc5fIZW4ymhPMBLqpquzzqSyZMmujfSDToiox/NviY/2FecF5H05nR8vTLQWFOu
7gdWO57GfLZ7JWcRQBjNDFq1clZ8zmDSK5/ZXkUtDQDkqEOuJrecat+GEKRsy/Ew
QQWg7nB4u289y+Vun1rgQAKSzkitEWr9xU1Gz4GZT9khYmWwSZf6FX8b+CqJJ7yR
/mpPMdL3d1BC178s0I7cmONItGr++el6FFPL71toM5LDgQZIYqkgymiiQaqa3dNj
Hfg7HF45AoGBAPtjDuyyJWHwGA9kHwLMaLC/8sfmHVorWr4/eodzi9v0Wb7Jtfgv
5PBLxDEBgZt/P2Prfmon9MOwxxSA9YpVDq2nVbS82DrWbjsHzapwJ+XoY0G1Rdzz
QGsQGssOQBOdctakMeTNAa+tpUE/SKP9w6xpOnyyBD1nFRyjA+IvgLivAoGBAMRG
3Rqyw/WgS+BuHPvGh3QoAH7rcgdfsdiqaVBoTp2jaox51ey1rdf8LcPM1GXbaBRv
4dq97fpe/Q/TARRMKYqMB4YPwHM1JhXSxo8BRje2NiORd+OfqW738vmEkSUOJxRy
RyJhXCxRZT1hhiGQbcYbQmcTvKTWYT+P1IbW/U7TAoGBAIReo8Q1BgQtFa49DSs/
ET1IxYFHBVuuioi1CkL6r8FxSDRzKFN4fLefXb5kSafkeC+YGCezxGmq0xlT0nc1
1JXSEAosijtpIAALWtuNVST1mhZGanQuzlPR1hnn9gueE5M8QF13KZUk/Wh+9zQK
8pb9jeONJThj6DT9DZVzZ/dXAoGBAKVTEzZD0W95n6/g0CT66mlasGA3rYqsfj8D
+0UxNtbtKPg+P4Ts2wuMbHf6dgV9s8NTIih/xo4XqIzFrKkOJgd/P28aoX3pDLVh
HsKhziVrI1r+Ur+2Yp8H1u95TFCsBRrhzy0UWPEzdlUnajWnU++EUoBETaeCs9M4
MUmKmT7lAoGBAJzwWdqAvuPtMjucKk5fe+w5grOPUC2PYeShrTfrGql6KXZOVO+y
4hgRRuEqF8p8woXTMskoOOmy6aU7VtOYKFLse/SgGRhOVm7eMn5MxYgZeO6nLbk1
iwxRWT0UqyggORJJjW5UAA1t2XDAGGvR0ZigdIwSXzjRpLZes24qUcfm
-----END RSA PRIVATE KEY-----
',
'-----BEGIN CERTIFICATE-----
MIIGCTCCA/GgAwIBAgICEAAwDQYJKoZIhvcNAQELBQAwgaIxCzAJBgNVBAYTAk1Y
MQ8wDQYDVQQIDAZNZXhpY28xHzAdBgNVBAoMFk1pY3Jvc2FmZSBTLkEuIGRlIEMu
Vi4xETAPBgNVBAsMCEZpcm13YXJlMSIwIAYDVQQDDBlNaWNyb3NhZmUgSW50ZXJt
ZWRpYXRlIENBMSowKAYJKoZIhvcNAQkBFhtwcm9ibGVzZ2lsQG1pY3Jvc2FmZS5j
b20ubXgwHhcNMTcxMDMwMDMwOTI0WhcNMjMwNDIyMDMwOTI0WjCBqjELMAkGA1UE
BhMCTVgxDzANBgNVBAgMBk1leGljbzEVMBMGA1UEBwwMVGxhbG5lcGFudGxhMRww
GgYDVQQKDBNBdmFudHkgVGVjaG5vbG9naWVzMRQwEgYDVQQLDAtEZXZlbG9wbWVu
dDEZMBcGA1UEAwwQd3d3LmF2YW50eS5sb2NhbDEkMCIGCSqGSIb3DQEJARYVYXJ0
dXJvZWFAYXZhbnR5LmxvY2FsMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKC
AQEAwL1togiafREfSIcx8Bx3IsqChSRoSVDpyGZvg2trfqDP3TQXbTSkWyhZF5y4
8kyyb23j1yAb15iR9YdLmqQFcoW8tUPOXAOHsadpWFyOdyjmMPilY0wvbWFEVqSp
rrN6pxP61h8CLzo4BXkBCbayuUnM1HlhshOzf+Vo2I/lDa7NxcRk2N38lHlwIyo1
NZ6Kypb19fbraE+LnwJvYbF4mdDp10/xtAntMpmXMQdy0q1KMyvn/v3Gj5tymSbm
VsDbe1mJevfkI0SquY4b1nvH5GTHOidjA7+1ID0otVjWCuDjEu1gZzcrj9s0DnwB
GRmzisu3I/mqyd7g3EIZLlCKPQIDAQABo4IBPTCCATkwCQYDVR0TBAIwADARBglg
hkgBhvhCAQEEBAMCBkAwDwYJYIZIAYb4QgENBAIWADAdBgNVHQ4EFgQUYnQDuHGn
CecW54+B5o9Ndi4rJN8wgcMGA1UdIwSBuzCBuIAUFYA71zyeFQx8kvUHk5JU+GRL
UW6hgZukgZgwgZUxCzAJBgNVBAYTAk1YMQ8wDQYDVQQIDAZNZXhpY28xFTATBgNV
BAcMDFRsYWxuZXBhbnRsYTEfMB0GA1UECgwWTWljcm9zYWZlIFMuQS4gZGUgQy5W
LjERMA8GA1UECwwIRmlybXdhcmUxKjAoBgkqhkiG9w0BCQEWG3Byb2JsZXNnaWxA
bWljcm9zYWZlLmNvbS5teIICEAAwDgYDVR0PAQH/BAQDAgWgMBMGA1UdJQQMMAoG
CCsGAQUFBwMBMA0GCSqGSIb3DQEBCwUAA4ICAQCldYBKE9PX1T2gV6iFLfGo4pq5
5M8iuK6EuPvVsFFQoKWz4DMdgntCSrSI0EfXC39QJFo3i3gLbe7fCAdKJRgVxGSX
6UdbvMe42oGdFSdscNsHf3516TtS8/gbHe/z834q+S2doytxsW437AacWl3vgUoN
AmA8bOQo4Lvzv5JEK/tvkjK6+8W98r6+oCzKA/qj2lCoLpTUwXM+Z+kParMAM1ac
7lDqVtnb96x75YH2DAOX1YoJWXZG7XGK8j2lLQwlVaLudxk+ereYeK4aPvZu29e3
ODvgNMKxDS0YFdK9680R7vXvnJb+RANW4KYe0zFEuOq9vq7d+pDXcQAuNVHiXSRg
OcZCwq56+UULDwjYKaL4YCKCZvovIoTL/BMi2ALt1ajFJpdpfjtCJVlwFCcjkCB4
03q0fuPdKHc0AxWW0rKbo7flXZSjIjnmwjzBcmNm/IfysjnpjAyrz774DOi7lvdp
U2bqk506bOY9dAE8UMd0wJriwP1WHE+LJhTSMZsqVbaDm2ZObgKvKb8WPAIG0nch
ShBRsnQFT3fQbfwBB48Rjh+nx/RXt17WZyGqxQlMcgMtX/39yZB2slAUL/CRq9Lh
qyggkrzF8BoHCRCvSRMUDmipczEsLDh93H+p8R/K8Ob7qtct0sZthwWBU2ZJXvhX
zozCzYdSCBfnRztD8A==
-----END CERTIFICATE-----
');

    INSERT INTO terminal VALUES (DEFAULT, 'user_pos', 'POS2', '192.168.137.184', 
'-----BEGIN RSA PRIVATE KEY-----
MIIEpgIBAAKCAQEAwL1togiafREfSIcx8Bx3IsqChSRoSVDpyGZvg2trfqDP3TQX
bTSkWyhZF5y48kyyb23j1yAb15iR9YdLmqQFcoW8tUPOXAOHsadpWFyOdyjmMPil
Y0wvbWFEVqSprrN6pxP61h8CLzo4BXkBCbayuUnM1HlhshOzf+Vo2I/lDa7NxcRk
2N38lHlwIyo1NZ6Kypb19fbraE+LnwJvYbF4mdDp10/xtAntMpmXMQdy0q1KMyvn
/v3Gj5tymSbmVsDbe1mJevfkI0SquY4b1nvH5GTHOidjA7+1ID0otVjWCuDjEu1g
Zzcrj9s0DnwBGRmzisu3I/mqyd7g3EIZLlCKPQIDAQABAoIBAQC7VOJEBPyy5ntz
cQPWjrQ0uoPViKdb6yruvrFQGI4oS4D9TO4gFHRSrYq6andP+b/MkhBLPUgSapYj
AFc5fIZW4ymhPMBLqpquzzqSyZMmujfSDToiox/NviY/2FecF5H05nR8vTLQWFOu
7gdWO57GfLZ7JWcRQBjNDFq1clZ8zmDSK5/ZXkUtDQDkqEOuJrecat+GEKRsy/Ew
QQWg7nB4u289y+Vun1rgQAKSzkitEWr9xU1Gz4GZT9khYmWwSZf6FX8b+CqJJ7yR
/mpPMdL3d1BC178s0I7cmONItGr++el6FFPL71toM5LDgQZIYqkgymiiQaqa3dNj
Hfg7HF45AoGBAPtjDuyyJWHwGA9kHwLMaLC/8sfmHVorWr4/eodzi9v0Wb7Jtfgv
5PBLxDEBgZt/P2Prfmon9MOwxxSA9YpVDq2nVbS82DrWbjsHzapwJ+XoY0G1Rdzz
QGsQGssOQBOdctakMeTNAa+tpUE/SKP9w6xpOnyyBD1nFRyjA+IvgLivAoGBAMRG
3Rqyw/WgS+BuHPvGh3QoAH7rcgdfsdiqaVBoTp2jaox51ey1rdf8LcPM1GXbaBRv
4dq97fpe/Q/TARRMKYqMB4YPwHM1JhXSxo8BRje2NiORd+OfqW738vmEkSUOJxRy
RyJhXCxRZT1hhiGQbcYbQmcTvKTWYT+P1IbW/U7TAoGBAIReo8Q1BgQtFa49DSs/
ET1IxYFHBVuuioi1CkL6r8FxSDRzKFN4fLefXb5kSafkeC+YGCezxGmq0xlT0nc1
1JXSEAosijtpIAALWtuNVST1mhZGanQuzlPR1hnn9gueE5M8QF13KZUk/Wh+9zQK
8pb9jeONJThj6DT9DZVzZ/dXAoGBAKVTEzZD0W95n6/g0CT66mlasGA3rYqsfj8D
+0UxNtbtKPg+P4Ts2wuMbHf6dgV9s8NTIih/xo4XqIzFrKkOJgd/P28aoX3pDLVh
HsKhziVrI1r+Ur+2Yp8H1u95TFCsBRrhzy0UWPEzdlUnajWnU++EUoBETaeCs9M4
MUmKmT7lAoGBAJzwWdqAvuPtMjucKk5fe+w5grOPUC2PYeShrTfrGql6KXZOVO+y
4hgRRuEqF8p8woXTMskoOOmy6aU7VtOYKFLse/SgGRhOVm7eMn5MxYgZeO6nLbk1
iwxRWT0UqyggORJJjW5UAA1t2XDAGGvR0ZigdIwSXzjRpLZes24qUcfm
-----END RSA PRIVATE KEY-----
',
'-----BEGIN CERTIFICATE-----
MIIGCTCCA/GgAwIBAgICEAAwDQYJKoZIhvcNAQELBQAwgaIxCzAJBgNVBAYTAk1Y
MQ8wDQYDVQQIDAZNZXhpY28xHzAdBgNVBAoMFk1pY3Jvc2FmZSBTLkEuIGRlIEMu
Vi4xETAPBgNVBAsMCEZpcm13YXJlMSIwIAYDVQQDDBlNaWNyb3NhZmUgSW50ZXJt
ZWRpYXRlIENBMSowKAYJKoZIhvcNAQkBFhtwcm9ibGVzZ2lsQG1pY3Jvc2FmZS5j
b20ubXgwHhcNMTcxMDMwMDMwOTI0WhcNMjMwNDIyMDMwOTI0WjCBqjELMAkGA1UE
BhMCTVgxDzANBgNVBAgMBk1leGljbzEVMBMGA1UEBwwMVGxhbG5lcGFudGxhMRww
GgYDVQQKDBNBdmFudHkgVGVjaG5vbG9naWVzMRQwEgYDVQQLDAtEZXZlbG9wbWVu
dDEZMBcGA1UEAwwQd3d3LmF2YW50eS5sb2NhbDEkMCIGCSqGSIb3DQEJARYVYXJ0
dXJvZWFAYXZhbnR5LmxvY2FsMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKC
AQEAwL1togiafREfSIcx8Bx3IsqChSRoSVDpyGZvg2trfqDP3TQXbTSkWyhZF5y4
8kyyb23j1yAb15iR9YdLmqQFcoW8tUPOXAOHsadpWFyOdyjmMPilY0wvbWFEVqSp
rrN6pxP61h8CLzo4BXkBCbayuUnM1HlhshOzf+Vo2I/lDa7NxcRk2N38lHlwIyo1
NZ6Kypb19fbraE+LnwJvYbF4mdDp10/xtAntMpmXMQdy0q1KMyvn/v3Gj5tymSbm
VsDbe1mJevfkI0SquY4b1nvH5GTHOidjA7+1ID0otVjWCuDjEu1gZzcrj9s0DnwB
GRmzisu3I/mqyd7g3EIZLlCKPQIDAQABo4IBPTCCATkwCQYDVR0TBAIwADARBglg
hkgBhvhCAQEEBAMCBkAwDwYJYIZIAYb4QgENBAIWADAdBgNVHQ4EFgQUYnQDuHGn
CecW54+B5o9Ndi4rJN8wgcMGA1UdIwSBuzCBuIAUFYA71zyeFQx8kvUHk5JU+GRL
UW6hgZukgZgwgZUxCzAJBgNVBAYTAk1YMQ8wDQYDVQQIDAZNZXhpY28xFTATBgNV
BAcMDFRsYWxuZXBhbnRsYTEfMB0GA1UECgwWTWljcm9zYWZlIFMuQS4gZGUgQy5W
LjERMA8GA1UECwwIRmlybXdhcmUxKjAoBgkqhkiG9w0BCQEWG3Byb2JsZXNnaWxA
bWljcm9zYWZlLmNvbS5teIICEAAwDgYDVR0PAQH/BAQDAgWgMBMGA1UdJQQMMAoG
CCsGAQUFBwMBMA0GCSqGSIb3DQEBCwUAA4ICAQCldYBKE9PX1T2gV6iFLfGo4pq5
5M8iuK6EuPvVsFFQoKWz4DMdgntCSrSI0EfXC39QJFo3i3gLbe7fCAdKJRgVxGSX
6UdbvMe42oGdFSdscNsHf3516TtS8/gbHe/z834q+S2doytxsW437AacWl3vgUoN
AmA8bOQo4Lvzv5JEK/tvkjK6+8W98r6+oCzKA/qj2lCoLpTUwXM+Z+kParMAM1ac
7lDqVtnb96x75YH2DAOX1YoJWXZG7XGK8j2lLQwlVaLudxk+ereYeK4aPvZu29e3
ODvgNMKxDS0YFdK9680R7vXvnJb+RANW4KYe0zFEuOq9vq7d+pDXcQAuNVHiXSRg
OcZCwq56+UULDwjYKaL4YCKCZvovIoTL/BMi2ALt1ajFJpdpfjtCJVlwFCcjkCB4
03q0fuPdKHc0AxWW0rKbo7flXZSjIjnmwjzBcmNm/IfysjnpjAyrz774DOi7lvdp
U2bqk506bOY9dAE8UMd0wJriwP1WHE+LJhTSMZsqVbaDm2ZObgKvKb8WPAIG0nch
ShBRsnQFT3fQbfwBB48Rjh+nx/RXt17WZyGqxQlMcgMtX/39yZB2slAUL/CRq9Lh
qyggkrzF8BoHCRCvSRMUDmipczEsLDh93H+p8R/K8Ob7qtct0sZthwWBU2ZJXvhX
zozCzYdSCBfnRztD8A==
-----END CERTIFICATE-----
');

    DELETE FROM tender;
    ALTER SEQUENCE tender_tender_id_seq RESTART;
	INSERT INTO tender VALUES
		   (DEFAULT,      5, 'coin'),
		   (DEFAULT,     10, 'coin'),
		   (DEFAULT,     20, 'coin'),
		   (DEFAULT,     50, 'coin'),
		   (DEFAULT,    100, 'coin'),
		   (DEFAULT,    200, 'coin'),
		   (DEFAULT,    500, 'coin'),
		   (DEFAULT,   1000, 'coin'),
		   (DEFAULT,   2000, 'coin'),
		   (DEFAULT,   2000, 'bill'),
		   (DEFAULT,   5000, 'bill'),
		   (DEFAULT,  10000, 'bill'),
		   (DEFAULT,  20000, 'bill'),
		   (DEFAULT,  50000, 'bill'),
		   (DEFAULT, 100000, 'bill');
    
	DELETE FROM rate;
    ALTER SEQUENCE rate_rate_id_seq RESTART;
	INSERT INTO rate VALUES (DEFAULT, 'regular', 'test', '// Fuente: http://www.oma.aero/es/aeropuertos/monterrey/pasajeros/servicios/estacionamiento.htm

incluir test-desc.fth
incluir test-param.fth
incluir test-calcular.fth

calcular
', NULL);
   INSERT INTO rate VALUES (DEFAULT, 'regular', 'test-desc', 'define desc_primera_hora " La primera hora o fracción " ;
define desc_fracción " Fracción de 30min " ;
define desc_tarifa_diaria_máxima " Cobro máximo permitido " ;
define desc_extraviado " Boleto extraviado " ;
', NULL);
   INSERT INTO rate VALUES (DEFAULT, 'regular', 'test-param', 'define costo_primera_hora 32 pesos ;
define costo_fracción 16 pesos ;
define costo_extraviado 360 pesos ;

define duración_fracción 30 minutos ; 
define tarifa_diaria_máxima 360 pesos ;
', NULL);
   INSERT INTO rate VALUES (DEFAULT, 'regular', 'test-calcular', '// Declaramos las variables que vamos a usar:

variable restante   // Será el tiempo registrado menos la primer hora.
variable fracciones // Número de fracciones de tiempo por cobrar.
variable total      // El total, para ver si nos pasamos de la tarifa diara máxima.

define calcular

// Checa la existencia de la constante "extraviado" y si es así, se cobra el concepto
// de boleto extraviado y termina.
si está extraviado entonces
	1 costo_extraviado desc_extraviado registra
	salir
fin

// Se cobra la primer hora o fracción:
1 costo_primera_hora desc_primera_hora registra

// Si el tiempo registrado es menor a una hora, terminamos.
si tiempo_registrado 1hr <= entonces
	salir
fin

// El tiempo restante es el tiempo registrado menos una hora.
tiempo_registrado 1hr - restante guarda

// Calculamos cuántas fracciones adicionales se registraron:
restante valor duración_fracción / fracciones guarda

// Si no se registró la salida en el minuto exacto de la última fracción, sumar una fracción adicional.
si restante valor duración_fracción residuo 0 > entonces
	fracciones incrementa
fin

fracciones valor costo_fracción desc_fracción registra

// Calcula el total: número de fracciones por su costo mas lo de la primer hora.
fracciones valor costo_fracción * costo_primera_hora + total guarda

// Si el total obtenido es mayor a la tarifa máxima diaria, marcamos lo ya reportado como cancelado
// y reportamos la tarifa máxima
si total valor tarifa_diaria_máxima > entonces
	cancela_anteriores
	1 tarifa_diaria_máxima desc_tarifa_diaria_máxima registra
fin

;
', NULL);

COMMIT TRANSACTION;
