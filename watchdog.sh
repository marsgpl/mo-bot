#!/bin/bash

if [[ $(ps ax | grep [b]uild/bot | wc -l) == 2 ]]; then
    echo "found"
else
    echo "not found. relaunch"
    cd /home/bot/mo-bot
    nohup npm start > bot.log 2>&1 &
fi
