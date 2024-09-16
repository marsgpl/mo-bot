export function toOrigin(url: string): string {
    const parts = new URL(url)
    return parts.protocol + '//' + parts.hostname
}
