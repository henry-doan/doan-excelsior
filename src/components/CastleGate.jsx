import { useEffect, useRef, useState } from 'react'
import castleUrl from '../assets/gate/castle.webp'
import doorLeftUrl from '../assets/gate/door-left.webp'
import doorRightUrl from '../assets/gate/door-right.webp'
import flameUrl from '../assets/gate/flame.webp'
import groundUrl from '../assets/gate/ground.webp'
import insideUrl from '../assets/gate/inside.webp'
import portcullisUrl from '../assets/gate/portcullis.webp'
import skyUrl from '../assets/gate/sky.webp'
import torchUrl from '../assets/gate/torch.webp'
import { ACCEPTED_FILE_TYPES } from '../lib/fileIO.js'
import { playSound } from '../lib/sounds.js'
import Brand from './Brand.jsx'

// How long the portcullis and doors take to open before moving on.
const OPEN_DURATION = 1800

/*
 * The scene is laid out in the castle artwork's own pixels: the castle is
 * 1600×1000 and the ground strip below it adds 282, so the stage is 1600×1282.
 * `place` turns those pixel boxes into percentages so everything scales together.
 */
const STAGE_WIDTH = 1600
const STAGE_HEIGHT = 1282

const place = (x, y, width, height) => ({
  left: `${(x / STAGE_WIDTH) * 100}%`,
  top: `${(y / STAGE_HEIGHT) * 100}%`,
  width: `${(width / STAGE_WIDTH) * 100}%`,
  height: `${(height / STAGE_HEIGHT) * 100}%`,
})

// The archway, measured from the castle art's transparent opening (x 581–991,
// point at y ≈ 530). Everything behind the gate lives in this box and is
// clipped to the arch's shape, so the portcullis can slide up into the stone.
const OPENING = { x: 570, y: 520, width: 432, height: 480 }

// The traced arch outline in castle pixels, widened a little; the castle's stone covers the edges.
const ARCH_OUTLINE = [
  [786, 522], [818, 538], [862, 556], [900, 576], [926, 596], [949, 616], [966, 636],
  [979, 656], [989, 676], [994, 696], [1000, 716], [1000, 1000],
  [574, 1000], [574, 716], [580, 696], [585, 676], [594, 656], [607, 636], [627, 616],
  [648, 596], [674, 576], [711, 556], [756, 538],
]

const archClipPath = `polygon(${ARCH_OUTLINE.map(
  ([x, y]) =>
    `${(((x - OPENING.x) / OPENING.width) * 100).toFixed(1)}% ${(((y - OPENING.y) / OPENING.height) * 100).toFixed(1)}%`,
).join(', ')})`

/** A wall torch: the holder, a glow, a flickering flame and a few rising embers. */
const Torch = ({ x }) => (
  <div className="gate-torch" style={place(x - 42, 500, 84, 260)}>
    <div className="gate-torch-glow" />
    <img className="gate-flame" src={flameUrl} alt="" />
    <img className="gate-torch-holder" src={torchUrl} alt="" />
    {[0, 1, 2, 3].map((i) => (
      <span key={i} className="gate-ember" style={{ '--ember': i }} />
    ))}
  </div>
)

const CastleScene = () => (
  <div className="gate-stage" role="img" aria-label="A castle gate at night">
    <img className="gate-layer gate-ground" src={groundUrl} alt="" style={place(0, 990, 1600, 282)} />

    <div
      className="gate-opening"
      style={{ ...place(OPENING.x, OPENING.y, OPENING.width, OPENING.height), clipPath: archClipPath }}
    >
      <img className="gate-inside" src={insideUrl} alt="" />
      <div className="gate-doors">
        <img className="gate-door is-left" src={doorLeftUrl} alt="" />
        <img className="gate-door is-right" src={doorRightUrl} alt="" />
      </div>
      <img className="gate-portcullis" src={portcullisUrl} alt="" />
    </div>

    <img className="gate-layer gate-castle" src={castleUrl} alt="" style={place(0, 0, 1600, 1000)} />

    <Torch x={458} />
    <Torch x={1117} />

    <div className="gate-fog" style={place(-200, 900, 2000, 260)} />
  </div>
)

/**
 * The castle gate shown when the page first opens. Entering raises the
 * portcullis and swings the doors open, then hands over to the loading
 * screen. "Bring a scroll" (or dropping a file on the gate) does the same
 * and passes the chosen file along so it opens behind the loading screen.
 */
const CastleGate = ({ onEnter }) => {
  const [opening, setOpening] = useState(false)
  const gateRef = useRef(null)
  const enterRef = useRef(null)
  const timer = useRef(null)

  useEffect(() => {
    enterRef.current?.focus()
    return () => clearTimeout(timer.current)
  }, [])

  const enter = (file = null) => {
    if (opening) return
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    playSound('gate')
    setOpening(true)
    timer.current = setTimeout(() => onEnter(file), reduceMotion ? 0 : OPEN_DURATION)
  }

  // A gentle parallax: CSS variables move the sky and castle slightly with the pointer.
  const handlePointerMove = (event) => {
    const gate = gateRef.current
    gate.style.setProperty('--tilt-x', ((event.clientX / window.innerWidth) * 2 - 1).toFixed(3))
    gate.style.setProperty('--tilt-y', ((event.clientY / window.innerHeight) * 2 - 1).toFixed(3))
  }

  const handleFileChange = (event) => {
    const [file] = event.target.files
    event.target.value = ''
    if (file) enter(file)
  }

  return (
    <main
      ref={gateRef}
      className={`gate ${opening ? 'is-opening' : ''}`}
      style={{ '--gate-open': `${OPEN_DURATION}ms`, '--gate-sky': `url(${skyUrl})` }}
      onPointerMove={handlePointerMove}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault()
        const [file] = event.dataTransfer.files
        if (file) enter(file)
      }}
    >
      <div className="gate-sky" />
      <div className="gate-scene">
        <h1 className="gate-brand">
          <Brand size="large" />
        </h1>
        <CastleScene />
        <p className="gate-tagline">Open, edit and save Excel spreadsheets in your browser.</p>
        <div className="gate-actions">
          <button ref={enterRef} type="button" className="gate-button is-primary" disabled={opening} onClick={() => enter()}>
            <span className="gate-button-title">Enter the keep</span>
            <span className="gate-button-hint">Start a new workbook</span>
          </button>
          <label className={`gate-button ${opening ? 'is-disabled' : ''}`}>
            <span className="gate-button-title">Bring a scroll</span>
            <span className="gate-button-hint">Open an Excel, ODS or CSV file</span>
            <input
              type="file"
              className="visually-hidden"
              accept={ACCEPTED_FILE_TYPES}
              disabled={opening}
              onChange={handleFileChange}
            />
          </label>
        </div>
        <p className="gate-drop-hint">or drop a file on the gate</p>
      </div>
    </main>
  )
}

export default CastleGate
