import { use, useSyncExternalStore } from 'react'
import { WorkbookContext } from '../context/WorkbookContext.js'

/**
 * Returns the current workbook snapshot and re-renders the caller whenever
 * the workbook changes (edits, undo, structure changes, file loads).
 * The snapshot carries every store method, so it is used for reads and writes.
 */
export const useWorkbook = () => {
  const store = use(WorkbookContext)
  if (!store) throw new Error('useWorkbook must be used inside <WorkbookContext value={store}>.')
  return useSyncExternalStore(store.subscribe, store.getSnapshot)
}
