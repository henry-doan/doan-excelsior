/**
 * Small preferences remembered between visits: knightly wording and sound
 * effects. Both are off by default so the app reads as a plain spreadsheet.
 */

const STORAGE_KEY = 'doan-excelsior-settings'
const DEFAULTS = { knightly: false, sound: false }

const readStoredSettings = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY))
    return {
      knightly: typeof stored?.knightly === 'boolean' ? stored.knightly : DEFAULTS.knightly,
      sound: typeof stored?.sound === 'boolean' ? stored.sound : DEFAULTS.sound,
    }
  } catch {
    return DEFAULTS
  }
}

let currentSettings = readStoredSettings()
const listeners = new Set()

export const getSettings = () => currentSettings

export const subscribeToSettings = (listener) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const updateSettings = (changes) => {
  currentSettings = { ...currentSettings, ...changes }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentSettings))
  } catch {
    // Storage can be unavailable (private mode); the setting still applies for this visit.
  }
  listeners.forEach((listener) => listener())
}
