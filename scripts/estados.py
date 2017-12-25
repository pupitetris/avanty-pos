#!/usr/bin/python2
#AVANTY

# Default sensor sampling period
POLL_SLEEP_DEFAULT = 0.25 # seconds

# Close gate CAR_PASSED_TO seconds after car passed
CAR_PASSED_TIMEOUT = 20

# GPIO channels
###############
GPIO_LOOP   = "P9_17"
GPIO_BUTTON = "P9_31"
GPIO_CLOSE  = "P8_12"
GPIO_OPEN   = "P8_12"

# File IO
#########
AVANTY_PATH = "/avanty"

#Screens
SCREENS_PATH = AVANTY_PATH + "/screens"
SCREENS_FILE_FORMAT = ".png"

#Logs
LOG_PATH = AVANTY_PATH + "/log"
FOLIO_FILE = "folio.txt"

# Printer
#########
NO_PRINTER_STR = "Waiting for printer to become available."
MAX_PRINTER_QUEUE_POLLS = 15 # iterations
PRINTER_QUEUE_POLL_PERIOD = 1 # seconds

#Ticket manipulation
PRINT_PATH = AVANTY_PATH + "/print"

TICKET_SVG_FILE = "barcodeFolioTest.svg"
TICKET_PS_FILE = "printTicket.ps"

# Init routine
#############################
#############################

import os.path as path
from subprocess import call

def init ():
	initScreen ()

	ticketFile = PRINT_PATH + "/" + TICKET_SVG_FILE
	initTicket (ticketFile)
	
	folioFile = LOG_PATH + "/" + FOLIO_FILE
	initFolio (folioFile)

	ioSetup()
	stateEvents (currentState, True)
	switchState ("welcome")


# Screen
#############################
#############################

def initScreen ():
	screen = states["welcome"]["screen"]
	screenPath = (
		SCREENS_PATH + 
		"/" + 
		str(screen) + 
		SCREENS_FILE_FORMAT
	)

	# Kill rogue instances
	shellCall = "killall fbi"
	call (shellCall, shell=True)
	
	shellCall = "killall -9 fbi"
	call (shellCall, shell=True)

	# fbi exisiting screens...
	while path.isfile (screenPath):

		shellCall = (
			"fbi --noverbose --vt " + 
			str(screen) +
			" " +  
			SCREENS_PATH + 
			"/" + 
			str(screen) + 
			SCREENS_FILE_FORMAT
		)

		screen += 1		
		screenPath = (
			SCREENS_PATH + 
			"/" + 
			str(screen) + 
			SCREENS_FILE_FORMAT
		)	

		print shellCall
		call (shellCall, shell=True)
		time.sleep (0.5)

def switchScreen (screen_number):
	if screen_number == None:
		return
	print "Cambio de pantalla: {}", screen_number
	shellCall = "chvt " + str(screen_number) 
	call (shellCall, shell=True)

# GPIO layer
#############################
#############################

import Adafruit_BBIO.GPIO as GPIO
import time

eventType = {
	"press": GPIO.FALLING,
	"release": GPIO.RISING, 
}

ioWriteValue = {
	"on": GPIO.HIGH,
	"off": GPIO.LOW,
}

def ioSetup ():
	GPIO.setup (GPIO_LOOP, GPIO.IN)   # Car sensor
	GPIO.setup (GPIO_BUTTON, GPIO.IN) # User Push Button
	GPIO.setup (GPIO_OPEN, GPIO.OUT)  # Barrier open
	GPIO.setup (GPIO_CLOSE, GPIO.OUT) # Barrier close

def ioAddEvent (gpio, event):
	GPIO.add_event_detect (gpio, event)
	GPIO.event_detected (gpio)

def ioDetectEvent (gpio, event):
	if GPIO.event_detected (gpio):
		return True
	else:
		return False

def ioRemoveEvent (gpio):
	GPIO.remove_event_detect (gpio)

def ioRead (gpio):
	return not GPIO.input(gpio)

def ioWrite (gpio, value = ioWriteValue["on"], duration = None):
	if duration == None:
		GPIO.output (gpio, value)
	else:
		GPIO.output (gpio, ioWriteValue["on"])
		time.sleep (duration)
		GPIO.output (gpio, ioWriteValue["off"]) 

# Printer layer
#############################
#############################

printerErrors = {
	"noError": 0,
	"disconnect": 1,
	"paper": 2,
}
from subprocess import check_output

def printerError ():
	output = check_output ("lpstat -o", shell=True)
	printerQueuePolls = 0
	while output:
		if printerQueuePolls == MAX_PRINTER_QUEUE_POLLS:
			print "Limite de polls: ", printerQueuePolls
			output = check_output ("lpstat -p", shell=True)
			for lines in output.splitlines ():
				line = lines.lstrip('\t')
				if NO_PRINTER_STR in line:
					return	printerErrors["disconnect"]	 
			
			return printerErrors["paper"]
		
		printerQueuePolls += 1
		print "polls: ", printerQueuePolls
		time.sleep (PRINTER_QUEUE_POLL_PERIOD)
		output = check_output ("lpstat -o", shell=True)
	
	return printerErrors["noError"]
	""" Borrar job en caso de disconnnect"""

# Log manager
###########################
###########################
from os.path import isfile

def initFolio (folioFile):
	if not isfile (folioFile):
		print "Archivo: " + folioFile + " creado" 
		folioFile = open (folioFile, 'w')
		folioFile.write (str(1))
		folioFile.close ()
	else:
		folioFile = open (folioFile, 'r')
		folio = folioFile.read ()
		print "Folio acutal:", folio
		folioFile.close ()


def getFolio (folioFile):
	folioFile = open (folioFile, 'r+')
	currentFolio = folioFile.read ()
	currentFolio = int (currentFolio.strip())
	
	nextFolio = currentFolio + 1

	folioFile.seek (0)
	folioFile.write (str(nextFolio))
	folioFile.close ()
	return currentFolio

# Ticket formatting
############################
############################

from string import Template
from datetime import datetime
from code128 import Code128
import cairosvg
import bcrypt
import base64

EPOCH = datetime.utcfromtimestamp (0)
EPOCH_LOCAL = datetime.fromtimestamp (0)
# Secs since epoch for 2017-01-01 00:00:00-00:00, plus local timezone+DST offset:
AVANTY_EPOCH = 1483228800 - (EPOCH - EPOCH_LOCAL).total_seconds () 
svgString = ''

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

EPOCH = datetime.utcfromtimestamp (0)

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

def initTicket (fileIn):
	global svgString
	svgSourceFile = open (fileIn, 'rb')
	svgString = unicode (svgSourceFile.read (), 'utf-8')
#	svgString = svgSourceFile.read ()
	svgSourceFile.close ()


def formatTicket (string, dictionary):
	global svgString
	dateTime = datetime.now ()

	# Set tag names to avanty's ticket template convention: ${tag_TAG}
	dictionary["terminalId_TAG"] = dictionary.pop ("terminalId")

	# Barcode...
	barcodeFields = {
		"terminalId": dictionary["terminalId_TAG"],
		"entryDate": dateTime, 
		"secret": dictionary["secret"]
	}

	barcodeDecoded =  barcode_generate (barcodeFields)
	dictionary["plainCode_TAG"] = barcodeDecoded

	barcode = Code128 ()
	barcodeBits = barcode.makeCode (barcodeDecoded)
	dictionary["code128_TAG"] = unicode (barcode.renderSvg (barcodeBits), 'utf-8')
	#dictionary["code128_TAG"] = barcode.renderSvg (barcodeBits)

	# Folio
	folioFile = LOG_PATH + "/" + FOLIO_FILE
	dictionary["folio_TAG"] = getFolio (folioFile)

	# Time & date
	dictionary["date_TAG"] = (
		str (dateTime.day).zfill (2) +
		"-" +
		str (dateTime.month).zfill (2) +
		"-" +		
		str (dateTime.year)
		)
	dictionary["time_TAG"] = (
		str (dateTime.hour).zfill (2) +
		":" +
		str (dateTime.minute).zfill (2) +
		":" +		
		str (dateTime.second).zfill (2)
		)

	# Tag substitution
	template = Template (svgString)
	svgStringWorkCpy = template.substitute (dictionary)
	"""
	###
	XMLfile = open ("/home/debian/wrkspc/pySandbox/XMLdebug.svg", 'w')
	XMLfile.write (svgStringWorkCpy)
	XMLfile.close ()
	print "Checalooooo!"
	while True:
		time.sleep(1)
	###
	"""
	# Convert SVG to Postscript
	psBytes = cairosvg.svg2ps (bytestring=svgStringWorkCpy.encode('utf-8'))
	return psBytes

def printTicket (dictionary):
	templateFile = PRINT_PATH + "/" + TICKET_SVG_FILE
	printFile = PRINT_PATH + "/" + TICKET_PS_FILE
	
	printBytes = formatTicket (svgString, dictionary)

	psFile = open (printFile, 'w')
	psFile.write (printBytes)
	psFile.close ()

	printCall = "lp " + printFile
	call (printCall, shell=True)

# States
############################
############################
def welcomeEnter ():
	ioWrite (GPIO_CLOSE, None, 0.5)

def welcomePoll ():
	if printerError ():
		switchState ("noService")
	if ioRead (GPIO_LOOP):
		switchState ("pushButton")

############################
def pushButtonEnter ():
	pass

def pushButtonPoll ():
	if not ioRead (GPIO_LOOP):
		switchState ("welcome")
	elif ioDetectEvent (GPIO_BUTTON, eventType['press']):
		switchState ("takeTicket")

#############################
def takeTicketEnter ():
	ticketDictionary = {
	"terminalId": 2,
	"secret": "vaquita"
	}	

	printTicket (ticketDictionary)	

def takeTicketPoll ():
	if printerError ():
		switchState ("noService")
	else:
		switchState ("goAhead")

#############################
def goAheadEnter ():
	ioWrite (GPIO_OPEN, None, 0.5)

def goAheadPoll ():
#	if ioDetectEvent (GPIO_LOOP, eventType["release"]) or not ioRead (GPIO_LOOP):
	if not ioRead (GPIO_LOOP):
		switchState ("carPassed")

#############################
carPassediterations = 0
def carPassedPoll ():
#	if ioDetectEvent (GPIO_LOOP, eventType["press"]):
	global carPassediterations 
	maxIterations = int(round(CAR_PASSED_TIMEOUT/states["carPassed"]["pollSleep"]))
	carPassediterations += 1 

	if ioRead (GPIO_LOOP) or (carPassediterations == maxIterations):
		carPassediterations = 0
		switchState ("welcome")

#############################
def noServicePoll ():	
	if not printerError ():
		switchState ("welcome")

# Switcher
##############################
##############################
states = {
    "welcome": {
    	"name": "welcome",
    	"screen": 1,
    	"enter": welcomeEnter,
    	"poll": welcomePoll,
    	"nextStates": ["welcome", "pushButton"],
    	"events": {
    		"BUTTON": {},
    		"LOOP": {"gpio": GPIO_LOOP, "eventType": eventType["press"]},
    	},
    },
    "pushButton": {
    	"name": "pushButton",
    	"screen": 2,
    	"poll": pushButtonPoll,
    	"nextStates": ["welcome", "takeTicket"],
    	"events": {
    		"BUTTON": {"gpio":GPIO_BUTTON, "eventType": eventType["press"]}, 
    		"LOOP": {},
    	},
    },
    "takeTicket": {
    	"name": "takeTicket",
    	"screen": 3,
    	"enter": takeTicketEnter,
    	"poll": takeTicketPoll,
    	"nextStates": ["goAhead", "noService"],
    },
    "goAhead": {
    	"name": "goAhead",
    	"screen": 4,
    	"enter": goAheadEnter,
    	"poll": goAheadPoll,
    	"nextStates": ["carPassed"],
    	"events": {
    		"BUTTON": {},
    		"LOOP": {},
#    		"LOOP": {"gpio": GPIO_LOOP, "eventType": eventType["release"]},
    	},
    },
    "carPassed": {
    	"name": "carPassed",
    	"screen": 1,
    	"poll": carPassedPoll,
    	"pollSleep": 0.5,
    	"nextStates": ["welcome"],    
     	"events": {
    		"BUTTON": {},
    		"LOOP": {},
#    		"LOOP": {"gpio": GPIO_LOOP, "eventType": eventType["press"]},
    	},
    },
    "noService": {
    	"name": "noService",
    	"screen": 5,
    	"poll": noServicePoll,
    	"pollSleep": 1,
    	"nextStates": ["welcome"],
    },
}

def stateEvents(state, on):
	if "events" in state:
		for event in state["events"].values():
			if event:
				if on:
					print "Eventos activados para estado {}", state["name"]
					ioAddEvent(event["gpio"], event["eventType"]) 
				else:
					print "Eventos desactivados para estado {}", state["name"]
					ioRemoveEvent(event["gpio"])

def switchState (next_state_name):
	global currentState
	if not next_state_name in currentState["nextStates"]:
		raise SystemExit ("Invalid state transition from {} to {}", 
						currentState["name"], next_state_name)

	stateEvents (currentState, False) #removeEvents(currentState)
	currentState = states[next_state_name]
	print "Entered state: {}", next_state_name
	switchScreen (currentState.get ("screen"))
	stateEvents (currentState, True) #addEvents (currentState)
	enter_function = currentState.get ("enter")
	if enter_function:
		enter_function ()

# Main
##############################
##############################

currentState = states["welcome"]
init ()
while True:
	currentState["poll"]()

	poll_sleep = currentState.get("pollSleep")
	if not poll_sleep:
		poll_sleep = POLL_SLEEP_DEFAULT 
	time.sleep (poll_sleep)
