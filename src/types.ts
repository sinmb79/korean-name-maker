export type FiveElement = '목' | '화' | '토' | '금' | '수'
export type Gender = 'male' | 'female' | 'neutral'
export type CalendarType = 'solar' | 'lunar'
export type NameStyle = 'modern' | 'classic' | 'soft' | 'strong' | 'bright'

export interface HanjaChar {
  char: string
  hangul: string
  meaning: string
  strokes: number
  originalStrokes: number
  element: FiveElement
  legal: boolean
  tone: string
  tags: string[]
}

export interface SyllableEntry {
  hangul: string
  element: FiveElement
  tone: string
  genderBias: Gender
  popularity: number
  styles: NameStyle[]
}

export interface PopularityEntry {
  name: string
  gender: Gender
  rank: number
  count: number
}

export interface BadWordEntry {
  pattern: string
  reason: string
}

export interface ScoringRules {
  weights: {
    saju: number
    hanjaMeaning: number
    numerology: number
    yinYang: number
    soundReference: number
    modernity: number
    preference: number
  }
  auspiciousNumbers: number[]
  cautionNumbers: number[]
}

export interface NameDataset {
  metadata: {
    schemaVersion: number
    legalHanjaVersion: string
    notice: string
  }
  hanja: HanjaChar[]
  syllables: SyllableEntry[]
  popularity: PopularityEntry[]
  badWords: BadWordEntry[]
  scoringRules: ScoringRules
}

export interface NamingInput {
  familyName: string
  gender: Gender
  birthDate: string
  birthTime: string
  calendarType: CalendarType
  timezone: string
  nameLength: 2 | 3
  generationChar: string
  generationPosition: 'none' | 'first' | 'last'
  preferredChars: string
  excludedChars: string
  styles: NameStyle[]
}

export interface Pillar {
  stem: string
  branch: string
  element: FiveElement
}

export interface SajuAnalysis {
  pillars: {
    year: Pillar
    month: Pillar
    day: Pillar
    hour: Pillar
  }
  elementCounts: Record<FiveElement, number>
  neededElements: FiveElement[]
  notes: string[]
}

export interface NumerologyResult {
  surnameStrokes: number
  originalNameStrokes: number[]
  won: number
  hyeong: number
  i: number
  jeong: number
  goodCount: number
  labels: string[]
}

export interface NameCandidate {
  id: string
  hangul: string
  fullHangul: string
  hanja: HanjaChar[]
  hanjaText: string
  meanings: string
  totalScore: number
  scoreBreakdown: Record<keyof ScoringRules['weights'], number>
  strengths: string[]
  cautions: string[]
  numerology: NumerologyResult
  popularityLabel: string
  soundReference: string
}

export interface RecommendationResult {
  input: NamingInput
  saju: SajuAnalysis
  candidates: NameCandidate[]
  datasetNotice: string
}
