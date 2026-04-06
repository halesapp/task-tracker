import { useState } from 'preact/hooks'
import { AlertTriangle, Trash2, X } from 'lucide-preact'

const CONFIRM_PHRASE = 'delete all project data'

export default function DeleteAllModal({ onConfirm, onClose }) {
  const [input, setInput] = useState('')
  const confirmed = input.trim().toLowerCase() === CONFIRM_PHRASE

  function handleKeyDown(e) {
    if (e.key === 'Escape') onClose()
  }

  return (
    <div className="search-overlay" onClick={onClose}>
      <div className="delete-all-modal" onClick={(e) => e.stopPropagation()}>

        <div className="delete-all-header">
          <AlertTriangle size={28} className="delete-all-icon" />
          <h2>Delete All Project Data</h2>
          <button className="detail-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="delete-all-body">
          <div className="delete-all-warning-banner">
            <strong>This action is permanent and cannot be undone.</strong>
          </div>

          <p className="delete-all-desc">Deleting all project data will permanently erase:</p>
          <ul className="delete-all-list">
            <li>Every task, subtask, and note</li>
            <li>All lists and groups</li>
            <li>All people and assignments</li>
            <li>All tags</li>
            <li>All local storage data for this app</li>
          </ul>

          <div className="delete-all-warning-secondary">
            If you have cloud sync configured, this does <strong>not</strong> delete your remote
            database. You would need to disconnect and wipe it separately.
          </div>

          <div className="delete-all-confirm-block">
            <label className="delete-all-confirm-label">
              Type <span className="delete-all-phrase">"{CONFIRM_PHRASE}"</span> to confirm:
            </label>
            <input
              className="delete-all-confirm-input"
              autoFocus
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={CONFIRM_PHRASE}
              spellCheck={false}
            />
          </div>

          <div className="delete-all-actions">
            <button className="delete-all-cancel-btn" onClick={onClose}>
              Cancel — keep my data
            </button>
            <button
              className="delete-all-confirm-btn"
              disabled={!confirmed}
              onClick={() => confirmed && onConfirm()}
            >
              <Trash2 size={15} />
              Delete everything
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
