/**
 * Remembers the chosen theme and applies it to <html data-theme="…">.
 * "system" removes the attribute so the CSS follows the OS light/dark setting.
 * index.html runs a tiny copy of `applyTheme` before React loads to avoid a flash.
 */

export const THEMES = [
  { id: 'system', label: 'Match system', icon: 'system' },
  { id: 'light', label: 'Light', icon: 'sun' },
  { id: 'dark', label: 'Dark', icon: 'moon' },
  { id: 'knight', label: 'Knight', icon: 'shield' },
]

/** Browser UI colors (address bar on mobile) for each theme. */
export const THEME_COLORS = {
  light: '#f4f6f3',
  dark: '#121615',
  knight: '#0b3f27',
}

const STORAGE_KEY = 'doan-excelsior-theme'
const isTheme = (value) => THEMES.some(({ id }) => id === value)

const readStoredTheme = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return isTheme(stored) ? stored : 'system'
  } catch {
    return 'system'
  }
}

const applyTheme = (theme) => {
  const root = document.documentElement
  if (theme === 'system') delete root.dataset.theme
  else root.dataset.theme = theme
}

let currentTheme = readStoredTheme()
const listeners = new Set()

export const getTheme = () => currentTheme

export const subscribeToTheme = (listener) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const setTheme = (theme) => {
  if (!isTheme(theme) || theme === currentTheme) return
  currentTheme = theme
  applyTheme(theme)
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // Storage can be unavailable (private mode); the theme still applies for this visit.
  }
  listeners.forEach((listener) => listener())
}
