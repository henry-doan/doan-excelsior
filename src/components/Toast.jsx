import Icon from './Icon.jsx'

const Toast = ({ message, tone = 'info', onDismiss }) => (
  <div className={`toast is-${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
    <span>{message}</span>
    <button type="button" className="toast-dismiss" aria-label="Dismiss" onClick={onDismiss}>
      <Icon name="close" size={14} />
    </button>
  </div>
)

export default Toast
