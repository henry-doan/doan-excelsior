import { FunctionPlugin, HyperFormula } from 'hyperformula'

/**
 * =EXCELSIOR() — a custom function that returns a random knightly motto.
 * It's an easter egg: Excel doesn't know it, so a downloaded file keeps the
 * motto as the cell's saved value but Excel will show #NAME? if it recalculates.
 *
 * Imported for its side effect (registering the function) by the workbook
 * store and the function catalog, so it exists before any engine is built.
 */

export const MOTTOS = [
  'Excelsior — ever upward!',
  'Fortune favors the bold.',
  'By sword and spreadsheet.',
  'No formula left behind.',
  'Honor in every cell.',
  'Steady hand, true sums.',
  'Courage, then calculation.',
  'The ledger is mightier than the sword.',
  'Ride swift, reckon true.',
  'For the realm and the reconciliation.',
  'Who dares, totals.',
  'A knight balances every column.',
  'Strength in numbers.',
  'Faithful to the final decimal.',
  'Onward, through the quarterly reports!',
  'Let no #REF! go unanswered.',
]

const pickMotto = () => MOTTOS[Math.floor(Math.random() * MOTTOS.length)]

class ExcelsiorPlugin extends FunctionPlugin {}

ExcelsiorPlugin.implementedFunctions = {
  EXCELSIOR: { method: 'excelsior', parameters: [] },
}

// HyperFormula looks plugin methods up on the prototype. This one doesn't
// need `this`, so a plain arrow function keeps to the house style.
ExcelsiorPlugin.prototype.excelsior = () => pickMotto()

// Guarded so hot reloading in development doesn't register it twice.
if (!HyperFormula.getRegisteredFunctionNames('enGB').includes('EXCELSIOR')) {
  HyperFormula.registerFunctionPlugin(ExcelsiorPlugin, { enGB: { EXCELSIOR: 'EXCELSIOR' } })
}
