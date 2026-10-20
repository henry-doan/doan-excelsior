/** Splits "IF(test, value_if_true, [value_if_false])" into its name and argument names. */
const splitSyntax = (syntax) => {
  const open = syntax.indexOf('(')
  const inner = syntax.slice(open + 1, syntax.lastIndexOf(')'))
  return { name: syntax.slice(0, open), args: inner ? inner.split(', ') : [] }
}

/** Shows the syntax of the function being typed, with the current argument in bold. */
const Signature = ({ fn, argument }) => {
  const { name, args } = splitSyntax(fn.syntax)
  // Past the last named argument, a trailing "…" means the last one repeats.
  const current = args.at(-1) === '…' && argument >= args.length - 1 ? args.length - 2 : argument
  return (
    <div className="function-signature" role="status">
      <code>
        {name}(
        {args.map((arg, index) => (
          <span key={index}>
            {index > 0 && ', '}
            {index === current ? <strong>{arg}</strong> : arg}
          </span>
        ))}
        )
      </code>
      {fn.description && <p>{fn.description}</p>}
    </div>
  )
}

/**
 * The popup under a formula input: matching function names while a name is
 * being typed, or the syntax of the function the caret is inside.
 */
const FunctionHints = ({ listId, suggestions, activeIndex, signature, onPick, style }) => {
  if (suggestions.length > 0) {
    return (
      <ul id={listId} className="function-hints" role="listbox" aria-label="Functions" style={style}>
        {suggestions.map((fn, index) => (
          <li
            key={fn.name}
            id={`${listId}-${index}`}
            role="option"
            aria-selected={index === activeIndex}
            className={index === activeIndex ? 'is-active' : ''}
            // Pointer down, not click, so the input keeps focus.
            onPointerDown={(event) => {
              event.preventDefault()
              onPick(fn)
            }}
          >
            <span className="function-name">{fn.name}</span>
            <span className="function-summary">{fn.description || fn.category}</span>
          </li>
        ))}
      </ul>
    )
  }
  if (!signature) return null
  return (
    <div className="function-hints is-signature" style={style}>
      <Signature fn={signature.fn} argument={signature.argument} />
    </div>
  )
}

export default FunctionHints
