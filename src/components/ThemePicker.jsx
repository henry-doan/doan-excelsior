import { useTheme } from '../hooks/useTheme.js'
import { THEMES } from '../lib/themeStore.js'
import Icon from './Icon.jsx'

/** A four-way switch: match system, light, dark or Knight. */
const ThemePicker = () => {
  const [theme, setTheme] = useTheme()

  return (
    <div className="theme-picker" role="radiogroup" aria-label="Theme">
      {THEMES.map(({ id, label, icon }) => (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={theme === id}
          aria-label={label}
          title={label}
          className="theme-option"
          onClick={() => setTheme(id)}
        >
          <Icon name={icon} size={16} />
        </button>
      ))}
    </div>
  )
}

export default ThemePicker
