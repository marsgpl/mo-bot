import type { Client } from '../client.js'
import type { KeyValue } from '../guards.js'

// 4:::{"action":"double_exp","xp":1800000}
export function onDoubleExp(this: Client, payload: KeyValue) {
    console.log('double exp used')
}
