import { useEffect } from 'react'
import { AlertTriangle, X, CloudUpload, CloudDownload, Clock } from 'lucide-react'

function timeAgo(isoString) {
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function ConflictModal({ conflictInfo, onKeepLocal, onUseRemote, onDismiss }) {
  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onDismiss()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onDismiss])

  return (
    <div className="search-overlay" onClick={onDismiss}>
      <div className="conflict-modal" onClick={(e) => e.stopPropagation()}>
        <div className="conflict-modal-header">
          <AlertTriangle size={16} className="conflict-icon" />
          <span>Sync Conflict</span>
          <button className="detail-close" onClick={onDismiss} style={{ marginLeft: 'auto' }}>
            <X size={16} />
          </button>
        </div>

        <p className="conflict-modal-body">
          Remote data was updated by another device after your last sync. Syncing now would overwrite those changes.
        </p>

        <div className="conflict-timestamps">
          <div className="conflict-ts-row">
            <Clock size={13} />
            <span>Your last sync</span>
            <span className="conflict-ts-value">{timeAgo(conflictInfo.localLastSyncedAt)}</span>
          </div>
          <div className="conflict-ts-row">
            <Clock size={13} />
            <span>Remote last synced</span>
            <span className="conflict-ts-value">{timeAgo(conflictInfo.remoteSyncedAt)}</span>
          </div>
        </div>

        <div className="conflict-actions">
          <button className="conflict-btn-local" onClick={onKeepLocal}>
            <CloudUpload size={15} />
            Keep Local
            <span className="conflict-btn-sub">overwrite remote</span>
          </button>
          <button className="conflict-btn-remote" onClick={onUseRemote}>
            <CloudDownload size={15} />
            Use Remote
            <span className="conflict-btn-sub">discard local changes</span>
          </button>
        </div>

        <button className="conflict-btn-dismiss" onClick={onDismiss}>
          Decide Later
        </button>
      </div>
    </div>
  )
}
