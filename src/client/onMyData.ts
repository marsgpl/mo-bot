import type { Client } from '../client.js'
import type { KeyValue } from '../guards.js'
import {
    type MoInvSlot,
    type MoMagicSlot,
    type Position,
    MoCombatStyle,
    getMoCombatStyleName,
    posToStr,
} from '../mo.js'
import {
    getArray,
    getBoolean,
    getKeyValue,
    getNumber,
    getString,
} from '../getters.js'
import { logic, LogicEvent } from '../logic.js'
import { SEP } from '../headers.js'
import { loadMap } from '../loadMap.js'
import { onHealthDelta } from '../onHealthDelta.js'

// 4:::{"action":"my_data","data":{ big json }}
export function onMyData(this: Client, payload: KeyValue) {
    const data = getKeyValue(payload, 'data')
    const id = getString(data, 'id')
    const mapId = getNumber(data, 'map')
    const i = getNumber(data, 'i')
    const j = getNumber(data, 'j')
    const params = getKeyValue(data, 'params')
    const temp = getKeyValue(data, 'temp')
    const pet = getKeyValue(data, 'pet')
    const curHealth = getNumber(temp, 'health')
    const maxHealth = getNumber(params, 'health')
    const penalty = getNumber(params, 'penalty')
    const magicSlotsN = getNumber(params, 'magic_slots')
    const magicSlotsData = getArray(params, 'magics') as MoMagicSlot[]
    const combatLevel = getNumber(params, 'combat_level')
    const curDef = Math.floor(getNumber(temp, 'total_defense'))
    const curStr = Math.floor(getNumber(temp, 'total_strength'))
    const curAcc = Math.floor(getNumber(temp, 'total_accuracy'))
    const combatStyle = getString(temp, 'combat_style')
    const coins = getNumber(temp, 'coins')
    const allowSpectators = getBoolean(temp, 'allow_spectators')
    const blockMulticombat = getBoolean(temp, 'block_multicombat')
    const magicBlockPercent = getNumber(temp, 'magic_block')
    const meleeBlockPercent = getNumber(temp, 'melee_block')
    const petEnabled = getBoolean(pet, 'enabled')
    const isUnderReview = getBoolean(temp, 'review')
    const isUnderPenalty = getBoolean(temp, 'penalty')
    const inventory = getArray(temp, 'inventory') as MoInvSlot[]
    const petInventory = petEnabled ? getArray(pet, 'chest') as MoInvSlot[] : []

    const pos: Position = { i, j }

    if (isUnderReview) {
        throw Error('under review, not safe', { cause: payload })
    }

    if (params.pvp || temp.duel_with || (temp.duel_id && temp.duel_id !== -1)) {
        throw Error('in pvp, not safe', { cause: payload })
    }

    if (mapId !== this.config.mapId) {
        throw Error(`player is on map #${mapId} but bot config expect map to be #${this.config.mapId}`, { cause: payload })
    }

    if (penalty >= 3) {
        throw Error(`penalty is too high: ${penalty} (max is 5), avoiding risk`, { cause: params })
    }

    if (this.mapId === undefined) {
        console.log('map id:', mapId)

        loadMap(this, mapId).then(map => {
            this.map = map
            console.log('✅', 'ready to start logic')
            logic(this, LogicEvent.READY)
        })
    }

    if (this.playerId === undefined) {
        console.log('player id:', id)
        console.log('position:', posToStr(pos))
        console.log('health:', curHealth, 'of', maxHealth)
        console.log('penalty:', penalty, '(5 = ban)')
        console.log('combat lvl:', combatLevel)
        console.log('magic slots available:', magicSlotsN)
        console.log('magic slots data:', JSON.stringify(magicSlotsData))
        console.log(
            'accuracy:', curAcc,
            'strength:', curStr,
            'defense:', curDef)
        console.log('combat style:', getMoCombatStyleName(combatStyle))
        console.log('coins:', coins)
        console.log('block multicombat:', blockMulticombat ? 'yes' : 'no')
        console.log('magic block:', magicBlockPercent, '%')
        console.log('melee block:', meleeBlockPercent, '%')
        console.log('inventory items:', inventory.length)
        console.log('pet inventory items:', petInventory.length)

        if (temp.premium_until) {
            const h = Math.round((Number(temp.premium_until) * 1000 - Date.now()) / 1000 / 3600)
            console.log('premium ends in:', h, 'hours')
        }

        if (allowSpectators) {
            console.log(SEP)
            console.log('allow spectators is ON, not safe')
            console.log(SEP)
        }
    } else {
        if (mapId !== this.mapId) {
            console.log('map changed from:', this.mapId, 'to:', mapId)
        }

        if (penalty !== this.penalty) {
            console.log('penalty changed from:', this.penalty, 'to:', penalty)
        }

        if (combatLevel !== this.combatLevel) {
            console.log('combat level changed from:', this.combatLevel, 'to:', combatLevel)
        }

        if (magicSlotsN !== this.magicSlotsN) {
            console.log('magic slots count changed from:', this.magicSlotsN, 'to:', magicSlotsN)
        }

        if (curAcc !== this.curAcc) {
            console.log('accuracy changed from:', this.curAcc, 'to:', curAcc)
        }

        if (curStr !== this.curStr) {
            console.log('strength changed from:', this.curStr, 'to:', curStr)
        }

        if (curDef !== this.curDef) {
            console.log('defense changed from:', this.curDef, 'to:', curDef)
        }

        if (combatStyle !== this.combatStyle) {
            console.log('combat style changed from:',
                getMoCombatStyleName(this.combatStyle || '?'),
                'to:', getMoCombatStyleName(combatStyle))
        }

        if (coins !== this.coins) {
            console.log('coins changed from:', this.coins, 'to:', coins)
        }
    }

    this.playerId = id
    this.mapId = mapId
    this.pos = pos
    this.penalty = penalty
    this.combatLevel = combatLevel
    this.magicSlotsN = magicSlotsN
    this.magicSlotsData = magicSlotsData
    this.curAcc = curAcc
    this.curStr = curStr
    this.curDef = curDef
    this.combatStyle = combatStyle as MoCombatStyle
    this.coins = coins
    this.petEnabled = petEnabled
    this.inventory = inventory
    this.petInventory = petInventory

    if (isUnderPenalty) {
        logic(this, LogicEvent.PENALTY_START)
    } else {
        logic(this, LogicEvent.PENALTY_END)
    }

    onHealthDelta(this, { curHealth, maxHealth })

    logic(this, LogicEvent.MY_DATA)
}
