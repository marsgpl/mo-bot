import { Client } from './client.js'
import { packPath } from './packPath.js'
import { findPath } from './findPath.js'
import {
    type Position,
    posToStr,
    strToPos,
    TOTAL_INVENTORY_SLOTS,
} from './mo.js'
import { wait } from './wait.js'

const MIN_FREE_INVENTORY_SLOTS = 2
const MIN_FOOD_IN_INVENTORY = 1
const WITHDRAW_FOOD_PCS = 14

export const enum LogicEvent {
    READY = 'READY', // initial data loaded (my data + map), start logic
    CONFIRM = 'CONFIRM', // on "e" (action confirm)
    CAPTCHA_DONE = 'CAPTCHA_DONE', // captcha answered successfully
    ATTACKING = 'ATTACKING', // we attacked somebody
    DEFENDING = 'DEFENDING', // somebody attacked us
    SPAWNED = 'SPAWNED', // on mob spawn, on mob visible, can be ineligible
    WON = 'WON', // on death if target.id === client.enemyTargetId
    HP_GAIN = 'HP_GAIN', // on curHealth inc (my data, skills, player data)
    HP_LOSS = 'HP_LOSS', // on curHealth dec (my data, skills, player data)
    MY_DATA = 'MY_DATA', // server sends my_data if action failed
    CHEST_OPENED = 'CHEST_OPENED', // now we can withdraw and deposit
    INVENTORY_CHANGED = 'INVENTORY_CHANGED',
    PENALTY_START = 'PENALTY_START',
    PENALTY_END = 'PENALTY_END',
}

const enum LogicGoal {
    WAIT_FOR_READY,
    GO_TO_CHEST,
    WAIT_FOR_SPAWN,
    GO_TO_ENEMY,
    WAIT_FOR_BATTLE,
    WAIT_FOR_WIN,
    WAIT_FOR_HEAL,
    WAIT_FOR_CHEST_OPEN,
    WAIT_FOR_CHEST_DEPOSIT,
    WAIT_FOR_CHEST_WITHDRAW,
}

let goal: LogicGoal = LogicGoal.WAIT_FOR_READY
let queue: LogicEvent[] = []
let path: Position[] = []
let lastPathTile: Position | undefined = undefined
let targetMobPos: Position | undefined = undefined
let pathWaitForConfirm = false
let wfbTmt: NodeJS.Timeout | undefined = undefined
let wfChestWithdrawTmt: NodeJS.Timeout | undefined = undefined
let wfChestOpenTmt: NodeJS.Timeout | undefined = undefined
let lastEatTime: number | undefined = undefined
let underCaptchaAboutToStart: boolean = false

export function logic(client: Client, event: LogicEvent) {
    if (client.isDisconnected) {
        console.log('logic called but ws is disconnected')
        clearAllTmts()
        return
    }

    if (client.busyWithCaptcha || underCaptchaAboutToStart) {
        console.log('logic called but captcha is active. queuing')
        clearAllTmts()
        return queue.push(event)
    }

    // console.log('🟣', 'logic event:', event)

    switch (event) {
        case LogicEvent.ATTACKING: return onBattleStart(client)
        case LogicEvent.DEFENDING: return onBattleStart(client)
        case LogicEvent.CAPTCHA_DONE: return onCaptchaDone(client)
        case LogicEvent.PENALTY_START: return onCaptchaAboutToStart()
        case LogicEvent.PENALTY_END: return onCaptchaDone(client)
    }

    switch (goal) {
        case LogicGoal.WAIT_FOR_READY: return waitForReady(client, event)
        case LogicGoal.GO_TO_CHEST: return goToChest(client, event)
        case LogicGoal.WAIT_FOR_SPAWN: return waitForSpawn(client, event)
        case LogicGoal.GO_TO_ENEMY: return goToEnemy(client, event)
        case LogicGoal.WAIT_FOR_BATTLE: return waitForBattle(client, event)
        case LogicGoal.WAIT_FOR_WIN: return waitForWin(client, event)
        case LogicGoal.WAIT_FOR_HEAL: return waitForHeal(client, event)
        case LogicGoal.WAIT_FOR_CHEST_OPEN:
            return waitForChestOpen(client, event)
        case LogicGoal.WAIT_FOR_CHEST_DEPOSIT:
            return waitForChestDeposit(client, event)
        case LogicGoal.WAIT_FOR_CHEST_WITHDRAW:
            return waitForChestWithdraw(client, event)
        default:
            throw Error('unknown goal', { cause: { goal, event } })
    }
}

function onCaptchaAboutToStart() {
    underCaptchaAboutToStart = true
}

function clearAllTmts() {
    if (wfbTmt) {
        clearTimeout(wfbTmt)
        wfbTmt = undefined
    }

    if (wfChestWithdrawTmt) {
        clearTimeout(wfChestWithdrawTmt)
        wfChestWithdrawTmt = undefined
    }

    if (wfChestOpenTmt) {
        clearTimeout(wfChestOpenTmt)
        wfChestOpenTmt = undefined
    }
}

function onCaptchaDone(client: Client) {
    underCaptchaAboutToStart = false

    while (queue.length) {
        const event = queue.shift()!
        console.log('processing queue event:', event)
        logic(client, event)
    }

    logic(client, LogicEvent.CONFIRM)
}

function waitForChestWithdraw(client: Client, event: LogicEvent) {
    switch (event) {
        case LogicEvent.INVENTORY_CHANGED: return onChestWithdrawDone(client)
    }
}

function waitForChestDeposit(client: Client, event: LogicEvent) {
    switch (event) {
        case LogicEvent.INVENTORY_CHANGED: return onChestDepositDone(client)
    }
}

function waitForChestOpen(client: Client, event: LogicEvent) {
    switch (event) {
        case LogicEvent.CHEST_OPENED: return onChestOpened(client)
    }
}

function onChestWithdrawDone(client: Client) {
    clearAllTmts()

    const freeSlots = TOTAL_INVENTORY_SLOTS - client.inventory!.length
    const notEnoughFreeSlots = freeSlots < MIN_FREE_INVENTORY_SLOTS

    const pieces = client.inventory!.reduce((count, { id }) => {
        const isGood = Number(id) === client.config.foodId
        return count + (isGood ? 1 : 0)
    }, 0)
    const notEnoughFood = pieces < MIN_FOOD_IN_INVENTORY

    console.log('chest withdraw done:',
        'free slots:', freeSlots,
        'food pieces:', pieces)

    if (notEnoughFreeSlots || notEnoughFood) {
        throw Error('withdrawal failed', { cause: {
            freeSlots,
            notEnoughFreeSlots,
            pieces,
            notEnoughFood,
            MIN_FREE_INVENTORY_SLOTS,
            MIN_FOOD_IN_INVENTORY,
        } })
    }

    return wantToCheckMissingHp(client)
}

// 5:::{"name":"chest_withdraw","args":[{"item_id":115,"item_slot":113,"target_id":11545,"target_i":49,"target_j":47,"amount":12,"sk":"xx"}]}
function onChestDepositDone(client: Client) {
    clearAllTmts()

    const { chest } = client.map!
    const { foodId } = client.config

    console.log('withdrawing food pcs:', WITHDRAW_FOOD_PCS)

    let slotIndex: number | undefined = undefined

    const slot = client.chest!.find((slot, index) => {
        if (String(slot.id) === String(foodId)) {
            slotIndex = index
            return true
        } else {
            return false
        }
    })

    console.log('food slot index:', slotIndex, 'count:', slot?.count)

    if (!slot || slotIndex === undefined) {
        throw Error('food id not found in chest', { cause: { foodId } })
    }

    if ((slot.count || 0) < WITHDRAW_FOOD_PCS) {
        throw Error('not enough food id in chest', { cause: { foodId, slot, WITHDRAW_FOOD_PCS } })
    }

    client.send('chest_withdraw', {
        item_id: foodId,
        item_slot: slotIndex,
        target_id: 11545,
        target_i: chest.i,
        target_j: chest.j,
        amount: WITHDRAW_FOOD_PCS,
    })

    goal = LogicGoal.WAIT_FOR_CHEST_WITHDRAW

    clearAllTmts()

    wfChestWithdrawTmt = setTimeout(() => {
        console.log('chest withdrawal is too slow, rechesting')
        wantChest(client)
    }, 2000)
}

// 5:::{"name":"chest_deposit_all","args":[{"target_id":11545,"target_i":49,"target_j":47,"avoid_list":{},"sk":"xx"}]}
function onChestOpened(client: Client) {
    const { chest } = client.map!

    const depositable = client.inventory!.filter(slot => {
        return !slot.selected
    })

    console.log('depositable loot:', depositable.length)

    if (!depositable.length) {
        console.log('nothing to deposit. skipping')
        return onChestDepositDone(client)
    }

    client.send('chest_deposit_all', {
        target_id: 11545,
        target_i: chest.i,
        target_j: chest.j,
        avoid_list: {},
    })

    goal = LogicGoal.WAIT_FOR_CHEST_DEPOSIT
}

function waitForBattle(client: Client, event: LogicEvent) {
    if (!lastPathTile) {
        throw Error('waitForBattleTile is missing', { cause: { event, goal } })
    }

    if (event === LogicEvent.MY_DATA) {
        if (posToStr(client.pos!) !== posToStr(lastPathTile!)) {
            console.log('dest tile mismatch with actual tile')
            return wantToCheckMissingHp(client)
        }
    }
}

function onBattleStart(client: Client) {
    clearAllTmts()

    console.log('fighting with:', client.enemyTargetId)
    goal = LogicGoal.WAIT_FOR_WIN
}

function waitForHeal(client: Client, event: LogicEvent) {
    switch (event) {
        case LogicEvent.HP_GAIN: return wantToCheckMissingHp(client)
    }
}

function waitForReady(client: Client, event: LogicEvent) {
    switch (event) {
        case LogicEvent.READY: return wantToCheckMissingHp(client)
    }
}

function waitForSpawn(client: Client, event: LogicEvent) {
    switch (event) {
        case LogicEvent.SPAWNED: return wantToCheckMissingHp(client)
    }
}


function waitForWin(client: Client, event: LogicEvent) {
    switch (event) {
        case LogicEvent.WON: return wantToCheckMissingHp(client)
    }
}

function wantToEat(client: Client) {
    const { foodId } = client.config

    const pieces = client.inventory!.reduce((count, { id }) => {
        const isGood = Number(id) === foodId
        return count + (isGood ? 1 : 0)
    }, 0)
    const needChest = pieces < MIN_FOOD_IN_INVENTORY

    console.log('food in bag:', pieces, 'pieces')

    if (needChest) {
        console.log('no food to eat, want chest')
        return wantChest(client)
    } else {
        if (lastEatTime && Date.now() - lastEatTime < 15000) {
            console.log('eating threshold reached')
            wantToCheckMissingHp(client)
            return
        }
        lastEatTime = Date.now()
        console.log('eating ...')
        client.send('equip', { data: { id: foodId } })
        goal = LogicGoal.WAIT_FOR_HEAL
    }
}

function goToChest(client: Client, event: LogicEvent) {
    if (!pathWaitForConfirm) return

    switch (event) {
        case LogicEvent.CONFIRM: return followChestPath(client)
        case LogicEvent.MY_DATA: return onMoveToChestFail(client)
    }
}

function goToEnemy(client: Client, event: LogicEvent) {
    if (!pathWaitForConfirm) return

    switch (event) {
        case LogicEvent.CONFIRM: return followMobPath(client)
        case LogicEvent.MY_DATA: return onMoveToEnemyFail(client)
    }
}

function onMoveToEnemyFail(client: Client) {
    console.log('move to enemy failed. resetting')
    return wantToCheckMissingHp(client)
}

function onMoveToChestFail(client: Client) {
    console.log('move to chest failed. resetting')
    return wantToCheckMissingHp(client)
}

function wantToCheckMissingHp(client: Client) {
    const missingHp = client.maxHealth! - client.curHealth!
    const needToEat = missingHp >= client.config.hpPerFood

    console.log('missing hp:', missingHp)

    if (lastEatTime && Date.now() - lastEatTime < 15000) {
        console.log('eating threshold reached')
        return wantBagFreeSpace(client)
    }

    if (needToEat) {
        // console.log('need to eat')
        return wantToEat(client)
    } else {
        // console.log('enough hp')
        return wantBagFreeSpace(client)
    }
}

function wantBagFreeSpace(client: Client) {
    const freeSlots = TOTAL_INVENTORY_SLOTS - client.inventory!.length
    const needChest = freeSlots < MIN_FREE_INVENTORY_SLOTS

    console.log('free bag space:', freeSlots)

    if (needChest) {
        // console.log('need more space for loot')
        return wantChest(client)
    } else {
        // console.log('enough space')
        return wantToHaveFoodInBag(client)
    }
}

function wantToHaveFoodInBag(client: Client) {
    const pieces = client.inventory!.reduce((count, { id }) => {
        const isGood = Number(id) === client.config.foodId
        return count + (isGood ? 1 : 0)
    }, 0)
    const needChest = pieces < MIN_FOOD_IN_INVENTORY

    console.log('food pieces in bag:', pieces)

    if (needChest) {
        // console.log('need more food')
        return wantChest(client)
    } else {
        // console.log('enough food')
        return wantToFight(client)
    }
}

function wantToFight(client: Client) {
    if (client.enemyTargetId) {
        return onBattleStart(client)
    } else {
        // console.log('want to fight')
        return wantToFindEnemy(client)
    }
}

function wantChest(client: Client) {
    const { matrix, chest } = client.map!
    const playerPos = client.pos!
    console.log('chest is located at:', posToStr(chest))

    const ts = Date.now()
    const chestPath = findPath(matrix, { from: playerPos, to: chest })
    const ms = Date.now() - ts

    if (!chestPath) {
        throw Error('chest is unreachable', { cause: { chest, playerPos } })
    } else if (!chestPath.length) {
        console.log('chest is next to player')
        doChestStuff(client)
    } else {
        console.log('route found:', packPath(chestPath))
        path = chestPath
        pathWaitForConfirm = false
        goal = LogicGoal.GO_TO_CHEST
        followChestPath(client)
    }
}

function doChestStuff(client: Client) {
    console.log('accessing chest')
    client.send('access_chest', { target_id: 11545 })
    goal = LogicGoal.WAIT_FOR_CHEST_OPEN

    clearAllTmts()

    wfChestOpenTmt = setTimeout(() => {
        console.log('chest access is too slow, rechesting')
        wantChest(client)
    }, 2000)
}

function wantToFindEnemy(client: Client) {
    const { monsters: eligible, matrix } = client.map!

    const nonMissing = Array.from(eligible).reduce((mobs, strPos) => {
        if (!client.missingMobs.has(strPos)) {
            mobs.push(strToPos(strPos))
        }
        return mobs
    }, [] as Position[])

    console.log('looking for enemy:',
        'eligible:', eligible.size,
        'non-missing:', nonMissing.length)

    if (!nonMissing.length) {
        console.log('all killed? waiting for spawn')
        goal = LogicGoal.WAIT_FOR_SPAWN
        return
    }

    const sorted: { distance: number, pos: Position }[] = []
    const playerPos = client.pos!

    nonMissing.forEach(mobPos => {
        const { i: x1, j: y1 } = mobPos
        const { i: x2, j: y2 } = playerPos
        const a = x1 - x2
        const b = y1 - y2
        const distance = Math.sqrt(a * a + b * b)

        sorted.push({ distance, pos: mobPos })
    })

    sorted.sort(({ distance: A }, { distance: B }) => B - A)

    while (sorted.length) {
        const { distance, pos: closestPos } = sorted.pop()!

        console.log('closest:', posToStr(closestPos),
            'dist:', Math.round(distance),
            'player:', posToStr(playerPos))

        const ts = Date.now()
        const mobPath = findPath(matrix, { from: playerPos, to: closestPos })
        const ms = Date.now() - ts

        if (!mobPath) {
            console.log('unreachable, picking next')
            continue
        } else if (!mobPath.length) {
            console.log('mob is next to player, picking different')
            continue
        } else {
            console.log('route found:', packPath(mobPath))

            const mobTargetId = targetMobPos
                    && client.map!.mobTargetIdByPos.get(posToStr(targetMobPos))

            if (goal !== LogicGoal.GO_TO_ENEMY) {
                if (mobTargetId) {
                    console.log('setting target:', mobTargetId)
                    client.send('set_target', { target: mobTargetId })
                } else {
                    console.log('mob target id not found')
                }
            }

            path = mobPath
            pathWaitForConfirm = false
            targetMobPos = closestPos
            goal = LogicGoal.GO_TO_ENEMY
            followMobPath(client)
            return
        }
    }

    throw Error('none of the mobs are reachable',
        { cause: { playerPos, eligible, nonMissing } })
}

function followChestPath(client: Client) {
    const tile = path.pop()

    if (!tile) {
        return doChestStuff(client)
    }

    wait(40).then(() => {
        const { i, j } = tile
        client.send('move', { i, j, t: Date.now() })
        console.log('🟠', JSON.stringify({ i, j, t: Date.now() }))
        pathWaitForConfirm = true
        lastPathTile = tile
    })
}

// 5:::{"name":"set_target","args":[{"target":11708,"sk":"xx"}]}
function followMobPath(client: Client) {
    const mobTargetId = targetMobPos
        && client.map!.mobTargetIdByPos.get(posToStr(targetMobPos))

    const tile = path.pop()

    if (!tile) {
        if (mobTargetId) {
            console.log('path is over, attacking mob and waiting for battle:', mobTargetId)
            client.send('set_target', { target: mobTargetId })
        } else {
            console.log('path is over, mob id not found, waiting for battle')
        }

        goal = LogicGoal.WAIT_FOR_BATTLE

        clearAllTmts()

        wfbTmt = setTimeout(() => {
            console.log('wait for battle for too long, rebattling')
            wantToCheckMissingHp(client)
        }, 2000)

        return
    }

    wait(40).then(() => {
        const { i, j } = tile
        client.send('move', { i, j, t: Date.now() })
        console.log('🟠', JSON.stringify({ i, j, t: Date.now() }))
        pathWaitForConfirm = true
        lastPathTile = tile

        if (!path.length && mobTargetId) {
            client.send('set_target', { target: mobTargetId })
        }
    })
}
