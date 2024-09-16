import type { Client } from '../client.js'
import { isKeyValue, type KeyValue } from '../guards.js'
import { getKeyValue, getNumber, getString } from '../getters.js'
import { onHealthDelta } from '../onHealthDelta.js'

// 4:::{"action":"skills","data":{"skill":"magic","stats":{"xp":111,"level":111,"current":111,"multiplier":1},"pet_xp":111}}
// 4:::{"action":"skills","data":{"skill":"health","stats":{"xp":12312,"level":111,"current":102,"multiplier":1},"pet_xp":12322}}
// 4:::{"action":"skills","data":{"accuracy":{"xp":111,"level":111,"current":111,"multiplier":1},"strength":{"xp":111,"level":111,"current":111,"multiplier":1},"defense":{"xp":111,"level":111,"current":111,"multiplier":1},"health":{"xp":111,"level":111,"current":111,"multiplier":1},"magic":{"xp":111,"level":111,"current":111,"multiplier":1},"alchemy":{"xp":111,"level":111,"current":111,"multiplier":1},"woodcutting":{"xp":111,"level":111,"current":111,"multiplier":1},"farming":{"xp":111,"level":111,"current":111,"multiplier":1},"fishing":{"xp":111,"level":111,"current":111,"multiplier":1},"cooking":{"xp":111,"level":111,"current":111,"multiplier":1},"jewelry":{"xp":111,"level":111,"current":111,"multiplier":1},"carpentry":{"xp":111,"level":111,"current":111,"multiplier":1},"forging":{"xp":111,"level":111,"current":111,"multiplier":1},"mining":{"xp":111,"level":111,"current":111,"multiplier":1},"breeding":{"xp":111,"level":111,"current":111,"multiplier":1},"archery":{"xp":111,"level":111,"current":111,"multiplier":1},"fletching":{"xp":111,"level":111,"current":111,"multiplier":1},"wizardry":{"xp":111,"level":111,"current":111,"multiplier":1},"fungiculture":{"xp":111,"level":111,"current":111,"multiplier":1}}}
export function onSkills(this: Client, payload: KeyValue) {
    const data = getKeyValue(payload, 'data')

    if (data.skill) {
        const skill = getString(data, 'skill')
        const stats = getKeyValue(data, 'stats')
        const xp = Math.floor(getNumber(stats, 'xp'))
        const level = Math.floor(getNumber(stats, 'level'))
        const current = Math.floor(getNumber(stats, 'current'))

        onSkill.call(this, { skill, xp, level, current })
    } else {
        Object.entries(data).forEach(([skill, stats]) => {
            if (!isKeyValue(stats)) {
                throw Error('skills: unsupported format', { cause: payload })
            }

            const xp = Math.floor(getNumber(stats, 'xp'))
            const level = Math.floor(getNumber(stats, 'level'))
            const current = Math.floor(getNumber(stats, 'current'))

            onSkill.call(this, { skill, xp, level, current })
        })
    }
}

function onSkill(this: Client, { skill, xp, level, current }: {
    skill: string
    xp: number
    level: number
    current: number
}) {
    const prev = this.skills[skill]

    if (prev) {
        const xpDelta = xp - prev.xp
        const lvlDelta = level - prev.level

        // takes too much space
        // if (xpDelta !== 0) {
        //     console.log(skill,
        //         xpDelta > 0 ? 'gained' : 'lost',
        //         xpDelta, 'xp')
        // }

        if (lvlDelta !== 0) {
            console.log(skill,
                lvlDelta > 0 ? 'gained' : 'lost',
                lvlDelta,
                lvlDelta === 1 ? 'level' : 'levels')
        }
    } else {
        console.log(skill, 'level:', level, `(${xp} xp)`)
    }

    this.skills[skill] = { level, xp }

    if (skill === 'health') {
        onHealthDelta(this, { curHealth: current, maxHealth: level })
    }
}
