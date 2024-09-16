import type { Client, ClientMap } from './client.js'
import {
    type Position,
    MoBaseType,
    posToStr,
    CHEST_BASE_INDEX,
    strToPos,
    isTypeWalkable,
} from './mo.js'
import { get } from './get.js'
import { HEADERS_LOADER, SEP } from './headers.js'
import { matchNumber, matchString } from './getters.js'
import { IS_NOT_WALKABLE, IS_WALKABLE, isWalkable } from './findPath.js'

export async function loadMap(
    client: Client,
    mapId: number,
): Promise<ClientMap> {
    const { mapHashes, cdnUrl, blockingTilesIds } = client.loaderProps
    const hash = mapHashes[mapId] || String(Date.now())
    const slash = cdnUrl[cdnUrl.length - 1] === '/' ? '' : '/'
    const url = `${cdnUrl}${slash}maps/map${mapId}.js?${hash}`

    console.log('map', mapId, 'hash:', hash)
    console.log('map', mapId, 'url:', url)

    const allowedMobs = new Set(client.config.monstersIds)

    if (allowedMobs.size) {
        console.log('allowed mobs:', client.config.monstersIds.join(', '))
    } else {
        throw Error('allowed mobs are empty', { cause: 'config.monstersIds' })
    }

    let mapCode = await get({
        url,
        agent: client.agent,
        headers: {
            ...HEADERS_LOADER,
            'Referer': client.config.loaderUrl,
        },
    })

    // "params":{"to_map":14,"to_i":42,"to_j":48}
    mapCode = mapCode.replace(/['"]?params['"]?\s*:\s*\{[^\{\}]+\}/ig, '')

    // {b_t:"1",b_i:392,i:0,j:26}
    const tiles = mapCode.match(/\{[^\{\}]+\}/g) || []

    if (!tiles.length) {
        throw Error('failed to detect tiles', { cause: url })
    }

    let maxI = 0
    let maxJ = 0

    const matrix: number[][] = []
    const monsters = new Set<string>()
    const mobTargetIdByPos = new Map<string, number>()
    let chest: Position | null = null

    // {b_t:"1",b_i:392,i:0,j:26}
    // {b_t:"4",b_i:23,id:11716,i:66,j:45}
    tiles.forEach(tile => {
        const baseType = matchString(tile, /b_t\s*?:\s*?["']([0-9]+)["']/i)
        const baseIndex = matchNumber(tile, /b_i\s*?:\s*?([0-9]+)/i)
        const i = matchNumber(tile, /[^_]i\s*?:\s*?([0-9]+)/i)
        const j = matchNumber(tile, /j\s*?:\s*?([0-9]+)/i)
        const pos: Position = { i, j }
        const isTile = baseType === MoBaseType.GROUND
        const isBlockingTile = isTile && blockingTilesIds.has(baseIndex)

        const isChest = baseType === MoBaseType.OBJECT
            && baseIndex === CHEST_BASE_INDEX

        const isAllowedMob = baseType === MoBaseType.NPC
            && allowedMobs.has(baseIndex)

        if (isChest) {
            chest = pos
        }

        if (isAllowedMob) {
            monsters.add(posToStr(pos))

            // {b_t:"4",b_i:23,id:11716,i:66,j:45}
            const targetId = matchNumber(tile, /id\s*?:\s*?([0-9]+)/i)

            if (targetId) {
                mobTargetIdByPos.set(posToStr(pos), targetId)
            }
        }

        if (i > maxI) maxI = i
        if (j > maxJ) maxJ = j

        const canStep = !isBlockingTile
            && (isTypeWalkable(baseType as MoBaseType) || isAllowedMob)

        if (!matrix[j]) {
            matrix[j] = []
        }

        if (!canStep) {
            matrix[j][i] = IS_NOT_WALKABLE
        } else if (matrix[j][i] !== IS_NOT_WALKABLE) {
            matrix[j][i] = IS_WALKABLE
        }
    })

    if (!mobTargetIdByPos.size) {
        throw Error('mobTargetIdByPos is empty', { cause: url })
    }

    if (maxI + maxJ <= 0) {
        throw Error('failed to detect dimensions', { cause: url })
    }

    if (!chest) {
        throw Error('chest (storage) not found', { cause: url })
    } else {
        console.log('map', mapId, 'chest:', posToStr(chest))
    }

    if (!monsters.size) {
        const ids = client.config.monstersIds
        throw Error(`no monsters found by ids`, { cause: { url, ids } })
    } else {
        console.log('map', mapId, 'eligible monsters count:', monsters.size)
    }

    // console.log(SEP)
    // console.log('matrix:', JSON.stringify(matrix))
    // console.log(SEP)
    // console.log('player pos:', JSON.stringify(client.pos))
    // console.log(SEP)
    // console.log('chest pos:', JSON.stringify(chest))
    // console.log(SEP)
    // console.log('mobs:', JSON.stringify(Array.from(monsters).map(strToPos)))
    // console.log(SEP)

    if (client.pos && !isWalkable(matrix, client.pos)) {
        const pos = client.pos
        throw Error('player tile is not walkable', { cause: { url, pos } })
    }

    if (isWalkable(matrix, chest)) {
        const pos = chest
        throw Error('chest tile is walkable', { cause: { url, pos } })
    }

    Array.from(monsters).map(strToPos).forEach(pos => {
        if (!isWalkable(matrix, pos)) {
            throw Error('mob tile is not walkable', { cause: { url, pos } })
        }
    })

    const map: ClientMap = {
        matrix,
        monsters,
        mobTargetIdByPos,
        chest,
    }

    return map
}
