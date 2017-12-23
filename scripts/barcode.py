#!/usr/bin/python2

import bcrypt
import base64
import datetime

# Secs since epoch for 2017-01-01 00:00:00-00:00
AVANTY_EPOCH = 1483228800

# entry and exit in seconds since epoch.
def barcode_get_type_and_length (entry, _exit):
    if not _exit:
        return '0' # No exit yet; it's an entry ticket.

    exit_delta = _exit - entry
    if exit_delta < 0:
	raise ValueError ('ticket exitDate is smaller than entryDate.')
    
    if exit_delta < 1000:
	return '3' + '%03d' % exit_delta

    if exit_delta < 10000:
        return '4' + str (exit_delta)

    if exit_delta < 100000:
	return '5' + str (exit_delta)

    # Too many seconds, go for minutes:
    exit_delta = int (exit_delta / 60)
    if exit_delta < 100000:
	return '8' + '%05d' % exit_delta

    # Too many minutes, go for hours:
    exit_delta = int (exit_delta / 60)
    # This may fail, but it would be a >11 year stay:
    return '9' + '%05d' % exit_delta

# barcode: partial barcode without the checksum.
def barcode_collect_bytes (barcode, count):
    length = len (barcode)
    advance = int (length / 2) - 1
    pos = advance
    need = 1
    got = 0
    num = 0
    _bytes = b''
    while len (_bytes) < count:
        digit = int (barcode[pos])
        if num < 10 or num * 10 + digit < 256:
            num = num * 10 + digit
            pos = (pos + advance) % length
        
        got += 1
        if got > need:
            _bytes += chr (num)
            num = got = 0
            need = (need + 1) % 3 # 2^8-1 has 3 digits
    
    return _bytes

# barcode: partial barcode without the checksum.
def barcode_calc_checksum (secret, barcode):
    # First, collect bytes for the salt from barcode, trying to get a nice variety of values.
    # bcrypt requires 22 base64 characters for the salt. That's 16 bytes:
    _bytes = barcode_collect_bytes (barcode, 16)
    
    # Convert to Base64 and trim trailing padding chars (=). For 16 bytes, that's always two:
    # Also non-conformingly replace + with . or bcrypt will complain.
    _base64 = base64.b64encode (_bytes)[0:22].replace ('+', '.')

    # OK, we got our proper salt, configured for 2^8 bcrypt iterations:
    salt = '$2a$08$' + _base64

    # Now encrypt our secret with the salt.
    crypt = bcrypt.hashpw (secret.encode ('utf-8'), salt)
    
    # Get hash part and fix non-conforming use of . for +
    hash64 = crypt[29:].replace ('.', '+') + '='

    # Decode the base64 hash and get the 10th byte. That's our number.
    c = ord (base64.b64decode (hash64)[10])

    return '%03d' % c

EPOCH = datetime.datetime.utcfromtimestamp (0)

def barcode_generate (fields):
    # Field 1: terminal ID
    barcode = '%02d' % fields['terminalId']

    # Field 2: timestamp
    entry_time = (fields['entryDate'] - EPOCH).total_seconds ()

    barcode += '%09d' % (entry_time - AVANTY_EPOCH)

    # Fields 3 & 4: ticket type and stay length
    if fields.get ('exitDate'):
        exit_time = (fields['exitDate'] - EPOCH).total_seconds () 
    else: 
        exit_time = 0

    barcode += barcode_get_type_and_length (entry_time, exit_time)

    # Field 5: signature
    barcode += barcode_calc_checksum (fields['secret'], barcode)

    if len (barcode) % 2 > 0:
	barcode += '0'
		
    return barcode

if __name__ == "__main__":
    time = datetime.datetime.now ()
    fields = {"terminalId": 2, "entryDate": time, "secret": "vaquita"}
    print barcode_generate (fields)
