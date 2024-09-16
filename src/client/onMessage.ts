import type { Client } from '../client.js'
import type { KeyValue } from '../guards.js'
import { isKeyValue, isString } from '../guards.js'
import { getKeyValue, getString } from '../getters.js'
import { SEP } from '../headers.js'

// 4:::{"action":"message","data":{"key":"Current experience rate is 2x","color":"#3BEEEE","variables":{"ns":"interface"}}}
// 4:::{"action":"message","data":{"key":"No active experience event","variables":{"ns":"interface"},"color":"#3BEEEE"}}
// 4:::{"action":"message","data":{"type":"chat","message":{"text":"[SELL] 7 {item:355} for 1.65M ea","user":"morning star","color":"#F2A2F2","type":"chat","lang":"$$","id":"$$_35330676"}}}
export function onMessage(this: Client, payload: KeyValue) {
    const data = getKeyValue(payload, 'data')

    if (data.key) { // system message
        console.log('🤖', getSysMsg(data.key, data.variables))
    } else if (data.type === 'chat') {
        const message = getKeyValue(data, 'message')
        const user = getString(message, 'user')
        const text = getString(message, 'text')
        const lang = getString(message, 'lang')

        if (lang === 'EN') {
            console.log(`[${lang}]`, user + ':', text)
        } else {
            // filter out other langs
        }
    } else {
        console.log(SEP)
        console.log('unsupported message:', JSON.stringify(payload))
        console.log(SEP)
    }
}

function getSysMsg(key: unknown, vars: unknown): string {
    if (!isString(key)) return ''
    if (!isKeyValue(vars)) return key

    Object.entries(vars).forEach(([k, v]) => {
        key = (key as string).replace(`\{${k}\}`,
            isKeyValue(v) ? JSON.stringify(v) : String(v))
    })

    return key
}

// 4:::{"action":"message","data":{"key":"You have {count} unaccepted item in market.","color":"#3BEEEE","variables":{"ns":"interface","count":123}}}

// 4:::{"action":"message","data":{"key":"+10 $ti(\"magic damage\") ($tn(\"Water Blast\"))","color":"#51EA30","type":"magic","variables":{"uniq":true}}}

// Maintenance restart in {time} {"ns":"interface","time":{"format":"{count} minute","count":5}}

// Restarting... {"ns":"interface"}

// $ti('Player') {player} $ti('started') '$ti('Normal')' ($ti('Combat level') {min}-{max}, $ti('recommended') 138+) $ti('party quest in the world') {world} {"uniq":true,"player":"derbeggar","difficulty":"Normal","min":72,"max":192,"world":"6"}

// $ti('Battle royale starts in {time} on world {world}, to join type /join', {"world": 6, "time": { "format": "{count} second", "count": 30}}) $ti('Items are safe if you die.') {"uniq":true}

// Battle royale has started on world {world}! {"ns":"interface","world":"6"}

// $ti("Battle royale on world {world} is over!", {"world": "6"}) $ti("Winners:") quirco {"uniq":true}

// {player} has just completed the tutorial! {"ns":"interface","player":"romaxa777"}
