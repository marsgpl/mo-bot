import type { Position } from './mo.js'

export function packPath(path: Position[]): string {
    return JSON.stringify(path.map(({ i, j }) => ([i, j])))
}
