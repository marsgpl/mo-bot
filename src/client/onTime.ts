import type { Client } from '../client.js'
import type { KeyValue } from '../guards.js'
import { getNumber } from '../getters.js'

// 4:::{"action":"time","data":1726135275}
export function onTime(this: Client, payload: KeyValue) {
    const time = getNumber(payload, 'data')
    const delta = Date.now() - time * 1000
    console.log('server time delta:', delta, 'ms')
    this.serverTimeDeltaMs = delta
}
