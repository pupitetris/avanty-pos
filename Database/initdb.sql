BEGIN TRANSACTION;

	SET CONSTRAINTS ALL DEFERRED;

	DELETE FROM request;
	DELETE FROM request_log;
	DELETE FROM ticket;
    DELETE FROM movement;
    DELETE FROM cashier_shift;
    DELETE FROM user_cashier;
    DELETE FROM supervisor_challenge;

    DELETE FROM account;
	ALTER SEQUENCE account_user_id_seq RESTART;
    INSERT INTO account VALUES (DEFAULT, NULL, 'supervisor', '$2a$08$dcVj2sdh6IU5ixUg5m5i2e', 
                                pgcrypto.crypt('S_n2Dnw?3T_SNTkx', '$2a$08$dcVj2sdh6IU5ixUg5m5i2e'), 
                                NULL, 'active', TRUE, CURRENT_TIMESTAMP);
                                
	DELETE FROM user_supervisor;
	INSERT INTO user_supervisor VALUES (currval('account_user_id_seq'));
    
    DELETE FROM terminal;
    ALTER SEQUENCE terminal_terminal_id_seq RESTART;
    INSERT INTO terminal VALUES (DEFAULT, 'user_pos', 'POS1', '127.0.0.1', 0, 0,
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
	INSERT INTO terminal VALUES ( DEFAULT, 'boom_entry', 'ENTRY1', '0.0.0.0', 0, 0, NULL, NULL );
	INSERT INTO terminal VALUES ( DEFAULT, 'boom_entry', 'ENTRY2', '0.0.0.0', 0, 0, NULL, NULL );
	INSERT INTO terminal VALUES ( DEFAULT, 'boom_entry', 'ENTRY3', '0.0.0.0', 0, 0, NULL, NULL );
    INSERT INTO terminal VALUES (DEFAULT, 'user_pos', 'POS2', '192.168.56.102', 0, 0,
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
	INSERT INTO rate VALUES (DEFAULT, '_standard', 'system', TRUE, '
: \ #10 parse 2drop ; immediate \ Single line comments

: binary #2 base ! ;
: octal #8 base ! ;
: decimal #10 base ! ;
: hex #16 base ! ;

: if [''] jumpIfFalse compile, here 0 , ; immediate
: then dup here swap - swap ! ; immediate
: begin here ; immediate
: again [''] jump compile, here - , ; immediate
: until [''] jumpIfFalse compile, here - , ; immediate
: ahead [''] jump compile, here 0 , ; immediate
: cs-pick pick ;
: cs-roll roll ;

: postpone #32 word find dup 0 = abort" Word not found"
    0 > if
        compile,
    [ ahead 1 cs-roll then ]
        [''] lit compile, ,
        [''] compile, compile,
    then
; immediate

: else postpone ahead 1 cs-roll postpone then ; immediate
: while postpone if 1 cs-roll ; immediate
: repeat postpone again postpone then ; immediate

: case 0 ; immediate

: of
   1 +
   >r
   postpone over postpone =
   postpone if
   postpone drop
   r>
; immediate

: endof
   >r
   postpone else
   r>
; immediate

: endcase
  postpone drop
  0 ?do
    postpone then
  loop
; immediate


: (  begin key '')'' = until ; immediate


: bl ( -- char ) #32 ;
: space ( -- ) bl emit ;
: spaces ( n -- ) dup 0 > if 0 do bl emit loop else drop then ;

: literal [''] lit compile, , ; immediate
: sliteral ( c-addr1 u -- ) swap postpone literal postpone literal ; immediate
: [char] char postpone literal ; immediate

: .( ( display "ccc<paren>" -- ) '')'' parse type ; immediate
: s" ( "ccc<quote>" -- ) ( -- c-addr u ) ''"'' parse postpone sliteral ; immediate
: ." ( "ccc<quote>" -- ) ( display ) ''"'' parse postpone sliteral postpone type ; immediate

: cell ( -- n ) 1 ;
: cell+ ( addr1 -- add2 ) 1 + ;
: cells ( n1 -- n2) ;
: char+ ( addr1 -- add2) 1 + ;
: chars ( n1 -- n2 ) ;
: c, ( char -- ) , ;
: c@ ( addr -- char ) @ ;
: c! ( char addr -- ) ! ;
: count ( c-addr1 -- caddr2 u ) dup 1 + swap c@ ;
: 2@ ( addr - x1 x2 ) dup cell+ @ swap @ ;
: 2! ( x1 x2 addr -- ) swap over ! cell+ ! ;
: align ( -- ) ;
: aligned ( addr -- addr ) ;
: fill ( addr u char -- ) -rot dup 0 > if 0 do 2dup i + ! loop 2drop else drop drop drop then ;
: erase ( addr u -- ) 0 fill ;
: move ( addr1 addr2 u -- )
    dup 0 > if
        -rot 2dup > if
            rot 0 do over i + @ over i + ! loop
        else
            rot 0 swap 1 - do over i + @ over i + ! -1 +loop
        then
        2drop
    else
        drop drop drop
    then
;
: c"
  ''"'' parse
  postpone ahead
  here 2>r
  dup here !
  here swap move
  2r> swap
  postpone then
  postpone literal
; immediate

: nip ( x1 x2 -- x2 ) swap drop ;
: tuck ( x1 x2 -- x2 x1 x2 ) dup -rot ;

: 0= ( x -- boolean ) 0 = ;
: 0<> ( x -- boolean ) 0 <> ;
: 0< ( x -- boolean ) 0 < ;
: 0> ( x -- boolean ) 0 > ;
: 0<= ( x -- boolean ) 0 <= ;
: 0>= ( x -- boolean ) 0 >= ;
: 1+ ( u1 -- u2 ) 1 + ;
: 1- ( u1 -- u2 ) 1 - ;
: holds ( addr u -- )
  begin
    dup
  while
    1- 2dup + c@ hold
  repeat
  2drop
;
: /mod ( n1 n2 -- n3 n4 ) 2dup mod -rot / ;
: unsigned ( n -- u ) 0 rshift ;
: u< ( n1 n2 -- boolean ) unsigned swap unsigned > ;
: u> ( n1 n2 -- boolean ) unsigned swap unsigned < ;
: u. ( u -- ) unsigned . ;
: u.r ( u w -- ) swap unsigned swap .r ;

: environment? 2drop false ;
: unused $ffffff here - ;
: buffer: ( u "<name>" ??? ; ??? addr )
   create allot
;

: constant ( x "<spaces>name" -- ) create , does> @ ;
: variable ( "<spaces>name" -- )  create cell allot ;
: value ( "<spaces>name" -- )  create , does> @ ;
: to ( x1 "<spaces>name" -- )
   '' >body
   state @ if
     postpone literal postpone !
   else
     !
   then
; immediate

: defer ( "name" -- )
  create [''] abort ,
does> ( ... -- ... )
  @ execute
;

: defer! ( xt2 xt1 -- )
   >body !
;

: defer@ ( xt1 -- xt2 )
   >body @
;

: is
  state @ if
    postpone [''] postpone defer!
  else
    '' defer!
  then
; immediate

: action-of
  state @ if
    postpone [''] postpone defer@
  else
    '' defer@
  then
; immediate

: -trailing ( c-addr u1 -- c-addr u2 )
  begin
    2dup + 1- @ bl = over 0> and
  while
    1-
  repeat
;

: /string ( c-addr1 u1 n -- c-addr2 u2 )
  dup -rot - -rot + swap
;

: blank ( c-addr u -- )
  dup 0 > if
    0 do
      bl over i + !
    loop
    drop
  else
    2drop
  then
;

: cmove ( c-addr1 c-addr2 u -- )
  dup 0 > if
    0 do
      over i + @ over i + !
    loop
  else
    drop
  then
  2drop
;

: cmove> ( c-addr1 c-addr2 u -- )
  dup 0 > if
    0 swap 1 - do
      over i + @ over i + ! -1
    +loop
  else
    drop
  then
  2drop
;

: compare ( c-addr1 u1 c-addr2 u2 -- n )
  rot 2swap 2over min
  dup 0= if
      drop
  else
    0 do 2dup i + @ swap i + @ 2dup = if
        2drop
      else
        < if 1 else -1 then
        -rot 2drop -rot 2drop unloop exit
      then
    loop
  then
  2drop 2dup = if
    2drop 0
  else
    < if 1 else -1 then
  then
;

: search ( c-addr1 u1 c-addr2 u2 -- c-addr3 u3 boolean )
  2over
  begin ( c-addr1 u1 c-addr2 u2 c-addr3 u3 )
    2over 2over drop over compare 0= if
      2swap 2drop 2swap 2drop true exit
    else dup 4 pick >= if
      1 /string
    else
      2drop 2drop false exit
    then then
  again
;

create pad 1000 cells allot


: [ELSE] ( -- )
  1 begin
    begin bl word count dup while
      2dup s" [IF]" compare 0= if
        2drop 1 +
      else
        2dup s" [ELSE]" compare 0= if
          2drop 1- dup if 1+ then
        else
          s" [THEN]" compare 0= if
            1-
          then
        then
      then ?dup 0= if exit then
    repeat 2drop
    refill 0= until
  drop
; immediate

: [IF] ( boolean -- )
   0= if postpone [ELSE] then
; immediate

: [THEN] ( -- ) ; immediate
', '', 0, NULL, NULL);
	INSERT INTO rate VALUES (DEFAULT, '_avanty', 'system', TRUE, '
incluir _standard

\ Some definitions to make Forth more pallatable:
: // #10 parse 2drop ; immediate            // C-style single line comments
: " ''"'' parse postpone sliteral ; immediate // s" synonym.

// Spanish translation and more literal functions:
: define : ;
: entonces [''] jumpIfFalse compile, here 0 , ; immediate
: fin dup here swap - swap ! ; immediate
: si_no postpone ahead 1 cs-roll postpone fin ; immediate
: si ; // a NOP for syntactic sugar.
: salir quit ;
: guarda ! ;
: valor @ ;
: residuo mod ;
: incrementa 1 swap +! ;
: est?? #32 word find swap drop ; immediate
: verdadero -1 ;
: falso 0 ;
: es = ;
: ?? or ;
: y and ;

// Some convenience numbers to ease readability.
  60 constant 1min // A minute in seconds.
3600 constant 1hr // Number of seconds in one hour.

// Standard calculations will make things very pleasant to read.
define pesos 100 * ;
define peso 100 * ;
define centavos + ;
define centavo + ;
define minutos 1min * ;
define minuto 1min * ;
define horas 1hr * ;
define hora 1hr * ;

// Call the truncDate method
define truncar_fecha js /APP.Util.truncDate{2} ;

// For JSON rendering
define lf 10 emit ;
define quot 34 emit ;
define colon 58 emit ;
define comma 44 emit ;
define lbrack 91 emit ;
define rbrack 93 emit ;
define lbrace 123 emit ;
define verbar 124 emit ;
define rbrace 125 emit ;
define value 1- type ;
define str quot value quot ;
define key str colon ;

// Report an account item 
define registra value verbar . verbar . lf ;

// Cancel all previous items
define _desc_cancel " __CANCEL__ " ;
define cancela_anteriores 0 0 _desc_cancel registra ;
', '', 0, NULL, NULL);
	INSERT INTO rate VALUES (DEFAULT, '_calc', 'system', TRUE, '
// simple_calc

variable l??mite_fracciones // n??mero m??ximo de fracciones que se calculan para el per??odo
variable costo_fracci??n // en de cada fracci??n, en centavos
variable duraci??n_fracci??n // en segundos
variable desc_fracci??n_size // texto que se va al ticket
variable desc_fracci??n_addr // texto que se va al ticket
variable tiempo_restante // asignado inicialmente a tiempo_registrado, usado para pasar el tiempo registrado de una invocaci??n a otra.

variable duraci??n // duraci??n total del periodo.
variable restante   // Ser?? el tiempo registrado menos la primer hora.
variable fracciones // N??mero de fracciones de tiempo por cobrar.

define simple_calc

    // paso de par??metros
    desc_fracci??n_size guarda
    desc_fracci??n_addr guarda
    duraci??n_fracci??n guarda
    costo_fracci??n guarda
    l??mite_fracciones guarda
    tiempo_restante guarda
    
    l??mite_fracciones valor duraci??n_fracci??n valor * duraci??n guarda
    
    si duraci??n valor 0 = tiempo_restante valor duraci??n valor < ?? entonces
        0 restante guarda
    si_no
        tiempo_restante valor duraci??n valor - restante guarda
        duraci??n valor tiempo_restante guarda
    fin
    
    tiempo_restante valor duraci??n_fracci??n valor / fracciones guarda
    si tiempo_restante valor duraci??n_fracci??n valor residuo 0 > entonces
        fracciones incrementa
    fin
    fracciones valor costo_fracci??n valor desc_fracci??n_addr valor desc_fracci??n_size valor registra
    
    // Regresar el tiempo restante para la siguiente invocaci??n
    restante valor
    
;
', '', 0, NULL, NULL);
	INSERT INTO rate VALUES (DEFAULT, '_json', 'system', TRUE, '
define simple_calc
    lbrace
        " func " key " simple_calc " str comma
        " label " key " Fracci??n simple " str comma
        " desc " key str comma // str will consume the description string from the stack
        " params " key
            lbrack
                lbrace
                    " label " key " Fracci??n " str comma
                    " type " key " time " str comma
                    " rules " key lbrace " required " key " true " value rbrace comma
                    " value " key .
                rbrace comma
                lbrace
                    " label " key " Costo " str comma
                    " type " key " text " str comma
                    " rules " key lbrace " required " key " true " value comma " money " key " true " value rbrace comma
                    " value " key .
                rbrace comma
                lbrace
                    " label " key " L??mite " str comma
                    " type " key " text " str comma
                    " attributes " key lbrace
                        " maxlength " key " 4 " value comma
                        " class " key " rate-edit-sc-limit " value
                    rbrace comma
                    " rules " key lbrace " required " key " true " value comma " amount " key " true " value rbrace comma
                    " value " key .
                rbrace
            rbrack
    rbrace comma lf
;
', '', 0, NULL, NULL);
	INSERT INTO rate VALUES (DEFAULT, '_json_proto', 'system', TRUE, '
// Invocar todas las funciones de alto nivel para obtener el JSON de cada una, para altas.
define desc " " ;
0 0 0 desc simple_calc
', '', 0, NULL, NULL);

COMMIT TRANSACTION;
