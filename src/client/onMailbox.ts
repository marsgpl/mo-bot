import type { Client } from '../client.js'
import type { KeyValue } from '../guards.js'
import { getArray } from '../getters.js'

// 4:::{"action":"mailbox","player_id":"...","sub":"mailboxes","results":[]}
export function onMailbox(this: Client, payload: KeyValue) {
    const items = getArray(payload, 'results')
    console.log('mailbox:', JSON.stringify(items))
}
