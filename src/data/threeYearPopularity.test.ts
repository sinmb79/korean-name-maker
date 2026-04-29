import { describe, expect, it } from 'vitest'
import { getThreeYearPopularity, getThreeYearRank } from './threeYearPopularity'

describe('three-year popularity data', () => {
  it('shows gender-specific top names for 2023 to 2025', () => {
    expect(getThreeYearPopularity('male')[0]).toMatchObject({ name: '이준', count: 6010 })
    expect(getThreeYearPopularity('female')[0]).toMatchObject({ name: '서아', count: 6129 })
    expect(getThreeYearPopularity('neutral')[0]).toMatchObject({ name: '도윤', count: 6174 })
  })

  it('can find the selected candidate rank', () => {
    expect(getThreeYearRank('도윤', 'male')?.rank).toBe(2)
    expect(getThreeYearRank('서아', 'female')?.rank).toBe(1)
  })
})
