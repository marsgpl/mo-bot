import type { Client } from '../client.js'
import type { KeyValue } from '../guards.js'
import { posToStr, type Position } from '../mo.js'
import { SEP } from '../headers.js'
import { getKeyValue, getNumber } from '../getters.js'
import { logic, LogicEvent } from '../logic.js'

// 4:::{"action":"death","target":{"id":11712,"b_i":23,"b_t":"4","i":63,"j":44,"map":13,"params":{"health":98,"radius":9,"move_radius":10,"aggressive":true,"speed":100,"att_anim":44,"drops":[{"id":99,"chance":0.01},{"id":1015,"chance":0.01},{"id":131,"chance":0.0025},{"id":35,"chance":0.0035},{"id":1031,"chance":0.0015},{"id":1126,"chance":0.005},{"id":1351,"chance":0.0025},{"id":1304,"chance":0.005},{"id":177,"chance":0.005},{"id":1361,"chance":0.005,"we_only":true}],"combat_level":117},"name":"Ghost Dragon","img":{"sheet":"13","x":3,"y":6},"blocking":true,"type":3,"activities":["Attack","Inspect"],"init":{"i":63,"j":44,"mon_id":4950},"temp":{"health":0,"busy":true,"total_defense":100,"total_strength":100,"total_accuracy":170,"melee_block":50,"broadcast":true,"respawn_time":1726399735277,"last_attacked":1726410080254,"target_id":"xxx"}}}
export function onDeath(this: Client, payload: KeyValue) {
    const target = getKeyValue(payload, 'target')

    if (target.id === this.playerId) {
        throw Error(`player died`, { cause: payload })
    }

    if (typeof target.id === 'string') {
        const temp = getKeyValue(target, 'temp')

        console.log(SEP)
        console.log('other player was killed:', 'name:', target.name, 'id:', target.id, 'killed by id:', temp.target_id)
        console.log(SEP)
    } else {
        const i = getNumber(target, 'i')
        const j = getNumber(target, 'j')

        const pos: Position = { i, j }

        this.missingMobs.add(posToStr(pos))
    }

    if (this.enemyTargetId === target.id) {
        console.log('battle won')
        this.enemyTargetId = undefined
        logic(this, LogicEvent.WON)
    }
}
