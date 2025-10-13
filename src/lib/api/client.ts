export interface JsonResult<T = any> {
  success: boolean
  data?: T
  error?: string
  [key: string]: any
}

export async function jsonFetch<T = any>(url: string, init?: RequestInit): Promise<JsonResult<T>> {
  const res = await fetch(url, init)
  let body: any = null
  try {
    body = await res.json()
  } catch {
    // ignore
  }

  if (!res.ok) {
    return { success: false, error: body?.error || res.statusText || 'Request failed', ...body }
  }
  return { success: true, ...body }
}

