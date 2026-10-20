import { useEffect, useEffectEvent, useRef } from 'react'
import { useFunctionAutocomplete } from '../hooks/useFunctionAutocomplete.js'
import FunctionHints from './FunctionHints.jsx'

const ARROW_MOVES = {
  ArrowUp: [-1, 0],
  ArrowDown: [1, 0],
  ArrowLeft: [0, -1],
  ArrowRight: [0, 1],
}

/**
 * The in-cell text box. In "enter" mode (started by typing) the arrow keys
 * commit and move, like Excel. In "edit" mode (F2, Enter or double-click)
 * they move the caret instead. While a function name is being typed, the
 * suggestion list gets the arrow, Tab, Enter and Esc keys first.
 *
 * `focusRequest` changes when something outside (like the Functions menu)
 * rewrites the value, so the box takes focus again with the caret at `caret`.
 */
const CellEditor = ({ value, mode, style, label, caret, focusRequest, onChange, onCommit, onCancel }) => {
  const inputRef = useRef(null)
  const autocomplete = useFunctionAutocomplete({ inputRef, value, onChange })

  const placeCaret = useEffectEvent(() => {
    const input = inputRef.current
    const position = caret ?? input.value.length
    input.focus()
    input.setSelectionRange(position, position)
  })

  useEffect(() => placeCaret(), [focusRequest])

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
    } else if (mode === 'enter' && ARROW_MOVES[event.key]) {
      event.preventDefault()
      onCommit(...ARROW_MOVES[event.key])
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        className="cell-editor"
        style={style}
        value={value}
        aria-label={`Edit ${label}`}
        spellCheck={false}
        autoComplete="off"
        {...autocomplete.inputProps}
        onChange={(event) => {
          autocomplete.trackCaret(event)
          onChange(event.target.value)
        }}
        onKeyDown={handleKeyDown}
      />
      <FunctionHints
        {...autocomplete.hints}
        style={{ top: style.top + style.height + 2, left: style.left }}
      />
    </>
  )
}

export default CellEditor
