import { HyperFormula } from 'hyperformula'
import * as XLSX from 'xlsx'
import { clampWidth, shiftWidths } from './columns.js'
import './excelsiorFunction.js'
import { detectedFormat, parseInput, toEditText } from './format.js'

export const MAX_ROWS = 100_000
export const MAX_COLUMNS = 16_384
const HISTORY_LIMIT = 100

const ENGINE_CONFIG = {
  // HyperFormula is dual-licensed. See the README before shipping commercially.
  licenseKey: 'gpl-v3',
  maxRows: MAX_ROWS,
  maxColumns: MAX_COLUMNS,
  undoLimit: HISTORY_LIMIT,
  dateFormats: ['MM/DD/YYYY', 'MM/DD/YY', 'YYYY-MM-DD'],
  timeFormats: ['hh:mm', 'hh:mm:ss.sss'],
  currencySymbol: ['$', '€', '£'],
}

const formatKey = (row, col) => `${row}:${col}`

const buildEngine = (sheets) =>
  HyperFormula.buildFromSheets(
    Object.fromEntries(sheets.map(({ name, matrix }) => [name, matrix])),
    ENGINE_CONFIG,
  )

/**
 * Moves stored number formats when rows or columns are inserted or removed,
 * so a date column stays a date column.
 */
const shiftFormats = (formats, axis, index, delta) => {
  const next = new Map()
  for (const [key, value] of formats) {
    const [row, col] = key.split(':').map(Number)
    const position = axis === 'row' ? row : col
    if (delta < 0 && position >= index && position < index - delta) continue
    const moved = position >= index ? position + delta : position
    next.set(axis === 'row' ? formatKey(moved, col) : formatKey(row, moved), value)
  }
  return next
}

/**
 * The workbook store owns the HyperFormula engine and exposes a tiny
 * subscribe/getSnapshot API so React can read it with useSyncExternalStore.
 * Each snapshot is a new object with the same methods, so components that
 * read through it re-render with fresh values after every change.
 * Every mutation goes through `mutate`, which keeps number formats and
 * column widths in step with the engine's own undo and redo history.
 * Width changes don't touch the engine, so they get history entries of
 * their own (`engine: false`) that undo without calling `engine.undo()`.
 */
export const createWorkbookStore = () => {
  let engine = buildEngine([{ name: 'Sheet1', matrix: [] }])
  let fileName = 'Untitled.xlsx'
  let formats = new Map([[0, new Map()]])
  let widths = new Map()
  let generation = 0
  let version = 0
  let view = null
  let undoStack = []
  let redoStack = []
  const listeners = new Set()

  const notify = () => {
    version += 1
    // A fresh snapshot object per change lets React (and the React Compiler)
    // see that anything read from the workbook may be different now.
    view = { ...api, version }
    listeners.forEach((listener) => listener())
  }

  const subscribe = (listener) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
  }

  const getSnapshot = () => view

  const remember = (engineStep) => {
    undoStack = [...undoStack, { engine: engineStep, formats, widths }].slice(-HISTORY_LIMIT)
    redoStack = []
  }

  const mutate = (operation, nextFormats = formats, nextWidths = widths) => {
    const result = operation()
    remember(true)
    formats = nextFormats
    widths = nextWidths
    notify()
    return result
  }

  const replaceWorkbook = (sheets, name) => {
    const nextEngine = buildEngine(sheets)
    engine.destroy()
    engine = nextEngine
    fileName = name
    formats = new Map(
      sheets.map(({ name: sheetName, formats: sheetFormats }) => [
        engine.getSheetId(sheetName),
        sheetFormats ?? new Map(),
      ]),
    )
    widths = new Map(
      sheets.map(({ name: sheetName, widths: sheetWidths }) => [
        engine.getSheetId(sheetName),
        sheetWidths ?? new Map(),
      ]),
    )
    undoStack = []
    redoStack = []
    generation += 1
    notify()
  }

  const sheetFormats = (sheet) => formats.get(sheet) ?? new Map()

  const withSheetFormats = (sheet, nextSheetFormats) => new Map(formats).set(sheet, nextSheetFormats)

  const sheetWidths = (sheet) => widths.get(sheet) ?? new Map()

  const withSheetWidths = (sheet, nextSheetWidths) => new Map(widths).set(sheet, nextSheetWidths)

  // Reading ------------------------------------------------------------

  const getEngine = () => engine
  const getFileName = () => fileName
  const getGeneration = () => generation
  const getSheetIds = () => engine.getSheetNames().map((name) => engine.getSheetId(name))
  const getSheetName = (sheet) => engine.getSheetName(sheet)
  const getDimensions = (sheet) => engine.getSheetDimensions(sheet)
  const getValue = (sheet, row, col) => engine.getCellValue({ sheet, row, col })

  /** The stored Excel format, or one inferred from what was typed (dates, %, $). */
  const getNumberFormat = (sheet, row, col) =>
    sheetFormats(sheet).get(formatKey(row, col)) ??
    detectedFormat(engine.getCellValueDetailedType({ sheet, row, col }))

  const getEditText = (sheet, row, col) => {
    const serialized = engine.getCellSerialized({ sheet, row, col })
    const numberFormat = sheetFormats(sheet).get(formatKey(row, col))
    // Show imported dates as dates while editing, in a form the engine parses back.
    if (typeof serialized === 'number' && Number.isInteger(serialized) && numberFormat && XLSX.SSF.is_date(numberFormat)) {
      return XLSX.SSF.format('mm/dd/yyyy', serialized)
    }
    return toEditText(serialized)
  }

  /** Custom column widths for a sheet, as a Map of column index to pixels. */
  const getColumnWidths = (sheet) => sheetWidths(sheet)

  const isFormula = (sheet, row, col) => engine.doesCellHaveFormula({ sheet, row, col })
  const canUndo = () => undoStack.length > 0
  const canRedo = () => redoStack.length > 0

  // Writing ------------------------------------------------------------

  const setCell = (sheet, row, col, text) =>
    mutate(() => engine.setCellContents({ sheet, row, col }, [[parseInput(text)]]))

  const setMatrix = (sheet, row, col, matrix) =>
    mutate(() =>
      engine.setCellContents(
        { sheet, row, col },
        matrix.map((values) => values.map(parseInput)),
      ),
    )

  const clearRange = (sheet, { top, left, bottom, right }) => {
    const empty = Array.from({ length: bottom - top + 1 }, () =>
      Array.from({ length: right - left + 1 }, () => null),
    )
    mutate(() => engine.setCellContents({ sheet, row: top, col: left }, empty))
  }

  const toEngineRange = (sheet, { top, left, bottom, right }) => ({
    start: { sheet, row: top, col: left },
    end: { sheet, row: bottom, col: right },
  })

  /** Copies inside the engine so pasted formulas shift their references. */
  const copyRange = (sheet, range) => engine.copy(toEngineRange(sheet, range))

  const cutRange = (sheet, range) => engine.cut(toEngineRange(sheet, range))

  const pasteAt = (sheet, row, col) => mutate(() => engine.paste({ sheet, row, col }))

  const insertRows = (sheet, index, count = 1) =>
    mutate(
      () => engine.addRows(sheet, [index, count]),
      withSheetFormats(sheet, shiftFormats(sheetFormats(sheet), 'row', index, count)),
    )

  const removeRows = (sheet, index, count = 1) =>
    mutate(
      () => engine.removeRows(sheet, [index, count]),
      withSheetFormats(sheet, shiftFormats(sheetFormats(sheet), 'row', index, -count)),
    )

  const insertColumns = (sheet, index, count = 1) =>
    mutate(
      () => engine.addColumns(sheet, [index, count]),
      withSheetFormats(sheet, shiftFormats(sheetFormats(sheet), 'col', index, count)),
      withSheetWidths(sheet, shiftWidths(sheetWidths(sheet), index, count)),
    )

  const removeColumns = (sheet, index, count = 1) =>
    mutate(
      () => engine.removeColumns(sheet, [index, count]),
      withSheetFormats(sheet, shiftFormats(sheetFormats(sheet), 'col', index, -count)),
      withSheetWidths(sheet, shiftWidths(sheetWidths(sheet), index, -count)),
    )

  /** Sets the width of each listed column. `null` returns them to the default width. */
  const setColumnWidths = (sheet, cols, width) => {
    const next = new Map(sheetWidths(sheet))
    for (const col of cols) {
      if (width === null) next.delete(col)
      else next.set(col, clampWidth(width))
    }
    remember(false)
    widths = withSheetWidths(sheet, next)
    notify()
  }

  /** "Sheet2", or with another prefix such as "Banner " → "Banner 2". */
  const nextSheetName = (prefix) => {
    const names = new Set(engine.getSheetNames().map((name) => name.toLowerCase()))
    let index = names.size + 1
    while (names.has(`${prefix}${index}`.toLowerCase())) index += 1
    return `${prefix}${index}`
  }

  const addSheet = (prefix = 'Sheet') => {
    const name = mutate(() => engine.addSheet(nextSheetName(prefix)))
    const sheet = engine.getSheetId(name)
    formats = new Map(formats).set(sheet, new Map())
    return sheet
  }

  const removeSheet = (sheet) => {
    if (engine.countSheets() <= 1) throw new Error('A workbook needs at least one sheet.')
    const nextFormats = new Map(formats)
    nextFormats.delete(sheet)
    const nextWidths = new Map(widths)
    nextWidths.delete(sheet)
    mutate(() => engine.removeSheet(sheet), nextFormats, nextWidths)
  }

  const renameSheet = (sheet, name) => {
    const trimmed = name.trim()
    if (!trimmed) throw new Error('Sheet names can’t be blank.')
    if (trimmed === engine.getSheetName(sheet)) return
    if (!engine.isItPossibleToRenameSheet(sheet, trimmed)) {
      throw new Error(`There’s already a sheet called “${trimmed}”.`)
    }
    mutate(() => engine.renameSheet(sheet, trimmed))
  }

  const undo = () => {
    const step = undoStack.at(-1)
    if (!step) return
    if (step.engine) engine.undo()
    redoStack = [...redoStack, { engine: step.engine, formats, widths }]
    undoStack = undoStack.slice(0, -1)
    formats = step.formats
    widths = step.widths
    notify()
  }

  const redo = () => {
    const step = redoStack.at(-1)
    if (!step) return
    if (step.engine) engine.redo()
    undoStack = [...undoStack, { engine: step.engine, formats, widths }]
    redoStack = redoStack.slice(0, -1)
    formats = step.formats
    widths = step.widths
    notify()
  }

  const load = (sheets, name) => replaceWorkbook(sheets, name)

  const reset = () => replaceWorkbook([{ name: 'Sheet1', matrix: [] }], 'Untitled.xlsx')

  const api = {
    subscribe,
    getSnapshot,
    getEngine,
    getFileName,
    getGeneration,
    getSheetIds,
    getSheetName,
    getDimensions,
    getValue,
    getNumberFormat,
    getEditText,
    getColumnWidths,
    isFormula,
    canUndo,
    canRedo,
    setCell,
    setMatrix,
    clearRange,
    copyRange,
    cutRange,
    pasteAt,
    insertRows,
    removeRows,
    insertColumns,
    removeColumns,
    setColumnWidths,
    addSheet,
    removeSheet,
    renameSheet,
    undo,
    redo,
    load,
    reset,
  }
  view = { ...api, version }
  return api
}
