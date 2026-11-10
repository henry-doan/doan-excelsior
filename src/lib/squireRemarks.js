import { cellLabel, columnLabel } from './address.js'

/**
 * What the squire notices. Each check looks at a small corner of the active
 * sheet (the header row and the first few hundred rows), so it stays quick
 * on huge workbooks. A remark has a `key` so it's only said once, and may
 * have a `target` cell the squire can take you to when you click him.
 */

// How far the checks look, so a two-million-cell sheet costs the same as a small one.
const SCAN_ROWS = 300
const SCAN_COLUMNS = 60
const BIG_SHEET_ROWS = 5000
const NAMED_SHEET_CELLS = 20

export const GREETING = 'At thy service, my liege! I shall keep watch over thy ledger. Click me if thou needest a tip.'

export const SLAIN = 'Huzzah! The dragon is slain and every cell is mended.'

export const UNSEALED = 'Thou hast not sealed thy work in some time, my liege. Download it, lest it be lost.'

export const LATE = '’Tis late, my liege. Even knights must rest their quills.'

export const EMPTY = 'A blank scroll! Type =EXCELSIOR() in any cell for a knightly motto.'

export const TIPS = [
  'Double-click the edge of a column’s header and I shall fit the column to its words.',
  'Hold Shift and click to claim a whole span of cells at once.',
  'Press F2 to amend a cell without striking out what is there.',
  'Every deed can be undone with Ctrl+Z. Even a knight may retreat.',
  'Type = and the start of a name, and I shall whisper the spells that match.',
  'Drop a file anywhere upon the window to open it.',
  'They say the moon above the castle gate hideth a secret…',
  'Click a column’s letter to aim thy lance down the whole of it.',
  'Copy a formula and paste it lower: its references march along with it.',
  'The Σ menu tallies a column for thee, as a steward would.',
  'Stand in a column and press Sort A–Z: I shall marshal every row by it, and the header stayeth put.',
  'Try the Parchment theme, for a ledger of olde.',
  'The scroll button in the toolbar teacheth the whole app to speak as I do.',
]

const isBlank = (value) => value === null || value === undefined || value === ''

// A number typed as text, such as " 42" or "1,200" imported from another program.
const NUMBER_AS_TEXT = /^\s*[-+]?[$€£]?\s*\d{1,3}(,?\d{3})*(\.\d+)?%?\s*$/

const headerProblems = (store, sheet, width, height) => {
  const remarks = []
  const columns = Math.min(width, SCAN_COLUMNS)
  const header = Array.from({ length: columns }, (_, col) => store.getValue(sheet, 0, col))
  const textHeaders = header.filter((value) => typeof value === 'string' && value.trim() !== '')
  // Only a sheet that has a header row can be missing one of its headers.
  if (textHeaders.length < 2 || height < 2) return remarks

  const rows = Math.min(height, SCAN_ROWS)
  for (let col = 0; col < columns; col += 1) {
    if (!isBlank(header[col])) continue
    for (let row = 1; row < rows; row += 1) {
      if (!isBlank(store.getValue(sheet, row, col))) {
        remarks.push({
          key: `header:${sheet}:${col}`,
          text: `My liege, column ${columnLabel(col)} hath no header. Click me and I shall take thee there to name it.`,
          target: { sheet, row: 0, col },
        })
        break
      }
    }
    if (remarks.length) break
  }

  const seen = new Map()
  for (let col = 0; col < columns; col += 1) {
    const value = header[col]
    if (typeof value !== 'string' || value.trim() === '') continue
    const name = value.trim().toLowerCase()
    if (seen.has(name)) {
      const first = seen.get(name)
      remarks.push({
        key: `duplicate:${sheet}:${name}`,
        text: `Two columns are both named “${value.trim()}” (${columnLabel(first)} and ${columnLabel(col)}). A herald could not tell them apart!`,
        target: { sheet, row: 0, col },
      })
      break
    }
    seen.set(name, col)
  }
  return remarks
}

const numberAsText = (store, sheet, width, height) => {
  const rows = Math.min(height, SCAN_ROWS)
  const columns = Math.min(width, SCAN_COLUMNS)
  for (let row = 1; row < rows; row += 1) {
    for (let col = 0; col < columns; col += 1) {
      const value = store.getValue(sheet, row, col)
      if (typeof value === 'string' && NUMBER_AS_TEXT.test(value) && !store.isFormula(sheet, row, col)) {
        return {
          key: `text-number:${sheet}:${row}:${col}`,
          text: `Cell ${cellLabel(row, col)} holdeth a number writ as text. It shall not be counted in thy sums.`,
          target: { sheet, row, col },
        }
      }
    }
  }
  return null
}

/** Things worth mentioning about the active sheet, most useful first. */
export const findRemarks = (store, sheet) => {
  const { width, height } = store.getDimensions(sheet)
  const remarks = []

  if (store.getErrors().length > 0) {
    remarks.push({ key: 'dragon', text: 'A dragon! Click it and it shall lead thee to the errant cell.' })
  }

  remarks.push(...headerProblems(store, sheet, width, height))

  const textNumber = numberAsText(store, sheet, width, height)
  if (textNumber) remarks.push(textNumber)

  const name = store.getSheetName(sheet)
  if (/^(sheet|banner) ?\d+$/i.test(name) && width * height >= NAMED_SHEET_CELLS) {
    remarks.push({
      key: `name:${sheet}`,
      text: `“${name}” is no name for so fine a banner. Double-click its tab to christen it.`,
    })
  }

  if (height > BIG_SHEET_ROWS) {
    remarks.push({
      key: `big:${sheet}`,
      text: `A mighty ledger of ${height.toLocaleString()} rows! Ctrl+Home returneth thee to A1.`,
    })
  }

  return remarks
}
