import TelegramBot from 'node-telegram-bot-api'
import { Client } from './client.js'

export interface EnglishTgBot {
    bot: TelegramBot
    client: Client
}

export function newEnglishTgBot(client: Client): EnglishTgBot | null {
    const {
        englishTgBotToken,
        englishTgBotAdminId,
    } = client.config

    if (!englishTgBotToken || !englishTgBotAdminId) {
        console.log('not enough config for bot, need token and admin id')
        return null
    }

    const bot: EnglishTgBot = {
        client,
        bot: new TelegramBot(englishTgBotToken, {
            polling: true,
        })
    }

    console.log('english tg bot is up')

    // {"message_id":1,"from":{"id":28831074,"is_bot":false,"first_name":"Iurii","last_name":"Belobeev","username":"marsgpl","language_code":"en","is_premium":true},"chat":{"id":28831074,"first_name":"Iurii","last_name":"Belobeev","username":"marsgpl","type":"private"},"date":1726579680,"text":"/start","entities":[{"offset":0,"length":6,"type":"bot_command"}]}
    // 5:::{"name":"message","args":[{"data":"123","lang":"","sk":"xxx"}]}
    bot.bot.on('message', (msg) => {
        console.log('✉️  new tg msg:', JSON.stringify(msg))

        const fromId = msg.from?.id
        const chatId = msg.chat?.id

        if (fromId !== englishTgBotAdminId || fromId !== englishTgBotAdminId) {
            console.log('msg is not from bot owner, rejecting')
            return
        }

        const text = msg.text?.trim()

        if (!text) {
            console.log('telegram msg is not a text msg, rejecting')
            return
        }

        const ts = Date.now()
        const msgTs = msg.date * 1000
        const tsDeltaMs = ts - msgTs

        if (tsDeltaMs > 15000) {
            console.log('msg is from the past, ignoring')
            return
        }

        console.log('sending to general chat:', text)

        client.send('message', {
            data: text,
            lang: '',
        })
    })

    return bot
}

export function sendEnglishTgBot(client: Client, text: string) {
    if (!client.englishTgBot) { return }

    const {
        englishTgBotAdminUsername,
        englishTgBotAdminId,
        englishTgBotMention,
    } = client.config

    if (englishTgBotMention
        && text.toLowerCase().match(englishTgBotMention.toLowerCase())
    ) {
        text += ' @' + client.config.englishTgBotAdminUsername
    }

    client.englishTgBot.bot.sendMessage(englishTgBotAdminId!, text)
}
