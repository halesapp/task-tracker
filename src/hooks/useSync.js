import { useState, useCallback, useEffect, useRef } from 'react'

const UPSTASH_URL_KEY = 'todo-sync-upstash-url'
const UPSTASH_TOKEN_KEY = 'todo-sync-upstash-token'
const LOCAL_LAST_SYNCED_KEY = 'todo-sync-lastSyncedAt'
const BASELINES_KEY = 'todo-sync-baselines'
const AUTO_SYNC_DELAY = 3_000

const DATA_KEYS = ['groups', 'lists', 'tasks', 'people', 'tags', 'settings']
const SYNC_TIMESTAMP_KEY = 'todo:syncedAt'

// --- Hashing utilities ---

function stableStringify(val) {
  if (Array.isArray(val)) {
    const sorted = val.slice().sort((a, b) =>
      a.id && b.id ? (a.id < b.id ? -1 : a.id > b.id ? 1 : 0) : 0
    )
    return '[' + sorted.map(stableStringify).join(',') + ']'
  }
  if (val !== null && typeof val === 'object') {
    const keys = Object.keys(val).sort()
    return '{' + keys.map(k => JSON.stringify(k) + ':' + stableStringify(val[k])).join(',') + '}'
  }
  return JSON.stringify(val)
}

function hashOf(str) {
  let h = 5381
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0
  return h
}

function computeHashes(data) {
  const out = {}
  for (const key of DATA_KEYS) out[key] = hashOf(stableStringify(data[key] ?? []))
  return out
}

// --- Baseline persistence ---

function loadBaselines() {
  try { return JSON.parse(localStorage.getItem(BASELINES_KEY) || '{}') } catch { return {} }
}
function saveBaselines(b) { localStorage.setItem(BASELINES_KEY, JSON.stringify(b)) }
function clearBaselines() { localStorage.removeItem(BASELINES_KEY) }

// --- Redis key helpers ---

function redisKey(section) { return `todo:${section}` }
function hashKey(section) { return `todo:hash:${section}` }

// --- Pipeline ---

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

async function testConnection(url, token) {
  const res = await fetch(`${url}/ping`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) return false
  const json = await res.json()
  return json.result === 'PONG'
}

// executePush: push local changes with per-key conflict detection.
// Returns { pushedKeys, pulledKeys, conflictKeys, mergedData, newBaselines, syncedAt }
// When conflictKeys is non-empty, no data is written — caller shows the conflict modal.
async function executePush(url, token, localData, baselines, forceAll = false) {
  const localHashes = computeHashes(localData)

  if (forceAll) {
    // Push everything without conflict check (user chose "Keep Local")
    const commands = []
    for (const key of DATA_KEYS) {
      commands.push(['SET', redisKey(key), JSON.stringify(localData[key] ?? [])])
      commands.push(['SET', hashKey(key), String(localHashes[key])])
    }
    const now = new Date().toISOString()
    commands.push(['SET', SYNC_TIMESTAMP_KEY, now])
    await upstashPipeline(url, token, commands)
    return {
      pushedKeys: [...DATA_KEYS],
      pulledKeys: [],
      conflictKeys: [],
      mergedData: null,
      newBaselines: { ...localHashes },
      syncedAt: now,
    }
  }

  // Fetch remote hashes for all keys
  const hashResults = await upstashPipeline(url, token, DATA_KEYS.map(key => ['GET', hashKey(key)]))
  const remoteHashes = {}
  for (let i = 0; i < DATA_KEYS.length; i++) {
    const val = hashResults[i]?.result
    remoteHashes[DATA_KEYS[i]] = val !== null && val !== undefined ? parseInt(val, 10) : null
  }

  // Check for conflicts
  const conflictKeys = []
  for (const key of DATA_KEYS) {
    const localHash = localHashes[key]
    const baselineHash = baselines[key]
    const remoteHash = remoteHashes[key]

    if (baselineHash === undefined) {
      // Never synced this key — if remote has data it's a first-time conflict
      if (remoteHash !== null) conflictKeys.push(key)
      continue
    }

    const localChanged = localHash !== baselineHash
    const remoteChanged = remoteHash !== null && remoteHash !== baselineHash

    if (localChanged && remoteChanged && localHash !== remoteHash) {
      conflictKeys.push(key)
    }
  }

  if (conflictKeys.length > 0) {
    const tsResults = await upstashPipeline(url, token, [['GET', SYNC_TIMESTAMP_KEY]])
    const remoteSyncedAt = tsResults[0]?.result || null
    return { conflictKeys, remoteSyncedAt }
  }

  // No conflicts — classify keys
  const keysToPush = []
  const keysToPull = []
  const keysIdentical = []

  for (const key of DATA_KEYS) {
    if (baselines[key] === undefined) continue

    const localHash = localHashes[key]
    const baselineHash = baselines[key]
    const remoteHash = remoteHashes[key]
    const localChanged = localHash !== baselineHash
    const remoteChanged = remoteHash !== null && remoteHash !== baselineHash

    if (localChanged && !remoteChanged) {
      keysToPush.push(key)
    } else if (!localChanged && remoteChanged) {
      keysToPull.push(key)
    } else if (localChanged && remoteChanged && localHash === remoteHash) {
      keysIdentical.push(key)
    }
    // !localChanged && !remoteChanged: no action needed
  }

  // Fetch data for auto-merge (remote-only-changed keys)
  const mergedData = { ...localData }
  const newBaselines = { ...baselines }
  const pulledKeys = []

  if (keysToPull.length > 0) {
    const fetchResults = await upstashPipeline(url, token, keysToPull.map(k => ['GET', redisKey(k)]))
    for (let i = 0; i < keysToPull.length; i++) {
      const key = keysToPull[i]
      const val = fetchResults[i]?.result
      if (val !== null && val !== undefined) {
        mergedData[key] = JSON.parse(val)
        pulledKeys.push(key)
        newBaselines[key] = remoteHashes[key]
      }
    }
  }

  // Build push commands
  const commands = []
  for (const key of keysToPush) {
    commands.push(['SET', redisKey(key), JSON.stringify(localData[key] ?? [])])
    commands.push(['SET', hashKey(key), String(localHashes[key])])
    newBaselines[key] = localHashes[key]
  }

  // Update baselines for keys where both devices made the identical change
  for (const key of keysIdentical) {
    newBaselines[key] = localHashes[key]
  }

  const now = new Date().toISOString()
  if (commands.length > 0) {
    commands.push(['SET', SYNC_TIMESTAMP_KEY, now])
    await upstashPipeline(url, token, commands)
  }

  return {
    pushedKeys: keysToPush,
    pulledKeys,
    conflictKeys: [],
    mergedData: pulledKeys.length > 0 ? mergedData : null,
    newBaselines,
    syncedAt: now,
  }
}

// executePull: pull remote data, optionally forcing all keys (for "Use Remote").
// Returns { data, newBaselines, syncedAt } or null if remote is empty.
async function executePull(url, token, localData, baselines, forceAll = false) {
  const commands = [
    ...DATA_KEYS.map(key => ['GET', redisKey(key)]),
    ...DATA_KEYS.map(key => ['GET', hashKey(key)]),
    ['GET', SYNC_TIMESTAMP_KEY],
  ]
  const results = await upstashPipeline(url, token, commands)

  const remoteData = {}
  const remoteHashes = {}
  let hasAny = false

  for (let i = 0; i < DATA_KEYS.length; i++) {
    const val = results[i]?.result
    if (val !== null && val !== undefined) {
      remoteData[DATA_KEYS[i]] = JSON.parse(val)
      hasAny = true
    }
  }

  for (let i = 0; i < DATA_KEYS.length; i++) {
    const val = results[DATA_KEYS.length + i]?.result
    if (val !== null && val !== undefined) {
      remoteHashes[DATA_KEYS[i]] = parseInt(val, 10)
    }
  }

  const remoteSyncedAt = results[DATA_KEYS.length * 2]?.result || null

  if (!hasAny) return null

  const syncedAt = remoteSyncedAt || new Date().toISOString()

  if (forceAll) {
    // Use all remote data — compute baselines from what we pulled
    const newBaselines = {}
    for (const key of DATA_KEYS) {
      if (remoteHashes[key] !== undefined) {
        newBaselines[key] = remoteHashes[key]
      } else if (remoteData[key] !== undefined) {
        newBaselines[key] = hashOf(stableStringify(remoteData[key]))
      }
    }
    return { data: remoteData, newBaselines, syncedAt }
  }

  // Smart merge: only overwrite keys that remote changed without local changes
  const localHashes = computeHashes(localData)
  const mergedData = { ...localData }
  const newBaselines = { ...baselines }

  for (const key of DATA_KEYS) {
    const localHash = localHashes[key]
    const baselineHash = baselines[key]
    const remoteHash = remoteHashes[key]

    if (baselineHash === undefined) {
      // Never synced — pull from remote if available
      if (remoteData[key] !== undefined) {
        mergedData[key] = remoteData[key]
        newBaselines[key] = remoteHash !== undefined ? remoteHash : hashOf(stableStringify(remoteData[key]))
      }
      continue
    }

    const localChanged = localHash !== baselineHash
    const remoteChanged = remoteHash !== undefined && remoteHash !== baselineHash

    if (!localChanged && remoteChanged && remoteData[key] !== undefined) {
      mergedData[key] = remoteData[key]
      newBaselines[key] = remoteHash
    } else if (!localChanged && !remoteChanged) {
      newBaselines[key] = localHash
    }
    // localChanged: keep local, don't update baseline for this key
  }

  return { data: mergedData, newBaselines, syncedAt }
}

export function useSync(data, { onAutoMerge } = {}) {
  const [upstashUrl, setUpstashUrl] = useState(() => localStorage.getItem(UPSTASH_URL_KEY) || '')
  const [upstashToken, setUpstashToken] = useState(() => localStorage.getItem(UPSTASH_TOKEN_KEY) || '')
  const [syncing, setSyncing] = useState(false)
  const [lastSynced, setLastSynced] = useState(() => localStorage.getItem(LOCAL_LAST_SYNCED_KEY))
  const [syncError, setSyncError] = useState(null)
  const [connectionOk, setConnectionOk] = useState(null)
  const [syncStatus, setSyncStatus] = useState(null)
  const [conflictInfo, setConflictInfo] = useState(null)

  // Always-current refs to avoid stale closures in effects/timeouts
  const dataRef = useRef(data)
  dataRef.current = data
  const onAutoMergeRef = useRef(onAutoMerge)
  onAutoMergeRef.current = onAutoMerge

  const isConfigured = !!(upstashUrl && upstashToken)

  function hasChanges(d) {
    const baselines = loadBaselines()
    if (Object.keys(baselines).length === 0) return false
    const hashes = computeHashes(d)
    for (const key of DATA_KEYS) {
      if (hashes[key] !== baselines[key]) return true
    }
    return false
  }

  function recordLastSynced(ts) {
    if (!ts) return
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
    clearBaselines()
    setUpstashUrl('')
    setUpstashToken('')
    setLastSynced(null)
    setSyncError(null)
    setConnectionOk(null)
    setSyncStatus(null)
    setConflictInfo(null)
  }

  const push = useCallback(async (pushData, { skipConflictCheck = false, onMergedData } = {}) => {
    if (!upstashUrl || !upstashToken) return
    setSyncError(null)
    setSyncing(true)
    try {
      const baselines = loadBaselines()
      const result = await executePush(upstashUrl, upstashToken, pushData, baselines, skipConflictCheck)

      if (result.conflictKeys?.length > 0) {
        setConflictInfo({
          conflictKeys: result.conflictKeys,
          remoteSyncedAt: result.remoteSyncedAt,
          localLastSyncedAt: localStorage.getItem(LOCAL_LAST_SYNCED_KEY),
        })
        setConnectionOk(true)
        return
      }

      saveBaselines(result.newBaselines)
      if (result.pushedKeys.length > 0 || result.pulledKeys.length > 0) {
        recordLastSynced(result.syncedAt)
      }
      setSyncStatus('synced')
      setConnectionOk(true)

      if (result.mergedData) {
        onMergedData?.(result.mergedData)
      }
    } catch (err) {
      setSyncError(err.message)
      setConnectionOk(false)
    } finally {
      setSyncing(false)
    }
  }, [upstashUrl, upstashToken])

  const pull = useCallback(async ({ skipConflictCheck = false } = {}) => {
    if (!upstashUrl || !upstashToken) return null
    setSyncing(true)
    setSyncError(null)
    try {
      const baselines = loadBaselines()
      const result = await executePull(upstashUrl, upstashToken, dataRef.current, baselines, skipConflictCheck)

      if (result === null) {
        setSyncError('No data found — push first to create it')
        setConnectionOk(true)
        return null
      }

      saveBaselines(result.newBaselines)
      recordLastSynced(result.syncedAt)
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
    await push(syncData, { onMergedData: onAutoMergeRef.current })
  }, [push])

  // Track modified state when data changes
  useEffect(() => {
    if (!isConfigured || !data) return
    if (hasChanges(data)) {
      setSyncStatus('modified')
    }
  }, [isConfigured, data])

  // Verify connection on mount and auto-pull when credentials exist
  useEffect(() => {
    if (!isConfigured) return
    let cancelled = false
    testConnection(upstashUrl, upstashToken).then(async (ok) => {
      if (cancelled) return
      setConnectionOk(ok)
      if (!ok) {
        setSyncError('Connection failed')
        return
      }
      // Auto-pull on first load
      const baselines = loadBaselines()
      const result = await executePull(upstashUrl, upstashToken, dataRef.current, baselines, false)
      if (cancelled || !result) return
      saveBaselines(result.newBaselines)
      recordLastSynced(result.syncedAt)
      setSyncStatus('synced')
      onAutoMergeRef.current?.(result.data)
    })
    return () => { cancelled = true }
  }, [isConfigured, upstashUrl, upstashToken])

  // Auto-sync 90s after the last edit
  useEffect(() => {
    if (!isConfigured || !data) return
    if (!hasChanges(data)) return

    const timeout = setTimeout(() => {
      push(data, { onMergedData: onAutoMergeRef.current })
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
