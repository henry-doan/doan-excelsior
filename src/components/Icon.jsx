/** A small hand-drawn icon set, stroked on a 20×20 grid so it inherits text color. */
const PATHS = {
  new: 'M5 2.5h6.5L15 6v11.5H5z M11.5 2.5V6H15 M10 9v5 M7.5 11.5h5',
  open: 'M2.5 5.5v10h15v-8H9.5L7.5 5.5z M2.5 8h15',
  download: 'M10 3v9 M6.5 8.5 10 12l3.5-3.5 M4 15.5h12',
  undo: 'M7 5 3.5 8.5 7 12 M3.5 8.5H12a4 4 0 0 1 0 8H9',
  redo: 'M13 5l3.5 3.5L13 12 M16.5 8.5H8a4 4 0 0 0 0 8h3',
  rowAdd: 'M2.5 4h15v5h-15z M10 12v5 M7.5 14.5h5',
  rowRemove: 'M2.5 4h15v5h-15z M7.5 14.5h5',
  colAdd: 'M4 2.5h5v15H4z M12 10h5 M14.5 7.5v5',
  colRemove: 'M4 2.5h5v15H4z M12 10h5',
  keyboard: 'M2.5 5.5h15v9h-15z M5 8.5h1 M8 8.5h1 M11 8.5h1 M14 8.5h1 M6.5 11.5h7',
  plus: 'M10 4.5v11 M4.5 10h11',
  sigma: 'M14.5 4.5v-1h-9l5 6.5-5 6.5h9v-1',
  chevron: 'M6 8l4 4 4-4',
  close: 'M5.5 5.5l9 9 M14.5 5.5l-9 9',
  system: 'M3 4.5h14v9H3z M7.5 16.5h5 M10 13.5v3',
  sun: 'M10 6.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7z M10 2.5v1.5 M10 16v1.5 M2.5 10H4 M16 10h1.5 M4.7 4.7l1 1 M14.3 14.3l1 1 M4.7 15.3l1-1 M14.3 5.7l1-1',
  moon: 'M15.5 12.5A6.5 6.5 0 0 1 7.5 4.5a6.5 6.5 0 1 0 8 8z',
  shield: 'M10 2.5 16 5v4.5c0 4-2.6 6.7-6 8-3.4-1.3-6-4-6-8V5z M7.5 9.5l5 5 M12.5 9.5l-5 5',
}

const Icon = ({ name, size = 18 }) => (
  <svg
    className="icon"
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d={PATHS[name]} />
  </svg>
)

export default Icon
