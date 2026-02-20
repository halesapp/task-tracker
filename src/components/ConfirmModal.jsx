import { useEffect, useRef } from 'react'
import { Trash2, X } from 'lucide-react'

export default function ConfirmModal({ message, confirmLabel = 'Delete', onConfirm, onClose }) {
  const cancelRef = useRef(null)

  useEffect(() => {
    cancelRef.current?.focus()
    function handleKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div className="search-overlay" onClick={onClose}>
      <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-modal-header">
          <span className="confirm-modal-title">Confirm Delete</span>
          <button className="detail-close" onClick={onClose}><X size={16} /></button>
        </div>
        <p className="confirm-modal-message">{message}</p>
        <div className="confirm-modal-actions">
          <button ref={cancelRef} className="confirm-modal-cancel" onClick={onClose}>
            Cancel
          </button>
          <button className="confirm-modal-confirm" onClick={() => { onConfirm(); onClose() }}>
            <Trash2 size={14} />
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
