import { useEffect, useMemo, useState } from 'react'
import {
  Clipboard,
  Download,
  FileText,
  Printer,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import './App.css'
import { getThreeYearPopularity, getThreeYearRank, POPULARITY_SOURCE } from './data/threeYearPopularity'
import { loadDataset } from './lib/tauriDataset'
import { makeDefaultInput, recommendNames } from './lib/namingEngine'
import type { NameCandidate, NameDataset, NameStyle, NamingInput, RecommendationResult } from './types'

const STYLE_OPTIONS: Array<{ value: NameStyle; label: string }> = [
  { value: 'modern', label: '현대' },
  { value: 'classic', label: '전통' },
  { value: 'soft', label: '부드러움' },
  { value: 'strong', label: '단단함' },
  { value: 'bright', label: '밝음' },
]

function App() {
  const [dataset, setDataset] = useState<NameDataset | null>(null)
  const [input, setInput] = useState<NamingInput>(() => makeDefaultInput())
  const [result, setResult] = useState<RecommendationResult | null>(null)
  const [selectedId, setSelectedId] = useState('')
  const [status, setStatus] = useState('데이터 준비 중')

  useEffect(() => {
    loadDataset().then((loaded) => {
      const defaultInput = makeDefaultInput()
      const firstResult = recommendNames(defaultInput, loaded)
      setDataset(loaded)
      setInput(defaultInput)
      setResult(firstResult)
      setSelectedId(firstResult.candidates[0]?.id ?? '')
      setStatus('사주명리 계산 준비 완료')
    })
  }, [])

  const selected = useMemo(() => {
    if (!result) return null
    return result.candidates.find((candidate) => candidate.id === selectedId) ?? result.candidates[0] ?? null
  }, [result, selectedId])

  function updateInput<K extends keyof NamingInput>(key: K, value: NamingInput[K]) {
    setInput((current) => ({ ...current, [key]: value }))
  }

  function toggleStyle(style: NameStyle) {
    setInput((current) => {
      const hasStyle = current.styles.includes(style)
      const styles = hasStyle ? current.styles.filter((entry) => entry !== style) : [...current.styles, style]
      return { ...current, styles }
    })
  }

  function runRecommendation() {
    if (!dataset) return
    const next = recommendNames(input, dataset)
    setResult(next)
    setSelectedId(next.candidates[0]?.id ?? '')
    setStatus(`${next.saju.eightLetters} 기준 ${next.candidates.length}개 후보 계산 완료`)
  }

  async function copySelected(candidate: NameCandidate | null) {
    if (!candidate) return
    const text = formatCandidateReport(candidate, result)
    await navigator.clipboard?.writeText(text)
    setStatus('후보 이름을 복사했습니다')
  }

  function saveSelected(candidate: NameCandidate | null) {
    if (!candidate) return
    const blob = new Blob([formatCandidateReport(candidate, result)], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${candidate.fullHangul}_사주작명리포트.txt`
    link.click()
    URL.revokeObjectURL(url)
    setStatus('사주 작명 리포트 파일을 만들었습니다')
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">년월일시분초 기반 v1</p>
          <h1>사주 작명 도우미</h1>
        </div>
        <div className="status-pill">
          <ShieldCheck size={17} aria-hidden="true" />
          <span>{status}</span>
        </div>
      </header>

      <section className="workspace">
        <aside className="input-panel" aria-label="작명 조건">
          <div className="panel-heading">
            <Sparkles size={20} aria-hidden="true" />
            <h2>태어난 정보</h2>
          </div>

          <div className="field-grid">
            <label>
              성
              <input value={input.familyName} maxLength={2} onChange={(event) => updateInput('familyName', event.target.value)} />
            </label>
            <label>
              성별
              <select value={input.gender} onChange={(event) => updateInput('gender', event.target.value as NamingInput['gender'])}>
                <option value="female">여아</option>
                <option value="male">남아</option>
                <option value="neutral">중성</option>
              </select>
            </label>
            <label>
              태어난 년월일
              <input type="date" value={input.birthDate} onChange={(event) => updateInput('birthDate', event.target.value)} />
            </label>
            <label>
              태어난 시분초
              <input
                type="time"
                step={1}
                value={input.birthTime}
                onChange={(event) => updateInput('birthTime', event.target.value)}
              />
            </label>
            <label>
              달력
              <select
                value={input.calendarType}
                onChange={(event) => updateInput('calendarType', event.target.value as NamingInput['calendarType'])}
              >
                <option value="solar">양력</option>
                <option value="lunar">음력 참고</option>
              </select>
            </label>
            <label>
              시간대
              <select value={input.timezone} onChange={(event) => updateInput('timezone', event.target.value)}>
                <option value="Asia/Seoul">한국 표준시</option>
                <option value="UTC">UTC</option>
              </select>
            </label>
            <label>
              이름 글자 수
              <select value={input.nameLength} onChange={(event) => updateInput('nameLength', Number(event.target.value) as 2 | 3)}>
                <option value={2}>2자</option>
                <option value={3}>3자</option>
              </select>
            </label>
            <label>
              돌림자
              <input value={input.generationChar} maxLength={1} onChange={(event) => updateInput('generationChar', event.target.value)} />
            </label>
            <label>
              돌림자 위치
              <select
                value={input.generationPosition}
                onChange={(event) => updateInput('generationPosition', event.target.value as NamingInput['generationPosition'])}
              >
                <option value="none">미사용</option>
                <option value="first">첫 글자</option>
                <option value="last">끝 글자</option>
              </select>
            </label>
          </div>

          <label className="wide-field">
            선호 글자
            <input value={input.preferredChars} onChange={(event) => updateInput('preferredChars', event.target.value)} />
          </label>

          <label className="wide-field">
            제외 글자
            <input value={input.excludedChars} onChange={(event) => updateInput('excludedChars', event.target.value)} />
          </label>

          <div className="style-row" aria-label="이름 분위기">
            {STYLE_OPTIONS.map((option) => (
              <label className="toggle-chip" key={option.value}>
                <input type="checkbox" checked={input.styles.includes(option.value)} onChange={() => toggleStyle(option.value)} />
                <span>{option.label}</span>
              </label>
            ))}
          </div>

          <button className="primary-action" type="button" onClick={runRecommendation} disabled={!dataset}>
            <Search size={18} aria-hidden="true" />
            사주 기반 작명
          </button>

          <p className="legal-note">사주명리 계산은 작명 참고용입니다. 출생신고 전 한자는 대법원 조회로 최종 확인해야 합니다.</p>
        </aside>

        <section className="result-panel" aria-label="추천 결과">
          <div className="result-toolbar">
            <div>
              <p className="eyebrow">추천 후보</p>
              <h2>{selected ? `${selected.fullHangul} (${selected.hanjaText})` : '후보 없음'}</h2>
            </div>
            <div className="toolbar-actions">
              <button type="button" title="복사" onClick={() => copySelected(selected)}>
                <Clipboard size={18} aria-hidden="true" />
              </button>
              <button type="button" title="저장" onClick={() => saveSelected(selected)}>
                <Download size={18} aria-hidden="true" />
              </button>
              <button type="button" title="인쇄/PDF" onClick={() => window.print()}>
                <Printer size={18} aria-hidden="true" />
              </button>
            </div>
          </div>

          {result && (
            <>
              <div className="pillar-strip">
                {Object.entries(result.saju.pillars).map(([key, pillar]) => (
                  <div key={key}>
                    <span>{pillarLabel(key)}</span>
                    <strong>{pillar.stem}{pillar.branch}</strong>
                    <small>{pillar.stemElement}/{pillar.branchElement}</small>
                  </div>
                ))}
                <div>
                  <span>일간</span>
                  <strong>{result.saju.dayMaster.label}</strong>
                  <small>계절 {result.saju.seasonElement}</small>
                </div>
              </div>

              <div className="saju-strip">
                {Object.entries(result.saju.elementBalance).map(([element, balance]) => (
                  <div key={element}>
                    <span>{element} {balance.grade}</span>
                    <strong>{balance.count}</strong>
                    <small>{balance.percent}%</small>
                  </div>
                ))}
                <div className="needed">
                  <span>보완 오행</span>
                  <strong>{result.saju.neededElements.join(', ')}</strong>
                </div>
              </div>
            </>
          )}

          <div className="content-grid">
            <div className="candidate-list" aria-label="후보 목록">
              {result?.candidates.map((candidate) => (
                <button
                  className={candidate.id === selected?.id ? 'candidate active' : 'candidate'}
                  key={candidate.id}
                  type="button"
                  onClick={() => setSelectedId(candidate.id)}
                >
                  <span>
                    <strong>{candidate.fullHangul}</strong>
                    <small>{candidate.hanjaText}</small>
                  </span>
                  <b>{candidate.totalScore}</b>
                </button>
              ))}
            </div>

            <article className="report-surface">
              <PopularityPanel gender={input.gender} selectedName={selected?.hangul ?? ''} />
              {selected ? <CandidateReport candidate={selected} result={result} /> : <EmptyState />}
            </article>
          </div>
        </section>
      </section>
    </main>
  )
}

function PopularityPanel({ gender, selectedName }: { gender: NamingInput['gender']; selectedName: string }) {
  const rows = getThreeYearPopularity(gender)
  const selectedRank = selectedName ? getThreeYearRank(selectedName, gender) : undefined

  return (
    <section className="popularity-panel" aria-label="최근 3년 인기 이름">
      <div className="popularity-heading">
        <div>
          <p className="eyebrow">{POPULARITY_SOURCE.range} 합산</p>
          <h3>{genderLabel(gender)} 인기 이름 TOP 10</h3>
        </div>
        {selectedRank && <span className="rank-badge">현재 후보 {selectedRank.rank}위</span>}
      </div>
      <div className="popularity-table">
        {rows.map((row) => (
          <div className={row.name === selectedName ? 'popularity-row selected' : 'popularity-row'} key={row.name}>
            <b>{row.rank}</b>
            <strong>{row.name}</strong>
            <span>{row.count.toLocaleString()}명</span>
            <small>
              23년 {row.years[2023].toLocaleString()} · 24년 {row.years[2024].toLocaleString()} · 25년{' '}
              {row.years[2025].toLocaleString()}
            </small>
          </div>
        ))}
      </div>
      <p className="source-note">{POPULARITY_SOURCE.label} 참고. 공개 집계 시점에 따라 소폭 달라질 수 있습니다.</p>
    </section>
  )
}

function CandidateReport({ candidate, result }: { candidate: NameCandidate; result: RecommendationResult | null }) {
  return (
    <>
      {result && (
        <section className="report-section saju-summary">
          <h3>사주명리 요약</h3>
          <p>
            {formatBirth(result)} 출생 기준 사주팔자는 <strong>{result.saju.eightLetters}</strong>입니다.
            일간은 <strong>{result.saju.dayMaster.label}</strong>이며, 이름에서는{' '}
            <strong>{result.saju.neededElements.join(', ')}</strong> 기운을 우선 보완합니다.
          </p>
        </section>
      )}

      <div className="score-band">
        <div>
          <span>종합점수</span>
          <strong>{candidate.totalScore}</strong>
        </div>
        {Object.entries(candidate.scoreBreakdown).map(([key, value]) => (
          <div key={key}>
            <span>{scoreLabel(key)}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>

      <section className="report-section">
        <h3>
          <FileText size={18} aria-hidden="true" />
          이름 풀이
        </h3>
        <p>{candidate.meanings}</p>
      </section>

      <section className="report-section two-column">
        <div>
          <h3>좋은 점</h3>
          <ul>
            {candidate.strengths.map((text) => (
              <li key={text}>{text}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3>확인할 점</h3>
          <ul>
            {candidate.cautions.map((text) => (
              <li key={text}>{text}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="report-section">
        <h3>수리사격</h3>
        <div className="number-grid">
          <span>원격 {candidate.numerology.won}</span>
          <span>형격 {candidate.numerology.hyeong}</span>
          <span>이격 {candidate.numerology.i}</span>
          <span>정격 {candidate.numerology.jeong}</span>
        </div>
      </section>
    </>
  )
}

function EmptyState() {
  return (
    <div className="empty-state">
      <RefreshCw size={24} aria-hidden="true" />
      <p>조건을 바꿔 다시 계산해 주십시오.</p>
    </div>
  )
}

function scoreLabel(key: string): string {
  const labels: Record<string, string> = {
    saju: '사주',
    hanjaMeaning: '뜻',
    numerology: '수리',
    yinYang: '음양',
    soundReference: '발음',
    modernity: '현대',
    preference: '선호',
  }
  return labels[key] ?? key
}

function pillarLabel(key: string): string {
  const labels: Record<string, string> = {
    year: '년주',
    month: '월주',
    day: '일주',
    hour: '시주',
  }
  return labels[key] ?? key
}

function genderLabel(gender: NamingInput['gender']): string {
  if (gender === 'male') return '남아'
  if (gender === 'female') return '여아'
  return '전체'
}

function formatBirth(result: RecommendationResult): string {
  const { birth } = result.saju
  const time = [birth.hour, birth.minute, birth.second].map((value) => String(value).padStart(2, '0')).join(':')
  return `${birth.year}년 ${birth.month}월 ${birth.day}일 ${time}`
}

function formatCandidateReport(candidate: NameCandidate, result: RecommendationResult | null): string {
  const sajuLines = result
    ? [
        `출생: ${formatBirth(result)}`,
        `사주팔자: ${result.saju.eightLetters}`,
        `일간: ${result.saju.dayMaster.label}`,
        `보완 오행: ${result.saju.neededElements.join(', ')}`,
      ]
    : []

  return [
    `${candidate.fullHangul} (${candidate.hanjaText})`,
    ...sajuLines,
    `점수: ${candidate.totalScore}`,
    `뜻: ${candidate.meanings}`,
    `인기: ${candidate.popularityLabel}`,
    `수리: 원격 ${candidate.numerology.won}, 형격 ${candidate.numerology.hyeong}, 이격 ${candidate.numerology.i}, 정격 ${candidate.numerology.jeong}`,
    `좋은 점: ${candidate.strengths.join(' / ')}`,
    `확인할 점: ${candidate.cautions.join(' / ')}`,
  ].join('\n')
}

export default App
