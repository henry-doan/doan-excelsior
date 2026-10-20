import * as XLSX from 'xlsx'
import { CellValueDetailedType } from 'hyperformula'

/**
 * Number formats used when a cell has no format of its own but
 * HyperFormula recognised the input as a date, percentage, etc.
 */
const DETECTED_FORMATS = {
  [CellValueDetailedType.NUMBER_DATE]: 'm/d/yyyy',
  [CellValueDetailedType.NUMBER_DATETIME]: 'm/d/yyyy h:mm',
  [CellValueDetailedType.NUMBER_TIME]: 'h:mm:ss',
  [CellValueDetailedType.NUMBER_PERCENT]: '0.##%',
  [CellValueDetailedType.NUMBER_CURRENCY]: '$#,##0.00',
}

export const detectedFormat = (detailedType) => DETECTED_FORMATS[detailedType] ?? null

export const isErrorValue = (value) =>
  value !== null && typeof value === 'object' && 'value' in value

const formatPlainNumber = (number) =>
  Number.isInteger(number) ? String(number) : String(Number(number.toPrecision(10)))

/** Turns an engine value plus an optional Excel number format into display text. */
export const formatValue = (value, numberFormat) => {
  if (value === null || value === undefined) return ''
  if (isErrorValue(value)) return value.value ?? '#ERROR!'
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE'
  if (typeof value === 'number') {
    if (numberFormat && numberFormat !== 'General') {
      try {
        return XLSX.SSF.format(numberFormat, value)
      } catch {
        return formatPlainNumber(value)
      }
    }
    return formatPlainNumber(value)
  }
  return String(value)
}

/** Converts what someone typed into the raw content HyperFormula expects. */
export const parseInput = (text) => {
  if (text === null || text === undefined) return null
  const content = String(text)
  return content.trim() === '' ? null : content
}

/** Turns the serialized content of a cell back into editable text. */
export const toEditText = (serialized) => {
  if (serialized === null || serialized === undefined) return ''
  if (typeof serialized === 'boolean') return serialized ? 'TRUE' : 'FALSE'
  return String(serialized)
}
