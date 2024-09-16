import type { Client } from '../client.js'
import type { KeyValue } from '../guards.js'
import { getString, getStringOrNumber } from '../getters.js'
import { sendHandshake } from './sendHandshake.js'

// 4:::{"action":"checksum","version":1111,"checksum":"(32 hex)"}
export function onChecksum(this: Client, payload: KeyValue) {
    const version = getStringOrNumber(payload, 'version')
    const checksum = getString(payload, 'checksum')

    const { releaseV, codeV } = this.loaderProps

    if (version !== releaseV) {
        throw Error('version mismatch', { cause: { payload, releaseV } })
    }

    if (checksum !== codeV) {
        throw Error('checksum mismatch', { cause: { payload, codeV } })
    }

    console.log('checksum match')

    sendHandshake.call(this)
}
