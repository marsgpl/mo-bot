import { readFile } from 'node:fs/promises'
import {
    isKeyValue,
    isNumber,
    isOptNumber,
    isOptString,
    isString,
} from './guards.js'

export interface Config {
    loaderUrl: string
    wsHost: string
    username: string
    password: string
    fingerprint?: string
    tz: string
    tzOffsetHours: number
    lang: string
    antiCaptchaApiKey: string
    mapId: number
    monstersIds: number[]
    foodId: number
    hpPerFood: number
    englishTgBotToken?: string
    englishTgBotAdminUsername?: string
    englishTgBotAdminId?: number
    englishTgBotMention?: string
}

export interface ReadConfigProps {
    path: string
}

export async function readConfig({
    path,
}: ReadConfigProps): Promise<Config> {
    const raw = await readFile(path)
    const text = raw.toString()
    const json = JSON.parse(text)

    if (!isConfig(json)) {
        throw Error('invalid config format', {
            cause: path,
        })
    }

    return json
}

function isConfig(config: unknown): config is Config {
    return Boolean(isKeyValue(config)
        && isString(config.loaderUrl)
        && isString(config.wsHost)
        && isString(config.username)
        && isString(config.password)
        && isOptString(config.fingerprint)
        && isString(config.tz)
        && isNumber(config.tzOffsetHours)
        && isString(config.lang)
        && isString(config.antiCaptchaApiKey)
        && isNumber(config.mapId)
        && Array.isArray(config.monstersIds)
        && isNumber(config.foodId)
        && isNumber(config.hpPerFood)
        && isOptString(config.englishTgBotToken)
        && isOptString(config.englishTgBotAdminUsername)
        && isOptNumber(config.englishTgBotAdminId)
        && isOptString(config.englishTgBotMention)
    )
}
