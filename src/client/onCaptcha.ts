import type { Client } from '../client.js'
import type { KeyValue } from '../guards.js'
import { getString } from '../getters.js'
import { SEP } from '../headers.js'
import { solveCaptcha } from '../captcha.js'

// 4:::{"action":"captcha","img2":"data:image/jpeg;base64,/9j/4AAQ...==","secondstamp":1626136661,"penalty":-4}
// 4:::{"action":"captcha","img2":"data:image/jpeg;base64,/9j/4AAQ...//Z","refresh":true,"can_refresh":true}
// 4:::{"action":"captcha","img2":"data:image/jpeg;base64,/9j/4AAQ...//Z","refresh":true,"can_refresh":false}
export function onCaptcha(this: Client, payload: KeyValue) {
    const img = getString(payload, 'img2')
    const canRefresh = payload.can_refresh
    const isLastAttempt = canRefresh !== undefined && !canRefresh

    if (!img.match('data:image/jpeg;base64,')) {
        throw Error('captcha img: missing b64 header', { cause: payload })
    }

    const b64img = img.substring('data:image/jpeg;base64,'.length)

    console.log(SEP)
    console.log('captcha:', b64img)
    console.log(SEP)

    if (isLastAttempt) {
        console.log('captcha last attempt')
    }

    this.busyWithCaptcha = true
    this.canRefreshCaptcha = !isLastAttempt

    solveCaptcha.call(this.antiCaptcha, {
        b64img,
        needRepeats: 2,
        maxRequests: 4,
    }).then(answer => {
        console.log('captcha solved, sending:', answer)
        this.send('captcha', { value: answer })
    }).catch(error => {
        throw Error('anti-captcha failed', { cause: error })
    })
}

// 5:::{"name":"captcha","args":[{"value":"00000","sk":"xx"}]}
