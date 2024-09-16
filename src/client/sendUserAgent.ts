import type { Client } from '../client.js'
import { USER_AGENT } from '../headers.js'

// 5:::{"name":"user_agent","args":[{"ua":"(user-agent)","inapp":"","stats":{"onload":1,"loaded":1,"finished":0,"connected":0,"total":2},"ref":"","browser_lang":"en","lang":"en","time":{"tz":"(tz)","offset":8},"sk":"(sk)"}]}
export function sendUserAgent(this: Client) {
    const { lang, tz, tzOffsetHours } = this.config

    console.log('ua:', USER_AGENT)
    console.log('lang:', lang)
    console.log('tz:', tz)
    console.log('tz offset hours:', tzOffsetHours)

    this.send('user_agent', {
        ua: USER_AGENT,
        inapp: '',
        stats: {
            onload: 1,
            loaded: 1,
            finished: 0,
            connected: 0, // no idea why 0
            total: 2, // sum of all above
        },
        ref: '',
        browser_lang: lang,
        lang,
        time: {
            tz,
            offset: tzOffsetHours,
        },
    })
}
