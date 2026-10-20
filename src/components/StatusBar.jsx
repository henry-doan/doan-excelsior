import { useDeferredValue } from 'react'
import { useWorkbook } from '../hooks/useWorkbook.js'
import { normalizeRange, rangeSize } from '../lib/address.js'

const SUMMARY_LIMIT = 50_000
const numberFormatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: 4 })

const summarize = (store, sheet, selection) => {
  const { top, left, bottom, right } = normalizeRange(selection)
  const { height, width } = store.getDimensions(sheet)
  let sum = 0
  let numbers = 0
  let filled = 0
  // Cells beyond the used area are empty, so there is no need to visit them.
  for (let row = top; row <= Math.min(bottom, height - 1); row += 1) {
    for (let col = left; col <= Math.min(right, width - 1); col += 1) {
      const value = store.getValue(sheet, row, col)
      if (value === null || value === undefined || value === '') continue
      filled += 1
      if (typeof value === 'number') {
        sum += value
        numbers += 1
      }
    }
  }
  return { sum, numbers, filled }
}

/**
 * Sum, average and count for multi-cell selections, like the bottom bar in
 * Excel. The selection is deferred so dragging across big ranges stays smooth.
 */
const StatusBar = ({ sheet, selection }) => {
  const store = useWorkbook()
  const deferredSelection = useDeferredValue(selection)
  const size = rangeSize(deferredSelection)

  if (size < 2 || size > SUMMARY_LIMIT) {
    return <div className="status-bar" aria-live="polite" />
  }

  const { sum, numbers, filled } = summarize(store, sheet, deferredSelection)

  return (
    <div className="status-bar" aria-live="polite">
      {numbers > 0 && (
        <>
          <span>Sum <strong>{numberFormatter.format(sum)}</strong></span>
          <span>Average <strong>{numberFormatter.format(sum / numbers)}</strong></span>
        </>
      )}
      <span>Count <strong>{filled}</strong></span>
    </div>
  )
}

export default StatusBar
