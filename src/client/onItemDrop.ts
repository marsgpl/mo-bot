import type { Client } from '../client.js'
import type { KeyValue } from '../guards.js'
import { getKeyValue, getStringOrNumber } from '../getters.js'

// 4:::{"action":"item_drop","data":{"id":35}}
export function onItemDrop(this: Client, payload: KeyValue) {
    const data = getKeyValue(payload, 'data')
    const id = getStringOrNumber(data, 'id')
    console.log('📦 item dropped:', id)
}
