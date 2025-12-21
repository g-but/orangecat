export function getPagination(url: string, opts?: { defaultLimit?: number; maxLimit?: number }) {
  const u = new URL(url)
  const def = opts?.defaultLimit ?? 20
  const max = opts?.maxLimit ?? 100
  const limitRaw = parseInt(u.searchParams.get('limit') || `${def}`)
  const offsetRaw = parseInt(u.searchParams.get('offset') || '0')
  const limit = isFinite(limitRaw) ? Math.max(1, Math.min(max, limitRaw)) : def
  const offset = isFinite(offsetRaw) ? Math.max(0, offsetRaw) : 0
  return { limit, offset }
}

export function getString(url: string, key: string) {
  const val = new URL(url).searchParams.get(key)
  return val ?? undefined
}

