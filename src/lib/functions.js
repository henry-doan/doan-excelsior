import { HyperFormula } from 'hyperformula'
import './excelsiorFunction.js'

/**
 * The catalog behind function autocomplete and the Functions menu.
 * HyperFormula knows the names but has no descriptions, so the common
 * functions are documented here; the rest are listed by category only.
 */

const DOCS = {
  // Math
  SUM: ['Math', 'SUM(number1, [number2], …)', 'Adds all the numbers in a range of cells.'],
  SUMIF: ['Math', 'SUMIF(range, criterion, [sum_range])', 'Adds the cells that meet one condition.'],
  SUMIFS: ['Math', 'SUMIFS(sum_range, range1, criterion1, …)', 'Adds the cells that meet several conditions.'],
  SUMPRODUCT: ['Math', 'SUMPRODUCT(array1, [array2], …)', 'Multiplies matching items in ranges and adds the results.'],
  PRODUCT: ['Math', 'PRODUCT(number1, [number2], …)', 'Multiplies all its arguments.'],
  ROUND: ['Math', 'ROUND(number, digits)', 'Rounds a number to a given number of digits.'],
  ROUNDUP: ['Math', 'ROUNDUP(number, digits)', 'Rounds a number up, away from zero.'],
  ROUNDDOWN: ['Math', 'ROUNDDOWN(number, digits)', 'Rounds a number down, toward zero.'],
  ABS: ['Math', 'ABS(number)', 'Returns a number without its sign.'],
  INT: ['Math', 'INT(number)', 'Rounds a number down to the nearest whole number.'],
  MOD: ['Math', 'MOD(number, divisor)', 'Returns the remainder after division.'],
  POWER: ['Math', 'POWER(number, power)', 'Raises a number to a power.'],
  SQRT: ['Math', 'SQRT(number)', 'Returns the square root of a number.'],
  RAND: ['Math', 'RAND()', 'Returns a random number between 0 and 1.'],
  RANDBETWEEN: ['Math', 'RANDBETWEEN(low, high)', 'Returns a random whole number between two numbers.'],
  SUBTOTAL: ['Math', 'SUBTOTAL(function_number, range1, …)', 'Returns a subtotal, such as a sum or average, for a range.'],
  CEILING: ['Math', 'CEILING(number, significance)', 'Rounds a number up to the nearest multiple.'],
  FLOOR: ['Math', 'FLOOR(number, significance)', 'Rounds a number down to the nearest multiple.'],
  PI: ['Math', 'PI()', 'Returns the value of pi.'],
  // Statistical
  AVERAGE: ['Statistical', 'AVERAGE(number1, [number2], …)', 'Returns the average (arithmetic mean) of its arguments.'],
  AVERAGEIF: ['Statistical', 'AVERAGEIF(range, criterion, [average_range])', 'Averages the cells that meet a condition.'],
  COUNT: ['Statistical', 'COUNT(value1, [value2], …)', 'Counts the cells that contain numbers.'],
  COUNTA: ['Statistical', 'COUNTA(value1, [value2], …)', 'Counts the cells that are not empty.'],
  COUNTBLANK: ['Statistical', 'COUNTBLANK(range)', 'Counts the empty cells in a range.'],
  COUNTIF: ['Statistical', 'COUNTIF(range, criterion)', 'Counts the cells that meet one condition.'],
  COUNTIFS: ['Statistical', 'COUNTIFS(range1, criterion1, …)', 'Counts the cells that meet several conditions.'],
  MAX: ['Statistical', 'MAX(number1, [number2], …)', 'Returns the largest value.'],
  MIN: ['Statistical', 'MIN(number1, [number2], …)', 'Returns the smallest value.'],
  MAXIFS: ['Statistical', 'MAXIFS(max_range, range1, criterion1, …)', 'Returns the largest value among cells that meet conditions.'],
  MINIFS: ['Statistical', 'MINIFS(min_range, range1, criterion1, …)', 'Returns the smallest value among cells that meet conditions.'],
  MEDIAN: ['Statistical', 'MEDIAN(number1, [number2], …)', 'Returns the middle value.'],
  LARGE: ['Statistical', 'LARGE(range, k)', 'Returns the k-th largest value.'],
  SMALL: ['Statistical', 'SMALL(range, k)', 'Returns the k-th smallest value.'],
  STDEV: ['Statistical', 'STDEV(number1, [number2], …)', 'Estimates standard deviation from a sample.'],
  // Logical
  IF: ['Logical', 'IF(test, value_if_true, [value_if_false])', 'Returns one value if a test is true and another if it is false.'],
  IFS: ['Logical', 'IFS(test1, value1, [test2, value2], …)', 'Returns the value for the first test that is true.'],
  IFERROR: ['Logical', 'IFERROR(value, value_if_error)', 'Returns a fallback if a formula gives an error.'],
  IFNA: ['Logical', 'IFNA(value, value_if_na)', 'Returns a fallback if a formula gives #N/A.'],
  AND: ['Logical', 'AND(test1, [test2], …)', 'Returns TRUE if all of its arguments are true.'],
  OR: ['Logical', 'OR(test1, [test2], …)', 'Returns TRUE if any argument is true.'],
  NOT: ['Logical', 'NOT(test)', 'Reverses TRUE and FALSE.'],
  SWITCH: ['Logical', 'SWITCH(value, case1, result1, …, [default])', 'Returns the result for the first case that matches a value.'],
  // Lookup
  VLOOKUP: ['Lookup', 'VLOOKUP(search_key, range, index, [is_sorted])', 'Looks down the first column of a range and returns a value from the same row.'],
  HLOOKUP: ['Lookup', 'HLOOKUP(search_key, range, index, [is_sorted])', 'Looks across the first row of a range and returns a value from the same column.'],
  XLOOKUP: ['Lookup', 'XLOOKUP(search_key, lookup_range, return_range, [if_not_found])', 'Finds a value in one range and returns the matching item from another.'],
  INDEX: ['Lookup', 'INDEX(range, row, [column])', 'Returns the value at a given row and column of a range.'],
  MATCH: ['Lookup', 'MATCH(search_key, range, [type])', 'Returns the position of a value in a range.'],
  CHOOSE: ['Lookup', 'CHOOSE(index, value1, [value2], …)', 'Picks a value from a list by its position.'],
  FILTER: ['Lookup', 'FILTER(range, condition1, …)', 'Returns the rows of a range that meet conditions.'],
  SORT: ['Lookup', 'SORT(range, [column], [ascending])', 'Sorts the rows of a range.'],
  UNIQUE: ['Lookup', 'UNIQUE(range)', 'Returns the unique rows of a range.'],
  // Text
  CONCATENATE: ['Text', 'CONCATENATE(text1, [text2], …)', 'Joins several pieces of text into one.'],
  TEXTJOIN: ['Text', 'TEXTJOIN(delimiter, ignore_empty, text1, …)', 'Joins text with a delimiter between each piece.'],
  LEFT: ['Text', 'LEFT(text, [count])', 'Returns characters from the start of text.'],
  RIGHT: ['Text', 'RIGHT(text, [count])', 'Returns characters from the end of text.'],
  MID: ['Text', 'MID(text, start, count)', 'Returns characters from the middle of text.'],
  LEN: ['Text', 'LEN(text)', 'Returns the number of characters in text.'],
  TRIM: ['Text', 'TRIM(text)', 'Removes extra spaces from text.'],
  UPPER: ['Text', 'UPPER(text)', 'Converts text to uppercase.'],
  LOWER: ['Text', 'LOWER(text)', 'Converts text to lowercase.'],
  PROPER: ['Text', 'PROPER(text)', 'Capitalizes the first letter of each word.'],
  SUBSTITUTE: ['Text', 'SUBSTITUTE(text, old, new, [occurrence])', 'Replaces existing text with new text.'],
  FIND: ['Text', 'FIND(search_for, text, [start])', 'Finds text inside other text (case-sensitive).'],
  SEARCH: ['Text', 'SEARCH(search_for, text, [start])', 'Finds text inside other text (not case-sensitive).'],
  TEXT: ['Text', 'TEXT(number, format)', 'Formats a number as text, e.g. TEXT(A1, "0.00").'],
  VALUE: ['Text', 'VALUE(text)', 'Converts text that looks like a number into a number.'],
  // Date & time
  TODAY: ['Date & time', 'TODAY()', 'Returns today’s date.'],
  NOW: ['Date & time', 'NOW()', 'Returns the current date and time.'],
  DATE: ['Date & time', 'DATE(year, month, day)', 'Builds a date from a year, month and day.'],
  YEAR: ['Date & time', 'YEAR(date)', 'Returns the year of a date.'],
  MONTH: ['Date & time', 'MONTH(date)', 'Returns the month of a date (1–12).'],
  DAY: ['Date & time', 'DAY(date)', 'Returns the day of the month of a date.'],
  WEEKDAY: ['Date & time', 'WEEKDAY(date, [type])', 'Returns the day of the week as a number.'],
  DATEDIF: ['Date & time', 'DATEDIF(start, end, unit)', 'Returns the days, months or years between two dates.'],
  DAYS: ['Date & time', 'DAYS(end, start)', 'Returns the number of days between two dates.'],
  EDATE: ['Date & time', 'EDATE(date, months)', 'Returns a date a number of months before or after another.'],
  EOMONTH: ['Date & time', 'EOMONTH(date, months)', 'Returns the last day of a month.'],
  NETWORKDAYS: ['Date & time', 'NETWORKDAYS(start, end, [holidays])', 'Returns the number of working days between two dates.'],
  // Financial
  PMT: ['Financial', 'PMT(rate, periods, present_value, [future_value], [type])', 'Returns the payment for a loan with constant payments.'],
  FV: ['Financial', 'FV(rate, periods, payment, [present_value], [type])', 'Returns the future value of an investment.'],
  PV: ['Financial', 'PV(rate, periods, payment, [future_value], [type])', 'Returns the present value of an investment.'],
  NPV: ['Financial', 'NPV(rate, value1, [value2], …)', 'Returns the net present value of a series of cash flows.'],
  IRR: ['Financial', 'IRR(values, [guess])', 'Returns the internal rate of return of cash flows.'],
  // Information
  ISBLANK: ['Information', 'ISBLANK(value)', 'Returns TRUE if a cell is empty.'],
  ISNUMBER: ['Information', 'ISNUMBER(value)', 'Returns TRUE if a value is a number.'],
  ISTEXT: ['Information', 'ISTEXT(value)', 'Returns TRUE if a value is text.'],
  ISERROR: ['Information', 'ISERROR(value)', 'Returns TRUE if a value is any error.'],
  // Ours
  EXCELSIOR: ['Knightly', 'EXCELSIOR()', 'Returns a random knightly motto. Only works in Doan Excelsior.'],
}

/** Categories for the functions without their own description, by name or prefix. */
const CATEGORY_NAMES = {
  Math: 'ACOS ACOSH ACOT ACOTH ARABIC ASIN ASINH ATAN ATAN2 ATANH BASE CEILING.MATH CEILING.PRECISE COMBIN COMBINA COS COSH COT COTH CSC CSCH DECIMAL DEGREES EVEN EXP FACT FACTDOUBLE FLOOR.MATH FLOOR.PRECISE GCD ISO.CEILING LCM LN LOG LOG10 MMULT MROUND MULTINOMIAL ODD QUOTIENT RADIANS ROMAN SEC SECH SEQUENCE SERIESSUM SIGN SIN SINH SQRTPI SUMSQ SUMX2MY2 SUMX2PY2 SUMXMY2 TAN TANH TRUNC MAXPOOL MEDIANPOOL',
  Statistical: 'AVEDEV AVERAGEA CORREL COUNTUNIQUE COVAR DEVSQ FISHER FISHERINV GAMMA GAMMALN GAMMALN.PRECISE GAUSS GEOMEAN HARMEAN MAXA MINA PEARSON PERCENTILE PERCENTILE.EXC PERCENTILE.INC PHI QUARTILE QUARTILE.EXC QUARTILE.INC RSQ SKEW SKEW.P SKEWP SLOPE STANDARDIZE STDEV.P STDEV.S STDEVA STDEVP STDEVPA STDEVS STEYX VAR VAR.P VAR.S VARA VARP VARPA VARS CRITBINOM CONFIDENCE CONFIDENCE.NORM CONFIDENCE.T',
  Logical: 'TRUE FALSE XOR',
  Lookup: 'ADDRESS COLUMN COLUMNS FORMULATEXT HYPERLINK OFFSET ROW ROWS TRANSPOSE VSTACK HSTACK ARRAYFORMULA ARRAY_CONSTRAIN',
  Text: 'CHAR CLEAN CODE EXACT REPLACE REPT SPLIT T UNICHAR UNICODE',
  'Date & time': 'DATEVALUE DAYS360 HOUR INTERVAL ISOWEEKNUM MINUTE NETWORKDAYS.INTL SECOND TIME TIMEVALUE WEEKNUM WORKDAY WORKDAY.INTL YEARFRAC',
  Financial: 'CUMIPMT CUMPRINC DB DDB DOLLARDE DOLLARFR EFFECT FVSCHEDULE IPMT ISPMT MIRR NOMINAL NPER PDURATION PPMT RATE RRI SLN SYD TBILLEQ TBILLPRICE TBILLYIELD XIRR XNPV',
  Information: 'ISBINARY ISERR ISEVEN ISFORMULA ISLOGICAL ISNA ISNONTEXT ISODD ISREF N NA SHEET SHEETS',
  Database: 'DAVERAGE DCOUNT DCOUNTA DGET DMAX DMIN DPRODUCT DSTDEV DSTDEVP DSUM DVAR DVARP',
}

const CATEGORY_BY_NAME = new Map(
  Object.entries(CATEGORY_NAMES).flatMap(([category, names]) =>
    names.split(' ').map((name) => [name, category]),
  ),
)

const ENGINEERING = /^(IM|BIT|BESSEL|BIN2|DEC2|HEX2|OCT2|ERF|DELTA|COMPLEX)/

const categoryFor = (name) => {
  if (DOCS[name]) return DOCS[name][0]
  if (CATEGORY_BY_NAME.has(name)) return CATEGORY_BY_NAME.get(name)
  if (ENGINEERING.test(name)) return 'Engineering'
  return 'Statistical' // What remains is distributions and tests, e.g. NORM.DIST, T.TEST.
}

export const CATEGORIES = [
  'Math',
  'Statistical',
  'Logical',
  'Lookup',
  'Text',
  'Date & time',
  'Financial',
  'Information',
  'Database',
  'Engineering',
  'Knightly',
]

/** Every function the engine supports, skipping HyperFormula's internal operator functions. */
export const FUNCTIONS = HyperFormula.getRegisteredFunctionNames('enGB')
  .filter((name) => !name.startsWith('HF.') && name !== 'VERSION')
  .sort()
  .map((name) => ({
    name,
    category: categoryFor(name),
    syntax: DOCS[name]?.[1] ?? `${name}(…)`,
    description: DOCS[name]?.[2] ?? '',
  }))

const BY_NAME = new Map(FUNCTIONS.map((fn) => [fn.name, fn]))

export const getFunction = (name) => BY_NAME.get(name.toUpperCase()) ?? null

/** The short list shown at the top of the Functions menu. */
export const QUICK_TOTALS = ['SUM', 'AVERAGE', 'COUNT', 'MIN', 'MAX']
export const POPULAR = ['IF', 'VLOOKUP', 'XLOOKUP', 'COUNTIF', 'SUMIF', 'IFERROR', 'CONCATENATE', 'ROUND', 'TODAY']

const FAVORITES = [...QUICK_TOTALS, ...POPULAR]

/** Lower ranks first: the menu's favorites, then documented functions, then the rest. */
const rank = (name) => {
  const favorite = FAVORITES.indexOf(name)
  if (favorite >= 0) return favorite
  return DOCS[name] ? FAVORITES.length : FAVORITES.length + 1
}

/**
 * Functions matching a search. Names that start with the query come first,
 * then documented functions whose name or description mentions it.
 */
export const searchFunctions = (query, { limit = Infinity, category = null } = {}) => {
  const pool = category ? FUNCTIONS.filter((fn) => fn.category === category) : FUNCTIONS
  const needle = query.trim().toUpperCase()
  if (!needle) return pool.slice(0, limit)
  const starts = pool.filter((fn) => fn.name.startsWith(needle))
  const mentions = pool.filter(
    (fn) =>
      !fn.name.startsWith(needle) &&
      (fn.name.includes(needle) || fn.description.toUpperCase().includes(needle)),
  )
  // Popular functions first among prefix matches, so "S" suggests SUM before SEARCH or SEC.
  starts.sort((a, b) => rank(a.name) - rank(b.name))
  return [...starts, ...mentions].slice(0, limit)
}

// Formula text helpers ------------------------------------------------------

/** Marks which characters of a formula sit inside "string literals". */
const quotedMask = (text, end = text.length) => {
  const mask = []
  let inString = false
  for (let i = 0; i < end; i += 1) {
    if (text[i] === '"') inString = !inString
    mask.push(inString)
  }
  return { mask, inString }
}

/**
 * The function name being typed just before the caret, e.g. "VLO" in
 * "=A1+VLO|". Returns { start, text } or null when the caret isn't on a name.
 */
export const functionTokenAt = (value, caret) => {
  if (!value.startsWith('=')) return null
  if (quotedMask(value, caret).inString) return null
  const match = /[A-Za-z][A-Za-z0-9.]*$/.exec(value.slice(1, caret))
  if (!match) return null
  const start = match.index + 1
  // A name followed by "(" is already complete; a "!" before it means a sheet reference.
  if (value[caret] === '(' || value[start - 1] === '!' || value[start - 1] === ':') return null
  // Cell references like A1 or AB12 aren't functions being typed.
  if (/^[A-Za-z]{1,3}\d+$/.test(match[0])) return null
  return { start, text: match[0] }
}

/**
 * The function call the caret is inside, and which argument it is on,
 * e.g. "=IF(A1>2, |" → { name: "IF", argument: 1 }. Used for the syntax hint.
 */
export const callAt = (value, caret) => {
  if (!value.startsWith('=')) return null
  const { mask } = quotedMask(value, caret)
  let depth = 0
  let argument = 0
  for (let i = caret - 1; i > 0; i -= 1) {
    if (mask[i]) continue
    const char = value[i]
    if (char === ')') depth += 1
    else if (char === '(') {
      if (depth === 0) {
        const name = /[A-Za-z][A-Za-z0-9.]*$/.exec(value.slice(1, i))?.[0]
        return name ? { name: name.toUpperCase(), argument } : null
      }
      depth -= 1
    } else if (char === ',' && depth === 0) argument += 1
  }
  return null
}

/** Adds any missing closing parentheses, so "=SUM(A1:A3" becomes "=SUM(A1:A3)", like Excel. */
export const closeParens = (value) => {
  if (!value.startsWith('=')) return value
  const { mask, inString } = quotedMask(value)
  if (inString) return value
  let open = 0
  for (let i = 0; i < value.length; i += 1) {
    if (mask[i]) continue
    if (value[i] === '(') open += 1
    else if (value[i] === ')') open = Math.max(0, open - 1)
  }
  return value + ')'.repeat(open)
}
