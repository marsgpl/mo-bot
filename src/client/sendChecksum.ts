import type { Client } from '../client.js'

// 5:::{"name":"checksum","args":[{"checksum":"(hex 32)","version":7777}]}
export function sendChecksum(this: Client) {
    this.send('checksum', {
        checksum: this.loaderProps.codeV,
        version: this.loaderProps.releaseV,
    }, {
        noSk: true,
    })
}
