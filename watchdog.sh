#!/bin/bash

if [[ $(ps ax | grep [b]uild/bot | wc -l) == 2 ]]; then
    echo "found"
else
    echo "not found. relaunch"
    nohup npm start > bot.log 2>&1 &
fi
