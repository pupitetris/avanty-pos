#!/usr/bin/python3
# -*- coding: utf-8 -*-

# Install apt package python-bcrypt or pip install bcrypt
# cffi six pycparser
import bcrypt
import sys
import os

USAGE = """Uso: {} reto

Reto es el número de activación de 8 dígitos que provee el cliente."""

def calc (chal):
    crypt = bcrypt.hashpw (chal.encode ('utf-8'), b'$2a$08$PqR7X.YexgDCsypnT0dFM.')
    last8 = crypt[len(crypt) - 8:]

    solution = ''
    for c in last8:
        solution += str (c % 10)
    return solution

def interactive ():
    if os.name == 'nt':
        os.system ('chcp 65001 > nul')
    sys.stdout.write ('\r\n\r\nTeclea el reto: ')
    try:
        chal = input ()
        sys.stdout.write ('\r\n\r\nSolución: {}\r\n\r\nPresiona ENTER para salir.'.format (calc (chal)))
        input ()
    except:
        sys.exit (127)

def usage():
    if os.name == 'nt':
        os.system ('chcp 65001 > nul')
    sys.stderr.write (USAGE.format (sys.argv[0]))
    sys.exit (1)

def main ():
    if len (sys.argv) == 1:
        interactive ()
    elif len (sys.argv) > 2:
        usage ()
    else:
        sys.stdout.write (calc (sys.argv[1]))
    sys.exit (0)

if __name__ == "__main__":
    main ()
