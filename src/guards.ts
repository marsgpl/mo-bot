export type Key = string
export type Value = string | number | boolean | Value[] | { [key: Key]: Value }
export type KeyValue = Record<Key, Value>

export function isKeyValue(value: unknown): value is KeyValue {
    return typeof value === 'object' && value !== null
}

export function isString(value: unknown): value is string {
    return typeof value === 'string' && value.length > 0
}

export function isOptString(value: unknown): value is string | undefined {
    return typeof value === 'string' || typeof value === undefined
}

export function isNumber(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value)
}

export function isOptNumber(value: unknown): value is number | undefined {
    return (typeof value === 'number' && Number.isFinite(value))
        || typeof value === undefined
}

export function isBoolean(value: unknown): value is boolean {
    return typeof value === 'boolean'
}

export function isOptBoolean(value: unknown): value is boolean | undefined {
    return typeof value === 'boolean' || typeof value === undefined
}

export function isStringOrNumber(value: unknown): value is string | number {
    return isString(value) || isNumber(value)
}

export function isOptStringOrNumber(
    value: unknown
): value is string | number | undefined {
    return isOptString(value) || isNumber(value)
}
