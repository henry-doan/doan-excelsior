/**
 * Interface wording. "knightly" is the optional medieval voice; it only
 * changes labels and messages, never what a button does. Error details
 * from the engine are always shown as-is so they stay searchable.
 */

const plain = {
  new: 'New',
  open: 'Open',
  openTitle: 'Open an Excel, ODS or CSV file',
  opening: 'Opening…',
  downloadXlsx: 'Download .xlsx',
  downloadCsv: 'Download .csv',
  undo: 'Undo',
  redo: 'Redo',
  insertRow: 'Insert row',
  deleteRows: 'Delete rows',
  insertColumn: 'Insert column',
  deleteColumns: 'Delete columns',
  sortAsc: 'Sort A–Z',
  sortDesc: 'Sort Z–A',
  sortAscTitle: 'Sort rows by the active column, smallest or A first',
  sortDescTitle: 'Sort rows by the active column, largest or Z first',
  sorted: (rows, column, descending, { header, totals }) =>
    `Sorted rows ${rows} by column ${column}, ${descending ? 'Z to A' : 'A to Z'}.` +
    (header ? ` Row ${header} stayed as the header.` : '') +
    (totals ? ` Row ${totals} stayed as the totals.` : ''),
  alreadySorted: (column) => `Already in order by column ${column}.`,
  nothingToSort: 'There’s nothing to sort yet. Type or open some rows first.',
  functions: 'Functions',
  functionsTitle: 'Insert a function',
  totalsHeading: 'Total the selected cells',
  popularHeading: 'Popular',
  allFunctions: 'All functions…',
  shortcuts: 'Shortcuts',
  addSheet: 'Add sheet',
  newSheetPrefix: 'Sheet',
  sum: 'Sum',
  average: 'Average',
  count: 'Count',
  knightlyToggle: 'Knightly speech',
  soundToggle: 'Sound effects',
  squireToggle: 'Squire',
  chargeTitle: 'Opening',
  stages: {
    read: 'Reading the file',
    parse: 'Reading the sheets',
    build: 'Calculating formulas',
  },
  downloaded: (fileName) => `Downloaded ${fileName}.`,
  downloadedSheet: (sheetName, fileName) => `Downloaded “${sheetName}” as ${fileName}.`,
  confirmNew: 'Start a new workbook? Changes you haven’t downloaded will be lost.',
  confirmOpen: (fileName) => `Open “${fileName}”? Changes you haven’t downloaded will be lost.`,
  confirmDeleteSheet: (sheetName) => `Delete “${sheetName}”? You can undo this with Ctrl+Z.`,
  selectNumbers: 'Select some cells with numbers first.',
  dragonCount: (count, label) => `${label} ${count === 1 ? 'error' : 'errors'}`,
  dragonTitle: (count) =>
    `${count === 1 ? 'A cell shows an error' : `${count.toLocaleString()} cells show errors`}. Click to go to the next one.`,
  dragonSlain: 'All errors fixed.',
  dragonSlainShort: 'All fixed',
}

const knightly = {
  ...plain,
  new: 'Forge',
  open: 'Summon scroll',
  openTitle: 'Summon an Excel, ODS or CSV scroll',
  opening: 'Charging…',
  downloadXlsx: 'Seal as .xlsx',
  downloadCsv: 'Seal as .csv',
  undo: 'Retreat',
  redo: 'Advance',
  insertRow: 'Raise row',
  deleteRows: 'Banish rows',
  insertColumn: 'Raise column',
  deleteColumns: 'Banish columns',
  sortAsc: 'Marshal A–Z',
  sortDesc: 'Marshal Z–A',
  sortAscTitle: 'Marshal the ranks by the chosen column, least or A first',
  sortDescTitle: 'Marshal the ranks by the chosen column, greatest or Z first',
  sorted: (rows, column, descending, { header, totals }) =>
    `The ranks of rows ${rows} are marshalled by column ${column}, ${descending ? 'Z to A' : 'A to Z'}.` +
    (header ? ` Row ${header} holdeth its place as the banner.` : '') +
    (totals ? ` Row ${totals} keepeth the tally at the rear.` : ''),
  alreadySorted: (column) => `The ranks already stand in order by column ${column}.`,
  nothingToSort: 'There are no ranks to marshal yet, good knight.',
  functions: 'Spellbook',
  functionsTitle: 'Cast a function',
  totalsHeading: 'Tally the chosen cells',
  popularHeading: 'Favored by the court',
  allFunctions: 'The full spellbook…',
  shortcuts: 'Battle keys',
  addSheet: 'Raise a banner',
  newSheetPrefix: 'Banner ',
  sum: 'Tribute',
  average: 'Mean',
  count: 'Muster',
  squireToggle: 'Summon thy squire',
  chargeTitle: 'Charge!',
  stages: {
    read: 'Unrolling the scroll',
    parse: 'Deciphering the runes',
    build: 'Raising the formulas',
  },
  downloaded: (fileName) => `Sealed and dispatched: ${fileName}.`,
  downloadedSheet: (sheetName, fileName) => `“${sheetName}” sealed and dispatched as ${fileName}.`,
  confirmNew: 'Forge a new workbook? Deeds not yet sealed (downloaded) shall be lost.',
  confirmOpen: (fileName) => `Summon “${fileName}”? Deeds not yet sealed (downloaded) shall be lost.`,
  confirmDeleteSheet: (sheetName) => `Lower the banner “${sheetName}”? Thou mayest retreat with Ctrl+Z.`,
  selectNumbers: 'Choose cells bearing numbers first, good knight.',
  dragonCount: (count, label) => `${label} to slay`,
  dragonTitle: (count) =>
    `A dragon guards ${count === 1 ? 'an errant cell' : `${count.toLocaleString()} errant cells`}! Strike to face the next.`,
  dragonSlain: 'The dragon is slain! Every error is mended.',
  dragonSlainShort: 'Slain!',
}

export const WORDS = { plain, knightly }
