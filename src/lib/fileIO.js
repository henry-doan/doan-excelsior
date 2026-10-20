import * as XLSX from 'xlsx'
import { clampWidth } from './columns.js'

export const ACCEPTED_FILE_TYPES = '.xlsx,.xlsm,.xls,.ods,.csv,.tsv'

/** Excel's internal error codes, used when writing cached error results. */
const ERROR_CODES = {
  '#NULL!': 0x00,
  '#DIV/0!': 0x07,
  '#VALUE!': 0x0f,
  '#REF!': 0x17,
  '#NAME?': 0x1d,
  '#NUM!': 0x24,
  '#N/A': 0x2a,
}

const formatKey = (row, col) => `${row}:${col}`

const cellToContent = (cell) => {
  if (!cell) return null
  if (cell.f) return `=${cell.f}`
  if (cell.t === 'e') return cell.w ?? null
  if (cell.t === 's' && typeof cell.v === 'string' && cell.v.startsWith('=')) {
    // A leading apostrophe tells the engine to keep this as text, not a formula.
    return `'${cell.v}`
  }
  return cell.v ?? null
}

/** Custom column widths in pixels, from SheetJS's `!cols` (hidden columns keep the default). */
const readWidths = (worksheet) => {
  const widths = new Map()
  worksheet?.['!cols']?.forEach((info, col) => {
    if (info?.wpx && !info.hidden) widths.set(col, clampWidth(info.wpx))
  })
  return widths
}

const readSheet = (worksheet) => {
  const matrix = []
  const formats = new Map()
  const widths = readWidths(worksheet)
  if (!worksheet?.['!ref']) return { matrix, formats, widths }

  const { e: end } = XLSX.utils.decode_range(worksheet['!ref'])
  for (let row = 0; row <= end.r; row += 1) {
    const values = []
    for (let col = 0; col <= end.c; col += 1) {
      const cell = worksheet[XLSX.utils.encode_cell({ r: row, c: col })]
      values.push(cellToContent(cell))
      if (cell?.z && cell.z !== 'General') formats.set(formatKey(row, col), cell.z)
    }
    matrix.push(values)
  }
  return { matrix, formats, widths }
}

/** Waits until the browser has painted, so progress shown before heavy work actually appears. */
export const nextPaint = () =>
  new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)))

/**
 * Reads an uploaded file into plain data:
 * `{ sheets: [{ name, matrix, formats, widths }] }` where formats maps "row:col" to an
 * Excel number format and widths maps a column index to its width in pixels.
 * `onProgress(stage, fraction)` is awaited before each step ("read", then "parse").
 */
export const readWorkbookFile = async (file, onProgress = async () => {}) => {
  await onProgress('read', 0.1)
  const buffer = await file.arrayBuffer()
  await onProgress('parse', 0.35)
  const workbook = XLSX.read(buffer, {
    cellFormula: true,
    cellNF: true,
    cellText: true,
    // Needed for SheetJS to read column widths (`!cols`).
    cellStyles: true,
    // Keeps formula cells that were saved without a cached result.
    sheetStubs: true,
  })
  if (workbook.SheetNames.length === 0) throw new Error('The file has no sheets.')

  return {
    sheets: workbook.SheetNames.map((name) => ({ name, ...readSheet(workbook.Sheets[name]) })),
  }
}

const toWorksheetCell = (raw, value, numberFormat) => {
  const isFormula = typeof raw === 'string' && raw.startsWith('=')
  const cell = isFormula ? { f: raw.slice(1) } : {}

  if (value !== null && typeof value === 'object') {
    Object.assign(cell, { t: 'e', v: ERROR_CODES[value.value] ?? ERROR_CODES['#VALUE!'] })
  } else if (typeof value === 'number') {
    Object.assign(cell, { t: 'n', v: value })
  } else if (typeof value === 'boolean') {
    Object.assign(cell, { t: 'b', v: value })
  } else if (value === null || value === undefined) {
    Object.assign(cell, isFormula ? { t: 'n', v: 0 } : { t: 'z' })
  } else {
    Object.assign(cell, { t: 's', v: String(value) })
  }

  if (numberFormat) cell.z = numberFormat
  return cell
}

/**
 * Builds a SheetJS workbook from the store and downloads it.
 * `sheetIds` limits which sheets are written (CSV only holds one).
 */
export const downloadWorkbook = (store, { fileName, bookType = 'xlsx', sheetIds } = {}) => {
  const engine = store.getEngine()
  const workbook = XLSX.utils.book_new()

  for (const sheetId of sheetIds ?? store.getSheetIds()) {
    const serialized = engine.getSheetSerialized(sheetId)
    const values = engine.getSheetValues(sheetId)
    const worksheet = {}
    let maxRow = -1
    let maxCol = -1

    serialized.forEach((row, rowIndex) => {
      row.forEach((raw, colIndex) => {
        if (raw === null || raw === undefined || raw === '') return
        const value = values[rowIndex]?.[colIndex] ?? null
        const numberFormat = store.getNumberFormat(sheetId, rowIndex, colIndex)
        worksheet[XLSX.utils.encode_cell({ r: rowIndex, c: colIndex })] = toWorksheetCell(
          raw,
          value,
          numberFormat,
        )
        maxRow = Math.max(maxRow, rowIndex)
        maxCol = Math.max(maxCol, colIndex)
      })
    })

    worksheet['!ref'] =
      maxRow < 0
        ? 'A1'
        : XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: maxRow, c: maxCol } })
    const columns = []
    store.getColumnWidths(sheetId).forEach((width, col) => {
      columns[col] = { wpx: width }
    })
    if (columns.length > 0) worksheet['!cols'] = columns
    XLSX.utils.book_append_sheet(workbook, worksheet, engine.getSheetName(sheetId))
  }

  XLSX.writeFile(workbook, fileName, { bookType, compression: true })
}

/** Swaps the extension of a file name, e.g. "Budget.xls" → "Budget.xlsx". */
export const withExtension = (fileName, extension) => {
  const base = fileName.replace(/\.[^.]+$/, '') || 'Untitled'
  return `${base}.${extension}`
}
