/**
 * Helpers for converting between zero-based grid coordinates
 * and the A1-style labels people see in a spreadsheet.
 */

export const columnLabel = (index) => {
  let label = ''
  let n = index + 1
  while (n > 0) {
    const remainder = (n - 1) % 26
    label = String.fromCharCode(65 + remainder) + label
    n = Math.floor((n - 1) / 26)
  }
  return label
}

export const cellLabel = (row, col) => `${columnLabel(col)}${row + 1}`

/** Normalizes a selection so the result is always top-left → bottom-right. */
export const normalizeRange = ({ row, col, endRow, endCol }) => ({
  top: Math.min(row, endRow),
  left: Math.min(col, endCol),
  bottom: Math.max(row, endRow),
  right: Math.max(col, endCol),
})

export const rangeLabel = (selection) => {
  const { top, left, bottom, right } = normalizeRange(selection)
  const start = cellLabel(top, left)
  return top === bottom && left === right ? start : `${start}:${cellLabel(bottom, right)}`
}

export const rangeSize = (selection) => {
  const { top, left, bottom, right } = normalizeRange(selection)
  return (bottom - top + 1) * (right - left + 1)
}

export const clamp = (value, min, max) => Math.min(Math.max(value, min), max)
