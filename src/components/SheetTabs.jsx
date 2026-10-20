import { useState } from 'react'
import { useWords } from '../hooks/useSettings.js'
import Icon from './Icon.jsx'

// Heraldic tinctures, given to the banners in turn: vert, or, gules, azure, purpure.
// Each has a text color that reads well on it.
const BANNER_COLORS = [
  { banner: '#1e7a46', ink: '#ffffff' },
  { banner: '#d4ac2b', ink: '#2b2105' },
  { banner: '#a8323a', ink: '#ffffff' },
  { banner: '#2f5f9e', ink: '#ffffff' },
  { banner: '#6b3f8f', ink: '#ffffff' },
]

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

/** Sheet tabs, shaped as hanging banners: click to switch, double-click to rename. */
const SheetTabs = ({ sheets, activeSheet, onSelect, onAdd, onRename, onRemove }) => {
  const [renaming, setRenaming] = useState(null)
  const words = useWords()

  const submitRename = (sheetId, name) => {
    onRename(sheetId, name)
    setRenaming(null)
  }

  return (
    <nav className="sheet-tabs" aria-label="Sheets">
      <button type="button" className="sheet-add" aria-label={words.addSheet} title={words.addSheet} onClick={onAdd}>
        <Icon name="plus" size={16} />
      </button>
      <div className="sheet-list" role="tablist">
        {sheets.map(({ id, name }, index) => {
          const isActive = id === activeSheet
          return (
            <div
              key={id}
              className={`sheet-tab ${isActive ? 'is-active' : ''}`}
              style={{
                '--banner': BANNER_COLORS[index % BANNER_COLORS.length].banner,
                '--banner-ink': BANNER_COLORS[index % BANNER_COLORS.length].ink,
              }}
            >
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
