#!/bin/bash

set -x

statefile=$HOME/.bright
inc=$1

[ -e $statefile ] || echo 10 > $statefile

curr=$(cat $statefile)

if ((curr==20&&inc>0)); then let inc*=3; fi
if ((curr>20)); then let inc*=3; fi
let curr=curr+inc

if ((curr<=3)); then curr=3; fi
if ((curr>=50)); then curr=50; fi

echo $curr > $statefile

if ((curr<10)); then curr=0$curr; fi

xrandr --output eDP1 --brightness ${curr:0:1}.${curr:1:2}
