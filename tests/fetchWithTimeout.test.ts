import { describe, it, expect, vi } from 'vitest'
import { fetchWithTimeout } from '../utils/fetchWithTimeout.js'

describe('fetchWithTimeout', () => {
  it('devuelve respuesta si no hay timeout', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    })

    const res = await fetchWithTimeout('http://test.com', 1000)

    expect(res.ok).toBe(true)
  })

  it('lanza error en timeout', async () => {
    vi.useFakeTimers()

    global.fetch = vi.fn<[], Promise<Response>>(
      () => new Promise(() => { })
    )

    const promise = fetchWithTimeout(
      'http://test.com',
      {},
      1000
    )

    vi.advanceTimersByTime(2000)

    await expect(promise).rejects.toThrow()

    vi.useRealTimers()
  })
})