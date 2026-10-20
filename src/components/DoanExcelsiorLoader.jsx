import knightUrl from '../assets/knight-loader.webp'

/**
 * The galloping knight with motion dust, a green glow, the wordmark and a
 * progress bar. By default the bar fills over `duration` milliseconds; pass
 * `progress` (0 to 1) to show real progress instead.
 */
const DoanExcelsiorLoader = ({ size = 280, duration = 4000, progress, label = 'Loading Doan Excelsior', showBrand = true }) => {
  const isDeterminate = typeof progress === 'number'

  return (
    <div
      className="doan-loader"
      style={{ '--loader-size': `${size}px`, '--loader-duration': `${duration}ms` }}
      role="status"
      aria-label={label}
    >
      <div className="doan-loader__scene">
        <div className="doan-loader__glow" />
        <img className="doan-loader__knight" src={knightUrl} alt="" />
        <div className="doan-loader__dust doan-loader__dust--one" />
        <div className="doan-loader__dust doan-loader__dust--two" />
        <div className="doan-loader__dust doan-loader__dust--three" />
      </div>

      {showBrand && (
        <div className="doan-loader__brand">
          <strong>Doan</strong>
          <span>Excelsior</span>
        </div>
      )}

      <div
        className="doan-loader__bar"
        role={isDeterminate ? 'progressbar' : undefined}
        aria-valuemin={isDeterminate ? 0 : undefined}
        aria-valuemax={isDeterminate ? 100 : undefined}
        aria-valuenow={isDeterminate ? Math.round(progress * 100) : undefined}
        aria-hidden={isDeterminate ? undefined : true}
      >
        <div
          className={`doan-loader__bar-fill ${isDeterminate ? 'is-determinate' : ''}`}
          style={isDeterminate ? { width: `${progress * 100}%` } : undefined}
        />
      </div>
    </div>
  )
}

export default DoanExcelsiorLoader
