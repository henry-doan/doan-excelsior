import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { useWorkbook } from '../hooks/useWorkbook.js'
import { playSound } from '../lib/sounds.js'
import { EMPTY, findRemarks, GREETING, LATE, SLAIN, TIPS, UNSEALED } from '../lib/squireRemarks.js'
import Icon from './Icon.jsx'

// A remark stays up this long, unless he's clicked or dismissed first.
const SPEAK_FOR = 9000
// He keeps quiet at least this long between remarks he makes on his own.
const QUIET_GAP = 40_000
// With nothing to point out, he offers a tip after this much quiet.
const TIP_AFTER = 150_000
// Edits pause this long before he looks the sheet over.
const LOOK_DELAY = 1500
const CHECK_EVERY = 5000
const UNSEALED_AFTER = 10 * 60_000
const EMPTY_AFTER = 30_000

const NEW_SCROLL = 'A fresh scroll! I shall look it over for thee.'

// The workbook generation he last saw, so opening a file gets its own greeting.
let lastGeneration = null
// Which tip comes next. Shared across files, so opening one doesn't repeat the tips.
let nextTip = Math.floor(Math.random() * TIPS.length)

const isLate = () => {
  const hour = new Date().getHours()
  return hour >= 23 || hour < 4
}

/**
 * A small squire who peeks up from the corner of the sheet and remarks on it
 * now and then: a column with no header, a number stored as text, the error
 * dragon, work not downloaded in a while, or a tip when all is quiet.
 * Clicking him goes to the cell he's talking about, or asks him for a tip.
 * `sealedAt` is when the workbook was last downloaded.
 */
const Squire = ({ sheet, sealedAt, onGo }) => {
  const store = useWorkbook()
  const generation = store.getGeneration()
  const [remark, setRemark] = useState(() => ({
    key: 'greeting',
    text: lastGeneration !== null && lastGeneration !== generation ? NEW_SCROLL : GREETING,
  }))
  const said = useRef(new Set())
  const lastSpoke = useRef(0)
  const mountedAt = useRef(0)
  const firstUnsealedEdit = useRef(null)
  const firstStore = useRef(store)

  useEffect(() => {
    lastGeneration = generation
    const now = Date.now()
    mountedAt.current = now
    lastSpoke.current = now
  }, [generation])

  // A soft lute pluck each time he speaks. The ref keeps Strict Mode from plucking twice.
  const heardKey = useRef(null)
  useEffect(() => {
    if (!remark || heardKey.current === remark.key) return
    heardKey.current = remark.key
    playSound('pluck')
  }, [remark])

  useEffect(() => {
    if (!remark) return
    const timer = setTimeout(() => setRemark(null), SPEAK_FOR)
    return () => clearTimeout(timer)
  }, [remark])

  const say = (next) => {
    said.current.add(next.key)
    lastSpoke.current = Date.now()
    setRemark(next)
  }

  const sayTip = () => {
    const text = TIPS[nextTip % TIPS.length]
    nextTip += 1
    say({ key: `tip:${nextTip}`, text })
  }

  const consider = useEffectEvent((timed) => {
    if (remark) return
    const now = Date.now()
    if (now - lastSpoke.current < QUIET_GAP) return
    const hasSaid = (key) => said.current.has(key)

    // The dragon left since he warned of it: cheer, and be ready to warn again.
    if (hasSaid('dragon') && store.getErrors().length === 0) {
      said.current.delete('dragon')
      say({ key: `slain:${now}`, text: SLAIN })
      return
    }

    const fresh = findRemarks(store, sheet).find(({ key }) => !hasSaid(key))
    if (fresh) {
      say(fresh)
      return
    }
    if (!timed) return

    if (firstUnsealedEdit.current && now - firstUnsealedEdit.current > UNSEALED_AFTER && !hasSaid('unsealed')) {
      say({ key: 'unsealed', text: UNSEALED })
    } else if (isLate() && !hasSaid('late')) {
      say({ key: 'late', text: LATE })
    } else if (
      store.getDimensions(sheet).width === 0 &&
      now - mountedAt.current > EMPTY_AFTER &&
      !hasSaid(`empty:${sheet}`)
    ) {
      say({ key: `empty:${sheet}`, text: EMPTY })
    } else if (now - lastSpoke.current > TIP_AFTER) {
      sayTip()
    }
  })

  // Look the sheet over once edits pause.
  useEffect(() => {
    if (store !== firstStore.current && firstUnsealedEdit.current === null) {
      firstUnsealedEdit.current = Date.now()
    }
    const timer = setTimeout(() => consider(false), LOOK_DELAY)
    return () => clearTimeout(timer)
  }, [store, sheet])

  useEffect(() => {
    const timer = setInterval(() => consider(true), CHECK_EVERY)
    return () => clearInterval(timer)
  }, [])

  // Downloading seals the work, so his reminder can come again later.
  useEffect(() => {
    if (!sealedAt) return
    firstUnsealedEdit.current = null
    said.current.delete('unsealed')
  }, [sealedAt])

  const handleClick = () => {
    if (remark?.target) {
      onGo(remark.target)
      setRemark(null)
    } else if (remark) {
      setRemark(null)
    } else {
      sayTip()
    }
  }

  return (
    <div className={`squire ${remark ? 'is-speaking' : ''}`}>
      {remark && (
        <div className="squire-bubble" role="status">
          <button type="button" className="squire-say" onClick={handleClick}>
            {remark.text}
          </button>
          <button type="button" className="squire-hush" aria-label="Hush" title="Hush" onClick={() => setRemark(null)}>
            <Icon name="close" size={12} />
          </button>
        </div>
      )}
      <button
        type="button"
        className="squire-button"
        aria-label={remark?.target ? 'Go where the squire points' : 'Ask the squire for a tip'}
        title={remark?.target ? 'Go there' : 'Ask for a tip'}
        onClick={handleClick}
      >
        <SquireArt />
      </button>
    </div>
  )
}

/** The squire: a young face in a mail hood, over a green tabard with a gold shield. */
const SquireArt = () => (
  <svg className="squire-art" viewBox="0 0 80 84" width="64" height="67" aria-hidden="true">
    <defs>
      <pattern id="squire-mail" width="4" height="3.4" patternUnits="userSpaceOnUse">
        <rect width="4" height="3.4" fill="#a9b3b2" />
        <circle cx="2" cy="1.7" r="1.25" fill="none" stroke="#6d7877" strokeWidth="0.7" />
      </pattern>
      <radialGradient id="squire-shade" cx="0.4" cy="0.3" r="0.8">
        <stop offset="0" stopColor="#fff" stopOpacity="0.35" />
        <stop offset="1" stopColor="#000" stopOpacity="0.25" />
      </radialGradient>
    </defs>
    <g stroke="#1d1a14" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round">
      <path d="M6 84 Q8 64 26 60 H54 Q72 64 74 84 Z" fill="url(#squire-mail)" />
      <path d="M6 84 Q8 64 26 60 H54 Q72 64 74 84 Z" fill="url(#squire-shade)" stroke="none" />
      <path d="M22 84 V63.5 Q40 59 58 63.5 V84 Z" fill="#0c6338" />
      <path d="M22 66 Q40 62 58 66" fill="none" stroke="#e2b34a" strokeWidth="1.4" />
      <path d="M34 69 H46 V75 Q46 80 40 82.5 Q34 80 34 75 Z" fill="#e8bd52" />
      <path d="M40 70.5 V80 M36 74 H44" stroke="#0c6338" strokeWidth="1.5" />
      <path
        d="M40 10 C56 10 64 22 64 38 C64 50 60 58 52 62 H28 C20 58 16 50 16 38 C16 22 24 10 40 10 Z"
        fill="url(#squire-mail)"
      />
      <path
        d="M40 10 C56 10 64 22 64 38 C64 50 60 58 52 62 H28 C20 58 16 50 16 38 C16 22 24 10 40 10 Z"
        fill="url(#squire-shade)"
        stroke="none"
      />
      <path d="M40 22 C50 22 54 30 54 39 C54 49 48 55 40 55 C32 55 26 49 26 39 C26 30 30 22 40 22 Z" fill="#f2c9a3" />
      <path
        d="M26.5 33 C27 25 33 21.5 40 21.5 C47 21.5 53 25 53.5 33 C50 29 47 30.5 44 28.5 C42 31 37 31 35 28.5 C32 30.5 29 29.5 26.5 33 Z"
        fill="#7a4a22"
      />
    </g>
    <g className="squire-eyes" fill="#1d1a14">
      <ellipse cx="34.5" cy="39.5" rx="1.9" ry="2.3" />
      <ellipse cx="45.5" cy="39.5" rx="1.9" ry="2.3" />
      <circle cx="35.1" cy="38.7" r="0.6" fill="#fff" />
      <circle cx="46.1" cy="38.7" r="0.6" fill="#fff" />
    </g>
    <path
      d="M31.5 35 Q34.5 33.4 37 34.6 M43 34.6 Q45.5 33.4 48.5 35"
      fill="none"
      stroke="#5a3417"
      strokeWidth="1.2"
      strokeLinecap="round"
    />
    <circle cx="31" cy="45" r="2.6" fill="#e8807a" opacity="0.45" />
    <circle cx="49" cy="45" r="2.6" fill="#e8807a" opacity="0.45" />
    <path className="squire-smile" d="M36 47.5 Q40 51 44 47.5" fill="none" stroke="#1d1a14" strokeWidth="1.4" strokeLinecap="round" />
    <ellipse className="squire-mouth" cx="40" cy="48.6" rx="2.6" ry="2" fill="#7a2a22" stroke="#1d1a14" strokeWidth="1" />
  </svg>
)

export default Squire
