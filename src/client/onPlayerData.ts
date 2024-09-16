import type { Client } from '../client.js'
import type { KeyValue } from '../guards.js'
import { getKeyValue, getNumber } from '../getters.js'
import { onHealthDelta } from '../onHealthDelta.js'

// 4:::{"action":"player_data","data":{"name":"margus","b_i":-1,"b_t":"5","params":{"speed":179,"hash":"37 0 66 45 84 2 0 52 133 23 6 6 0 1","combat_level":88,"health":78,"pvp":false,"d_head":37},"temp":{"health":78,"to":{"i":49,"j":29},"dest":{"i":49,"j":29},"cathedral_level":2017,"cathedral_time":0,"tower_nature_time":1736135229,"tower_ice_time":0,"tower_fire_time":0,"frames":0,"offset":467},"map":15,"pet":{"id":444,"enabled":true},"i":57,"j":21,"id":"x"}}
export function onPlayerData(this: Client, payload: KeyValue) {
    const data = getKeyValue(payload, 'data')
    const mapId = getNumber(data, 'map')
    const pet = getKeyValue(data, 'pet')
    const params = getKeyValue(data, 'params')
    const temp = getKeyValue(data, 'temp')
    const curHealth = getNumber(temp, 'health')
    const maxHealth = getNumber(params, 'health')
    const combatLevel = getNumber(params, 'combat_level')

    if (data.id !== this.playerId) return // ignore

    if (params.pvp) {
        throw Error('in pvp, not safe', { cause: payload })
    }

    if (mapId !== this.config.mapId) {
        throw Error(`player is on map #${mapId} but bot config expect map to be #${this.config.mapId}`, { cause: payload })
    }

    if (mapId !== this.mapId) {
        console.log('map changed from:', this.mapId, 'to:', mapId)
    }

    if (combatLevel !== this.combatLevel) {
        console.log('combat level changed from:', this.combatLevel, 'to:', combatLevel)
    }

    this.mapId = mapId
    this.petEnabled = Boolean(pet.enabled)
    this.combatLevel = combatLevel

    onHealthDelta(this, { curHealth, maxHealth })
}
