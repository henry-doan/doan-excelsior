import { useId, useLayoutEffect, useRef, useState } from 'react'
import { callAt, functionTokenAt, getFunction, searchFunctions } from '../lib/functions.js'

const MAX_SUGGESTIONS = 8

/**
 * Function-name autocomplete for a formula input. While someone types a
 * name after "=", it suggests matching functions; inside a call it offers
 * the function's syntax with the current argument highlighted.
 *
 * Returns props to spread on the <input>, a key handler that reports
 * whether it used the key, and the data <FunctionHints> renders.
 */
export const useFunctionAutocomplete = ({ inputRef, value, onChange }) => {
  const listId = useId()
  const [caret, setCaret] = useState(value.length)
  const [active, setActive] = useState({ key: null, index: 0 })
  const [dismissed, setDismissed] = useState(null)
  const pendingCaret = useRef(null)

  // After inserting a name, put the caret inside its parentheses once the new value renders.
  useLayoutEffect(() => {
    if (pendingCaret.current === null) return
    inputRef.current?.setSelectionRange(pendingCaret.current, pendingCaret.current)
    pendingCaret.current = null
  }, [inputRef, value])

  const token = functionTokenAt(value, Math.min(caret, value.length))
  const tokenKey = token ? `${token.start}:${token.text}` : null
  const suggestions =
    token && tokenKey !== dismissed
      ? searchFunctions(token.text)
          .filter((fn) => fn.name.startsWith(token.text.toUpperCase()))
          .slice(0, MAX_SUGGESTIONS)
      : []
  const activeIndex = active.key === tokenKey ? Math.min(active.index, suggestions.length - 1) : 0

  const call = suggestions.length === 0 ? callAt(value, Math.min(caret, value.length)) : null
  const signature = call && getFunction(call.name) ? { fn: getFunction(call.name), argument: call.argument } : null

  const pick = (fn) => {
    const end = Math.min(caret, value.length)
    const next = `${value.slice(0, token.start)}${fn.name}(${value.slice(end)}`
    const position = token.start + fn.name.length + 1
    pendingCaret.current = position
    setCaret(position)
    onChange(next)
  }

  /** Handles list navigation. Returns true when the key was used and the caller should ignore it. */
  const handleKey = (event) => {
    if (suggestions.length === 0) return false
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      const step = event.key === 'ArrowDown' ? 1 : -1
      const index = (activeIndex + step + suggestions.length) % suggestions.length
      setActive({ key: tokenKey, index })
      return true
    }
    if (event.key === 'Tab' || event.key === 'Enter') {
      event.preventDefault()
      pick(suggestions[activeIndex])
      return true
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      setDismissed(tokenKey)
      return true
    }
    return false
  }

  const trackCaret = (event) => setCaret(event.currentTarget.selectionStart ?? value.length)

  const inputProps = {
    role: 'combobox',
    'aria-autocomplete': 'list',
    'aria-expanded': suggestions.length > 0,
    'aria-controls': listId,
    'aria-activedescendant': suggestions.length > 0 ? `${listId}-${activeIndex}` : undefined,
    onSelect: trackCaret,
  }

  return { inputProps, handleKey, trackCaret, hints: { listId, suggestions, activeIndex, signature, onPick: pick } }
}
