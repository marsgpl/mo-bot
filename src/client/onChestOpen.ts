import type { Client } from '../client.js'
import type { KeyValue } from '../guards.js'
import { getArray, getBoolean } from '../getters.js'
import { logic, LogicEvent } from '../logic.js'
import { MoChestSlot } from '../mo.js'

// 4:::{"action":"chest_open","content":[{"id":"11","count":11},...,{"id":22,"count":0}],"open":false}
export function onChestOpen(this: Client, payload: KeyValue) {
    const content = getArray(payload, 'content')
    const open = getBoolean(payload, 'open')

    this.chest = content as MoChestSlot[]

    console.log('chest is', open ? 'opened' : 'closed')
    console.log('items in chest:', content.length)

    if (open) {
        logic(this, LogicEvent.CHEST_OPENED)
    }
}
