import type { Client } from '../client.js'
import type { KeyValue } from '../guards.js'
import type { MoMagicSlot } from '../mo.js'
import { getKeyValue, getNumber } from '../getters.js'

// 4:::{"action":"magic_cooldown","slot":0,"magic":{"id":20,"count":3802,"ready":false,"i":0}}
export function onMagicCooldown(this: Client, payload: KeyValue) {
    if (!this.magicSlotsData) {
        setTimeout(() => onMagicCooldown.call(this, payload), 1000)
    } else {
        const slotIndex = getNumber(payload, 'slot')
        const slot = getKeyValue(payload, 'magic') as MoMagicSlot
        this.magicSlotsData[slotIndex] = slot
    }
}
