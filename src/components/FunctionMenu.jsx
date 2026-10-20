import { useEffect, useRef, useState } from 'react'
import { useWords } from '../hooks/useSettings.js'
import { getFunction, POPULAR, QUICK_TOTALS } from '../lib/functions.js'
import Icon from './Icon.jsx'

const TOTAL_LABELS = { SUM: 'Sum', AVERAGE: 'Average', COUNT: 'Count numbers', MIN: 'Min', MAX: 'Max' }

/**
 * The Σ Functions dropdown: quick totals for the selected cells, popular
 * functions, and a way into the full list. The menu uses fixed positioning
 * because the toolbar row scrolls sideways on small screens and would clip it.
 */
const FunctionMenu = ({ onTotal, onInsert, onBrowse }) => {
  // null when closed, otherwise where the menu opens: { top, left }.
  const [position, setPosition] = useState(null)
  const menuRef = useRef(null)
  const words = useWords()
  const open = position !== null

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event) => {
      if (!menuRef.current?.contains(event.target)) setPosition(null)
    }
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setPosition(null)
    }
    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const choose = (action) => {
    setPosition(null)
    action()
  }

  return (
    <div className="function-menu" ref={menuRef}>
      <button
        type="button"
        className="tool-button"
        title={words.functionsTitle}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(event) => {
          const bounds = event.currentTarget.getBoundingClientRect()
          const left = Math.max(8, Math.min(bounds.left, window.innerWidth - 288))
          setPosition(open ? null : { top: bounds.bottom + 4, left })
        }}
      >
        <Icon name="sigma" />
        <span className="tool-label">{words.functions}</span>
        <Icon name="chevron" size={14} />
      </button>

      {open && (
        <div className="menu" role="menu" aria-label={words.functions} style={position}>
          <p className="menu-heading">{words.totalsHeading}</p>
          {QUICK_TOTALS.map((name) => (
            <button
              key={name}
              type="button"
              role="menuitem"
              className="menu-item"
              onClick={() => choose(() => onTotal(name))}
            >
              <span>{TOTAL_LABELS[name]}</span>
              <code>{name}</code>
            </button>
          ))}
          <p className="menu-heading">{words.popularHeading}</p>
          {POPULAR.map((name) => (
            <button
              key={name}
              type="button"
              role="menuitem"
              className="menu-item"
              title={getFunction(name)?.description}
              onClick={() => choose(() => onInsert(name))}
            >
              <code>{getFunction(name)?.syntax ?? name}</code>
            </button>
          ))}
          <div className="menu-separator" role="separator" />
          <button type="button" role="menuitem" className="menu-item" onClick={() => choose(onBrowse)}>
            <span>{words.allFunctions}</span>
          </button>
        </div>
      )}
    </div>
  )
}

export default FunctionMenu
