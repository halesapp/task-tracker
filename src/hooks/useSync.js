import { useState, useCallback, useEffect, useRef } from 'react'

const UPSTASH_URL_KEY = 'todo-sync-upstash-url'
const UPSTASH_TOKEN_KEY = 'todo-sync-upstash-token'
const LOCAL_LAST_SYNCED_KEY = 'todo-sync-lastSyncedAt'
const AUTO_SYNC_DELAY = 90_000

const DATA_KEYS = ['groups', 'lists', 'tasks', 'people', 'tags', 'settings']
const SYNC_TIMESTAMP_KEY = 'todo:syncedAt'

function redisKey(section) {
  return `todo:${section}`
}

async function upstashPipeline(url, token, commands) {
  const res = await fetch(`${url}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(commands),
  })
  if (!res.ok) throw new Error(`Upstash pipeline failed: ${res.status}`)
  return res.json()
}

async function fetchRemoteSyncedAt(url, token) {
  const results = await upstashPipeline(url, token, [['GET', SYNC_TIMESTAMP_KEY]])
  return results[0]?.result || null
}

async function pushChanged(url, token, data, lastSnapshots) {
  const commands = []
  const updatedKeys = []

  for (const key of DATA_KEYS) {
    const current = JSON.stringify(data[key] || [])
    if (current !== lastSnapshots[key]) {
      commands.push(['SET', redisKey(key), current])
      updatedKeys.push(key)
    }
  }

  if (commands.length === 0) return null

  const now = new Date().toISOString()
  commands.push(['SET', SYNC_TIMESTAMP_KEY, now])

  await upstashPipeline(url, token, commands)
  return { updatedKeys, syncedAt: now }
}

async function pullAll(url, token) {
  const commands = [
    ...DATA_KEYS.map((key) => ['GET', redisKey(key)]),
    ['GET', SYNC_TIMESTAMP_KEY],
  ]
  const results = await upstashPipeline(url, token, commands)

  const data = {}
  let hasAny = false
  for (let i = 0; i < DATA_KEYS.length; i++) {
    const val = results[i]?.result
    if (val !== null) {
      data[DATA_KEYS[i]] = JSON.parse(val)
      hasAny = true
    }
  }
  const remoteSyncedAt = results[DATA_KEYS.length]?.result || null
  return hasAny ? { data, remoteSyncedAt } : null
}

async function testConnection(url, token) {
  const res = await fetch(`${url}/ping`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) return false
  const json = await res.json()
  return json.result === 'PONG'
}

export function useSync(data) {
  const [upstashUrl, setUpstashUrl] = useState(() => localStorage.getItem(UPSTASH_URL_KEY) || '')
  const [upstashToken, setUpstashToken] = useState(() => localStorage.getItem(UPSTASH_TOKEN_KEY) || '')
  const [syncing, setSyncing] = useState(false)
  const [lastSynced, setLastSynced] = useState(() => localStorage.getItem(LOCAL_LAST_SYNCED_KEY))
  const [syncError, setSyncError] = useState(null)
  const [connectionOk, setConnectionOk] = useState(null)
  const [syncStatus, setSyncStatus] = useState(null)
  const [conflictInfo, setConflictInfo] = useState(null)

  // Per-key snapshots of last synced JSON strings
  const lastSnapshots = useRef({})

  const isConfigured = !!(upstashUrl && upstashToken)

  function snapshotData(d) {
    const snap = {}
    for (const key of DATA_KEYS) {
      snap[key] = JSON.stringify(d[key] || [])
    }
    return snap
  }

  function hasChanges(d) {
    for (const key of DATA_KEYS) {
      if (JSON.stringify(d[key] || []) !== lastSnapshots.current[key]) {
        return true
      }
    }
    return false
  }

  function recordLastSynced(ts) {
    localStorage.setItem(LOCAL_LAST_SYNCED_KEY, ts)
    setLastSynced(ts)
  }

  const saveCredentials = useCallback(async (url, token) => {
    const trimmedUrl = url.trim().replace(/\/+$/, '')
    const trimmedToken = token.trim()

    const ok = await testConnection(trimmedUrl, trimmedToken)
    if (!ok) {
      setSyncError('Connection failed — check your URL and token')
      setConnectionOk(false)
      return false
    }

    localStorage.setItem(UPSTASH_URL_KEY, trimmedUrl)
    localStorage.setItem(UPSTASH_TOKEN_KEY, trimmedToken)
    setUpstashUrl(trimmedUrl)
    setUpstashToken(trimmedToken)
    setConnectionOk(true)
    setSyncError(null)
    return true
  }, [])

  function clearCredentials() {
    localStorage.removeItem(UPSTASH_URL_KEY)
    localStorage.removeItem(UPSTASH_TOKEN_KEY)
    localStorage.removeItem(LOCAL_LAST_SYNCED_KEY)
    setUpstashUrl('')
    setUpstashToken('')
    setLastSynced(null)
    setSyncError(null)
    setConnectionOk(null)
    setSyncStatus(null)
    setConflictInfo(null)
    lastSnapshots.current = {}
  }

  // push: skips conflict check if skipConflictCheck is true (used when user resolves conflict)
  const push = useCallback(async (pushData, { skipConflictCheck = false } = {}) => {
    if (!upstashUrl || !upstashToken) return
    setSyncError(null)

    // Conflict check: if DB was synced by someone else after our last sync
    if (!skipConflictCheck) {
      const localLastSynced = localStorage.getItem(LOCAL_LAST_SYNCED_KEY)
      if (localLastSynced) {
        try {
          const remoteSyncedAt = await fetchRemoteSyncedAt(upstashUrl, upstashToken)
          if (remoteSyncedAt && remoteSyncedAt > localLastSynced) {
            setConflictInfo({ remoteSyncedAt, localLastSyncedAt: localLastSynced })
            setConnectionOk(true)
            return
          }
        } catch {
          // If we can't check, proceed optimistically
        }
      }
    }

    setSyncing(true)
    try {
      const result = await pushChanged(upstashUrl, upstashToken, pushData, lastSnapshots.current)
      lastSnapshots.current = snapshotData(pushData)
      const now = result?.syncedAt || new Date().toISOString()
      recordLastSynced(now)
      setSyncStatus('synced')
      setConnectionOk(true)
    } catch (err) {
      setSyncError(err.message)
      setConnectionOk(false)
    } finally {
      setSyncing(false)
    }
  }, [upstashUrl, upstashToken])

  const pull = useCallback(async () => {
    if (!upstashUrl || !upstashToken) return null
    setSyncing(true)
    setSyncError(null)
    try {
      const result = await pullAll(upstashUrl, upstashToken)
      if (result === null) {
        setSyncError('No data found — push first to create it')
        setConnectionOk(true)
        return null
      }
      lastSnapshots.current = snapshotData(result.data)
      const syncedAt = result.remoteSyncedAt || new Date().toISOString()
      recordLastSynced(syncedAt)
      setSyncStatus('synced')
      setConnectionOk(true)
      return result.data
    } catch (err) {
      setSyncError(err.message)
      setConnectionOk(false)
      return null
    } finally {
      setSyncing(false)
    }
  }, [upstashUrl, upstashToken])

  const dismissConflict = useCallback(() => {
    setConflictInfo(null)
  }, [])

  const syncNow = useCallback(async (syncData) => {
    await push(syncData)
  }, [push])

  // Track modified state when data changes
  useEffect(() => {
    if (!isConfigured || !data) return
    if (Object.keys(lastSnapshots.current).length > 0 && hasChanges(data)) {
      setSyncStatus('modified')
    }
  }, [isConfigured, data])

  // Verify connection on mount when credentials exist
  useEffect(() => {
    if (!isConfigured) return
    testConnection(upstashUrl, upstashToken).then((ok) => {
      setConnectionOk(ok)
      if (!ok) setSyncError('Connection failed')
    })
  }, [isConfigured, upstashUrl, upstashToken])

  // Auto-sync 90s after the last edit
  useEffect(() => {
    if (!isConfigured || !data) return
    if (!hasChanges(data)) return

    const timeout = setTimeout(() => {
      push(data)
    }, AUTO_SYNC_DELAY)

    return () => clearTimeout(timeout)
  }, [isConfigured, data, push])

  return {
    syncing,
    lastSynced,
    syncError,
    isConfigured,
    connectionOk,
    syncStatus,
    conflictInfo,
    saveCredentials,
    clearCredentials,
    push,
    pull,
    syncNow,
    dismissConflict,
  }
}
