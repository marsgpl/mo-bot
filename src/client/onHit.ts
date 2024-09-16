import type { Client } from '../client.js'
import type { KeyValue } from '../guards.js'
import { getKeyValue, getNumber } from '../getters.js'

// 4:::{"action":"hit","target":{"id":"xxx","i":77,"j":38,"b_i":-1,"b_t":"5","map":15,"name":"margus","params":{"health":11,"combat_level":11},"temp":{"health":11},"anim":44},"hit":4}
// 4:::{"action":"hit","target":{"id":12991,"i":78,"j":38,"b_i":160,"b_t":"4","map":15,"c":"Skeletal Dragon","params":{"health":152},"temp":{"health":91},"anim":36},"hit":61}
export function onHit(this: Client, payload: KeyValue) {
    const target = getKeyValue(payload, 'target')
    const hit = getNumber(payload, 'hit')

    if (!hit) { return }

    if (target.id === this.playerId) {
        console.log('💥', 'you received damage:', hit)

        const temp = getKeyValue(target, 'temp')
        const params = getKeyValue(target, 'params')

        this.curHealth = getNumber(temp, 'health')
        this.maxHealth = getNumber(params, 'health')
    }
}
