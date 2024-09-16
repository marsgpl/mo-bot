import type { Client } from '../client.js'
import type { KeyValue } from '../guards.js'
import { getKeyValue, getNumber, getString } from '../getters.js'
import { MoBaseType, type Position, posToStr } from '../mo.js'
import { logic, LogicEvent } from '../logic.js'

// 4:::{"action":"monster_spawn","target":{"id":11717,"b_i":23,"b_t":"4","i":64,"j":48,"map":15,"name":"Ghost Dragon","params":{"health":98},"temp":{"health":98,"total_defense":100,"total_strength":100,"total_accuracy":170}}}
export function onMonsterSpawn(this: Client, payload: KeyValue) {
    const target = getKeyValue(payload, 'target')
    const i = getNumber(target, 'i')
    const j = getNumber(target, 'j')
    const map = getNumber(target, 'map')
    const baseType = getString(target, 'b_t')

    if (map !== this.mapId) { return } // not on our map, ignore

    switch (baseType) {
        case MoBaseType.NPC: break // ok
        case MoBaseType.PLAYER: return // ok, ignore
        case MoBaseType.PET: return // ok, ignore
        case MoBaseType.GROUND:
            throw Error('ground spawned, very strange', { cause: payload })
        case MoBaseType.OBJECT:
            throw Error('object (obstacle) spawned, very strange', { cause: payload })
        case MoBaseType.ITEM:
            throw Error('item (obstacle) spawned, strange (should bot collect it? anyway it blocks the path). but action was monster_spawn anyway, why item should spawn here?', { cause: payload })
    }

    const pos: Position = { i, j }

    this.missingMobs.delete(posToStr(pos))

    logic(this, LogicEvent.SPAWNED)
}
