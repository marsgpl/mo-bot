export function toHeaders(input: string): Record<string, string> {
    const headers: Record<string, string> = {}

    input.split('\n').forEach(line => {
        const colonIndex = line.indexOf(':')
        if (colonIndex == -1) { return }
        const key = line.substring(0, colonIndex).trim()
        const value = line.substring(colonIndex + 1).trim()
        headers[key] = value
    })

    return headers
}
