import { useState } from 'react'
import {
  Cloud,
  CloudUpload,
  CloudDownload,
  X,
  AlertCircle,
  Database,
  Download,
  Upload,
  Link,
} from 'lucide-react'

export default function SyncPanel({
  syncing,
  lastSynced,
  syncError,
  isConfigured,
  onSaveCredentials,
  onClearCredentials,
  onPush,
  onPull,
  onExport,
  fileInputRef,
  onClose,
}) {
  const [urlInput, setUrlInput] = useState('')
  const [tokenInput, setTokenInput] = useState('')
  const [connecting, setConnecting] = useState(false)

  async function handleSaveCredentials() {
    if (!urlInput.trim() || !tokenInput.trim()) return
    setConnecting(true)
    await onSaveCredentials(urlInput, tokenInput)
    setConnecting(false)
  }

  function handleDisconnect() {
    onClearCredentials()
    setUrlInput('')
    setTokenInput('')
  }

  const exportImportButtons = (
    <div className="sync-field" style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 4 }}>
      <label>Local Data</label>
      <div className="sync-actions">
        <button className="sync-btn" onClick={onExport}>
          <Download size={16} /> Export
        </button>
        <button className="sync-btn" onClick={() => fileInputRef.current?.click()}>
          <Upload size={16} /> Import
        </button>
      </div>
    </div>
  )

  // Step 1: No credentials — prompt for Upstash setup
  if (!isConfigured) {
    return (
      <div className="sync-panel">
        <div className="sync-panel-header">
          <Cloud size={18} />
          <span>Cloud Sync</span>
          <button className="detail-close" onClick={onClose} style={{ marginLeft: 'auto' }}>
            <X size={16} />
          </button>
        </div>
        <div className="sync-panel-body">
          <p className="sync-description">
            Sync your tasks across devices using your own Upstash Redis database.
            Create a free Redis database at{' '}
            <a href="https://upstash.com" target="_blank" rel="noopener noreferrer">
              upstash.com
            </a>
            , then paste your REST URL and token below.
          </p>

          <div className="sync-field">
            <label><Database size={13} style={{ verticalAlign: -2 }} /> REST URL</label>
            <input
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://your-db.upstash.io"
            />
          </div>

          <div className="sync-field">
            <label><Link size={13} style={{ verticalAlign: -2 }} /> REST Token</label>
            <input
              type="password"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="AX...your-token"
            />
          </div>

          <button
            className="sync-btn-primary"
            onClick={handleSaveCredentials}
            disabled={!urlInput.trim() || !tokenInput.trim() || connecting}
          >
            {connecting ? 'Connecting...' : 'Connect'}
          </button>

          {exportImportButtons}
        </div>
      </div>
    )
  }

  // Step 2: Connected
  return (
    <div className="sync-panel">
      <div className="sync-panel-header">
        <Cloud size={18} />
        <span>Cloud Sync</span>
        <button className="detail-close" onClick={onClose} style={{ marginLeft: 'auto' }}>
          <X size={16} />
        </button>
      </div>
      <div className="sync-panel-body">
        <div className="sync-status-row">
          <div className="sync-status-dot connected" />
          <span>Auto-sync active</span>
          {lastSynced && (
            <span className="sync-last-time">
              Last sync: {new Date(lastSynced).toLocaleTimeString()}
            </span>
          )}
        </div>

        {syncError && (
          <div className="sync-error">
            <AlertCircle size={14} />
            {syncError}
          </div>
        )}

        <p className="sync-description" style={{ fontSize: 12, opacity: 0.7 }}>
          Auto-syncs 3s after the last change. Press Cmd+S / Ctrl+S to sync immediately.
        </p>

        <div className="sync-actions">
          <button className="sync-btn" onClick={onPush} disabled={syncing}>
            <CloudUpload size={16} />
            {syncing ? 'Syncing...' : 'Push'}
          </button>
          <button className="sync-btn" onClick={onPull} disabled={syncing}>
            <CloudDownload size={16} />
            {syncing ? 'Syncing...' : 'Pull'}
          </button>
        </div>

        <button className="sync-btn-danger" onClick={handleDisconnect}>
          Disconnect
        </button>

        {exportImportButtons}
      </div>
    </div>
  )
}
