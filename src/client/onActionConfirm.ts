import type { Client } from '../client.js'
import type { KeyValue } from '../guards.js'
import { logic, LogicEvent } from '../logic.js'

// 4:::{"action":"e"}
export function onActionConfirm(this: Client, payload: KeyValue) {
    console.log('🟣', JSON.stringify(payload))
    logic(this, LogicEvent.CONFIRM)
}
