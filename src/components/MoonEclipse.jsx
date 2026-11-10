import { useEffect, useState } from 'react'
import skyUrl from '../assets/gate/sky.webp'
import moonUrl from '../assets/eclipse/moon.webp'
import bloodMoonUrl from '../assets/eclipse/blood-moon.webp'
import diamondUrl from '../assets/eclipse/diamond.webp'
import coronaUrl from '../assets/eclipse/eclipse.webp'
import { playSound } from '../lib/sounds.js'

/*
 * The easter egg: click the moon on the castle gate and it is eclipsed twice,
 * first turning blood red in Earth's shadow, then blotted out to a corona,
 * before the page leaves for Doan Dome.
 */

export const DOAN_DOME_URL = 'https://doan-dome.netlify.app/'

// The moon in the sky art's own pixels (sky.webp is 1920×1080).
const SKY = { width: 1920, height: 1080 }
const MOON = { x: 1618, y: 178, r: 117 }

// When each step happens, in ms. The CSS keyframes use the same timings.
const LEAVE_AT = 5400
const LEAVE_AT_REDUCED = 1600

/**
 * Where the moon is on screen, ignoring the parallax drift. This mirrors the
 * `.gate-sky` rule: inset -3% of the viewport, `background: center 30% / cover`.
 */
export const getMoonOnScreen = () => {
  const viewWidth = window.innerWidth
  const viewHeight = window.innerHeight
  const width = viewWidth * 1.06
  const height = viewHeight * 1.06
  const scale = Math.max(width / SKY.width, height / SKY.height)
  const x = -0.03 * viewWidth + (width - SKY.width * scale) * 0.5 + MOON.x * scale
  const y = -0.03 * viewHeight + (height - SKY.height * scale) * 0.3 + MOON.y * scale
  const r = MOON.r * scale
  // Clickable while most of it is on screen; narrow screens crop it out of the sky entirely.
  const edge = r * 0.4
  const visible = x - edge >= 0 && x + edge <= viewWidth && y - edge >= 0 && y + edge <= viewHeight
  return { x, y, r, visible }
}

// Shows just the moon from the sky art inside a circle of any size.
const moonArt = {
  backgroundImage: `url(${skyUrl})`,
  backgroundSize: `${(SKY.width / (MOON.r * 2)) * 100}% auto`,
  backgroundPosition: `${((MOON.x - MOON.r) / (SKY.width - MOON.r * 2)) * 100}% ${((MOON.y - MOON.r) / (SKY.height - MOON.r * 2)) * 100}%`,
}

// Fetched ahead of time, so every frame is ready the moment the moon is clicked.
if (typeof window !== 'undefined') {
  for (const url of [moonUrl, bloodMoonUrl, diamondUrl, coronaUrl]) new Image().src = url
}

/** The full-screen eclipse. `from` is the moon's on-screen circle, where the animation starts. */
const MoonEclipse = ({ from }) => {
  // Measured once, when the eclipse starts.
  const [layout] = useState(() => {
    const viewWidth = window.innerWidth
    const viewHeight = window.innerHeight
    const size = Math.min(Math.min(viewWidth, viewHeight) * 0.58, 520)
    const centerX = viewWidth / 2
    const centerY = viewHeight * 0.44
    return {
      '--orb-size': `${size}px`,
      '--orb-left': `${centerX - size / 2}px`,
      '--orb-top': `${centerY - size / 2}px`,
      '--orb-from-x': `${from.x - centerX}px`,
      '--orb-from-y': `${from.y - centerY}px`,
      '--orb-from-scale': (from.r * 2) / size,
      '--text-top': `${centerY + size / 2 + Math.min(size * 0.28, 72)}px`,
    }
  })

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    playSound('eclipse')
    const timer = setTimeout(
      () => window.location.assign(DOAN_DOME_URL),
      reduceMotion ? LEAVE_AT_REDUCED : LEAVE_AT,
    )
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="eclipse" style={layout} role="status">
      <div className="eclipse-backdrop" />
      <div className="eclipse-orb">
        <img className="eclipse-corona" src={coronaUrl} alt="" />
        <div className="eclipse-moon">
          <div className="eclipse-moon-art" style={moonArt} />
          <img className="eclipse-moon-full" src={moonUrl} alt="" />
          <img className="eclipse-moon-blood" src={bloodMoonUrl} alt="" />
        </div>
        <div className="eclipse-disc" />
        <img className="eclipse-diamond" src={diamondUrl} alt="" />
      </div>
      <p className="eclipse-text">
        Taking you to <strong>Doan Dome</strong>
        <span className="eclipse-dots" aria-hidden="true">…</span>
      </p>
      <div className="eclipse-fade" />
    </div>
  )
}

export default MoonEclipse
