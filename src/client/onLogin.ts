import type { Client } from '../client.js'
import type { KeyValue } from '../guards.js'
import { getNumber, getString } from '../getters.js'
import { sendUserAgent } from './sendUserAgent.js'

// send new handshake if totp requested

// 4:::{"action":"login","status":"totp"}
// 4:::{"action":"login","status":"ok","world":2,"maintenance":23735539,"xp":0,"eml":false,"we":false}
// 4:::{ action: 'login', status: 'logged-in', retry: true }
export function onLogin(this: Client, payload: KeyValue) {
    const status = getString(payload, 'status')

    if (status === 'totp') {
        throw Error('otp (one time password) requested by server (bot does not support it). disable 2-factor-auth on your account', { cause: payload })
    }

    if (status === 'logged-in') {
        throw Error('already logged in', { cause: payload })
    }

    if (status !== 'ok') {
        throw Error('login failed', { cause: payload })
    }

    const world = getNumber(payload, 'world')
    const maintenance = getNumber(payload, 'maintenance')
    const xp = getNumber(payload, 'xp')

    console.log('login successful')
    console.log('world:', world)
    console.log('maintenance in:',
        Math.floor(maintenance / 1000 / 60), 'minutes')

    if (xp) {
        console.log('double xp rate, expires in:',
            Math.floor(xp / 1000 / 60), 'minutes')
    } else {
        console.log('normal xp rate')
    }

    sendUserAgent.call(this)

    this.send('storage', { sub: 'get', vault: 'wishlist' })
    this.send('storage', { sub: 'get', vault: 'eq_slot' })
    this.send('player_info_request', {})

    // 5:::{"name":"storage","args":[{"sub":"get","vault":"wishlist","sk":"x"}]}
    // 5:::{"name":"storage","args":[{"sub":"get","vault":"eq_slot","sk":"x"}]}
    // 5:::{"name":"player_info_request","args":[{"sk":"x"}]}
}
