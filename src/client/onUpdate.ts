import type { Client } from '../client.js'
import type { KeyValue } from '../guards.js'
import { getString } from '../getters.js'

// 4:::{"action":"update","func":"...patch_version=2;"}
// 4:::{"action":"update","func":"var func = ...turn\"\"};func();","id":2}
export function onUpdate(this: Client, payload: KeyValue) {
    const func = getString(payload, 'func')
    const [, patchV] = func.match(/patch_version\s*?=\s*?([0-9]+)/i) || []
    const [, retV] =
        func.match(/return\s*['"]?([^'"\s\}]+)['"]?\s*\}\s*;/i) || []

    const id = payload.id

    console.log('server sent update:', 'id:', id, 'func:',
        func.substring(0, 20) + '...' + func.substring(func.length - 20))
    console.log('update patch_version:', patchV)
    console.log('update return:', retV)

    this.send('update_response', {
        data: {
            id,
            response: patchV || retV,
        },
    })

    // 5:::{"name":"update_response","args":[{"data":{"response":"2"},"sk":""}]}
    // 5:::{"name":"update_response","args":[{"data":{"id":2,"response":""},"sk":""}]}
}
