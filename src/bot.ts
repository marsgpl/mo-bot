import { Agent } from 'node:https'
import WebSocket from 'ws'
import { readConfig } from './config.js'
import { get } from './get.js'
import {
    HEADERS_LOADER,
    HEADERS_CODE,
    HEADERS_WS_DATA,
    HEADERS_WS,
} from './headers.js'
import { toOrigin } from './toOrigin.js'
import { type LoaderProps, newClient, onWsMsg } from './client.js'
import { isMoWsId } from './mo.js'
import { newAntiCaptcha } from './captcha.js'
import { matchNumber, matchString } from './getters.js'
import { isKeyValue } from './guards.js'

const config = await readConfig({
    path: 'config.json',
})

const agent = new Agent({
    keepAlive: true,
    timeout: 30000,
})

console.log('loader url:', config.loaderUrl)

const loader = await get({
    url: config.loaderUrl,
    headers: HEADERS_LOADER,
    agent,
})

const [codeUrl, codeV] = loader.match(
    /https:\/\/[0-9a-z_\-\.]+\/release\.js\?v=([0-9a-z_]+)/i) || []
if (!codeUrl) throw Error('code url not found', { cause: config.loaderUrl })
if (!codeV) throw Error('code version not found', { cause: config.loaderUrl })

console.log('code url:', codeUrl)
console.log('release checksum:', codeV)

const code = await get({
    url: codeUrl,
    headers: {
        ...HEADERS_CODE,
        'Referer': config.loaderUrl,
    },
    agent,
})

const blockingTilesIds = new Set<number>()

const groundObjects =
    code.match(/ground_base\s*\[.*?\]\s*=\s*createObject\s*\(.*?\)\s*;/ig)

if (!groundObjects?.length) {
    throw Error('can not parse ground_base', { cause: codeUrl })
}

// example of blocking for map 15:
// 1 6 23 58 253 254 255 256 257 258 265 266 267 268 269 270 272 273 274 275 302 303 304 321 322 323 324 325 326 327 328 380 381 382 383 384 385 388+i 405+i 416 418 419 423+i 429+i 432+i 441+i 450+i 551
let prevIncId = NaN
groundObjects.forEach((chunk) => {
    const id = matchString(chunk, /^ground_base\s*\[([^\]]+)\]/i).trim()
    const intId = parseInt(id)
    if (!Number.isFinite(intId)) throw Error('groundObjects: bad id',
        { cause: { chunk, id, intId } })
    const blocking = matchString(chunk, /blocking\s*:\s*([^\},]+)\s*/i).trim()
    const isBlocking = blocking !== '!1'

    if (Number.isFinite(prevIncId)) {
        const delta = intId - prevIncId
        if (delta > 100 || delta < 1) throw Error('groundObjects: bad delta',
            { cause: { chunk, id, intId, prevIncId, delta } })
        for (let i = prevIncId; i < intId; ++i) {
            blockingTilesIds.add(i)
        }
    }

    prevIncId = NaN

    if (!isBlocking) return

    if (String(intId) === id) {
        blockingTilesIds.add(intId)
    } else {
        prevIncId = parseInt(id)
    }
})

if (!blockingTilesIds.size) {
    throw Error('can not parse blocking ground_base', { cause: codeUrl })
}

const releaseV = matchNumber(code,
    /release_version\s*?=\s*?["']?([0-9]+)["']?/i)
const gameV = matchNumber(code,
    /GAME_VERSION\s*?=\s*?["']?([0-9]+)["']?/i)
const patchV = matchNumber(code,
    /patch_version\s*?=\s*?["']?([0-9]+)["']?/i)
const salt = matchString(code,
    /salt\s*?=\s*?["']([0-9a-z_]+)["']/i)
const cdnUrl = matchString(code,
    /cdn_url\s*?=\s*?["']([^"']+)["']/i)
const mapHashes = matchString(code,
    /map_hashes\s*?=\s*?["']([^"']+)["']/i).split(' ')

console.log('release version:', releaseV)
console.log('game version:', gameV)
console.log('patch version:', patchV)
console.log('salt:', salt)
console.log('cdn url:', cdnUrl)
console.log('map hashes:', mapHashes.length)
console.log('blocking tile ids:', blockingTilesIds.size)

const loaderProps: LoaderProps = {
    codeV,
    releaseV,
    gameV,
    patchV,
    salt,
    cdnUrl,
    mapHashes,
    blockingTilesIds,
}

const wsDataUrl = `https://${config.wsHost}/socket.io/1/?t=${Date.now()}`

console.log('ws host:', config.wsHost)
console.log('ws data url:', wsDataUrl)

// maintenance: statusCode: 502, statusMessage: 'Bad Gateway'
const wsData = await get({
    url: wsDataUrl,
    headers: {
        ...HEADERS_WS_DATA,
        'Origin': toOrigin(config.loaderUrl),
        'Referer': config.loaderUrl,
    },
    agent,
})

console.log('ws data:', wsData)

const [wsSlug] = wsData.split(':')
if (!wsSlug) throw Error('ws slug not found', { cause: wsData })

const wsUrl = `wss://${config.wsHost}/socket.io/1/websocket/${wsSlug}`

console.log('ws slug:', wsSlug)
console.log('ws url:', wsUrl)

const ws = new WebSocket(wsUrl, {
    headers: {
        ...HEADERS_WS,
        'Origin': toOrigin(config.loaderUrl),
    },
    timeout: 0,
    agent,
})

const antiCaptcha = newAntiCaptcha(config.antiCaptchaApiKey)

const client = newClient({
    config,
    agent,
    ws,
    antiCaptcha,
    loaderProps,
})

ws.on('error', error => {
    throw Error('ws error', { cause: error })
})

ws.on('open', () => {
    console.log('connected to ws')
})

ws.on('close', (code: number, reasonBuf: Buffer) => {
    const reason = reasonBuf.toString('utf8')
    throw Error('ws closed', { cause: { code, reason } })
})

ws.on('message', buf => {
    const msg = buf.toString('utf8')
    const [, id, json] = msg
        .match(/^([0-9]+):{2,}(.*)$/) || []
    const payload = json ? JSON.parse(json) : {}

    if (!isMoWsId(id)) {
        throw Error(`ws: unsupported packet id: ${id}`, { cause: msg })
    }

    if (!isKeyValue(payload)) {
        throw Error('ws: payload is not a JSON', { cause: msg })
    }

    onWsMsg.call(client, { id, payload })
})
