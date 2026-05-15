import type { Section } from "./utils/sections.js"

export interface DigestItem {
  date: Date
  score: number
  readonly section: Section
  source?: string
  summary?: string
  title?: string
  url?: string
  tags: string[]
}

export interface SourceItem {
  date: Date
  excerpt?: string
  source?: string
  title?: string
  url?: string
}
