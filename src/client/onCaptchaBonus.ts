import type { Client } from '../client.js'
import type { KeyValue } from '../guards.js'

// 4:::{"action":"captcha_bonus"}
export function onCaptchaBonus(this: Client, payload: KeyValue) {
    void(payload)
    console.log('captcha bonus arrived')

    if (this.penalty && this.penalty < -4) {
        console.log('too much penalty credits, spending on breeding')
        this.send('captcha_bonus', { skill: 'breeding', amount: 1 })
    }
}

// 5:::{"name":"captcha_bonus","args":[{"skill":"brdng","amount":1,"sk":"xx"}]}
