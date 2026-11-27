import { describe, it, expect } from 'vitest'
import { groupBySection } from '../utils/sections.js'

describe('groupBySection', () => {
  it('agrupa correctamente por categoría', () => {
    const items = [
      { section: 'news' },
      { section: 'tools' },
    ]

    const result = groupBySection(items)

    expect(result.news.length).toBe(1)
    expect(result.tools.length).toBe(1)
  })
})