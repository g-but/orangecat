export interface JsonResult<T = any> {
  success: boolean
  data?: T
  error?: string
  [key: string]: any
}

export async function jsonFetch<T = any>(url: string, init?: RequestInit): Promise<JsonResult<T>> {
  const res = await fetch(url, init)
  const contentType = res.headers.get('content-type') || ''
  let body: any = null
  try {
    if (contentType.includes('application/json')) {
      body = await res.json()
    } else {
      const text = await res.text()
      body = { text }
    }
  } catch (e) {
    body = { error: 'Invalid server response' }
  }

  if (!res.ok) {
    const friendly = body?.error || body?.message || body?.text || res.statusText || 'Request failed'
    return { success: false, error: friendly, status: res.status, ...body }
  }
  return { success: true, status: res.status, ...body }
}
