import type { Client } from '../client.js'
import type { KeyValue } from '../guards.js'
import { SEP } from '../headers.js'
import { MoWsId } from '../mo.js'

// {"action":"shutdown","msg":"Server maintenance!","reconnect":true}
export function onShutdown(this: Client, payload: KeyValue) {
    console.log(SEP)
    console.log('ws server shutdown:', JSON.stringify(payload))
    console.log(SEP)

    this.isDisconnected = true

    this.ws.send(`${MoWsId.DEAD}::`)

    setTimeout(() => {
        throw Error('exit')
    }, 500)
}
