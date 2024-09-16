import { createRequire } from 'module'

export interface AntiCaptcha {
    setAPIKey: (key: string) => void
    solveImage: (b64img: string) => Promise<string>
    settings: {
        phrase: boolean
        case: boolean
        numeric: number
        comment: string
        math: boolean
        minLength: number
        maxLength: number
        languagePool: string
    }
}

export interface SolveCaptchaProps {
    b64img: string
    needRepeats: number
    maxRequests: number
}

export function newAntiCaptcha(apiKey: string): AntiCaptcha {
    const require = createRequire(import.meta.url)
    const ac = require('@antiadmin/anticaptchaofficial') as AntiCaptcha

    ac.setAPIKey(apiKey)

    ac.settings.phrase = false // 2 words
    ac.settings.case = false // case sensitivity
    ac.settings.numeric = 1 // only numbers
    // ac.settings.comment = 'only green letters' // text comment for workers
    ac.settings.math = false // math operation like 50+2
    ac.settings.minLength = 5 // minimum amount of characters
    ac.settings.maxLength = 5 // maximum number of characters
    // ac.settings.languagePool = 'en' // language pool

    return ac
}

// https://anti-captcha.com/apidoc/errors
export async function solveCaptcha(this: AntiCaptcha, {
    b64img,
    needRepeats,
    maxRequests,
}: SolveCaptchaProps): Promise<string> {
    if (maxRequests < 1) throw Error('maxRequests < 1')
    if (needRepeats > maxRequests) throw Error('needRepeats > maxRequests')

    let maxRepsN = 0
    let maxRepsAnswer = ''
    let requestsLeft = maxRequests
    const repeats = new Map<string, number>() // key: answer, value: repsN

    while (requestsLeft --> 0) {
        const answer = await this.solveImage(b64img)
        const repsN = (repeats.get(answer) || 0) + 1

        console.log('anti-captcha answer:', answer)

        if (repsN >= needRepeats) {
            console.log('anti-captcha answer hit desired score:', repsN)
            return answer
        }

        if (repsN > maxRepsN) {
            maxRepsN = repsN
            maxRepsAnswer = answer
        }

        repeats.set(answer, repsN)
    }

    if (maxRepsAnswer) {
        console.log('anti-captcha answer with max score:',
            maxRepsAnswer,
            maxRepsN)
        return maxRepsAnswer
    }

    throw Error('anti-captcha has no answers')
}
