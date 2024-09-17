import { Agent } from 'node:https'
import WebSocket from 'ws'
import type { Config } from './config.js'
import type { KeyValue } from './guards.js'
import type { AntiCaptcha } from './captcha.js'
import {
    type Position,
    type MoInvSlot,
    type MoMagicSlot,
    type MoChestSlot,
    MoCombatStyle,
    MoWsId,
} from './mo.js'
import { SEP } from './headers.js'
import { sendChecksum } from './client/sendChecksum.js'
import { onChecksum } from './client/onChecksum.js'
import { onClue } from './client/onClue.js'
import { onLogin } from './client/onLogin.js'
import { onUpdate } from './client/onUpdate.js'
import { onEvent } from './client/onEvent.js'
import { onMessage } from './client/onMessage.js'
import { onMyData } from './client/onMyData.js'
import { onMosBalance } from './client/onMosBalance.js'
import { onMailbox } from './client/onMailbox.js'
import { onTime } from './client/onTime.js'
import { onSkills } from './client/onSkills.js'
import { onChestOpen } from './client/onChestOpen.js'
import { onActionConfirm } from './client/onActionConfirm.js'
import { onMagicReady } from './client/onMagicReady.js'
import { onInventory } from './client/onInventory.js'
import { onAttack } from './client/onAttack.js'
import { onMonsterVisible } from './client/onMonsterVisible.js'
import { onMonsterInvisible } from './client/onMonsterInvisible.js'
import { onMonsterSpawn } from './client/onMonsterSpawn.js'
import { onDeath } from './client/onDeath.js'
import { onMagicCooldown } from './client/onMagicCooldown.js'
import { onHit } from './client/onHit.js'
import { onSpectateStatus } from './client/onSpectateStatus.js'
import { onShutdown } from './client/onShutdown.js'
import { onDoubleExp } from './client/onDoubleExp.js'
import { onPlayerData } from './client/onPlayerData.js'
import { onTeleport } from './client/onTeleport.js'
import { onItemDrop } from './client/onItemDrop.js'
import { onCaptcha } from './client/onCaptcha.js'
import { onCaptchaResponse } from './client/onCaptchaResponse.js'
import { onCaptchaBonus } from './client/onCaptchaBonus.js'
import { EnglishTgBot } from './englishTgBot.js'

export interface ClientMap {
    matrix: number[][]
    monsters: Set<string>
    mobTargetIdByPos: Map<string, number>
    chest: Position
}

export interface LoaderProps {
    codeV: string
    releaseV: number
    gameV: number
    patchV: number
    salt: string
    cdnUrl: string
    mapHashes: string[]
    blockingTilesIds: Set<number>
}

export interface ClientProps {
    config: Config
    agent: Agent
    ws: WebSocket
    antiCaptcha: AntiCaptcha
    loaderProps: LoaderProps
}

export interface ClientSendProps {
    noSk?: boolean
}

export interface Client extends ClientProps {
    sk?: string // session key
    fp?: string // fingerprint
    salt?: string // runtime salt
    playerId?: string
    mapId?: number
    pos?: Position
    curHealth?: number
    maxHealth?: number
    penalty?: number // 5 = ban
    combatLevel?: number
    magicSlotsN?: number
    magicSlotsData?: MoMagicSlot[]
    curAcc?: number
    curStr?: number
    curDef?: number
    combatStyle?: MoCombatStyle
    coins?: number
    mos?: number
    petEnabled?: boolean
    inventory?: MoInvSlot[]
    chest?: MoChestSlot[]
    petInventory?: MoInvSlot[]
    isUnderPenalty?: boolean
    serverTimeDeltaMs?: number
    send: (
        this: Client,
        action: string,
        args: KeyValue,
        props?: ClientSendProps,
    ) => void
    isDisconnected: boolean
    skills: Record<string, {
        xp: number
        level: number
    }>
    missingMobs: Set<string>
    busyWithCaptcha: boolean
    canRefreshCaptcha: boolean
    map?: ClientMap
    enemyTargetId?: string | number
    englishTgBot: EnglishTgBot | null
}

export interface OnWsMsgProps {
    id: MoWsId
    payload: KeyValue
}

export function newClient(props: ClientProps): Client {
    const client: Client = {
        ...props,
        send: () => {},
        isDisconnected: false,
        skills: {},
        missingMobs: new Set(),
        busyWithCaptcha: false,
        canRefreshCaptcha: true,
        englishTgBot: null
    }

    client.send = send.bind(client)

    if (!client.config.foodId) throw Error('invalid config.foodId')
    if (!client.config.hpPerFood) throw Error('invalid config.hpPerFood')

    return client
}

export function onWsMsg(this: Client, { id, payload }: OnWsMsgProps) {
    switch (id) {
        case MoWsId.DEAD: return onDead.call(this)
        case MoWsId.HI: return onHi.call(this)
        case MoWsId.PING: return onPing.call(this)
        case MoWsId.SERVER: return onServer.call(this, payload)
        default: return onUnsupported.call(this, id, payload)
    }
}

// 0::
function onDead(this: Client) {
    console.log(SEP)
    console.log('ws: disconnect packet received')
    console.log(SEP)

    this.isDisconnected = true

    this.ws.send(`${MoWsId.DEAD}::`)

    setTimeout(() => {
        throw Error('exit')
    }, 500)
}

// 1::
function onHi(this: Client) {
    sendChecksum.call(this)
}

// 2::
function onPing(this: Client) {
    this.ws.send(`${MoWsId.PING}::`)
}

// 4:::{...}
function onServer(this: Client, payload: KeyValue) {
    // console.log('🟣', JSON.stringify(payload))

    switch (payload.action) {
        case 'captcha': return onCaptcha.call(this, payload)
        case 'captcha_response': return onCaptchaResponse.call(this, payload)
        case 'captcha_bonus': return onCaptchaBonus.call(this, payload)
        case 'e': return onActionConfirm.call(this, payload)
        case 'checksum': return onChecksum.call(this, payload)
        case 'clue': return onClue.call(this, payload)
        case 'login': return onLogin.call(this, payload)
        case 'update': return onUpdate.call(this, payload)
        case 'event': return onEvent.call(this, payload)
        case 'message': return onMessage.call(this, payload)
        case 'my_data': return onMyData.call(this, payload)
        case 'mos_balance': return onMosBalance.call(this, payload)
        case 'mailbox': return onMailbox.call(this, payload)
        case 'time': return onTime.call(this, payload)
        case 'skills': return onSkills.call(this, payload)
        case 'chest_open': return onChestOpen.call(this, payload)
        case 'magic_ready': return onMagicReady.call(this, payload)
        case 'magic_cooldown': return onMagicCooldown.call(this, payload)
        case 'inventory': return onInventory.call(this, payload)
        case 'attack': return onAttack.call(this, payload)
        case 'monster_visible': return onMonsterVisible.call(this, payload)
        case 'monster_invisible': return onMonsterInvisible.call(this, payload)
        case 'monster_spawn': return onMonsterSpawn.call(this, payload)
        case 'death': return onDeath.call(this, payload)
        case 'hit': return onHit.call(this, payload)
        case 'spectate_status': return onSpectateStatus.call(this, payload)
        case 'shutdown': return onShutdown.call(this, payload)
        case 'double_exp': return onDoubleExp.call(this, payload)
        case 'player_data': return onPlayerData.call(this, payload)
        case 'teleport': return onTeleport.call(this, payload)
        case 'item_drop': return onItemDrop.call(this, payload)
        case 'price_multiplier': return // {"action":"online_players","list":[...],"names":false}
        case 'online_players': return // {"action":"online_players","list":[{"world":"6","name":"margus","s":0},...],"names":false}
        case 'contacts': return // {"action":"contacts","contacts":[]}
        case 'monster_book': return // {"action":"monster_book","sub":"monster_book","results":[{"monster":23,"kills":11,"sacrifices":0},...]}
        case 'channel_subscriptions': return // {"action":"channel_subscriptions","channels":[],"tabs":[{"data":"▲"}]}
        case 'quests': return // {"action":"quests","quests":[{"quest_id":0,"progress":11,"reward_result":11},...]}
        case 'move': return // {"to":"XXXXXX","i":66,"j":46,"id":"XXXXXX","action":"move","map":11}
        case 'join': return // {"action":"join","channel":"players","name":"2680667839","world":"1","m":1,"s":0}
        case 'disconnect': return // {"action":"disconnect","channel":"players","id":"xxxxxx","name":"wlarc"}
        case 'achievements': return // {"action":"achievements","achievements":["CARPENTRY_90","DUNGEON",...]}
        case 'storage': return // {"action":"storage","result":{"vault":"eq_slot"}} // {"action":"storage","result":{"vault":"wishlist"}}
        case 'player_info_results': return // {"action":"player_info_results","results":{"id":11111,"player":"margus","created_at":"String(new Date())","first_name":"Margus","last_name":"Ooooo","country":"EE","email":"support@mo.ee","invalid":0,"newsletter":0,"day":1,"month":1,"year":1990,"lang":"ee"}}
        case 'magic_animation': return // {"action":"magic_animation","id":20,"i":18,"j":88,"map":14}
        case 'consecutive_logins_dialog': return // {"action":"consecutive_logins_dialog","data":{"day":11,"days":[{"day":30,"message":"","reward":{"sheet":"10","x":4,"y":31,"desc":"10,000 $ti('combat experience')"}},{"day":35,"message":"$tc('{count} day', {\"count\": \"3\"})$ti('{time} remaining', {\"time\": \"\"})","reward":{"item_id":764}},{"day":40,"message":"","reward":{"item_id":1326}}]}}
        case 'move': return // {"i":57,"j":21,"id":"xxx","action":"move","map":15} // {"to":"xxx","i":57,"j":21,"id":"xxx","action":"move","map":15}
        case 'use_skill': return // {"action":"use_skill","position":{"i":52,"j":41},"item_id":2807}
        case 'remove_line': return // {"action":"remove_line","line":"EN_15430865","lang":"EN","moderator":"rapota"}
        case 'arrow': return // {"action":"arrow","arrow":2337,"from":{"i":70,"j":20},"to":{"i":71,"j":21},"map":15,"duration":154}
        default: return onUnknownAction.call(this, payload)
    }
}

// 3::?  5::?
function onUnsupported(this: Client, id: MoWsId, payload: KeyValue) {
    console.log(SEP)
    console.log('ws: unsupported packet id:', id, JSON.stringify(payload))
    console.log(SEP)
}

function onUnknownAction(this: Client, payload: KeyValue) {
    console.log(SEP)
    console.log('ws: unknown action:', JSON.stringify(payload))
    console.log(SEP)
}

// 5:::{"name":action,"args":[{args,"sk":...}]}
function send(
    this: Client,
    action: string,
    args: KeyValue,
    props?: ClientSendProps,
) {
    if (this.isDisconnected) { return }

    const payload = {
        name: action,
        args: [args],
    }

    if (!props?.noSk && this.sk) {
        payload.args[0].sk = this.sk
    }

    this.ws.send(`${MoWsId.CLIENT}:::${JSON.stringify(payload)}`)

    // console.log('🟠', JSON.stringify(payload))
}
