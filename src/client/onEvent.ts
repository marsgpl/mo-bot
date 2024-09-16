import type { Client } from '../client.js'
import type { KeyValue } from '../guards.js'
import { SEP } from '../headers.js'

// 4:::{"action":"event","data":"existing_player"}
export function onEvent(this: Client, payload: KeyValue) {
    switch (payload.data) {
        case 'existing_player': return
        default: onUnknownEvent(payload)
    }
}

function onUnknownEvent(payload: KeyValue) {
    console.log(SEP)
    console.log('unknown event:', JSON.stringify(payload))
    console.log(SEP)
}
