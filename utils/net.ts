export async function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit & { timeout?: number }) {
  const { timeout = 2000, ...rest } = init || {}
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)
  try {
    return await fetch(input, { ...rest, signal: controller.signal })
  } finally {
    clearTimeout(id)
  }
}

export async function safeJson<T = any>(res: Response | null | undefined, fallback: T): Promise<T> {
  if (!res || !('ok' in res) || !res.ok) return fallback
  try { return (await res.json()) as T } catch { return fallback }
}
