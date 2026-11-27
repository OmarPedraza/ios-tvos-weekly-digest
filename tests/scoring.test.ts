import { describe, it, expect } from 'vitest'
import { scoreItem } from '../utils/scoring.js'

describe('scoreItem', () => {
  it('da mayor score a items recientes', () => {
    const recent = scoreItem({ date: new Date() })
    const old = scoreItem({ date: new Date('2020-01-01') })

    expect(recent).toBeGreaterThan(old)
  })
})