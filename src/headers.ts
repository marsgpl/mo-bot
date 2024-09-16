import { toHeaders } from './toHeaders.js'

export const SEP = '----------------------------------------'

export const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36'

export const SEC_CH = `
    sec-ch-ua: "Not)A;Brand";v="99", "Google Chrome";v="127", "Chromium";v="127"
    sec-ch-ua-mobile: ?0
    sec-ch-ua-platform: "macOS"
`

export const HEADERS_LOADER = toHeaders(`
    Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7
    Accept-Encoding: gzip, deflate, br, zstd
    Accept-Language: en
    Sec-Fetch-Dest: document
    Sec-Fetch-Mode: navigate
    Sec-Fetch-Site: none
    Sec-Fetch-User: ?1
    Upgrade-Insecure-Requests: 1
    User-Agent: ${USER_AGENT}
    ${SEC_CH}
`)

export const HEADERS_CODE = toHeaders(`
    Accept: */*
    Accept-Encoding: gzip, deflate, br, zstd
    Accept-Language: en
    Priority: u=1
    Sec-Fetch-Dest: script
    Sec-Fetch-Mode: no-cors
    Sec-Fetch-Site: same-site
    User-Agent: ${USER_AGENT}
    ${SEC_CH}
`)

export const HEADERS_WS_DATA = toHeaders(`
    Accept: */*
    Accept-Encoding: gzip, deflate, br, zstd
    Accept-Language: en
    Sec-Fetch-Dest: empty
    Sec-Fetch-Mode: cors
    Sec-Fetch-Site: same-site
    User-Agent: ${USER_AGENT}
    ${SEC_CH}
`)

export const HEADERS_WS = toHeaders(`
    Pragma: no-cache
    Cache-Control: no-cache
    User-Agent: ${USER_AGENT}
    Accept-Encoding: gzip, deflate, br, zstd
    Accept-Language: en
`)
