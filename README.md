<p align="center">
  <img src="public/logo.png" alt="Doan Excelsior" width="200" />
</p>

# Doan Excelsior

A spreadsheet that runs in the browser. Open an Excel, ODS or CSV file, edit it with real formulas, and download it again as `.xlsx` or `.csv`. Nothing is uploaded anywhere: files are read and written entirely on your own machine.

Built with React 19, the React Compiler, [HyperFormula](https://hyperformula.handsontable.com/) for calculation and [SheetJS](https://sheetjs.com/) for file reading and writing.

## Features

- **Open files** with the Open button or by dragging a file onto the window. Supports `.xlsx`, `.xlsm`, `.xls`, `.ods`, `.csv` and `.tsv`.
- **Formulas** with Excel syntax and over 400 built-in functions, including `SUM`, `AVERAGE`, `IF`, `VLOOKUP`, `XLOOKUP`, `INDEX`/`MATCH`, `SUMIFS`, `TEXT`, date functions and cross-sheet references like `=Budget!E7`.
- **Function help while you type.** Type `=` and the start of a name to get matching functions with a short description; pick one with the arrow keys and Tab or Enter. Inside a function, a hint shows its arguments with the current one in bold. Missing closing parentheses are added when you press Enter, so `=SUM(A1:A3` works.
- **Functions menu (Σ)** in the toolbar. **Sum, Average, Count, Min and Max** total the selected cells like Excel's AutoSum: with one cell selected, it fills in the numbers above (or to the left) for you to check; with a range selected, it writes a total under each column. **Popular** lists IF, VLOOKUP, XLOOKUP, COUNTIF and more, and **All functions…** opens a searchable list of every supported function, filterable by category.
- **Number formats from the original file** are kept, so dates show as dates and currency as currency. Typing `1/2/2026`, `12%` or `$4.50` is recognised automatically.
- **Editing like Excel.** Start typing to replace a cell, or press Enter, F2 or double-click to edit it. The formula bar shows and edits the raw contents.
- **Selection** with the mouse (click, Shift+click, drag) or keyboard (Shift+Arrow), plus whole rows and columns from their headers.
- **Copy, cut and paste.** Copying inside the app keeps formulas and shifts their references, so `=E2*2` pasted one row down becomes `=E3*2`. Pasting from Excel or Google Sheets works too.
- **Undo and redo** for everything, including row, column and sheet changes.
- **Rows and columns**: insert and delete, with formulas updating to match.
- **Resizable columns.** Drag the right edge of a column header to make it wider or narrower, or double-click the edge to fit the column to its contents. Select several whole columns first to resize them all at once. Widths are read from and saved to `.xlsx` files, and can be undone.
- **Sheets**: add, rename (double-click a tab) and delete.
- **Status bar** with Sum, Average and Count for the selected cells.
- **Download** the whole workbook as `.xlsx`, or the current sheet as `.csv`.
- **Large sheets** stay smooth: the grid only renders the cells on screen.
- **Three themes**: Light, Dark and Knight, plus Match system. Your choice is remembered.
- **Works on small screens**, and can be installed as an app from the browser.

## Knight features

Optional touches that make the app feel like a knight's ledger. The two toolbar switches next to the theme buttons turn on the wording and the sounds; both are off by default and remembered between visits.

| Feature | How to use it |
| --- | --- |
| **Castle gate** | The first page you see, every visit: a painted castle at night under a green moon, with flickering torches, rising embers and drifting fog, and a slight depth shift as the mouse moves. Choose **Enter the keep** for a new workbook, or **Bring a scroll** to pick a file (you can also drop a file on the gate). The portcullis rises into the stone, the doors swing inward onto a sunlit courtyard and you ride through to the loading screen. A file chosen here opens behind the loading screen, so it's ready when the app appears. |
| **Loading screen** | Shows for about four seconds after the castle gate: a galloping knight, the wordmark and a filling progress bar. It's a timed intro, and the app loads underneath it. Change the length with `SPLASH_DURATION` in `src/components/SplashScreen.jsx`. |
| **Knightly speech** | Click the **scroll** button. Buttons, menus, the status bar and messages switch to a medieval voice (see the table below). Only the wording changes, never what a button does, and formula error codes like `#DIV/0!` stay as they are. While it's on, new sheets are named *Banner 2*, *Banner 3*… |
| **Banner sheet tabs** | Always on. Sheet tabs hang like swallowtail pennants in heraldic colors: green, gold, crimson, blue and purple, in turn. The active tab is filled in. |
| **`=EXCELSIOR()`** | Type it in any cell to get a random knightly motto, such as *“Let no #REF! go unanswered.”* It appears in autocomplete and under **Knightly** in All functions. Excel doesn't know it, so a downloaded file keeps the motto as the cell's saved value, but Excel shows `#NAME?` if it recalculates. |
| **Sound effects** | Click the **speaker** button; a short sword sound confirms it's on. Then you'll hear a sword being drawn when you save a formula, a horse when a file opens, parchment when you switch sheets, a horn when you download, the portcullis rattling up at the castle gate, a dragon's roar when the error dragon lands and a victory fanfare when you slay it. |
| **“Charge!” while opening** | Shows automatically when a file takes a moment to open: a small galloping knight with real progress through reading the file, reading the sheets and calculating formulas. It appears at once for files over 1 MB, and only after a quarter of a second for smaller ones, so quick opens don't flash. |
| **Error dragon** | Always on. While any cell in the workbook shows an error (`#DIV/0!`, `#REF!`, `#NAME?`…), a dragon perches on the status bar above a count of the errors. It can't be dismissed: click it to jump to the next error, on any sheet, and it flies off once every error is fixed (or undone). With sound on, it roars as it lands and a fanfare plays when it leaves; when an edit or a newly opened file wakes or slays the dragon, only the dragon's sound plays, not the usual sword or horse. It counts up to 10,000 errors. |
| **Sword cursor** | Always on over the cells, in place of the usual plus. Text boxes, buttons, headers and resize handles keep their normal cursors. The click point is the tip of the blade. |

**Knightly wording**

| Plain | Knightly |
| --- | --- |
| New, Open | Forge, Summon scroll |
| Download .xlsx / .csv | Seal as .xlsx / .csv |
| Undo, Redo | Retreat, Advance |
| Insert / Delete rows and columns | Raise / Banish rows and columns |
| Functions, Shortcuts | Spellbook, Battle keys |
| Sum, Average, Count | Tribute, Mean, Muster |
| Add sheet | Raise a banner |
| Opening | Charge! |
| 3 errors | 3 to slay |

**No sound?** Make sure the speaker button is on (it shows sound waves rather than an ×), the browser tab isn't muted (right-click the tab) and your system volume is up. Browsers only allow sound after you've clicked or typed on the page, so the very first sound needs an interaction first.

## Getting started

You need Node.js 20.19 or later.

```bash
npm install
npm run dev
```

Then open the address Vite prints, usually <http://localhost:5173>.

| Command           | What it does                                    |
| ----------------- | ----------------------------------------------- |
| `npm run dev`     | Starts the development server with hot reload   |
| `npm run build`   | Builds a production version into `dist/`       |
| `npm run preview` | Serves the production build locally             |
| `npm run lint`    | Checks the code, including the house style rules |

`dist/` is a plain static site, so it can be hosted on Netlify, Vercel, GitHub Pages, Cloudflare Pages or any web server.

### A note on SheetJS

SheetJS publishes current versions on its own CDN rather than npm (the npm package is stuck at 0.18.5, which has known security issues). `package.json` installs 0.20.3 straight from `cdn.sheetjs.com`. If your network blocks that domain, download the tarball once and point `package.json` at the local file instead:

```json
"xlsx": "file:vendor/xlsx-0.20.3.tgz"
```

## Themes

Pick a theme with the switch at the right of the toolbar.

| Theme        | Look                                                                 |
| ------------ | -------------------------------------------------------------------- |
| Match system | Follows your computer’s light or dark setting (the default)          |
| Light        | White sheet with forest-green selection and accents                  |
| Dark         | Steel-black sheet with mint-green accents                            |
| Knight       | Forest-green toolbar and footer around a light sheet, like the logo  |

The choice is saved in the browser, and a small script in `index.html` applies it before the page draws so there is no flash of the wrong theme. All colors are CSS variables at the top of `src/styles.css`, one block per theme, and are taken from the logo:

| Token           | Color     | From the logo            |
| --------------- | --------- | ------------------------ |
| Brand ink       | `#091F1B` | “DOAN” lettering         |
| Brand green     | `#0C6338` | “EXCELSIOR” and the cape |
| Bright green    | `#188448` | Shield highlights        |
| Mint            | `#90CC9C` | Spreadsheet grid on the shield |
| Steel           | `#849090` | Armor                    |

To add another theme, copy the `:root[data-theme='knight']` block, give it a new name, and add it to `THEMES` in `src/lib/themeStore.js` (and to the list in the `index.html` script).

## Logo and icons

`public/logo.png` is the full logo. The other image files are made from it:

| File                          | Used for                                          |
| ----------------------------- | ------------------------------------------------- |
| `public/favicon.ico`, `icon-32.png`, `icon-192.png` | Browser tab icon                |
| `public/apple-touch-icon.png` | iPhone and iPad home screen                       |
| `public/icon-512.png`         | Installed app icon (`manifest.webmanifest`)       |
| `public/cursor-sword.png`, `cursor-sword@2x.png` | Sword cursor over cells (32 and 64 px, hotspot at the blade tip, top left) |
| `src/assets/emblem.png`       | Knight emblem in the toolbar and drop screen      |

In the app, the “DOAN / EXCELSIOR” lettering next to the emblem is set in type (Cinzel) rather than taken from the image, so it can change color with the theme and stay readable in Dark and Knight.

If you change the logo, regenerate these files at the same sizes. The emblem is the logo cropped to the knight and shield, without the lettering.

## Keyboard shortcuts

On a Mac, use ⌘ in place of Ctrl. The Shortcuts button in the toolbar shows this list inside the app.

| Action                    | Keys                                   |
| ------------------------- | -------------------------------------- |
| Move                      | Arrow keys, Tab, Shift+Tab             |
| Extend selection          | Shift+Arrow, Shift+click, drag         |
| Edit cell                 | Enter, F2, double-click, or start typing |
| Save edit and move        | Enter, Shift+Enter, Tab                |
| Cancel edit               | Esc                                    |
| Clear cells               | Delete or Backspace                    |
| Copy, cut, paste          | Ctrl+C, Ctrl+X, Ctrl+V                 |
| Undo, redo                | Ctrl+Z, Ctrl+Y or Ctrl+Shift+Z         |
| Select all data           | Ctrl+A                                 |
| Jump a screen             | Page Up, Page Down                     |
| Start of row, go to A1    | Home, Ctrl+Home                        |
| Resize column             | Drag the edge of its header            |
| Fit column to contents    | Double-click the edge of its header    |
| Pick a suggested function | Arrow keys, then Tab or Enter          |
| Hide function suggestions | Esc                                    |

## Project structure

```
src/
├── main.jsx                  Entry point
├── assets/
│   ├── emblem.png            Knight emblem from the logo
│   ├── knight-loader.webp    Galloping knight for the loading screen
│   ├── dragon/dragon.webp    Error dragon, cut from art/dragon/dragon-error.png
│   └── gate/                 Castle gate layers (sky, castle, ground, courtyard, doors, portcullis, torch, flame)
├── App.jsx                   Creates the workbook store and provides it
├── styles.css                All styles, with light and dark color tokens
├── context/
│   └── WorkbookContext.js    React context holding the store
├── hooks/
│   ├── useWorkbook.js        Subscribes a component to workbook changes
│   ├── useFunctionAutocomplete.js  Function suggestions for formula inputs
│   ├── useSettings.js        Reads settings, and the wording for the current voice
│   └── useTheme.js           Reads and sets the theme
├── lib/
│   ├── workbookStore.js      Wraps HyperFormula: reads, edits, undo, sheets
│   ├── columns.js            Column widths and pixel offsets
│   ├── functions.js          Function catalog, search and formula text helpers
│   ├── excelsiorFunction.js  Registers the =EXCELSIOR() custom function
│   ├── lexicon.js            Plain and knightly interface wording
│   ├── settingsStore.js      Remembers knightly speech and sound settings
│   ├── sounds.js             Synthesized sound effects (Web Audio)
│   ├── fileIO.js             Reads and writes files with SheetJS
│   ├── format.js             Turns values and number formats into display text
│   ├── address.js            A1-style labels and range helpers
│   ├── tsv.js                Clipboard text in and out
│   └── themeStore.js         Saves and applies the theme
└── components/
    ├── CastleGate.jsx        The castle gate shown first on every visit
    ├── SplashScreen.jsx      Timed full-screen loader shown after the gate
    ├── DoanExcelsiorLoader.jsx  Knight, wordmark and progress bar
    ├── Workspace.jsx         File opening, drag and drop, page title
    ├── WorkbookView.jsx      Selection, editing and every action
    ├── Brand.jsx             Emblem and wordmark
    ├── ThemePicker.jsx       System, Light, Dark and Knight switch
    ├── SettingsToggles.jsx   Knightly speech and sound on/off buttons
    ├── Toolbar.jsx           File and editing buttons
    ├── FormulaBar.jsx        Cell address and raw contents
    ├── Grid.jsx              The virtualized grid, mouse and keyboard
    ├── CellEditor.jsx        The text box shown while editing a cell
    ├── FunctionHints.jsx     Suggestion list and syntax hint under an input
    ├── FunctionMenu.jsx      The Σ Functions dropdown in the toolbar
    ├── FunctionPicker.jsx    Searchable dialog of every function
    ├── SheetTabs.jsx         Sheet tabs, add, rename, delete
    ├── ErrorDragon.jsx       The dragon that guards formula errors
    ├── StatusBar.jsx         Sum, Average and Count
    ├── ShortcutsPanel.jsx    Keyboard shortcuts list
    ├── Toast.jsx             Short messages and errors
    └── Icon.jsx              Inline SVG icons
```

## How it works

**The store.** `workbookStore.js` owns a HyperFormula engine and exposes `subscribe` and `getSnapshot`, so React reads it through `useSyncExternalStore`. Every change produces a new snapshot object, which tells React and the React Compiler that anything read from the workbook may have changed. Components never hold their own copy of cell data.

**Number formats.** HyperFormula stores values, not formats, so the store keeps Excel number formats (such as `m/d/yyyy`) in a separate map. When rows or columns move, the map moves with them, and it is saved alongside each undo step so undo restores formats too.

**Column widths** work the same way: the store keeps a map of custom widths per sheet that shifts with inserted and deleted columns. Resizing a column doesn't touch HyperFormula, so the store keeps its own undo list where each step is marked as an engine step or a width-only step, and only engine steps call `engine.undo()`.

**Opening and saving.** `fileIO.js` converts SheetJS cells into the plain values and `=formulas` HyperFormula expects, and back again on download. Downloaded files include both the formula and its last result, so other apps show values immediately.

**The grid.** Only the visible cells (plus a few extra around the edges) are rendered. Row and column headers stay in place with CSS `position: sticky`, so no scroll syncing code is needed. Because columns can have different widths, `columnLayout` in `columns.js` builds a table of column offsets, and a binary search finds the column under the mouse or at the edge of the screen.

**Functions.** HyperFormula supplies the functions (`getRegisteredFunctionNames`) but not their descriptions, so `functions.js` documents about 90 common ones with syntax and a one-line summary, and sorts the rest into categories. The cell editor and formula bar share `useFunctionAutocomplete`, which looks at the text before the caret to find a function name being typed or the function call the caret is inside.

**The castle gate art** is stacked in layers so parts can move. From back to front: the sky (the page background), the ground, then everything inside the archway (the courtyard, the two doors and the portcullis) clipped to the arch's traced outline, then the castle on top, then the torches and fog. Positions are given in the castle artwork's own pixels (1600×1000, plus 282 for the ground) and turned into percentages, so the whole scene scales together. The original PNGs are kept in `art/castle-gate/` (not shipped); the app uses compressed WebP copies in `src/assets/gate/`. The ground's printed filename label was cropped off, and the flame's dark backing faded out, during that conversion.

**Arrival.** `App.jsx` moves through three phases: the castle gate, the loading screen, then the app. The app renders underneath the whole time (marked `inert` so the keyboard can't reach it), so it's ready the moment the loading screen fades. A file chosen at the gate is handed to `Workspace`, which starts opening it straight away.

**Knight features.** `settingsStore.js` remembers the two switches, and `useWords()` returns the wording for the current voice from `lexicon.js`, so components never hard-code button text. Sounds in `sounds.js` are built from oscillators and filtered noise with the Web Audio API. Each one has a volume level tuned by measuring it, and they all go through a limiter so overlapping sounds don't distort. `=EXCELSIOR()` is a HyperFormula function plugin registered in `excelsiorFunction.js` before any engine is created. While a file opens, `readWorkbookFile` reports each step, and `Workspace` waits for the browser to paint between steps so the progress bar actually updates.

**Opening a new file** changes a `generation` number in the store. `WorkbookView` uses it as its `key`, so React resets selection, editing and the active sheet automatically.

## Code style

- **Every function is a `const` arrow function**, components included: `const Grid = ({ sheet }) => { … }`. ESLint enforces this with `func-style`, `prefer-arrow-callback` and a rule that rejects the `function` keyword, so `npm run lint` fails on any exception.
- **No manual memoization.** The React Compiler (configured in `vite.config.js`) memoizes components and values automatically, so the code has no `useMemo`, `useCallback` or `React.memo`.
- **Plain JavaScript with JSX**, ES modules, one component per file.

## React 19 features used

| Feature                              | Where                     | Why                                                       |
| ------------------------------------ | ------------------------- | --------------------------------------------------------- |
| React Compiler                       | Whole app                 | Automatic memoization                                     |
| `useActionState`                     | `Workspace.jsx`           | Opening a file, with built-in pending and error state     |
| `<Activity>`                         | `WorkbookView.jsx`        | Keeps the shortcuts panel mounted while hidden            |
| `useEffectEvent`                     | `Grid.jsx`                | Drag-to-select listeners that always see current props    |
| `use(Context)`                       | `useWorkbook.js`          | Reads the store from context                              |
| `<Context value>` as provider        | `App.jsx`                 | No `.Provider` needed                                     |
| `ref` as a prop                      | `Grid.jsx`                | Lets the parent focus the grid without `forwardRef`       |
| `<title>` and `<meta>` in a component | `Workspace.jsx`          | File name in the browser tab, theme color for mobile browsers |
| `useSyncExternalStore`               | `useWorkbook.js`, `useTheme.js` | Subscribes to the spreadsheet engine and the theme  |
| `useDeferredValue`                   | `StatusBar.jsx`           | Keeps large selections smooth while totals catch up       |

## Known limitations

- **Formatting.** Number formats and column widths are kept, but fonts, colors, borders and merged cells from the original file are not shown or saved. Hidden columns are shown at the default width.
- **Row heights** are fixed.
- **Not supported:** charts, pivot tables, conditional formatting, data validation, comments, images and macros. Files containing these still open, but those parts are dropped when you download.
- **Fill handle and formula point-and-click** (clicking cells to insert references while typing a formula) are not built yet.
- **Pasting from other apps** pastes values; formulas only shift their references when copied within doan-excelsior.
- **Sheet size** is capped at 100,000 rows and 16,384 columns. Very large files may take a few seconds to open.
- **No autosave.** Download your work before closing the tab.

## Ideas for next steps

Spreadsheet features:

Adjustable row heights, bold/italic/fill formatting that round-trips to Excel, the fill handle, find and replace, freezing rows and columns, sorting and filtering, charts, and saving work in the browser between sessions.

## Licensing

- **HyperFormula** is dual-licensed: GPLv3, or a commercial license from Handsontable. This project uses the `gpl-v3` license key in `src/lib/workbookStore.js`. If you distribute this app, either release your source code under GPLv3 or buy a commercial HyperFormula license.
- **SheetJS Community Edition** is Apache 2.0.
- **React** and **Vite** are MIT.

Choose a license for your own code that is compatible with the HyperFormula option you pick.
