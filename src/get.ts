import { Agent, request } from 'node:https'
import { createGunzip } from 'node:zlib'

export interface GetProps {
    url: string | URL
    agent: Agent
    headers: Record<string, string>
}

export async function get({
    url,
    agent,
    headers,
}: GetProps): Promise<string> {
    return new Promise((resolve, reject) => {
        const req = request(url, {
            method: 'GET',
            headers,
            agent,
        }, res => {
            if (res.statusCode !== 200) {
                throw Error('status must be 200', {
                    cause: res,
                })
            }

            let text = ''

            if (res.headers['content-encoding']?.match(/gzip/i)) {
                const gunzip = createGunzip()
                res.pipe(gunzip)
                gunzip.on('data', chunk => {
                    text += chunk.toString('utf8')
                })
                gunzip.on('end', () => resolve(text))
                gunzip.on('error', reject)
            } else {
                res.setEncoding('utf8')
                res.on('data', chunk => {
                    text += String(chunk)
                })
                res.on('end', () => resolve(text))
                res.on('error', reject)
            }
        })
        req.on('error', reject)
        req.end()
    })
}
