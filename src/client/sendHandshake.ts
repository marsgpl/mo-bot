import type { Client } from '../client.js'
import { randomFp, randomSalt } from '../mo.js'

// 5:::{"name":"handshake","args":[{"user":"(name)","version":"22","sk":"(salt 10)","fp":"(32 hex)","mp":false,"force":0,"v":1111,"p":1}]}
export function sendHandshake(this: Client) {
    const { fingerprint, username } = this.config
    const { gameV, releaseV, patchV } = this.loaderProps

    this.sk = randomSalt(10)
    this.fp = fingerprint || randomFp()

    console.log('username:', username)
    console.log('session key:', this.sk)
    console.log('fingerprint:', this.fp)

    this.send('handshake', {
        user: username,
        version: gameV,
        sk: this.sk, // session key
        fp: this.fp, // fingerprint
        mp: false, // is mobile device?
        force: 0, // world_login_force (number), 0 - no force
        v: releaseV,
        p: patchV,
    }, {
        noSk: true, // added manually above
    })
}
