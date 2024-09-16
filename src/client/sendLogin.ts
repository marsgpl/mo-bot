import type { Client } from '../client.js'
import { getPass, getPassHash } from '../mo.js'

// 5:::{"name":"login","args":[{"user":"..","pass":"(64 hex)"}]}
// 5:::{"name":"login","args":[{"user":"..","pass":"(64 hex)","totp":"111111"}]}
export function sendLogin(this: Client) {
    const { username, password } = this.config
    const { salt: staticSalt } = this.loaderProps
    const { salt: runtimeSalt } = this

    if (!runtimeSalt) throw Error('runtime salt is missing')

    const passHash = getPassHash(username, staticSalt, password)
    const pass = getPass(passHash, runtimeSalt)

    this.send('login', {
        user: username,
        pass,
    }, {
        noSk: true,
    })
}
