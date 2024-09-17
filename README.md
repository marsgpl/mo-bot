# MO Bot

## Start

```sh
nvm use
npm start
```

## Config

copy config.example.json to config.json

loaderUrl: url you use to start a game

wsHost: one of these (can be found in release.js)
```
1: rpg-us2.mo.ee
2: rpg-de.mo.ee
3: rpg-us3.mo.ee - PREMIUM
4: rpg-de4.mo.ee
5: rpg-de2.mo.ee
6: rpg-de3.mo.ee
```

username: your user name

password: your password

fingerprint: random hex string (32 symbols). optional

tz: your timezone name

tzOffsetHours: positive or negative number. 0 is Greenwich, 3 is Moscow

lang: 2-letter language code of your browser

antiCaptchaApiKey: anti-captcha.com api key

mapId: id of the map to hunt on

monstersIds: array of monster ids (found in release.js)
```javascript
npc_base[23] = createObject({
	b_i: 23,
	b_t: BASE_TYPE.NPC,
	name: "Ghost Dragon",
	...
},1)
```

foodId: id of the food to eat duting battle

hpPerFood: how much hp recovered per piece of food eaten

## Digitalocean

```
ssh root@xx.xx.xx.xx
    apt-get update
    apt-get upgrade -y
    apt-get install nodejs npm -y
    useradd -m -s /bin/bash bot
    su bot
    cd
    ssh-keygen -t rsa # then add ssh key to github
    git clone git@github.com:marsgpl/mo-bot.git
    cd mo-bot
    npm ci
    cp config.example.json config.json
    nohup npm start > bot.log 2>&1 &
    watch -n 1 -- tail -n 40 bot.log
    df -h
    crontab -e
    */5 * * * * /user/bot/mo-bot/watchdog.sh > /user/bot/mo-bot/watchdog.log 2>&1
```
