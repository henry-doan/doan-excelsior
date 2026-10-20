import emblem from '../assets/emblem.png'

/**
 * The knight emblem with the wordmark set in type, so the lettering can
 * change color with the theme while the emblem stays the same.
 */
const Brand = ({ size = 'small' }) => (
  <span className={`brand-lockup is-${size}`} role="img" aria-label="Doan Excelsior">
    <img className="brand-emblem" src={emblem} alt="" draggable="false" />
    <span className="brand-words" aria-hidden="true">
      <span className="brand-name">Doan</span>
      <span className="brand-tagline">Excelsior</span>
    </span>
  </span>
)

export default Brand
