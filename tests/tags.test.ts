import { describe, it, expect } from 'vitest'
import { extractTags } from '../utils/tags.js'

describe('extractTags', () => {
  it('detecta tags básicos', () => {
    const tags = extractTags('New SwiftUI feature released')

    expect(tags).toContain('swiftui')
  })
})