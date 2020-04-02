#!/bin/bash

PROC=`ps -ef | egrep '^.*?\bnode\b.*?\bingest.js\b.*?$'`

if test -z "$PROC"
then
    /var/local/node/bin/node /home/screwyscotty/mmm-ingest/ingest.js > /dev/null 2>&1
else
    echo "process is running"
fi
