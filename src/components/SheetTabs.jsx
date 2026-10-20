import { useState } from 'react'
import Icon from './Icon.jsx'

const RenameInput = ({ initialName, onSubmit, onCancel }) => {
  const [name, setName] = useState(initialName)

  return (
    <input
      className="sheet-rename"
      value={name}
      aria-label="Sheet name"
      autoFocus
      size={Math.max(6, name.length + 1)}
      onChange={(event) => setName(event.target.value)}
      onBlur={() => onSubmit(name)}
      onKeyDown={(event) => {
        if (event.key === 'Enter') onSubmit(name)
        if (event.key === 'Escape') onCancel()
      }}
    />
  )
}

/** Sheet tabs: click to switch, double-click to rename. */
const SheetTabs = ({ sheets, activeSheet, onSelect, onAdd, onRename, onRemove }) => {
  const [renaming, setRenaming] = useState(null)

  const submitRename = (sheetId, name) => {
    onRename(sheetId, name)
    setRenaming(null)
  }

  return (
    <nav className="sheet-tabs" aria-label="Sheets">
      <button type="button" className="sheet-add" aria-label="Add sheet" title="Add sheet" onClick={onAdd}>
        <Icon name="plus" size={16} />
      </button>
      <div className="sheet-list" role="tablist">
        {sheets.map(({ id, name }) => {
          const isActive = id === activeSheet
          return (
            <div key={id} className={`sheet-tab ${isActive ? 'is-active' : ''}`}>
              {renaming === id ? (
                <RenameInput
                  initialName={name}
                  onSubmit={(nextName) => submitRename(id, nextName)}
                  onCancel={() => setRenaming(null)}
                />
              ) : (
                <button
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className="sheet-tab-button"
                  title="Double-click to rename"
                  onClick={() => onSelect(id)}
                  onDoubleClick={() => setRenaming(id)}
                >
                  {name}
                </button>
              )}
              {isActive && sheets.length > 1 && renaming !== id && (
                <button
                  type="button"
                  className="sheet-remove"
                  aria-label={`Delete ${name}`}
                  title={`Delete ${name}`}
                  onClick={() => onRemove(id)}
                >
                  <Icon name="close" size={14} />
                </button>
              )}
            </div>
          )
        })}
      </div>
    </nav>
  )
}

export default SheetTabs
