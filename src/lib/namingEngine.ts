import seedData from '../data/seed-data.json'
import type {
  BirthDateTime,
  ElementBalance,
  FiveElement,
  Gender,
  HanjaChar,
  NameCandidate,
  NameDataset,
  NamingInput,
  NumerologyResult,
  Pillar,
  RecommendationResult,
  SajuAnalysis,
  ScoringRules,
  SyllableEntry,
  YinYang,
} from '../types'

export const defaultDataset = seedData as NameDataset

const ELEMENTS: FiveElement[] = ['목', '화', '토', '금', '수']
const STEMS = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계']
const STEM_ELEMENTS: FiveElement[] = ['목', '목', '화', '화', '토', '토', '금', '금', '수', '수']
const STEM_YINYANG: YinYang[] = ['양', '음', '양', '음', '양', '음', '양', '음', '양', '음']
const BRANCHES = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해']
const BRANCH_ELEMENTS: FiveElement[] = ['수', '토', '목', '목', '토', '화', '화', '토', '금', '금', '토', '수']

const INITIALS = [
  'ㄱ',
  'ㄲ',
  'ㄴ',
  'ㄷ',
  'ㄸ',
  'ㄹ',
  'ㅁ',
  'ㅂ',
  'ㅃ',
  'ㅅ',
  'ㅆ',
  'ㅇ',
  'ㅈ',
  'ㅉ',
  'ㅊ',
  'ㅋ',
  'ㅌ',
  'ㅍ',
  'ㅎ',
]

const SOUND_ELEMENT: Record<string, FiveElement> = {
  ㄱ: '목',
  ㄲ: '목',
  ㅋ: '목',
  ㄴ: '화',
  ㄷ: '화',
  ㄸ: '화',
  ㄹ: '화',
  ㅌ: '화',
  ㅇ: '토',
  ㅎ: '토',
  ㅅ: '금',
  ㅆ: '금',
  ㅈ: '금',
  ㅉ: '금',
  ㅊ: '금',
  ㅁ: '수',
  ㅂ: '수',
  ㅃ: '수',
  ㅍ: '수',
}

const SURNAME_STROKES: Record<string, number> = {
  김: 8,
  이: 7,
  리: 7,
  박: 6,
  최: 11,
  정: 19,
  조: 14,
  강: 9,
  윤: 4,
  장: 11,
  임: 8,
  림: 8,
  한: 17,
  오: 7,
  서: 10,
  신: 5,
  권: 22,
  황: 12,
  안: 6,
  송: 7,
  류: 9,
  유: 9,
  홍: 10,
  전: 6,
  고: 10,
  문: 4,
  손: 10,
  양: 11,
  배: 14,
  백: 5,
  허: 11,
  남: 9,
  심: 8,
}

const MONTH_BOUNDARIES = [
  { month: 2, day: 4, branchIndex: 2, seasonElement: '목' as FiveElement },
  { month: 3, day: 6, branchIndex: 3, seasonElement: '목' as FiveElement },
  { month: 4, day: 5, branchIndex: 4, seasonElement: '토' as FiveElement },
  { month: 5, day: 6, branchIndex: 5, seasonElement: '화' as FiveElement },
  { month: 6, day: 6, branchIndex: 6, seasonElement: '화' as FiveElement },
  { month: 7, day: 7, branchIndex: 7, seasonElement: '토' as FiveElement },
  { month: 8, day: 8, branchIndex: 8, seasonElement: '금' as FiveElement },
  { month: 9, day: 8, branchIndex: 9, seasonElement: '금' as FiveElement },
  { month: 10, day: 8, branchIndex: 10, seasonElement: '토' as FiveElement },
  { month: 11, day: 7, branchIndex: 11, seasonElement: '수' as FiveElement },
  { month: 12, day: 7, branchIndex: 0, seasonElement: '수' as FiveElement },
  { month: 1, day: 6, branchIndex: 1, seasonElement: '토' as FiveElement },
]

export function makeDefaultInput(): NamingInput {
  return {
    familyName: '김',
    gender: 'female',
    birthDate: '2026-04-29',
    birthTime: '09:30:00',
    calendarType: 'solar',
    timezone: 'Asia/Seoul',
    nameLength: 2,
    generationChar: '',
    generationPosition: 'none',
    preferredChars: '',
    excludedChars: '',
    styles: ['modern', 'soft'],
  }
}

export function recommendNames(
  rawInput: NamingInput,
  dataset: NameDataset = defaultDataset,
): RecommendationResult {
  const input = normalizeInput(rawInput)
  const saju = analyzeSaju(input)
  const generatedNames = generateHangulNames(input, dataset.syllables, saju)

  const candidates = generatedNames
    .map((name) => buildCandidate(name, input, saju, dataset))
    .filter((candidate): candidate is NameCandidate => candidate !== null)
    .sort((left, right) => {
      if (right.totalScore !== left.totalScore) return right.totalScore - left.totalScore
      return left.hangul.localeCompare(right.hangul, 'ko-KR')
    })
    .slice(0, 24)

  return {
    input,
    saju,
    candidates,
    datasetNotice: dataset.metadata.notice,
  }
}

export function analyzeSaju(input: NamingInput): SajuAnalysis {
  const birth = parseBirth(input)
  const sajuYear = resolveSajuYear(birth)
  const yearIndex = positiveModulo(sajuYear - 4, 60)
  const monthMeta = resolveMonthMeta(birth)
  const monthIndex = estimateMonthPillarIndex(monthMeta.branchIndex, yearIndex)
  const dayIndex = estimateDayPillarIndex(birth.year, birth.month, birth.day)
  const hourIndex = estimateHourPillarIndex(birth.hour, birth.minute, birth.second, dayIndex)

  const pillars = {
    year: makePillar(yearIndex),
    month: makePillar(monthIndex),
    day: makePillar(dayIndex),
    hour: makePillar(hourIndex),
  }

  const elementCounts = emptyElementCounts()
  Object.values(pillars).forEach((pillar) => {
    elementCounts[pillar.stemElement] += 1
    elementCounts[pillar.branchElement] += 1
  })

  const elementBalance = buildElementBalance(elementCounts)
  const neededElements = ELEMENTS.filter((element) => elementBalance[element].grade === '부족')
  const strongElements = ELEMENTS.filter((element) => elementBalance[element].grade === '과다')
  const fallbackNeeded = neededElements.length > 0 ? neededElements : weakestElements(elementCounts)
  const dayMaster = {
    stem: pillars.day.stem,
    element: pillars.day.stemElement,
    yinYang: pillars.day.yinYang,
    label: `${pillars.day.stem}${pillars.day.stemElement}${pillars.day.yinYang}`,
  }

  const notes = [
    '년월일시분초를 모두 사주 계산에 반영합니다.',
    '월주는 24절기 절입일 근사값 기준입니다. 공식 절입 시각 DB를 붙이면 전문가용 정확도로 확장됩니다.',
    input.calendarType === 'lunar'
      ? '음력 입력은 현재 양력 환산 전 단계이므로 참고 계산입니다.'
      : '양력 기준으로 계산했습니다.',
  ]

  return {
    birth,
    pillars,
    eightLetters: `${pillarText(pillars.year)} ${pillarText(pillars.month)} ${pillarText(pillars.day)} ${pillarText(pillars.hour)}`,
    dayMaster,
    elementCounts,
    elementBalance,
    neededElements: fallbackNeeded,
    strongElements,
    seasonElement: monthMeta.seasonElement,
    notes,
  }
}

export function filterLegalHanja(hanja: HanjaChar[]): HanjaChar[] {
  return hanja.filter((entry) => entry.legal)
}

function normalizeInput(input: NamingInput): NamingInput {
  return {
    ...input,
    familyName: input.familyName.trim().slice(0, 2) || '김',
    birthTime: normalizeBirthTime(input.birthTime),
    generationChar: input.generationChar.trim().slice(0, 1),
    preferredChars: input.preferredChars.trim(),
    excludedChars: input.excludedChars.trim(),
    styles: input.styles.length > 0 ? input.styles : ['modern'],
  }
}

function normalizeBirthTime(time: string): string {
  const [hour = '12', minute = '00', second = '00'] = time.split(':')
  return [hour, minute, second].map((value) => value.padStart(2, '0')).join(':')
}

function parseBirth(input: NamingInput): BirthDateTime {
  const [yearRaw, monthRaw, dayRaw] = input.birthDate.split('-').map(Number)
  const [hourRaw, minuteRaw, secondRaw] = normalizeBirthTime(input.birthTime).split(':').map(Number)
  return {
    year: yearRaw || 2026,
    month: monthRaw || 1,
    day: dayRaw || 1,
    hour: Number.isFinite(hourRaw) ? hourRaw : 12,
    minute: Number.isFinite(minuteRaw) ? minuteRaw : 0,
    second: Number.isFinite(secondRaw) ? secondRaw : 0,
  }
}

function makePillar(index: number): Pillar {
  const stemIndex = positiveModulo(index, 10)
  const branchIndex = positiveModulo(index, 12)
  return {
    stem: STEMS[stemIndex],
    branch: BRANCHES[branchIndex],
    stemElement: STEM_ELEMENTS[stemIndex],
    branchElement: BRANCH_ELEMENTS[branchIndex],
    yinYang: STEM_YINYANG[stemIndex],
  }
}

function pillarText(pillar: Pillar): string {
  return `${pillar.stem}${pillar.branch}`
}

function resolveSajuYear(birth: BirthDateTime): number {
  if (birth.month < 2) return birth.year - 1
  if (birth.month === 2 && birth.day < 4) return birth.year - 1
  return birth.year
}

function resolveMonthMeta(birth: BirthDateTime): { branchIndex: number; seasonElement: FiveElement } {
  let active = MONTH_BOUNDARIES[MONTH_BOUNDARIES.length - 1]
  for (const boundary of MONTH_BOUNDARIES) {
    const boundaryValue = boundary.month * 100 + boundary.day
    const birthValue = birth.month * 100 + birth.day
    if (birthValue >= boundaryValue) active = boundary
  }
  return active
}

function estimateMonthPillarIndex(monthBranchIndex: number, yearIndex: number): number {
  const yearStemIndex = positiveModulo(yearIndex, 10)
  const tigerMonthStem = positiveModulo(yearStemIndex * 2 + 2, 10)
  const offsetFromTiger = positiveModulo(monthBranchIndex - 2, 12)
  const stemIndex = positiveModulo(tigerMonthStem + offsetFromTiger, 10)
  return combineStemBranch(stemIndex, monthBranchIndex)
}

function estimateDayPillarIndex(year: number, month: number, day: number): number {
  const julianDay = toJulianDay(year, month, day)
  return positiveModulo(Math.floor(julianDay + 49), 60)
}

function estimateHourPillarIndex(hour: number, minute: number, second: number, dayIndex: number): number {
  const decimalHour = hour + minute / 60 + second / 3600
  const branchIndex = positiveModulo(Math.floor((decimalHour + 1) / 2), 12)
  const dayStemIndex = positiveModulo(dayIndex, 10)
  const ratHourStem = positiveModulo(dayStemIndex * 2, 10)
  const stemIndex = positiveModulo(ratHourStem + branchIndex, 10)
  return combineStemBranch(stemIndex, branchIndex)
}

function combineStemBranch(stemIndex: number, branchIndex: number): number {
  for (let index = 0; index < 60; index += 1) {
    if (index % 10 === stemIndex && index % 12 === branchIndex) return index
  }
  return stemIndex
}

function toJulianDay(year: number, month: number, day: number): number {
  const adjustedMonth = month <= 2 ? month + 12 : month
  const adjustedYear = month <= 2 ? year - 1 : year
  const century = Math.floor(adjustedYear / 100)
  const correction = 2 - century + Math.floor(century / 4)
  return (
    Math.floor(365.25 * (adjustedYear + 4716)) +
    Math.floor(30.6001 * (adjustedMonth + 1)) +
    day +
    correction -
    1524.5
  )
}

function buildElementBalance(counts: Record<FiveElement, number>): Record<FiveElement, ElementBalance> {
  const total = ELEMENTS.reduce((sum, element) => sum + counts[element], 0)
  return ELEMENTS.reduce(
    (balance, element) => {
      const count = counts[element]
      const percent = total > 0 ? Math.round((count / total) * 100) : 0
      balance[element] = {
        count,
        percent,
        grade: count <= 1 ? '부족' : count >= 3 ? '과다' : '보통',
      }
      return balance
    },
    {} as Record<FiveElement, ElementBalance>,
  )
}

function weakestElements(counts: Record<FiveElement, number>): FiveElement[] {
  const minCount = Math.min(...ELEMENTS.map((element) => counts[element]))
  return ELEMENTS.filter((element) => counts[element] === minCount)
}

function generateHangulNames(input: NamingInput, syllables: SyllableEntry[], saju: SajuAnalysis): string[] {
  const preferredSet = new Set([...input.preferredChars])
  const excludedSet = new Set([...input.excludedChars])
  const usable = syllables.filter((entry) => {
    if (excludedSet.has(entry.hangul)) return false
    if (!genderMatches(input.gender, entry.genderBias)) return false
    const matchesStyle = input.styles.some((style) => entry.styles.includes(style))
    const matchesSaju = saju.neededElements.includes(entry.element)
    return matchesStyle || matchesSaju || preferredSet.has(entry.hangul)
  })

  const names = new Set<string>()

  usable.forEach((first) => {
    usable.forEach((second) => {
      if (input.nameLength === 2) {
        const base = [first.hangul, second.hangul]
        if (base[0] === base[1]) return
        applyGeneration(input, base)
        if (base.every((letter) => letter && !excludedSet.has(letter))) {
          names.add(base.join(''))
        }
        return
      }

      usable.slice(0, 10).forEach((third) => {
        const base = [first.hangul, second.hangul, third.hangul]
        if (new Set(base).size < 2) return
        applyGeneration(input, base)
        if (base.every((letter) => letter && !excludedSet.has(letter))) {
          names.add(base.join(''))
        }
      })
    })
  })

  preferredSet.forEach((preferred) => {
    usable.forEach((entry) => {
      if (!excludedSet.has(preferred) && preferred !== entry.hangul) {
        names.add(`${preferred}${entry.hangul}`)
        names.add(`${entry.hangul}${preferred}`)
      }
    })
  })

  return [...names].filter((name) => name.length === input.nameLength)
}

function applyGeneration(input: NamingInput, syllables: string[]): void {
  if (!input.generationChar || input.generationPosition === 'none') return
  if (input.generationPosition === 'first') {
    syllables[0] = input.generationChar
  } else {
    syllables[syllables.length - 1] = input.generationChar
  }
}

function genderMatches(target: Gender, bias: Gender): boolean {
  return bias === 'neutral' || target === 'neutral' || bias === target
}

function buildCandidate(
  hangul: string,
  input: NamingInput,
  saju: SajuAnalysis,
  dataset: NameDataset,
): NameCandidate | null {
  const syllables = [...hangul]
  const hanja = syllables.map((syllable) => pickBestHanja(syllable, saju.neededElements, dataset.hanja))
  if (hanja.some((entry) => entry === null)) return null

  const selectedHanja = hanja as HanjaChar[]
  const numerology = calculateNumerology(input.familyName, selectedHanja, dataset.scoringRules)
  const badWordWarnings = findBadWordWarnings(`${input.familyName}${hangul}`, dataset)
  const scoreBreakdown = calculateScoreBreakdown(
    hangul,
    selectedHanja,
    input,
    saju,
    numerology,
    dataset,
    badWordWarnings.length,
  )
  const totalScore = clampScore(
    Object.values(scoreBreakdown).reduce((sum, score) => sum + score, 0),
  )
  const popularity = getPopularityLabel(hangul, input.gender, dataset)
  const soundReference = describeSoundReference(hangul, saju.neededElements)
  const strengths = buildStrengths(selectedHanja, saju, numerology, popularity, scoreBreakdown)
  const cautions = buildCautions(badWordWarnings, numerology, popularity, soundReference, saju)

  return {
    id: `${hangul}-${selectedHanja.map((entry) => entry.char).join('')}`,
    hangul,
    fullHangul: `${input.familyName}${hangul}`,
    hanja: selectedHanja,
    hanjaText: selectedHanja.map((entry) => entry.char).join(''),
    meanings: selectedHanja.map((entry) => `${entry.char}: ${entry.meaning}`).join(' / '),
    totalScore,
    scoreBreakdown,
    strengths,
    cautions,
    numerology,
    popularityLabel: popularity,
    soundReference,
  }
}

function pickBestHanja(
  syllable: string,
  neededElements: FiveElement[],
  hanja: HanjaChar[],
): HanjaChar | null {
  const legal = filterLegalHanja(hanja).filter((entry) => entry.hangul === syllable)
  if (legal.length === 0) return null

  return legal
    .map((entry) => {
      const elementBonus = neededElements.includes(entry.element) ? 30 : 0
      const meaningBonus = entry.tags.some((tag) => ['길상', '지혜', '은혜', '뛰어남', '품격'].includes(tag))
        ? 12
        : 5
      const strokeBonus = entry.originalStrokes >= 4 && entry.originalStrokes <= 17 ? 8 : 0
      return { entry, score: elementBonus + meaningBonus + strokeBonus }
    })
    .sort((left, right) => right.score - left.score || left.entry.originalStrokes - right.entry.originalStrokes)[0]
    .entry
}

function calculateNumerology(
  familyName: string,
  hanja: HanjaChar[],
  rules: ScoringRules,
): NumerologyResult {
  const surnameStrokes = SURNAME_STROKES[familyName[0]] ?? 8
  const originalNameStrokes = hanja.map((entry) => entry.originalStrokes)
  const first = originalNameStrokes[0] ?? 0
  const last = originalNameStrokes[originalNameStrokes.length - 1] ?? 0
  const won = originalNameStrokes.reduce((sum, stroke) => sum + stroke, 0)
  const hyeong = surnameStrokes + first
  const i = surnameStrokes + last
  const jeong = surnameStrokes + won
  const numbers = [won, hyeong, i, jeong]
  const labels = numbers.map((number) => numberLabel(number, rules))
  return {
    surnameStrokes,
    originalNameStrokes,
    won,
    hyeong,
    i,
    jeong,
    goodCount: labels.filter((label) => label === '길').length,
    labels,
  }
}

function numberLabel(number: number, rules: ScoringRules): '길' | '주의' | '보통' {
  const normalized = normalizeNumerologyNumber(number)
  if (rules.auspiciousNumbers.includes(normalized)) return '길'
  if (rules.cautionNumbers.includes(normalized)) return '주의'
  return '보통'
}

function normalizeNumerologyNumber(number: number): number {
  if (number <= 81) return number
  return ((number - 1) % 81) + 1
}

function calculateScoreBreakdown(
  hangul: string,
  hanja: HanjaChar[],
  input: NamingInput,
  saju: SajuAnalysis,
  numerology: NumerologyResult,
  dataset: NameDataset,
  badWordCount: number,
): Record<keyof ScoringRules['weights'], number> {
  const weights = dataset.scoringRules.weights
  const hanjaElements = hanja.map((entry) => entry.element)
  const neededMatches = hanjaElements.filter((element) => saju.neededElements.includes(element)).length
  const strongHits = hanjaElements.filter((element) => saju.strongElements.includes(element)).length
  const sajuRatio = Math.max(0, (neededMatches - strongHits * 0.35) / Math.max(1, hanja.length))
  const sajuScore = sajuRatio * weights.saju
  const meaningScore =
    (hanja.filter((entry) => entry.tags.some((tag) => tag !== '비추천')).length / hanja.length) *
    weights.hanjaMeaning
  const numerologyScore = (numerology.goodCount / 4) * weights.numerology
  const yinYangScore = calculateYinYangScore(numerology.originalNameStrokes, weights.yinYang)
  const soundScore = calculateSoundScore(hangul, saju.neededElements, weights.soundReference)
  const modernityScore = calculateModernityScore(hangul, input.gender, dataset, badWordCount, weights.modernity)
  const preferenceScore = calculatePreferenceScore(hangul, input, weights.preference)

  return {
    saju: roundScore(sajuScore),
    hanjaMeaning: roundScore(meaningScore),
    numerology: roundScore(numerologyScore),
    yinYang: roundScore(yinYangScore),
    soundReference: roundScore(soundScore),
    modernity: roundScore(modernityScore),
    preference: roundScore(preferenceScore),
  }
}

function calculateYinYangScore(strokes: number[], maxScore: number): number {
  const parity = strokes.map((stroke) => stroke % 2)
  return new Set(parity).size > 1 ? maxScore : maxScore * 0.55
}

function calculateSoundScore(hangul: string, neededElements: FiveElement[], maxScore: number): number {
  const soundElements = [...hangul].map((letter) => SOUND_ELEMENT[getInitialConsonant(letter)] ?? '토')
  const matched = soundElements.filter((element) => neededElements.includes(element)).length
  return (matched / Math.max(1, soundElements.length)) * maxScore
}

function calculateModernityScore(
  hangul: string,
  gender: Gender,
  dataset: NameDataset,
  badWordCount: number,
  maxScore: number,
): number {
  const popularity = dataset.popularity.find(
    (entry) => entry.name === hangul && (entry.gender === gender || entry.gender === 'neutral'),
  )
  const rankScore = popularity ? (popularity.rank <= 3 ? 0.68 : popularity.rank <= 15 ? 0.92 : 0.8) : 0.74
  const badWordPenalty = badWordCount > 0 ? 0.35 : 1
  const pronunciationScore = hasRepeatedVowels(hangul) ? 0.88 : 1
  return maxScore * rankScore * badWordPenalty * pronunciationScore
}

function calculatePreferenceScore(hangul: string, input: NamingInput, maxScore: number): number {
  const preferred = [...input.preferredChars].filter((letter) => hangul.includes(letter)).length
  const generation = input.generationChar && hangul.includes(input.generationChar) ? 1 : 0
  const styleBonus = input.styles.length > 0 ? 0.35 : 0
  return Math.min(maxScore, (preferred + generation) * 3 + styleBonus * maxScore + 3)
}

function findBadWordWarnings(fullName: string, dataset: NameDataset): string[] {
  return dataset.badWords
    .filter((entry) => fullName.includes(entry.pattern))
    .map((entry) => `${entry.pattern}: ${entry.reason}`)
}

function getPopularityLabel(hangul: string, gender: Gender, dataset: NameDataset): string {
  const popularity = dataset.popularity.find(
    (entry) => entry.name === hangul && (entry.gender === gender || entry.gender === 'neutral'),
  )
  if (!popularity) return '공식 순위권 밖 또는 희소 이름'
  if (popularity.rank <= 3) return `상위 ${popularity.rank}위권이라 매우 익숙합니다.`
  if (popularity.rank <= 15) return `상위 ${popularity.rank}위권이라 친숙합니다.`
  return `순위 ${popularity.rank}위권으로 적당히 알려져 있습니다.`
}

function describeSoundReference(hangul: string, neededElements: FiveElement[]): string {
  const parts = [...hangul].map((letter) => {
    const initial = getInitialConsonant(letter)
    return `${letter}(${SOUND_ELEMENT[initial] ?? '토'})`
  })
  const hasMatch = parts.some((part) => neededElements.some((element) => part.includes(element)))
  return `발음오행 참고: ${parts.join(', ')}${hasMatch ? ' / 보완 오행과 일부 맞습니다.' : ' / 낮은 가중치 참고 항목입니다.'}`
}

function buildStrengths(
  hanja: HanjaChar[],
  saju: SajuAnalysis,
  numerology: NumerologyResult,
  popularity: string,
  scoreBreakdown: Record<keyof ScoringRules['weights'], number>,
): string[] {
  const strengths = [
    `사주팔자: ${saju.eightLetters}, 일간 ${saju.dayMaster.label}`,
    `보완 오행: ${saju.neededElements.join(', ')} 중 ${hanja.map((entry) => entry.element).join(', ')} 반영`,
    `한자 뜻: ${hanja.map((entry) => entry.meaning).join(', ')}`,
    `수리 길격 ${numerology.goodCount}/4`,
    popularity,
  ]

  if (scoreBreakdown.saju >= 14) strengths.push('부족 오행 보완 점수가 높습니다.')
  if (scoreBreakdown.modernity >= 16) strengths.push('현대 어감 점수가 안정적입니다.')
  return strengths
}

function buildCautions(
  badWordWarnings: string[],
  numerology: NumerologyResult,
  popularity: string,
  soundReference: string,
  saju: SajuAnalysis,
): string[] {
  const cautions = [...badWordWarnings]
  if (saju.strongElements.length > 0) cautions.push(`과다 오행(${saju.strongElements.join(', ')})은 이름에서 과하게 더하지 않는 편이 좋습니다.`)
  if (numerology.goodCount < 2) cautions.push('수리사격 길격 수가 낮아 재검토가 좋습니다.')
  if (popularity.includes('매우')) cautions.push('흔한 이름을 피하고 싶다면 후순위 후보도 보십시오.')
  cautions.push(soundReference)
  return cautions
}

function getInitialConsonant(letter: string): string {
  const code = letter.charCodeAt(0) - 0xac00
  if (code < 0 || code > 11171) return letter
  return INITIALS[Math.floor(code / 588)] ?? letter
}

function hasRepeatedVowels(hangul: string): boolean {
  const vowels = [...hangul].map((letter) => {
    const code = letter.charCodeAt(0) - 0xac00
    if (code < 0 || code > 11171) return ''
    return Math.floor((code % 588) / 28)
  })
  return new Set(vowels).size === 1
}

function emptyElementCounts(): Record<FiveElement, number> {
  return {
    목: 0,
    화: 0,
    토: 0,
    금: 0,
    수: 0,
  }
}

function positiveModulo(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor
}

function roundScore(score: number): number {
  return Math.round(score * 10) / 10
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)))
}
