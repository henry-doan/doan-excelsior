import knightUrl from '../assets/knight-loader.webp'

/**
 * The galloping knight with motion dust, a green glow, the wordmark and a
 * progress bar. The bar fills over `duration` milliseconds.
 */
const DoanExcelsiorLoader = ({ size = 280, duration = 4000 }) => (
  <div
    className="doan-loader"
    style={{ '--loader-size': `${size}px`, '--loader-duration': `${duration}ms` }}
    role="status"
    aria-label="Loading Doan Excelsior"
  >
    <div className="doan-loader__scene">
      <div className="doan-loader__glow" />
      <img className="doan-loader__knight" src={knightUrl} alt="" />
      <div className="doan-loader__dust doan-loader__dust--one" />
      <div className="doan-loader__dust doan-loader__dust--two" />
      <div className="doan-loader__dust doan-loader__dust--three" />
    </div>

    <div className="doan-loader__brand">
      <strong>Doan</strong>
      <span>Excelsior</span>
    </div>

    <div className="doan-loader__bar" aria-hidden="true">
      <div className="doan-loader__bar-fill" />
    </div>
  </div>
)

export default DoanExcelsiorLoader
