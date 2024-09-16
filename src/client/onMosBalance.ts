import type { Client } from '../client.js'
import type { KeyValue } from '../guards.js'
import { getNumber } from '../getters.js'

// 4:::{"action":"mos_balance","balance":1111111}
export function onMosBalance(this: Client, payload: KeyValue) {
    const mos = getNumber(payload, 'balance')

    if (this.mos === undefined) {
        console.log('mos balance:', mos)
    } else if (mos !== this.mos) {
        console.log('mos balance changed from:', this.mos, 'to:', mos)
    }

    this.mos = mos
}
