import {
    KeyValue,
    Value,
    isString,
    isNumber,
    isBoolean,
    isStringOrNumber,
    isKeyValue,
} from './guards.js'

export function getString(payload: KeyValue, field: string): string {
    const value = payload[field]

    if (value === undefined) {
        throw Error(`payload["${field}"] not found`, { cause: payload })
    }

    if (!isString(value)) {
        throw Error(`payload["${field}"] is not a string`, { cause: payload })
    }

    return value
}

export function getNumber(payload: KeyValue, field: string): number {
    const value = payload[field]

    if (value === undefined) {
        throw Error(`payload["${field}"] not found`, { cause: payload })
    }

    if (!isNumber(value)) {
        throw Error(`payload["${field}"] is not a number`, { cause: payload })
    }

    return value
}

export function getBoolean(payload: KeyValue, field: string): boolean {
    const value = payload[field]

    if (value === undefined) {
        throw Error(`payload["${field}"] not found`, { cause: payload })
    }

    if (!isBoolean(value)) {
        throw Error(`payload["${field}"] is not boolean`, { cause: payload })
    }

    return value
}

export function getStringOrNumber(
    payload: KeyValue,
    field: string
): string | number {
    const value = payload[field]

    if (value === undefined) {
        throw Error(`payload["${field}"] not found`, { cause: payload })
    }

    if (!isStringOrNumber(value)) {
        throw Error(`payload["${field}"] is not a string or number`,
            { cause: payload })
    }

    return value
}

export function getArray(payload: KeyValue, field: string): Value[] {
    const value = payload[field]

    if (value === undefined) {
        throw Error(`payload["${field}"] not found`, { cause: payload })
    }

    if (!Array.isArray(value)) {
        throw Error(`payload["${field}"] is not an array`, { cause: payload })
    }

    return value
}

export function getKeyValue(payload: KeyValue, field: string): KeyValue {
    const value = payload[field]

    if (value === undefined) {
        throw Error(`payload["${field}"] not found`, { cause: payload })
    }

    if (!isKeyValue(value)) {
        throw Error(`payload["${field}"] is not an object`, { cause: payload })
    }

    return value
}

export function matchString(payload: string, expr: RegExp): string {
    const [, value] = payload.match(expr) || []

    if (!value) {
        throw Error(`expr not found: ${expr}`, { cause: payload })
    }

    return value
}

export function matchNumber(payload: string, expr: RegExp): number {
    const [, value] = payload.match(expr) || []

    if (!value) {
        throw Error(`expr not found: ${expr}`, { cause: payload })
    }

    const numeric = Number(value)

    if (!Number.isFinite(numeric)) {
        throw Error(`matched expr is not numeric: ${value}; expr: ${expr}`,
            { cause: payload })
    }

    return numeric
}
