import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const inputPath = process.argv[2]
const outputPath = resolve('src/data/seed-data.json')

if (!inputPath) {
  console.error('Usage: npm run import:hanja -- <official-hanja.csv>')
  process.exit(1)
}

const seed = JSON.parse(await readFile(outputPath, 'utf8'))
const csv = await readFile(resolve(inputPath), 'utf8')
const [headerLine, ...lines] = csv.trim().split(/\r?\n/)
const headers = parseCsvLine(headerLine)

const imported = lines
  .map(parseCsvLine)
  .filter((columns) => columns.length === headers.length)
  .map((columns) => Object.fromEntries(headers.map((header, index) => [header, columns[index] ?? ''])))
  .map((row) => ({
    char: row.char,
    hangul: row.hangul,
    meaning: row.meaning,
    strokes: Number(row.strokes || row.originalStrokes || 0),
    originalStrokes: Number(row.originalStrokes || row.strokes || 0),
    element: row.element,
    legal: row.legal !== 'false',
    tone: row.tone || '중립',
    tags: row.tags ? row.tags.split('|').filter(Boolean) : [],
  }))
  .filter((row) => row.char && row.hangul && row.element)

seed.hanja = imported
seed.metadata = {
  ...seed.metadata,
  notice: `공식 CSV에서 ${imported.length}개 한자를 가져왔습니다. 출생신고 전 최종 확인은 대법원 조회를 사용하십시오.`,
}

await writeFile(outputPath, `${JSON.stringify(seed, null, 2)}\n`, 'utf8')
console.log(`Imported ${imported.length} hanja rows into ${outputPath}`)

function parseCsvLine(line) {
  const values = []
  let value = ''
  let quoted = false

  for (const char of line) {
    if (char === '"') {
      quoted = !quoted
      continue
    }
    if (char === ',' && !quoted) {
      values.push(value.trim())
      value = ''
      continue
    }
    value += char
  }

  values.push(value.trim())
  return values
}
