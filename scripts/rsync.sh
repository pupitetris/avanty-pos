#!/bin/bash

(
	cd site/htdocs/avanty
	cp devices-rel.json devices.json
	cp app.html /tmp
	mv devices-*.json /tmp
	git checkout -- app.html
)

rsync -r --progress -e ssh * avanty-pos:/avanty

(
	cd site/htdocs/avanty
	cp /tmp/app.html /tmp/devices-*.json .
	cp devices-test.json devices.json
)

