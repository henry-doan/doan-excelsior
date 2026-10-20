import { useEffect, useRef, useState } from 'react'
import { CATEGORIES, FUNCTIONS, searchFunctions } from '../lib/functions.js'
import Icon from './Icon.jsx'

/**
 * A searchable list of every supported function, in a modal <dialog>.
 * Picking one inserts it into the active cell.
 */
const FunctionPicker = ({ open, onClose, onPick }) => {
  const dialogRef = useRef(null)
  const searchRef = useRef(null)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const dialog = dialogRef.current
    // The dialog stays mounted, so autoFocus would only fire once; focus the search on every open.
    if (open && !dialog.open) {
      dialog.showModal()
      searchRef.current.focus()
    }
    if (!open && dialog.open) dialog.close()
  }, [open])

  const results = searchFunctions(query, { category: category || null })
  const active = Math.min(activeIndex, results.length - 1)

  const pick = (fn) => {
    if (!fn) return
    // Close first: the dialog hands focus back to the menu button as it closes,
    // and the cell editor that onPick opens should take it after that.
    dialogRef.current.close()
    onPick(fn.name)
    setQuery('')
    setActiveIndex(0)
  }

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      const step = event.key === 'ArrowDown' ? 1 : -1
      const next = Math.min(Math.max(active + step, 0), results.length - 1)
      setActiveIndex(next)
      dialogRef.current.querySelector(`[data-index="${next}"]`)?.scrollIntoView({ block: 'nearest' })
    } else if (event.key === 'Enter') {
      event.preventDefault()
      pick(results[active])
    }
  }

  return (
    <dialog ref={dialogRef} className="function-picker" aria-label="All functions" onClose={onClose}>
      <div className="picker-header">
        <h2>Insert a function</h2>
        <button type="button" className="icon-button" aria-label="Close" onClick={onClose}>
          <Icon name="close" size={16} />
        </button>
      </div>
      <div className="picker-filters">
        <input
          ref={searchRef}
          type="search"
          className="picker-search"
          placeholder={`Search ${FUNCTIONS.length} functions, e.g. “lookup” or “average”`}
          aria-label="Search functions"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setActiveIndex(0)
          }}
          onKeyDown={handleKeyDown}
        />
        <select
          className="picker-category"
          aria-label="Category"
          value={category}
          onChange={(event) => {
            setCategory(event.target.value)
            setActiveIndex(0)
          }}
        >
          <option value="">All categories</option>
          {CATEGORIES.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>
      <ul className="picker-list" role="listbox" aria-label="Functions">
        {results.map((fn, index) => (
          <li
            key={fn.name}
            data-index={index}
            role="option"
            aria-selected={index === active}
            className={index === active ? 'is-active' : ''}
            onPointerEnter={() => setActiveIndex(index)}
            onClick={() => pick(fn)}
          >
            <code className="picker-syntax">{fn.syntax}</code>
            <span className="picker-category-tag">{fn.category}</span>
            {fn.description && <span className="picker-description">{fn.description}</span>}
          </li>
        ))}
        {results.length === 0 && <li className="picker-empty">No functions match “{query}”.</li>}
      </ul>
    </dialog>
  )
}

export default FunctionPicker
