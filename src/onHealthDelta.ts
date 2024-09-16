import type { Client } from './client.js'
import { logic, LogicEvent } from './logic.js'

export interface OnHealthDeltaProps {
    curHealth: number
    maxHealth: number
}

export function onHealthDelta(
    client: Client,
    { curHealth, maxHealth }: OnHealthDeltaProps,
) {
    const prevHealth = client.curHealth

    client.curHealth = curHealth
    client.maxHealth = maxHealth

    if (prevHealth === undefined) return
    if (prevHealth < curHealth) return logic(client, LogicEvent.HP_GAIN)
    if (prevHealth > curHealth) return logic(client, LogicEvent.HP_LOSS)
}
