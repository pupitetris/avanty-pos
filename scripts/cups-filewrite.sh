#!/bin/bash
TARGETFILE=${DEVICE_URI#filewrite:}1
if [ $# -eq 0 ]; then
echo 'direct filewrite "Unknown" "Print any job to file specified in device-URI"'
exit 0
fi
cat $6 >> $TARGETFILE
