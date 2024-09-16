import type { Client } from '../client.js'
import { getNumber } from '../getters.js'
import type { KeyValue } from '../guards.js'
import { type Position, posToStr } from '../mo.js'

// 4:::{"action":"monster_invisible","target_id":11716,"i":66,"j":45,"duration":115111}
export function onMonsterInvisible(this: Client, payload: KeyValue) {
    const i = getNumber(payload, 'i')
    const j = getNumber(payload, 'j')

    const pos: Position = { i, j }

    this.missingMobs.add(posToStr(pos))
}
