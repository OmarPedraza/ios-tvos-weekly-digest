import { describe, it, expect, vi } from 'vitest'
import { withRetry } from '../utils/retry.js'

describe('withRetry', () => {
  it('reintenta hasta que tiene éxito', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue('ok')

    const result = await withRetry(fn, { retries: 2 })

    expect(result).toBe('ok')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('lanza error tras agotar retries', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('fail'))

    await expect(
      withRetry(fn, { retries: 2 })
    ).rejects.toThrow('fail')

    expect(fn).toHaveBeenCalledTimes(3)
  })
})