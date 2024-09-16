import type { Client } from '../client.js'
import type { KeyValue } from '../guards.js'
import { MoInvSlot } from '../mo.js'
import { getArray } from '../getters.js'
import { logic, LogicEvent } from '../logic.js'

// 4:::{"action":"inventory","data":[{"id":11,"selected":true},...]}
export function onInventory(this: Client, payload: KeyValue) {
    const initial = this.inventory === undefined
    this.inventory = getArray(payload, 'data') as MoInvSlot[]

    if (!initial) {
        logic(this, LogicEvent.INVENTORY_CHANGED)
    }
}
