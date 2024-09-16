import type { Client } from '../client.js'
import type { KeyValue } from '../guards.js'
import { getString } from '../getters.js'
import { sendLogin } from './sendLogin.js'

// 4:::{"action":"clue","salt":"(random salt 12)"}
export function onClue(this: Client, payload: KeyValue) {
    this.salt = getString(payload, 'salt')

    console.log('runtime salt:', this.salt)

    sendLogin.call(this)
}
