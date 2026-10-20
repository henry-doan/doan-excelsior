import { useSyncExternalStore } from 'react'
import { WORDS } from '../lib/lexicon.js'
import { getSettings, subscribeToSettings, updateSettings } from '../lib/settingsStore.js'

/** Returns `[settings, updateSettings]`. Every component using it stays in sync. */
export const useSettings = () => [useSyncExternalStore(subscribeToSettings, getSettings), updateSettings]

/** The interface wording: plain, or knightly when that setting is on. */
export const useWords = () => {
  const [settings] = useSettings()
  return settings.knightly ? WORDS.knightly : WORDS.plain
}
