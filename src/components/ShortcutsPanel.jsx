import Icon from './Icon.jsx'

const SHORTCUTS = [
  ['Move', 'Arrow keys, Tab, Shift+Tab'],
  ['Extend selection', 'Shift+Arrow, Shift+click, drag'],
  ['Edit cell', 'Enter, F2, double-click, or start typing'],
  ['Save edit and move', 'Enter, Shift+Enter, Tab'],
  ['Cancel edit', 'Esc'],
  ['Pick a suggested function', 'Arrow keys, then Tab or Enter'],
  ['Hide function suggestions', 'Esc'],
  ['Clear cells', 'Delete or Backspace'],
  ['Copy, cut, paste', 'Ctrl+C, Ctrl+X, Ctrl+V'],
  ['Undo, redo', 'Ctrl+Z, Ctrl+Y or Ctrl+Shift+Z'],
  ['Select all data', 'Ctrl+A'],
  ['Jump a screen', 'Page Up, Page Down'],
  ['Start of row, A1', 'Home, Ctrl+Home'],
  ['Resize column', 'Drag the edge of its header'],
  ['Fit column to contents', 'Double-click the edge of its header'],
  ['Rename sheet', 'Double-click its tab'],
]

/**
 * Kept mounted inside <Activity> so it opens instantly and keeps its
 * scroll position between toggles.
 */
const ShortcutsPanel = ({ onClose }) => (
  <aside className="shortcuts-panel" aria-label="Keyboard shortcuts">
    <div className="shortcuts-header">
      <h2>Keyboard shortcuts</h2>
      <button type="button" className="icon-button" aria-label="Close shortcuts" onClick={onClose}>
        <Icon name="close" size={16} />
      </button>
    </div>
    <dl className="shortcuts-list">
      {SHORTCUTS.map(([action, keys]) => (
        <div key={action} className="shortcut">
          <dt>{action}</dt>
          <dd>{keys}</dd>
        </div>
      ))}
    </dl>
    <p className="shortcuts-note">On a Mac, use ⌘ in place of Ctrl.</p>
  </aside>
)

export default ShortcutsPanel
