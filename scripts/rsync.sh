#!/bin/bash

# Backup test configurations
(
	cd site/cgi
	cp CHARP-config-rel.pm CHARP-config.pm
	mv CHARP-config-*.pm /tmp
)

(
	cd site/htdocs/avanty
	cp devices-rel.json devices.json
	cp app.html /tmp
	mv devices-*.json /tmp
	git checkout -- app.html
)

rsync -r --progress -e ssh * avanty-pos:/avanty

# Restore test configurations
(
	cd site/cgi
	cp /tmp/CHARP-config-*.json .
	cp CHARP-config-test.pm CHARP-config.pm
)

(
	cd site/htdocs/avanty
	cp /tmp/app.html /tmp/devices-*.json .
	cp devices-test.json devices.json
)

