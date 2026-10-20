import { createContext } from 'react'

/** Holds the workbook store. Rendered directly as a provider: `<WorkbookContext value={store}>`. */
export const WorkbookContext = createContext(null)
