// Simple global concurrency limiter + fetch timeout helper for Reddit calls
// This prevents long tails and 429s from excessive parallelism.

let active = 0
const queue: Array<() => void> = []
const MAX_CONCURRENCY = 2 // keep small to avoid Reddit rate limits

export async function withRedditLimit<T>(fn: () => Promise<T>): Promise<T> {
  if (active >= MAX_CONCURRENCY) {
    await new Promise<void>(resolve => queue.push(resolve))
  }
  active++
  try {
    return await fn()
  } finally {
    active--
    const next = queue.shift()
    if (next) next()
  }
}

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: RequestInit & { timeoutMs?: number },
  timeoutMs: number = (init?.timeoutMs ?? 6000)
): Promise<Response> {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(input, { ...(init || {}), signal: controller.signal })
    return res
  } finally {
    clearTimeout(id)
  }
}

