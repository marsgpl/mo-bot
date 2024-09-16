import type { Client } from '../client.js'
import type { KeyValue } from '../guards.js'
import { posToStr, type Position } from '../mo.js'
import {
    getKeyValue,
    getNumber,
    getString,
    getStringOrNumber,
} from '../getters.js'
import { logic, LogicEvent } from '../logic.js'

// 4:::{"action":"attack","defender":"xxx","attacker":12991,"data":{"id":12991,"b_i":160,"b_t":"4","i":78,"j":38,"map":15,"name":"Skeletal Dragon","params":{"health":152},"temp":{"health":152,"total_defense":160,"total_strength":80,"total_accuracy":160}},"fight":14}
// 4:::{"action":"attack","defender":11711,"attacker":"xxx","data":{"id":11711,"b_i":23,"b_t":"4","i":59,"j":45,"map":15,"name":"Ghost Dragon","params":{"health":98},"temp":{"health":98,"total_defense":100,"total_strength":100,"total_accuracy":170}},"fight":13}
export function onAttack(this: Client, payload: KeyValue) {
    const defender = getStringOrNumber(payload, 'defender')
    const attacker = getStringOrNumber(payload, 'attacker')
    const data = getKeyValue(payload, 'data')
    const enemyTargetId = getStringOrNumber(data, 'id')
    const name = getString(data, 'name')
    const pos: Position = {
        i: getNumber(data, 'i'),
        j: getNumber(data, 'j'),
    }

    if (defender === this.playerId) {
        console.log('🛡️', 'defending from', name, 'at', posToStr(pos))
        this.enemyTargetId = enemyTargetId
        logic(this, LogicEvent.DEFENDING)
    } else if (attacker === this.playerId) {
        console.log('⚔️', 'attacking', name, 'at', posToStr(pos))
        this.enemyTargetId = enemyTargetId
        logic(this, LogicEvent.ATTACKING)
    } else {
        // somebody else is fighting
    }
}
