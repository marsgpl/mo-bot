import type { Position } from './mo.js'

export const IS_WALKABLE = 1
export const IS_NOT_WALKABLE = 0

const MATRIX_MAX_W = 1000
const MATRIX_MAX_H = 1000
const MAX_PATH_LEN = 1000

type Graph = {
    hash: number
    length: number
    parent?: Graph
}

export function isWalkable(matrix: number[][], { i, j }: Position) {
    return !!matrix[j]?.[i]
}

export function findPath(matrix: number[][], { from, to }: {
    from: Position
    to: Position
}): null | Position[] {
    const { i: fx, j: fy } = from
    const { i: tx, j: ty } = to

    const fromHash = fy * MATRIX_MAX_H + fx
    const toHash = ty * MATRIX_MAX_H + tx

    const matrixW = matrix[0].length
    const matrixH = matrix.length

    if (fromHash === toHash) {
        return [] // already at destination
    }

    if (matrixW > MATRIX_MAX_W || matrixH > MATRIX_MAX_H) {
        throw Error('matrix dimensions are too powerful', { cause: {
            matrixW,
            matrixH,
            maxW: MATRIX_MAX_W,
            maxH: MATRIX_MAX_H,
        } })
    }

    const hiQueue: Array<Function> = []
    const loQueue: Array<Function> = []
    const used = new Map<number, Graph>()
    let finish: Graph | undefined = undefined
    let checks = 0

    const isTail = (hash: number, node?: Graph) => {
        while (node) {
            if (node.hash === hash) return true
            node = node.parent
        }

        return false
    }

    const check = (x: number, y: number, parent?: Graph) => {
        checks++

        const hash = y * MATRIX_MAX_H + x

        if (!matrix[y]?.[x] && hash !== toHash) {
            return // dead end
        }

        const length = parent?.length ? parent.length + 1 : 1

        if (length > MAX_PATH_LEN) {
            return // too long
        }

        if (finish && finish.length < length) {
            return // finish is shorter
        }

        const competitor = used.get(hash)

        const node: Graph = {
            hash,
            length,
            parent,
        }

        if (competitor) {
            if (isTail(competitor.hash, parent)) {
                if (competitor.length < length) {
                    node.parent = competitor
                    node.length = node.parent.length + 1
                } else {
                    return
                }
            } else if (competitor.length < length) {
                return // competitor is shorter
            } else {
                used.set(hash, node)
                return // competitor is longer. override and exit
            }
        }

        used.set(hash, node)

        if (hash === toHash) {
            finish = node
            return // success
        } else if (x === tx) {
            if (y > ty) {
                hiQueue.push(() => check(x, y - 1, node)) // north
                loQueue.push(() => check(x, y + 1, node)) // south
            } else {
                hiQueue.push(() => check(x, y + 1, node)) // south
                loQueue.push(() => check(x, y - 1, node)) // north
            }
            loQueue.push(() => check(x + 1, y, node)) // east
            loQueue.push(() => check(x - 1, y, node)) // west
        } else if (y === ty) {
            if (x > tx) {
                hiQueue.push(() => check(x - 1, y, node)) // west
                loQueue.push(() => check(x + 1, y, node)) // east
            } else {
                hiQueue.push(() => check(x + 1, y, node)) // east
                loQueue.push(() => check(x - 1, y, node)) // west
            }
            loQueue.push(() => check(x, y - 1, node)) // north
            loQueue.push(() => check(x, y + 1, node)) // south
        } else if (x > tx && y > ty) {
            hiQueue.push(() => check(x - 1, y, node)) // west
            hiQueue.push(() => check(x, y - 1, node)) // north
            loQueue.push(() => check(x + 1, y, node)) // east
            loQueue.push(() => check(x, y + 1, node)) // south
        } else if (x > tx && y < ty) {
            hiQueue.push(() => check(x - 1, y, node)) // west
            hiQueue.push(() => check(x, y + 1, node)) // south
            loQueue.push(() => check(x + 1, y, node)) // east
            loQueue.push(() => check(x, y - 1, node)) // north
        } else if (x < tx && y < ty) {
            hiQueue.push(() => check(x + 1, y, node)) // east
            hiQueue.push(() => check(x, y + 1, node)) // south
            loQueue.push(() => check(x - 1, y, node)) // west
            loQueue.push(() => check(x, y - 1, node)) // north
        } else if (x < tx && y > ty) {
            hiQueue.push(() => check(x + 1, y, node)) // east
            hiQueue.push(() => check(x, y - 1, node)) // north
            loQueue.push(() => check(x - 1, y, node)) // west
            loQueue.push(() => check(x, y + 1, node)) // south
        } else {
            throw Error('find path check logic error',
                { cause: { x, y, tx, ty } })
        }
    }

    check(fx, fy)

    while (hiQueue.length || loQueue.length) {
        while (hiQueue.length) {
            hiQueue.shift()!()
        }

        while (loQueue.length) {
            loQueue.shift()!()
        }
    }

    // console.log('checks:', checks)

    if (!finish) {
        return null
    }

    const path: Position[] = []

    while (finish) {
        const { hash, parent } = finish as Graph
        const i = hash % MATRIX_MAX_H
        const j = Math.floor(hash / MATRIX_MAX_H)
        path.push({ i, j })
        finish = parent
    }

    path.shift() // rm to
    path.pop() // rm from

    return path
}
