import { startTransition, useActionState, useRef, useState } from 'react'
import { useTheme } from '../hooks/useTheme.js'
import { useWorkbook } from '../hooks/useWorkbook.js'
import { readWorkbookFile } from '../lib/fileIO.js'
import { THEME_COLORS } from '../lib/themeStore.js'
import Brand from './Brand.jsx'
import Toast from './Toast.jsx'
import WorkbookView from './WorkbookView.jsx'

const INITIAL_OPEN_STATE = { error: null }

/**
 * Owns file opening (button and drag-and-drop) and the document title.
 * Opening is a React 19 action: `useActionState` tracks the pending state
 * and the last result, so there is no hand-rolled loading flag.
 * `inert` keeps it out of reach of the keyboard while the splash screen covers it.
 */
const Workspace = ({ inert = false }) => {
  const store = useWorkbook()
  const [theme] = useTheme()
  const dragDepth = useRef(0)
  const [isDragging, setIsDragging] = useState(false)
  const [dismissedResult, setDismissedResult] = useState(null)

  const [openResult, openFileAction, isOpening] = useActionState(async (_previous, file) => {
    try {
      const { sheets } = await readWorkbookFile(file)
      store.load(sheets, file.name)
      return { error: null }
    } catch (error) {
      return { error: `Couldn’t open “${file.name}”. ${error.message} Try an .xlsx, .xls, .ods or .csv file.` }
    }
  }, INITIAL_OPEN_STATE)

  const openFile = (file) => {
    if (!file) return
    if (store.canUndo() && !window.confirm(`Open “${file.name}”? Changes you haven’t downloaded will be lost.`)) {
      return
    }
    startTransition(() => openFileAction(file))
  }

  const hasFiles = (event) => event.dataTransfer?.types?.includes('Files')

  const handleDragEnter = (event) => {
    if (!hasFiles(event)) return
    event.preventDefault()
    dragDepth.current += 1
    setIsDragging(true)
  }

  const handleDragLeave = (event) => {
    if (!hasFiles(event)) return
    dragDepth.current = Math.max(0, dragDepth.current - 1)
    if (dragDepth.current === 0) setIsDragging(false)
  }

  const handleDrop = (event) => {
    if (!hasFiles(event)) return
    event.preventDefault()
    dragDepth.current = 0
    setIsDragging(false)
    openFile(event.dataTransfer.files[0])
  }

  const showOpenError = openResult.error && dismissedResult !== openResult

  return (
    <div
      className="app"
      inert={inert}
      onDragEnter={handleDragEnter}
      onDragOver={(event) => hasFiles(event) && event.preventDefault()}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* React 19 hoists <title> and <meta> into <head>. */}
      <title>{`${store.getFileName()} – Doan Excelsior`}</title>
      {theme === 'system' ? (
        <>
          <meta name="theme-color" media="(prefers-color-scheme: light)" content={THEME_COLORS.light} />
          <meta name="theme-color" media="(prefers-color-scheme: dark)" content={THEME_COLORS.dark} />
        </>
      ) : (
        <meta name="theme-color" content={THEME_COLORS[theme]} />
      )}

      <WorkbookView key={store.getGeneration()} onOpenFile={openFile} isOpening={isOpening} />

      {isDragging && (
        <div className="drop-overlay" aria-hidden="true">
          <div>
            <Brand size="large" />
            <p>Drop an .xlsx, .xls, .ods or .csv file to open it</p>
          </div>
        </div>
      )}

      {showOpenError && (
        <Toast tone="error" message={openResult.error} onDismiss={() => setDismissedResult(openResult)} />
      )}
    </div>
  )
}

export default Workspace
