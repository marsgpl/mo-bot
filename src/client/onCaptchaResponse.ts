import type { Client } from '../client.js'
import type { KeyValue } from '../guards.js'
import { logic, LogicEvent } from '../logic.js'

// 4:::{"action":"captcha_response","status":false}
// 4:::{"action":"captcha_response","status":true}
export function onCaptchaResponse(this: Client, payload: KeyValue) {
    if (payload.status) {
        console.log('✅', 'captcha successfully solved')
        this.busyWithCaptcha = false
        logic(this, LogicEvent.CAPTCHA_DONE)
        return
    }

    console.log('captcha solve failed')

    if (!this.canRefreshCaptcha) {
        throw Error('can not refresh captcha', { cause: payload })
    }

    console.log('refreshing captcha')
    this.send('captcha', { sub: 'refresh' })
}

// 5:::{"name":"captcha","args":[{"sub":"refresh","sk":"xx"}]}
