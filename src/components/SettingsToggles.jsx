import { useSettings, useWords } from '../hooks/useSettings.js'
import { playSound } from '../lib/sounds.js'
import Icon from './Icon.jsx'

/** Two on/off switches: knightly wording and sound effects. Both are remembered. */
const SettingsToggles = () => {
  const [settings, updateSettings] = useSettings()
  const words = useWords()

  const toggleSound = () => {
    const sound = !settings.sound
    updateSettings({ sound })
    // A short preview confirms sound is on (and unlocks audio in the browser).
    if (sound) playSound('sheen', { force: true })
  }

  return (
    <div className="theme-picker" role="group" aria-label="Fun settings">
      <button
        type="button"
        className="theme-option"
        aria-pressed={settings.knightly}
        aria-label={words.knightlyToggle}
        title={words.knightlyToggle}
        onClick={() => updateSettings({ knightly: !settings.knightly })}
      >
        <Icon name="scroll" size={16} />
      </button>
      <button
        type="button"
        className="theme-option"
        aria-pressed={settings.sound}
        aria-label={words.soundToggle}
        title={words.soundToggle}
        onClick={toggleSound}
      >
        <Icon name={settings.sound ? 'sound' : 'mute'} size={16} />
      </button>
    </div>
  )
}

export default SettingsToggles
