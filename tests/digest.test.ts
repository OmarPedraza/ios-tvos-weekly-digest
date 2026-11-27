import { describe, it, expect, vi } from 'vitest'
import { generateDigest } from '../digest.js'

describe('generateDigest', () => {
  it('genera digest con sources mockeados', async () => {
    const mockSources = [
      vi.fn().mockResolvedValue([
        { title: 'Test', date: new Date() }
      ])
    ]

    const result = await generateDigest(mockSources)

    expect(result.items.length).toBeGreaterThan(0)
  })
})