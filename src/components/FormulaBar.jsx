import { useId, useRef } from 'react'
import { useFunctionAutocomplete } from '../hooks/useFunctionAutocomplete.js'
import { rangeLabel } from '../lib/address.js'
import FunctionHints from './FunctionHints.jsx'

/**
 * Shows the active cell’s address and raw contents, and edits them in place.
 * Suggests function names while a formula is typed, like the in-cell editor.
 */
const FormulaBar = ({ selection, text, isFormula, isEditing, onFocus, onChange, onCommit, onCancel }) => {
  const inputId = useId()
  const inputRef = useRef(null)
  const autocomplete = useFunctionAutocomplete({ inputRef, value: text, onChange })

  const handleKeyDown = (event) => {
    if (autocomplete.handleKey(event)) return
    if (event.key === 'Enter') {
      event.preventDefault()
      onCommit(event.shiftKey ? -1 : 1, 0)
    } else if (event.key === 'Tab') {
      event.preventDefault()
      onCommit(0, event.shiftKey ? -1 : 1)
    } else if (event.key === 'Escape') {
      event.preventDefault()
      onCancel()
    }
  }

  return (
    <div className="formula-bar">
      <label className="cell-address" htmlFor={inputId}>
        {rangeLabel(selection)}
      </label>
      <span className={`formula-mark ${isFormula ? 'is-formula' : ''}`} aria-hidden="true">
        fx
      </span>
      <div className="formula-field">
        <input
          ref={inputRef}
          id={inputId}
          className="formula-input"
          value={text}
          placeholder="Type a value, or a formula starting with ="
          spellCheck={false}
          autoComplete="off"
          {...autocomplete.inputProps}
          onFocus={onFocus}
          onChange={(event) => {
            autocomplete.trackCaret(event)
            onChange(event.target.value)
          }}
          onKeyDown={handleKeyDown}
        />
        {isEditing && <FunctionHints {...autocomplete.hints} />}
      </div>
    </div>
  )
}

export default FormulaBar
