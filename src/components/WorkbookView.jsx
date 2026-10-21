import { Activity, useEffect, useRef, useState } from 'react'
import { useSettings, useWords } from '../hooks/useSettings.js'
import { useWorkbook } from '../hooks/useWorkbook.js'
import { cellLabel, clamp, normalizeRange, rangeSize } from '../lib/address.js'
import { downloadWorkbook, withExtension } from '../lib/fileIO.js'
import { formatValue } from '../lib/format.js'
import { closeParens } from '../lib/functions.js'
import { playSound } from '../lib/sounds.js'
import { fromTsv, toTsv } from '../lib/tsv.js'
import { MAX_COLUMNS, MAX_ROWS } from '../lib/workbookStore.js'
import ErrorDragon from './ErrorDragon.jsx'
import FormulaBar from './FormulaBar.jsx'
import FunctionPicker from './FunctionPicker.jsx'
import Grid from './Grid.jsx'
import SheetTabs from './SheetTabs.jsx'
import ShortcutsPanel from './ShortcutsPanel.jsx'
import StatusBar from './StatusBar.jsx'
import Toast from './Toast.jsx'
import Toolbar from './Toolbar.jsx'

const MIN_ROWS = 200
const MIN_COLUMNS = 26
const COPY_LIMIT = 200_000
// How far below a selection a quick total looks for an empty row.
const TOTAL_SEARCH_LIMIT = 1000

const singleCell = (row, col, reveal = false) => ({ row, col, endRow: row, endCol: col, reveal })

/**
 * Everything for one open workbook. The parent remounts this component
 * (via `key`) when a new file is opened, which resets selection and sheet.
 */
const WorkbookView = ({ onOpenFile, isOpening }) => {
  const store = useWorkbook()
  const words = useWords()
  const [settings] = useSettings()
  const gridRef = useRef(null)
  const clipboardText = useRef(null)
  const sheetIds = store.getSheetIds()
  const [preferredSheet, setPreferredSheet] = useState(sheetIds[0])
  const [selection, setSelection] = useState(singleCell(0, 0))
  const [editing, setEditing] = useState(null)
  const [notice, setNotice] = useState(null)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [showFunctions, setShowFunctions] = useState(false)

  const sheet = sheetIds.includes(preferredSheet) ? preferredSheet : sheetIds[0]
  const dimensions = store.getDimensions(sheet)
  const rowCount = Math.min(MAX_ROWS, Math.max(MIN_ROWS, dimensions.height + 50, selection.endRow + 20))
  const colCount = Math.min(MAX_COLUMNS, Math.max(MIN_COLUMNS, dimensions.width + 6, selection.endCol + 6))
  const range = normalizeRange(selection)

  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(null), 4500)
    return () => clearTimeout(timer)
  }, [notice])

  const focusGrid = () => gridRef.current?.focus({ preventScroll: true })

  /** Runs a store mutation and turns engine errors into a visible notice. */
  const attempt = (operation) => {
    try {
      operation()
      return true
    } catch (error) {
      setNotice(error.message)
      return false
    }
  }

  // Selection ------------------------------------------------------------

  const select = (row, col, extend = false, reveal = false) => {
    const nextRow = clamp(row, 0, MAX_ROWS - 1)
    const nextCol = clamp(col, 0, MAX_COLUMNS - 1)
    setSelection((current) =>
      extend
        ? { ...current, endRow: nextRow, endCol: nextCol, reveal }
        : singleCell(nextRow, nextCol, reveal),
    )
  }

  const moveBy = (rowDelta, colDelta, extend) => {
    if (extend) select(selection.endRow + rowDelta, selection.endCol + colDelta, true, true)
    else select(selection.row + rowDelta, selection.col + colDelta, false, true)
  }

  const selectRow = (row, extend) =>
    setSelection((current) => ({
      row: extend ? current.row : row,
      col: 0,
      endRow: row,
      endCol: colCount - 1,
      reveal: false,
    }))

  const selectColumn = (col, extend) =>
    setSelection((current) => ({
      row: 0,
      col: extend ? current.col : col,
      endRow: rowCount - 1,
      endCol: col,
      reveal: false,
    }))

  const selectAll = () =>
    setSelection({
      row: 0,
      col: 0,
      endRow: Math.max(0, dimensions.height - 1),
      endCol: Math.max(0, dimensions.width - 1),
      reveal: false,
    })

  // Editing --------------------------------------------------------------

  // `caret` and `focusRequest` let actions like the Functions menu place the caret in the editor.
  const startEditing = (initialText, mode, origin = 'cell', caret = undefined) => {
    setEditing({
      row: selection.row,
      col: selection.col,
      value: initialText ?? store.getEditText(sheet, selection.row, selection.col),
      mode,
      origin,
      caret,
      focusRequest: 0,
    })
  }

  const updateDraft = (value) => setEditing((current) => current && { ...current, value })

  const commitEditing = (rowDelta = 0, colDelta = 0) => {
    if (!editing) return
    // Only checked with sound on, since a huge workbook takes a moment to scan.
    const hadErrors = settings.sound && store.getErrors().length > 0
    const saved = attempt(() => store.setCell(sheet, editing.row, editing.col, closeParens(editing.value)))
    // When this formula wakes or slays the error dragon, its roar or fanfare plays instead.
    const stirsDragon = settings.sound && hadErrors !== store.getErrors().length > 0
    if (saved && editing.value.startsWith('=') && !stirsDragon) playSound('sheen')
    setEditing(null)
    if (rowDelta || colDelta) select(editing.row + rowDelta, editing.col + colDelta, false, true)
    focusGrid()
  }

  const cancelEditing = () => {
    setEditing(null)
    focusGrid()
  }

  /** Saves any open edit before another action changes the workbook. */
  const finishEditing = () => {
    if (editing) commitEditing()
  }

  const selectCell = (row, col, extend, reveal) => {
    if (editing && !extend) commitEditing()
    select(row, col, extend, reveal)
  }

  // Functions ------------------------------------------------------------

  const isNumberAt = (row, col) => typeof store.getValue(sheet, row, col) === 'number'

  /** Like Excel's AutoSum: the run of numbers directly above the active cell, or else to its left. */
  const guessTotalRange = (row, col) => {
    let top = row
    while (top > 0 && isNumberAt(top - 1, col)) top -= 1
    if (top < row) return `${cellLabel(top, col)}:${cellLabel(row - 1, col)}`
    let left = col
    while (left > 0 && isNumberAt(row, left - 1)) left -= 1
    if (left < col) return `${cellLabel(row, left)}:${cellLabel(row, col - 1)}`
    return ''
  }

  const isRowEmpty = (row, left, right) => {
    for (let col = left; col <= right; col += 1) {
      const value = store.getValue(sheet, row, col)
      if (value !== null && value !== undefined && value !== '') return false
    }
    return true
  }

  /**
   * Sum, Average, Count, Min or Max of the selection. With one cell selected,
   * it starts a formula over the numbers next to it for you to check. With a
   * range, it writes a total under each column (or to the right of a single row).
   */
  const totalSelection = (name) => {
    finishEditing()
    const isSingleCell = range.top === range.bottom && range.left === range.right
    if (isSingleCell) {
      const text = `=${name}(${guessTotalRange(selection.row, selection.col)}`
      startEditing(text, 'edit', 'cell')
      return
    }

    const bottom = Math.min(range.bottom, dimensions.height - 1)
    const right = Math.min(range.right, dimensions.width - 1)
    if (bottom < range.top || right < range.left) {
      setNotice(words.selectNumbers)
      return
    }

    if (range.top === bottom) {
      const formula = `=${name}(${cellLabel(range.top, range.left)}:${cellLabel(range.top, right)})`
      if (attempt(() => store.setCell(sheet, range.top, right + 1, formula))) {
        select(range.top, right + 1)
      }
      return
    }

    let row = bottom + 1
    while (row < bottom + TOTAL_SEARCH_LIMIT && !isRowEmpty(row, range.left, right)) row += 1
    const formulas = []
    for (let col = range.left; col <= right; col += 1) {
      formulas.push(`=${name}(${cellLabel(range.top, col)}:${cellLabel(bottom, col)})`)
    }
    if (attempt(() => store.setMatrix(sheet, row, range.left, [formulas]))) {
      setSelection({ row, col: range.left, endRow: row, endCol: right, reveal: true })
    }
  }

  /**
   * Starts "=NAME(" in the active cell, or adds "NAME(" to a formula being
   * edited when it ends where a value can go (after "=", "(", "," or an operator).
   */
  const insertFunction = (name) => {
    setShowFunctions(false)
    const canAppend = editing && /^=.*[=(,+\-*/^&<>:\s]$|^=$/.test(editing.value)
    if (canAppend) {
      const value = `${editing.value}${name}(`
      setEditing({
        ...editing,
        value,
        origin: 'cell',
        mode: 'edit',
        caret: value.length,
        focusRequest: editing.focusRequest + 1,
      })
      return
    }
    if (editing) setEditing(null)
    startEditing(`=${name}(`, 'edit', 'cell')
  }

  // Clipboard ------------------------------------------------------------

  const copy = (cut) => {
    if (rangeSize(selection) > COPY_LIMIT) {
      setNotice('That selection is too large to copy. Select fewer than 200,000 cells.')
      return ''
    }
    const matrix = []
    for (let row = range.top; row <= range.bottom; row += 1) {
      const values = []
      for (let col = range.left; col <= range.right; col += 1) {
        values.push(formatValue(store.getValue(sheet, row, col), store.getNumberFormat(sheet, row, col)))
      }
      matrix.push(values)
    }
    attempt(() => (cut ? store.cutRange(sheet, range) : store.copyRange(sheet, range)))
    clipboardText.current = toTsv(matrix)
    return clipboardText.current
  }

  const paste = (text) => {
    if (!text) return
    const isInternal = text === clipboardText.current && !store.getEngine().isClipboardEmpty()
    const matrix = fromTsv(text)
    const pasted = attempt(() =>
      isInternal
        ? store.pasteAt(sheet, range.top, range.left)
        : store.setMatrix(sheet, range.top, range.left, matrix),
    )
    if (!pasted) return
    const height = matrix.length
    const width = Math.max(...matrix.map((row) => row.length))
    setSelection({
      row: range.top,
      col: range.left,
      endRow: range.top + height - 1,
      endCol: range.left + width - 1,
      reveal: false,
    })
  }

  // Structure ------------------------------------------------------------

  const clearSelection = () => attempt(() => store.clearRange(sheet, range))

  const insertRow = () => {
    finishEditing()
    attempt(() => store.insertRows(sheet, range.top, 1))
  }

  const deleteRows = () => {
    finishEditing()
    const count = Math.min(range.bottom, Math.max(0, dimensions.height - 1)) - range.top + 1
    if (count > 0) attempt(() => store.removeRows(sheet, range.top, count))
    select(range.top, selection.col)
  }

  const insertColumn = () => {
    finishEditing()
    attempt(() => store.insertColumns(sheet, range.left, 1))
  }

  const deleteColumns = () => {
    finishEditing()
    const count = Math.min(range.right, Math.max(0, dimensions.width - 1)) - range.left + 1
    if (count > 0) attempt(() => store.removeColumns(sheet, range.left, count))
    select(selection.row, range.left)
  }

  const resizeColumns = (cols, width) => attempt(() => store.setColumnWidths(sheet, cols, width))

  const undo = () => {
    setEditing(null)
    store.undo()
  }

  const redo = () => {
    setEditing(null)
    store.redo()
  }

  // Sheets ---------------------------------------------------------------

  const switchSheet = (nextSheet) => {
    finishEditing()
    if (nextSheet !== sheet) playSound('rustle')
    setPreferredSheet(nextSheet)
    setSelection(singleCell(0, 0))
  }

  const addSheet = () => {
    finishEditing()
    try {
      switchSheet(store.addSheet(words.newSheetPrefix))
    } catch (error) {
      setNotice(error.message)
    }
  }

  const renameSheet = (sheetId, name) => attempt(() => store.renameSheet(sheetId, name))

  const removeSheet = (sheetId) => {
    const name = store.getSheetName(sheetId)
    if (!window.confirm(words.confirmDeleteSheet(name))) return
    attempt(() => store.removeSheet(sheetId))
  }

  // Errors ---------------------------------------------------------------

  /** Selects the first error after the active cell, wrapping to the first sheet. */
  const jumpToError = (errors) => {
    if (errors.length === 0) return
    finishEditing()
    const order = store.getSheetIds()
    const position = (cell) => [order.indexOf(cell.sheet), cell.row, cell.col]
    const current = position({ sheet, row: selection.row, col: selection.col })
    const isAfterCurrent = (cell) => {
      const next = position(cell)
      const index = next.findIndex((value, i) => value !== current[i])
      return index !== -1 && next[index] > current[index]
    }
    const target = errors.find(isAfterCurrent) ?? errors[0]
    if (target.sheet !== sheet) {
      playSound('rustle')
      setPreferredSheet(target.sheet)
    }
    setSelection(singleCell(target.row, target.col, true))
    focusGrid()
  }

  // Files ----------------------------------------------------------------

  const newWorkbook = () => {
    if (store.canUndo() && !window.confirm(words.confirmNew)) return
    store.reset()
  }

  const download = (bookType) => {
    finishEditing()
    const fileName = withExtension(store.getFileName(), bookType)
    const sheets = bookType === 'csv' ? [sheet] : undefined
    if (attempt(() => downloadWorkbook(store, { fileName, bookType, sheetIds: sheets }))) {
      playSound('horn')
      setNotice(
        bookType === 'csv'
          ? words.downloadedSheet(store.getSheetName(sheet), fileName)
          : words.downloaded(fileName),
      )
    }
  }

  const gridActions = {
    select: selectCell,
    moveBy,
    selectRow,
    selectColumn,
    selectAll,
    startEditing,
    updateDraft,
    commitEditing,
    cancelEditing,
    clearSelection,
    copy,
    paste,
    resizeColumns,
    undo,
    redo,
  }

  return (
    <div className="workbook">
      <Toolbar
        fileName={store.getFileName()}
        isOpening={isOpening}
        canUndo={store.canUndo()}
        canRedo={store.canRedo()}
        onNew={newWorkbook}
        onOpen={onOpenFile}
        onDownload={download}
        onUndo={undo}
        onRedo={redo}
        onInsertRow={insertRow}
        onDeleteRows={deleteRows}
        onInsertColumn={insertColumn}
        onDeleteColumns={deleteColumns}
        onToggleShortcuts={() => setShowShortcuts((visible) => !visible)}
        shortcutsOpen={showShortcuts}
        onTotal={totalSelection}
        onInsertFunction={insertFunction}
        onBrowseFunctions={() => setShowFunctions(true)}
      />

      <FormulaBar
        selection={selection}
        text={editing ? editing.value : store.getEditText(sheet, selection.row, selection.col)}
        isFormula={store.isFormula(sheet, selection.row, selection.col)}
        isEditing={editing?.origin === 'bar'}
        onFocus={() => {
          if (editing) setEditing({ ...editing, origin: 'bar', mode: 'edit' })
          else startEditing(null, 'edit', 'bar')
        }}
        onChange={updateDraft}
        onCommit={commitEditing}
        onCancel={cancelEditing}
      />

      <div className="workbook-main">
        <Grid
          ref={gridRef}
          sheet={sheet}
          selection={selection}
          editing={editing}
          rowCount={rowCount}
          colCount={colCount}
          actions={gridActions}
        />
        <Activity mode={showShortcuts ? 'visible' : 'hidden'}>
          <ShortcutsPanel onClose={() => setShowShortcuts(false)} />
        </Activity>
      </div>

      <footer className="workbook-footer">
        <SheetTabs
          sheets={sheetIds.map((id) => ({ id, name: store.getSheetName(id) }))}
          activeSheet={sheet}
          onSelect={switchSheet}
          onAdd={addSheet}
          onRename={renameSheet}
          onRemove={removeSheet}
        />
        <ErrorDragon onJump={jumpToError} />
        <StatusBar sheet={sheet} selection={selection} />
      </footer>

      <FunctionPicker
        open={showFunctions}
        onClose={() => {
          setShowFunctions(false)
          if (!editing) focusGrid()
        }}
        onPick={insertFunction}
      />

      {notice && <Toast message={notice} onDismiss={() => setNotice(null)} />}
    </div>
  )
}

export default WorkbookView
