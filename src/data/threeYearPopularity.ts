import type { Gender } from '../types'

export interface ThreeYearPopularityEntry {
  rank: number
  name: string
  count: number
  totalCount: number
  gender: Gender
  years: Record<2023 | 2024 | 2025, number>
}

export const POPULARITY_SOURCE = {
  range: '2023~2025',
  label: '대법원 전자가족관계등록시스템 출생신고 기반 공개 집계',
  url: 'https://uncle.tools/names/ranking/2025',
}

export const THREE_YEAR_POPULARITY: Record<Gender, ThreeYearPopularityEntry[]> = {
  male: [
    { rank: 1, name: '이준', count: 6010, totalCount: 6028, gender: 'male', years: { 2023: 2113, 2024: 1912, 2025: 2003 } },
    { rank: 2, name: '도윤', count: 5928, totalCount: 6174, gender: 'male', years: { 2023: 1961, 2024: 1809, 2025: 2404 } },
    { rank: 3, name: '하준', count: 5630, totalCount: 5636, gender: 'male', years: { 2023: 1884, 2024: 1803, 2025: 1949 } },
    { rank: 4, name: '서준', count: 4905, totalCount: 4911, gender: 'male', years: { 2023: 1712, 2024: 1564, 2025: 1635 } },
    { rank: 5, name: '시우', count: 4709, totalCount: 5215, gender: 'male', years: { 2023: 1645, 2024: 1692, 2025: 1878 } },
    { rank: 6, name: '도현', count: 4468, totalCount: 4592, gender: 'male', years: { 2023: 1406, 2024: 1422, 2025: 1764 } },
    { rank: 7, name: '은우', count: 4289, totalCount: 5256, gender: 'male', years: { 2023: 1873, 2024: 1763, 2025: 1620 } },
    { rank: 8, name: '이안', count: 4236, totalCount: 5453, gender: 'male', years: { 2023: 1645, 2024: 1689, 2025: 2119 } },
    { rank: 9, name: '선우', count: 4170, totalCount: 4665, gender: 'male', years: { 2023: 1439, 2024: 1581, 2025: 1645 } },
    { rank: 10, name: '유준', count: 4166, totalCount: 4175, gender: 'male', years: { 2023: 1423, 2024: 1437, 2025: 1315 } },
  ],
  female: [
    { rank: 1, name: '서아', count: 6129, totalCount: 6135, gender: 'female', years: { 2023: 2108, 2024: 1961, 2025: 2066 } },
    { rank: 2, name: '이서', count: 5499, totalCount: 5926, gender: 'female', years: { 2023: 1974, 2024: 2054, 2025: 1898 } },
    { rank: 3, name: '하린', count: 4581, totalCount: 4627, gender: 'female', years: { 2023: 1217, 2024: 1528, 2025: 1882 } },
    { rank: 4, name: '서윤', count: 4426, totalCount: 4728, gender: 'female', years: { 2023: 1367, 2024: 1355, 2025: 2006 } },
    { rank: 5, name: '하윤', count: 4412, totalCount: 4951, gender: 'female', years: { 2023: 1555, 2024: 1525, 2025: 1871 } },
    { rank: 6, name: '아윤', count: 4393, totalCount: 4446, gender: 'female', years: { 2023: 1528, 2024: 1428, 2025: 1490 } },
    { rank: 7, name: '아린', count: 4231, totalCount: 4240, gender: 'female', years: { 2023: 1294, 2024: 1309, 2025: 1637 } },
    { rank: 8, name: '지유', count: 4181, totalCount: 4355, gender: 'female', years: { 2023: 1354, 2024: 1489, 2025: 1512 } },
    { rank: 9, name: '지아', count: 4164, totalCount: 4168, gender: 'female', years: { 2023: 1519, 2024: 1392, 2025: 1257 } },
    { rank: 10, name: '지안', count: 4062, totalCount: 5895, gender: 'female', years: { 2023: 1777, 2024: 1937, 2025: 2181 } },
  ],
  neutral: [
    { rank: 1, name: '도윤', count: 6174, totalCount: 6174, gender: 'neutral', years: { 2023: 1961, 2024: 1809, 2025: 2404 } },
    { rank: 2, name: '서아', count: 6135, totalCount: 6135, gender: 'neutral', years: { 2023: 2108, 2024: 1961, 2025: 2066 } },
    { rank: 3, name: '이현', count: 6096, totalCount: 6096, gender: 'neutral', years: { 2023: 1825, 2024: 2057, 2025: 2214 } },
    { rank: 4, name: '이준', count: 6028, totalCount: 6028, gender: 'neutral', years: { 2023: 2113, 2024: 1912, 2025: 2003 } },
    { rank: 5, name: '이서', count: 5926, totalCount: 5926, gender: 'neutral', years: { 2023: 1974, 2024: 2054, 2025: 1898 } },
    { rank: 6, name: '지안', count: 5895, totalCount: 5895, gender: 'neutral', years: { 2023: 1777, 2024: 1937, 2025: 2181 } },
    { rank: 7, name: '하준', count: 5636, totalCount: 5636, gender: 'neutral', years: { 2023: 1884, 2024: 1803, 2025: 1949 } },
    { rank: 8, name: '지우', count: 5508, totalCount: 5508, gender: 'neutral', years: { 2023: 1843, 2024: 1799, 2025: 1866 } },
    { rank: 9, name: '이안', count: 5453, totalCount: 5453, gender: 'neutral', years: { 2023: 1645, 2024: 1689, 2025: 2119 } },
    { rank: 10, name: '은우', count: 5256, totalCount: 5256, gender: 'neutral', years: { 2023: 1873, 2024: 1763, 2025: 1620 } },
  ],
}

export function getThreeYearPopularity(gender: Gender): ThreeYearPopularityEntry[] {
  return THREE_YEAR_POPULARITY[gender]
}

export function getThreeYearRank(name: string, gender: Gender): ThreeYearPopularityEntry | undefined {
  return THREE_YEAR_POPULARITY[gender].find((entry) => entry.name === name)
}
