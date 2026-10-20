import { useSyncExternalStore } from 'react'
import { getTheme, setTheme, subscribeToTheme } from '../lib/themeStore.js'

/** Returns `[theme, setTheme]`. Every component using it stays in sync. */
export const useTheme = () => [useSyncExternalStore(subscribeToTheme, getTheme), setTheme]
