import { useEffect, useEffectEvent, useLayoutEffect, useRef, useState } from 'react'
import { useWorkbook } from '../hooks/useWorkbook.js'
import { cellLabel, clamp, columnLabel, normalizeRange } from '../lib/address.js'
import { clampWidth, columnLayout } from '../lib/columns.js'
import { formatValue, isErrorValue } from '../lib/format.js'
import CellEditor from './CellEditor.jsx'

const ROW_HEIGHT = 26
const HEADER_HEIGHT = 26
const ROW_HEADER_WIDTH = 52
const OVERSCAN = 4

const KEY_MOVES = {
  ArrowUp: [-1, 0],
  ArrowDown: [1, 0],
  ArrowLeft: [0, -1],
  ArrowRight: [0, 1],
}

const alignmentFor = (value) => {
  if (isErrorValue(value)) return 'is-error'
  if (typeof value === 'number') return 'is-number'
  if (typeof value === 'boolean') return 'is-boolean'
  return ''
}

const isPrintableKey = (event) =>
  event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey

// Horizontal padding inside a cell (6px each side) plus room for the grid line.
const CELL_PADDING = 14

let measureContext = null

/** Measures text in the grid's font, for fitting a column to its contents. */
const measureText = (text, font) => {
  measureContext ??= document.createElement('canvas').getContext('2d')
  measureContext.font = font
  return measureContext.measureText(text).width
}

/**
 * A virtualized spreadsheet grid: only the cells in view (plus a small
 * overscan) are rendered, so large sheets scroll smoothly. Headers stay
 * pinned with CSS `position: sticky`, so no scroll syncing is needed.
 * Columns can be resized by dragging the right edge of their header, or
 * fitted to their contents by double-clicking that edge.
 *
 * `ref` is a plain prop in React 19, so the parent can focus the grid
 * without forwardRef.
 */
const Grid = ({ ref, sheet, selection, editing, rowCount, colCount, actions }) => {
  const store = useWorkbook()
  const bodyRef = useRef(null)
  const dragAnchor = useRef(null)
  const [viewport, setViewport] = useState({ top: 0, left: 0, width: 0, height: 0 })
  // While a column edge is being dragged: { col, cols, startX, startWidth, width }.
  const [resize, setResize] = useState(null)
  const range = normalizeRange(selection)
  const layout = columnLayout(store.getColumnWidths(sheet), colCount, resize)

  useLayoutEffect(() => {
    const scroller = ref.current
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setViewport((current) => ({ ...current, width, height }))
    })
    observer.observe(scroller)
    return () => observer.disconnect()
  }, [ref])

  // Keep the cell the keyboard moved to inside the visible area.
  const revealSelection = useEffectEvent(() => {
    const scroller = ref.current
    if (!scroller || !selection.reveal) return
    const top = selection.endRow * ROW_HEIGHT
    const left = layout.left(selection.endCol)
    const width = layout.width(selection.endCol)
    const visibleHeight = scroller.clientHeight - HEADER_HEIGHT
    const visibleWidth = scroller.clientWidth - ROW_HEADER_WIDTH

    if (top < scroller.scrollTop) scroller.scrollTop = top
    else if (top + ROW_HEIGHT > scroller.scrollTop + visibleHeight) {
      scroller.scrollTop = top + ROW_HEIGHT - visibleHeight
    }
    if (left < scroller.scrollLeft) scroller.scrollLeft = left
    else if (left + width > scroller.scrollLeft + visibleWidth) {
      scroller.scrollLeft = left + width - visibleWidth
    }
  })

  useEffect(() => revealSelection(), [selection])

  const cellFromPointer = (event) => {
    const bounds = bodyRef.current.getBoundingClientRect()
    return {
      row: clamp(Math.floor((event.clientY - bounds.top) / ROW_HEIGHT), 0, rowCount - 1),
      col: layout.colAt(event.clientX - bounds.left),
    }
  }

  // Drag-to-select listens on window so the drag keeps working outside the grid.
  // Column resizing uses the same listeners, so it survives the header scrolling out of view.
  const handlePointerMove = useEffectEvent((event) => {
    if (resize) {
      const width = clampWidth(resize.startWidth + event.clientX - resize.startX)
      if (width !== resize.width) setResize({ ...resize, width })
      return
    }
    if (!dragAnchor.current) return
    const { row, col } = cellFromPointer(event)
    actions.select(row, col, true)
  })

  const handlePointerUp = useEffectEvent(() => {
    dragAnchor.current = null
    if (!resize) return
    if (resize.width !== resize.startWidth) actions.resizeColumns(resize.cols, resize.width)
    setResize(null)
  })

  /** Resizing a column inside a whole-column selection resizes every selected column, like Excel. */
  const columnsToResize = (col) => {
    const wholeColumns = range.top === 0 && range.bottom >= rowCount - 1
    if (!wholeColumns || col < range.left || col > range.right) return [col]
    return Array.from({ length: range.right - range.left + 1 }, (_, i) => range.left + i)
  }

  const handleResizeStart = (event, col) => {
    if (event.button !== 0) return
    event.preventDefault()
    event.stopPropagation()
    const startWidth = layout.width(col)
    setResize({ col, cols: columnsToResize(col), startX: event.clientX, startWidth, width: startWidth })
  }

  /** Double-clicking a column edge fits the column to its widest value, or resets an empty one. */
  const handleAutoFit = (col) => {
    const font = getComputedStyle(bodyRef.current).font
    const height = store.getDimensions(sheet).height
    const cols = columnsToResize(col)
    let widest = 0
    for (const fitCol of cols) {
      for (let row = 0; row < height; row += 1) {
        const value = store.getValue(sheet, row, fitCol)
        if (value === null || value === undefined || value === '') continue
        const text = formatValue(value, store.getNumberFormat(sheet, row, fitCol))
        widest = Math.max(widest, measureText(text, font))
      }
    }
    actions.resizeColumns(cols, widest > 0 ? Math.ceil(widest) + CELL_PADDING : null)
  }

  useEffect(() => {
    const onMove = (event) => handlePointerMove(event)
    const onUp = () => handlePointerUp()
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [])

  const handleBodyPointerDown = (event) => {
    if (event.button !== 0 || event.target.closest('.cell-editor')) return
    event.preventDefault()
    const { row, col } = cellFromPointer(event)
    actions.select(row, col, event.shiftKey)
    dragAnchor.current = { row, col }
    ref.current.focus({ preventScroll: true })
  }

  const handleDoubleClick = (event) => {
    if (event.target.closest('.cell-editor')) return
    actions.startEditing(null, 'edit')
  }

  const handleKeyDown = (event) => {
    if (event.target !== ref.current || editing) return
    const modifier = event.ctrlKey || event.metaKey
    const key = event.key

    if (KEY_MOVES[key]) {
      event.preventDefault()
      const [rowDelta, colDelta] = KEY_MOVES[key]
      actions.moveBy(rowDelta, colDelta, event.shiftKey)
    } else if (key === 'Tab') {
      event.preventDefault()
      actions.moveBy(0, event.shiftKey ? -1 : 1, false)
    } else if (key === 'Enter' || key === 'F2') {
      event.preventDefault()
      actions.startEditing(null, 'edit')
    } else if (key === 'Delete' || key === 'Backspace') {
      event.preventDefault()
      actions.clearSelection()
    } else if (key === 'PageDown' || key === 'PageUp') {
      event.preventDefault()
      const page = Math.max(1, Math.floor((viewport.height - HEADER_HEIGHT) / ROW_HEIGHT) - 1)
      actions.moveBy(key === 'PageDown' ? page : -page, 0, event.shiftKey)
    } else if (key === 'Home') {
      event.preventDefault()
      actions.select(modifier ? 0 : selection.endRow, 0, event.shiftKey, true)
    } else if (key === 'Escape') {
      actions.select(selection.row, selection.col, false)
    } else if (modifier && key.toLowerCase() === 'z') {
      event.preventDefault()
      if (event.shiftKey) actions.redo()
      else actions.undo()
    } else if (modifier && key.toLowerCase() === 'y') {
      event.preventDefault()
      actions.redo()
    } else if (modifier && key.toLowerCase() === 'a') {
      event.preventDefault()
      actions.selectAll()
    } else if (isPrintableKey(event)) {
      event.preventDefault()
      actions.startEditing(key, 'enter')
    }
  }

  const fromGrid = (event) => event.target === ref.current && !editing

  const handleCopy = (event) => {
    if (!fromGrid(event)) return
    event.preventDefault()
    event.clipboardData.setData('text/plain', actions.copy(false))
  }

  const handleCut = (event) => {
    if (!fromGrid(event)) return
    event.preventDefault()
    event.clipboardData.setData('text/plain', actions.copy(true))
  }

  const handlePaste = (event) => {
    if (!fromGrid(event)) return
    event.preventDefault()
    actions.paste(event.clipboardData.getData('text/plain'))
  }

  const handleScroll = (event) => {
    const { scrollTop, scrollLeft } = event.currentTarget
    setViewport((current) => ({ ...current, top: scrollTop, left: scrollLeft }))
  }

  const bodyHeight = Math.max(0, viewport.height - HEADER_HEIGHT)
  const bodyWidth = Math.max(0, viewport.width - ROW_HEADER_WIDTH)
  const firstRow = Math.max(0, Math.floor(viewport.top / ROW_HEIGHT) - OVERSCAN)
  const lastRow = Math.min(rowCount - 1, Math.ceil((viewport.top + bodyHeight) / ROW_HEIGHT) + OVERSCAN)
  const firstCol = Math.max(0, layout.colAt(viewport.left) - OVERSCAN)
  const lastCol = Math.min(colCount - 1, layout.colAt(viewport.left + bodyWidth) + OVERSCAN)

  const rows = Array.from({ length: Math.max(0, lastRow - firstRow + 1) }, (_, i) => firstRow + i)
  const cols = Array.from({ length: Math.max(0, lastCol - firstCol + 1) }, (_, i) => firstCol + i)

  const cells = rows.flatMap((row) =>
    cols.map((col) => {
      const value = store.getValue(sheet, row, col)
      if (value === null || value === undefined || value === '') return null
      const text = formatValue(value, store.getNumberFormat(sheet, row, col))
      const width = layout.width(col)
      return (
        <div
          key={`${row}:${col}`}
          className={`cell ${alignmentFor(value)}`}
          style={{ top: row * ROW_HEIGHT, left: layout.left(col), width, height: ROW_HEIGHT, lineHeight: `${ROW_HEIGHT}px` }}
          title={text.length * 7.5 > width - CELL_PADDING ? text : undefined}
        >
          {text}
        </div>
      )
    }),
  )

  const selectionBox = {
    top: range.top * ROW_HEIGHT,
    left: layout.left(range.left),
    height: (range.bottom - range.top + 1) * ROW_HEIGHT,
    width: layout.left(range.right + 1) - layout.left(range.left),
  }
  const isMultiCell = range.top !== range.bottom || range.left !== range.right
  const activeLabel = cellLabel(selection.row, selection.col)

  return (
    <div
      ref={ref}
      className={`grid-scroller ${resize ? 'is-resizing' : ''}`}
      tabIndex={0}
      role="grid"
      aria-label="Spreadsheet"
      aria-rowcount={rowCount}
      aria-colcount={colCount}
      aria-description={`Active cell ${activeLabel}`}
      onScroll={handleScroll}
      onKeyDown={handleKeyDown}
      onCopy={handleCopy}
      onCut={handleCut}
      onPaste={handlePaste}
    >
      <div
        className="grid-sizer"
        style={{
          width: ROW_HEADER_WIDTH + layout.total,
          height: HEADER_HEIGHT + rowCount * ROW_HEIGHT,
        }}
      >
        <div className="column-headers" style={{ height: HEADER_HEIGHT }}>
          <button
            type="button"
            className="corner"
            aria-label="Select all"
            style={{ width: ROW_HEADER_WIDTH, height: HEADER_HEIGHT }}
            onClick={() => actions.selectAll()}
          />
          {cols.map((col) => (
            <div
              key={col}
              className={`column-header ${col >= range.left && col <= range.right ? 'is-selected' : ''} ${col === selection.col ? 'is-active' : ''}`}
              style={{ left: ROW_HEADER_WIDTH + layout.left(col), width: layout.width(col) }}
              onPointerDown={(event) => {
                event.preventDefault()
                actions.selectColumn(col, event.shiftKey)
                ref.current.focus({ preventScroll: true })
              }}
            >
              {columnLabel(col)}
              <div
                className={`column-resizer ${resize?.col === col ? 'is-dragging' : ''}`}
                role="separator"
                aria-orientation="vertical"
                aria-label={`Resize column ${columnLabel(col)}`}
                title="Drag to resize, double-click to fit"
                onPointerDown={(event) => handleResizeStart(event, col)}
                onDoubleClick={() => handleAutoFit(col)}
              />
            </div>
          ))}
        </div>

        <div
          className="row-headers"
          style={{ width: ROW_HEADER_WIDTH, height: rowCount * ROW_HEIGHT }}
        >
          {rows.map((row) => (
            <div
              key={row}
              className={`row-header ${row >= range.top && row <= range.bottom ? 'is-selected' : ''} ${row === selection.row ? 'is-active' : ''}`}
              style={{ top: row * ROW_HEIGHT, height: ROW_HEIGHT }}
              onPointerDown={(event) => {
                event.preventDefault()
                actions.selectRow(row, event.shiftKey)
                ref.current.focus({ preventScroll: true })
              }}
            >
              {row + 1}
            </div>
          ))}
        </div>

        <div
          ref={bodyRef}
          className="grid-body"
          style={{
            top: HEADER_HEIGHT,
            left: ROW_HEADER_WIDTH,
            width: layout.total,
            height: rowCount * ROW_HEIGHT,
            backgroundSize: `100% ${ROW_HEIGHT}px`,
          }}
          onPointerDown={handleBodyPointerDown}
          onDoubleClick={handleDoubleClick}
        >
          {cols.map((col) => (
            <div key={col} className="column-rule" style={{ left: layout.left(col + 1) - 1 }} />
          ))}
          {cells}
          {isMultiCell && <div className="selection-range" style={selectionBox} />}
          <div
            className="active-cell"
            style={{
              top: selection.row * ROW_HEIGHT,
              left: layout.left(selection.col),
              width: layout.width(selection.col) + 1,
              height: ROW_HEIGHT + 1,
            }}
          />
          {editing?.origin === 'cell' && (
            <CellEditor
              key={`${editing.row}:${editing.col}`}
              value={editing.value}
              mode={editing.mode}
              caret={editing.caret}
              focusRequest={editing.focusRequest}
              label={cellLabel(editing.row, editing.col)}
              style={{
                top: editing.row * ROW_HEIGHT,
                left: layout.left(editing.col),
                height: ROW_HEIGHT + 1,
                minWidth: layout.width(editing.col),
                width: `${Math.max(layout.width(editing.col), editing.value.length * 8 + 24)}px`,
              }}
              onChange={actions.updateDraft}
              onCommit={actions.commitEditing}
              onCancel={actions.cancelEditing}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default Grid
