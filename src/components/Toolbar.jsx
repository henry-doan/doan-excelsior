import { ACCEPTED_FILE_TYPES } from '../lib/fileIO.js'
import Brand from './Brand.jsx'
import FunctionMenu from './FunctionMenu.jsx'
import Icon from './Icon.jsx'
import ThemePicker from './ThemePicker.jsx'

const ToolButton = ({ icon, label, shortcut, ...props }) => (
  <button
    type="button"
    className="tool-button"
    title={shortcut ? `${label} (${shortcut})` : label}
    aria-label={label}
    {...props}
  >
    <Icon name={icon} />
    <span className="tool-label">{label}</span>
  </button>
)

const Toolbar = ({
  fileName,
  isOpening,
  canUndo,
  canRedo,
  shortcutsOpen,
  onNew,
  onOpen,
  onDownload,
  onUndo,
  onRedo,
  onInsertRow,
  onDeleteRows,
  onInsertColumn,
  onDeleteColumns,
  onToggleShortcuts,
  onTotal,
  onInsertFunction,
  onBrowseFunctions,
}) => {
  const handleFileChange = (event) => {
    const [file] = event.target.files
    event.target.value = ''
    onOpen(file)
  }

  return (
    <header className="toolbar">
      <div className="toolbar-top">
        <div className="brand">
          <Brand />
          <span className="file-name" title={fileName}>
            {isOpening ? 'Opening…' : fileName}
          </span>
        </div>

        <div className="tool-group file-actions" role="group" aria-label="File">
          <ToolButton icon="new" label="New" onClick={onNew} />
          <label className="tool-button" title="Open an Excel, ODS or CSV file">
            <Icon name="open" />
            <span className="tool-label">Open</span>
            <input
              type="file"
              className="visually-hidden"
              accept={ACCEPTED_FILE_TYPES}
              disabled={isOpening}
              onChange={handleFileChange}
            />
          </label>
          <ToolButton icon="download" label="Download .xlsx" onClick={() => onDownload('xlsx')} />
          <ToolButton icon="download" label="Download .csv" onClick={() => onDownload('csv')} />
        </div>
      </div>

      <div className="tool-groups" role="toolbar" aria-label="Editing">
        <div className="tool-group">
          <ToolButton icon="undo" label="Undo" shortcut="Ctrl+Z" disabled={!canUndo} onClick={onUndo} />
          <ToolButton icon="redo" label="Redo" shortcut="Ctrl+Y" disabled={!canRedo} onClick={onRedo} />
        </div>

        <div className="tool-group">
          <ToolButton icon="rowAdd" label="Insert row" onClick={onInsertRow} />
          <ToolButton icon="rowRemove" label="Delete rows" onClick={onDeleteRows} />
          <ToolButton icon="colAdd" label="Insert column" onClick={onInsertColumn} />
          <ToolButton icon="colRemove" label="Delete columns" onClick={onDeleteColumns} />
        </div>

        <div className="tool-group">
          <FunctionMenu onTotal={onTotal} onInsert={onInsertFunction} onBrowse={onBrowseFunctions} />
        </div>

        <div className="tool-group toolbar-end">
          <ThemePicker />
          <ToolButton
            icon="keyboard"
            label="Shortcuts"
            aria-pressed={shortcutsOpen}
            onClick={onToggleShortcuts}
          />
        </div>
      </div>
    </header>
  )
}

export default Toolbar
