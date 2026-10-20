import { useEffect, useState } from 'react'
import DoanExcelsiorLoader from './DoanExcelsiorLoader.jsx'

// How long the loader shows on arrival, and how long it takes to fade away.
export const SPLASH_DURATION = 4000
const FADE_DURATION = 450

/**
 * The full-screen loader shown when the page first opens. It's a timed
 * intro rather than real loading: after SPLASH_DURATION it fades out and
 * calls `onDone`. The app renders underneath the whole time.
 */
const SplashScreen = ({ onDone }) => {
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    const fade = setTimeout(() => setLeaving(true), SPLASH_DURATION)
    const done = setTimeout(onDone, SPLASH_DURATION + FADE_DURATION)
    return () => {
      clearTimeout(fade)
      clearTimeout(done)
    }
  }, [onDone])

  return (
    <div
      className={`splash ${leaving ? 'is-leaving' : ''}`}
      style={{ '--splash-fade': `${FADE_DURATION}ms` }}
    >
      <DoanExcelsiorLoader size={320} duration={SPLASH_DURATION} />
    </div>
  )
}

export default SplashScreen
