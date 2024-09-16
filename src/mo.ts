import { createHash } from 'node:crypto'

export const CHEST_BASE_INDEX = 17
export const TOTAL_INVENTORY_SLOTS = 5 * 8 // 5 rows, 8 cells

export type Position = {
    i: number
    j: number
}

// { "id": "111", "selected": true },
// { "id": 222, "selected": false },
export type MoInvSlot = {
    id: number | string
    selected?: boolean
}

// {"id":"11","count":11},
export type MoChestSlot = {
    id: number | string
    count?: number
}

// { "id": 22, "count": 111, "ready": false, "i": 0 }
// { "id": 11, "count": 222, "ready": true, "i": 1 }
export type MoMagicSlot = {
    id: number | string
    count: number
    ready?: boolean
    i: number // index
}

export function randomSalt(a: number) {
	var b, d;
	b = "";
	for (d = 1; 1 <= a ? d <= a : d >= a; 1 <= a ? ++d : --d) b += "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!#$%&/()=?,.-_*-+" [79 * Math.random() << 0];
	return b
}

export function getPassHash(username: string, salt: string, password: string) {
    return createHash('sha256')
        .update(username + salt + password)
        .digest('hex')
}

export function getPass(passHash: string, sessionSalt: string) {
    return createHash('sha256')
        .update(passHash + sessionSalt)
        .digest('hex')
}

export function randomFp() {
    return createHash('sha256')
        .update(randomSalt(50))
        .digest('hex')
        .substring(0, 32)
}

export const enum MoWsId {
    DEAD = '0',
    HI = '1',
    PING = '2',
    UNKNOWN = '3',
    SERVER = '4',
    CLIENT = '5',
}

export function isMoWsId(id: string): id is MoWsId {
    switch (id) {
        case MoWsId.DEAD:
        case MoWsId.HI:
        case MoWsId.PING:
        case MoWsId.UNKNOWN:
        case MoWsId.SERVER:
        case MoWsId.CLIENT:
            return true
        default:
            return false
    }
}

export const enum MoCombatStyle {
    CONTROLLED = "0",
    AGGRESSIVE = "1",
    DEFENSIVE = "2",
    ACCURATE = "3",
    CORDIAL = "4",
}

export function getMoCombatStyleName(id: string): string {
    switch (id) {
        case MoCombatStyle.CONTROLLED: return 'Controlled'
        case MoCombatStyle.AGGRESSIVE: return 'Aggressive'
        case MoCombatStyle.DEFENSIVE: return 'Defensive'
        case MoCombatStyle.ACCURATE: return 'Accurate'
        case MoCombatStyle.CORDIAL: return 'Cordial'
        default: return 'Unknown'
    }
}

export function posToStr(pos: Position): string {
    return `${pos.i}:${pos.j}`
}

export function strToPos(strPos: string): Position {
    const [i, j] = strPos.split(':')
    return { i: Number(i), j: Number(j) }
}

export const enum MoBaseType {
    OBJECT = '1',
    GROUND = '2',
    ITEM = '3',
    NPC = '4',
    PLAYER = '5',
    PET = '6',
}

export function isTypeWalkable(baseType: MoBaseType) {
    switch (baseType) {
        case MoBaseType.GROUND:
        case MoBaseType.PLAYER:
        case MoBaseType.PET:
            return true
        default:
            return false
    }
}
