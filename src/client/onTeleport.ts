import type { Client } from '../client.js'
import type { KeyValue } from '../guards.js'
import { getString } from '../getters.js'

// {"i":68,"j":37,"action":"teleport","player_id":"xxxx","map":2}
// {"i":51,"j":44,"action":"teleport","player_id":"xxxx","map":15,"data":{"name":"margus","b_i":-1,"b_t":"5","params":{"speed":180,"hash":"31 0 kf¶268 67 55 1 0 130 521 268 144 5 0 1","combat_level":150,"health":118,"pvp":false,"d_head":31},"temp":{"health":106,"to":{"i":58,"j":73},"dest":{"i":58,"j":73},"cathedral_level":75,"cathedral_time":1726308910,"tower_nature_time":1708899492,"tower_ice_time":1717950409,"tower_fire_time":1691960277,"poseidon_until":1726139118,"frames":3,"offset":160},"map":15,"pet":{"id":335,"enabled":true},"i":51,"j":44,"id":"xxxx"}}
export function onTeleport(this: Client, payload: KeyValue) {
    const playerId = getString(payload, 'player_id')

    if (playerId === this.playerId) {
        throw Error('current player was teleported', { cause: payload })
    }
}
