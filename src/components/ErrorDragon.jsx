import { useEffect, useRef, useState } from 'react'
import dragonArt from '../assets/dragon/dragon.webp'
import { useWords } from '../hooks/useSettings.js'
import { useWorkbook } from '../hooks/useWorkbook.js'
import { playSound } from '../lib/sounds.js'
import { ERROR_LIMIT } from '../lib/workbookStore.js'

// Scanning a huge workbook takes a moment, so it waits until edits pause.
const SCAN_DELAY = 150

/**
 * While any cell in the workbook shows an error, a dragon perches on the
 * status bar. It can't be dismissed: clicking it jumps to the next error,
 * and it only flies off once every error is fixed (or undone).
 * It roars when it lands and a fanfare plays when it's slain.
 */
const ErrorDragon = ({ onJump }) => {
  const store = useWorkbook()
  const words = useWords()
  const [count, setCount] = useState(() => store.getErrors().length)
  const [isLeaving, setIsLeaving] = useState(false)
  const [wasPerched, setWasPerched] = useState(count > 0)

  useEffect(() => {
    const timer = setTimeout(() => setCount(store.getErrors().length), SCAN_DELAY)
    return () => clearTimeout(timer)
  }, [store])

  // The ref keeps Strict Mode's second effect run from roaring twice.
  const heardPerched = useRef(false)
  const isPerched = count > 0

  useEffect(() => {
    if (heardPerched.current === isPerched) return
    heardPerched.current = isPerched
    playSound(isPerched ? 'roar' : 'triumph')
  }, [isPerched])

  // Adjusting state during render: start the fly-off when the last error goes.
  if (isPerched !== wasPerched) {
    setWasPerched(isPerched)
    setIsLeaving(!isPerched)
  }

  if (!isPerched && !isLeaving) return null

  const label = count >= ERROR_LIMIT ? `${ERROR_LIMIT.toLocaleString()}+` : count.toLocaleString()

  return (
    <div
      className={`error-dragon ${isLeaving ? 'is-leaving' : ''}`}
      onAnimationEnd={(event) => {
        if (event.animationName === 'dragon-fly-off') setIsLeaving(false)
      }}
    >
      <span className="visually-hidden" aria-live="polite">
        {isLeaving ? words.dragonSlain : words.dragonTitle(count)}
      </span>
      <button
        type="button"
        className="error-dragon-button"
        title={isLeaving ? words.dragonSlain : words.dragonTitle(count)}
        disabled={isLeaving}
        onClick={() => onJump(store.getErrors())}
      >
        <img className="error-dragon-art" src={dragonArt} alt="" width="345" height="240" />
        <span className="error-dragon-count">{isLeaving ? words.dragonSlainShort : words.dragonCount(count, label)}</span>
      </button>
    </div>
  )
}

export default ErrorDragon
