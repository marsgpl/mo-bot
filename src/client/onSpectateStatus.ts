import type { Client } from '../client.js'
import type { KeyValue } from '../guards.js'
import { SEP } from '../headers.js'

// 4:::{"action":"spectate_status","name":"lava1","status":0}
export function onSpectateStatus(this: Client, payload: KeyValue) {
    console.log(SEP)
    console.log('spectate attempt:', JSON.stringify(payload))
    console.log(SEP)
}
