/**
 * Column sizing. Widths are stored sparsely (only columns that differ from
 * the default), and the grid turns them into a layout of pixel offsets.
 */

export const DEFAULT_COLUMN_WIDTH = 104
export const MIN_COLUMN_WIDTH = 24
export const MAX_COLUMN_WIDTH = 1200

export const clampWidth = (width) =>
  Math.round(Math.min(MAX_COLUMN_WIDTH, Math.max(MIN_COLUMN_WIDTH, width)))

/**
 * Builds pixel offsets for `count` columns. `widths` maps column index to
 * width; `override` ({ cols, width }) previews a resize that is still in progress.
 * Returns `left(col)`, `width(col)`, `total` and `colAt(x)`.
 */
export const columnLayout = (widths, count, override = null) => {
  const lefts = new Float64Array(count + 1)
  const overridden = override ? new Set(override.cols) : null
  const widthOf = (col) =>
    overridden?.has(col) ? override.width : (widths.get(col) ?? DEFAULT_COLUMN_WIDTH)

  for (let col = 0; col < count; col += 1) lefts[col + 1] = lefts[col] + widthOf(col)

  /** The column under a horizontal pixel offset, found by binary search. */
  const colAt = (x) => {
    let low = 0
    let high = count - 1
    while (low < high) {
      const mid = (low + high + 1) >> 1
      if (lefts[mid] <= x) low = mid
      else high = mid - 1
    }
    return low
  }

  return {
    left: (col) => lefts[col],
    width: (col) => lefts[col + 1] - lefts[col],
    total: lefts[count],
    colAt,
  }
}

/** Moves stored widths when columns are inserted (delta > 0) or removed (delta < 0). */
export const shiftWidths = (widths, index, delta) => {
  const next = new Map()
  for (const [col, width] of widths) {
    if (delta < 0 && col >= index && col < index - delta) continue
    next.set(col >= index ? col + delta : col, width)
  }
  return next
}
