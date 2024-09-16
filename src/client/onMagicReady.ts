import type { Client } from '../client.js'
import type { KeyValue } from '../guards.js'
import { getNumber } from '../getters.js'

// 4:::{"action":"magic_ready","slot":3}
export function onMagicReady(this: Client, payload: KeyValue) {
    if (!this.magicSlotsData) {
        setTimeout(() => onMagicReady.call(this, payload), 1000)
    } else {
        const slotIndex = getNumber(payload, 'slot')
        this.magicSlotsData[slotIndex].ready = true
    }
}
