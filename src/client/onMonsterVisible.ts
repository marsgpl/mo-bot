import type { Client } from '../client.js'
import type { KeyValue } from '../guards.js'
import { getNumber } from '../getters.js'
import { posToStr, type Position } from '../mo.js'
import { logic, LogicEvent } from '../logic.js'

// 4:::{"action":"monster_visible","target_id":11710,"i":61,"j":42,"health":98}
export function onMonsterVisible(this: Client, payload: KeyValue) {
    const i = getNumber(payload, 'i')
    const j = getNumber(payload, 'j')

    const pos: Position = { i, j }

    this.missingMobs.delete(posToStr(pos))

    logic(this, LogicEvent.SPAWNED)
}
