/**
 * Tab-separated text is what Excel and Google Sheets put on the
 * clipboard, so it is what we read and write too.
 */

export const toTsv = (matrix) => matrix.map((row) => row.join('\t')).join('\n')

export const fromTsv = (text) => {
  const lines = text.replace(/\r\n?/g, '\n').split('\n')
  if (lines.length > 1 && lines.at(-1) === '') lines.pop()
  return lines.map((line) => line.split('\t'))
}
