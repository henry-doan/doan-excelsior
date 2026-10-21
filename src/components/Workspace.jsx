import { startTransition, useActionState, useEffect, useEffectEvent, useRef, useState } from 'react'
import { useWords } from '../hooks/useSettings.js'
import { useTheme } from '../hooks/useTheme.js'
import { useWorkbook } from '../hooks/useWorkbook.js'
import { nextPaint, readWorkbookFile } from '../lib/fileIO.js'
import { playSound } from '../lib/sounds.js'
import { THEME_COLORS } from '../lib/themeStore.js'
import Brand from './Brand.jsx'
import DoanExcelsiorLoader from './DoanExcelsiorLoader.jsx'
import Toast from './Toast.jsx'
import WorkbookView from './WorkbookView.jsx'

const INITIAL_OPEN_STATE = { error: null }
// Files bigger than this show the "Charge!" overlay at once. Parsing freezes the
// page, so a delayed fade-in might not get a chance to paint before it starts.
const LARGE_FILE_BYTES = 1_000_000

/**
 * Owns file opening (button and drag-and-drop) and the document title.
 * Opening is a React 19 action: `useActionState` tracks the pending state
 * and the last result, so there is no hand-rolled loading flag.
 * While a file opens, a small galloping knight shows each step's progress
 * ("Charge!"); it fades in only if opening takes more than a moment.
 * `inert` keeps it out of reach of the keyboard while the gate or splash screen covers it.
 * `fileToOpen` is a file chosen at the castle gate, opened as soon as it arrives.
 */
const Workspace = ({ inert = false, fileToOpen = null }) => {
  const store = useWorkbook()
  const [theme] = useTheme()
  const dragDepth = useRef(0)
  const [isDragging, setIsDragging] = useState(false)
  const [dismissedResult, setDismissedResult] = useState(null)
  // { name, isLarge, stage, fraction } for the file being opened.
  const [progress, setProgress] = useState(null)
  const words = useWords()

  const [openResult, openFileAction, isOpening] = useActionState(async (_previous, file) => {
    // State set synchronously inside an action waits until the action ends, so
    // each report awaits first; then it lets the browser paint before heavy work.
    const report = async (stage, fraction) => {
      await null
      setProgress({ name: file.name, isLarge: file.size > LARGE_FILE_BYTES, stage, fraction })
      await nextPaint()
    }
    try {
      const { sheets } = await readWorkbookFile(file, report)
      await report('build', 0.75)
      store.load(sheets, file.name)
      setProgress((current) => ({ ...current, fraction: 1 }))
      // A file with errors greets you with the error dragon's roar instead.
      if (store.getErrors().length === 0) playSound('whinny')
      return { error: null }
    } catch (error) {
      return { error: `Couldn’t open “${file.name}”. ${error.message} Try an .xlsx, .xls, .ods or .csv file.` }
    }
  }, INITIAL_OPEN_STATE)

  const openFile = (file) => {
    if (!file) return
    if (store.canUndo() && !window.confirm(words.confirmOpen(file.name))) return
    setProgress({ name: file.name, isLarge: file.size > LARGE_FILE_BYTES, stage: 'read', fraction: 0.05 })
    startTransition(() => openFileAction(file))
  }

  // Opened once per file, even though Strict Mode runs effects twice in development.
  const openedFromGate = useRef(null)
  const openFromGate = useEffectEvent((file) => openFile(file))

  useEffect(() => {
    if (!fileToOpen || openedFromGate.current === fileToOpen) return
    openedFromGate.current = fileToOpen
    openFromGate(fileToOpen)
  }, [fileToOpen])

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

      {isOpening && progress && (
        <div className={`charge-overlay ${progress.isLarge ? 'is-immediate' : ''}`}>
          <div className="charge-card">
            <p className="charge-title">{words.chargeTitle}</p>
            <DoanExcelsiorLoader
              size={220}
              progress={progress.fraction}
              showBrand={false}
              label={words.stages[progress.stage]}
            />
            <p className="charge-stage">{words.stages[progress.stage]}…</p>
            <p className="charge-file">{progress.name}</p>
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
