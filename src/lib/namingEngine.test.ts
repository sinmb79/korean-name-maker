import { describe, expect, it } from 'vitest'
import { analyzeSaju, defaultDataset, filterLegalHanja, makeDefaultInput, recommendNames } from './namingEngine'

describe('naming engine', () => {
  it('removes non-legal hanja before recommendation', () => {
    const legal = filterLegalHanja(defaultDataset.hanja)

    expect(legal.some((entry) => entry.char === '龘')).toBe(false)
    expect(legal.every((entry) => entry.legal)).toBe(true)
  })

  it('returns deterministic recommendations for the same birth input', () => {
    const input = {
      ...makeDefaultInput(),
      familyName: '김',
      birthDate: '2026-04-29',
      birthTime: '09:30',
      preferredChars: '서',
    }

    const first = recommendNames(input)
    const second = recommendNames(input)

    expect(first.candidates.map((candidate) => candidate.id)).toEqual(second.candidates.map((candidate) => candidate.id))
    expect(first.candidates[0]?.totalScore).toBe(second.candidates[0]?.totalScore)
  })

  it('computes five-element gaps for saju balancing', () => {
    const saju = analyzeSaju({
      ...makeDefaultInput(),
      birthDate: '2026-04-29',
      birthTime: '09:30',
    })

    expect(Object.keys(saju.elementCounts).sort()).toEqual(['금', '목', '수', '토', '화'].sort())
    expect(saju.neededElements.length).toBeGreaterThan(0)
  })

  it('builds candidates with hanja, scoring, and printable cautions', () => {
    const result = recommendNames(makeDefaultInput())
    const first = result.candidates[0]

    expect(first).toBeDefined()
    expect(first?.hanjaText.length).toBeGreaterThan(0)
    expect(first?.totalScore).toBeGreaterThan(0)
    expect(first?.cautions.some((text) => text.includes('발음오행'))).toBe(true)
  })
})
