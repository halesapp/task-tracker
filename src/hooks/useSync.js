import { useState, useCallback, useEffect, useRef } from 'react'

const UPSTASH_URL_KEY = 'todo-sync-upstash-url'
const UPSTASH_TOKEN_KEY = 'todo-sync-upstash-token'
const AUTO_SYNC_INTERVAL = 300_000

const DATA_KEYS = ['groups', 'lists', 'tasks', 'people', 'tags']

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

  await upstashPipeline(url, token, commands)
  return updatedKeys
}

async function pullAll(url, token) {
  const commands = DATA_KEYS.map((key) => ['GET', redisKey(key)])
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
  return hasAny ? data : null
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
  const [lastSynced, setLastSynced] = useState(null)
  const [syncError, setSyncError] = useState(null)
  const [connectionOk, setConnectionOk] = useState(null) // null = unknown, true/false
  const [syncStatus, setSyncStatus] = useState(null) // null | 'synced' | 'modified'

  // Per-key snapshots of last synced JSON strings
  const lastSnapshots = useRef({})

  const isConfigured = !!(upstashUrl && upstashToken)

  // Snapshot current data state for comparison
  function snapshotData(d) {
    const snap = {}
    for (const key of DATA_KEYS) {
      snap[key] = JSON.stringify(d[key] || [])
    }
    return snap
  }

  // Check if current data differs from last synced snapshots
  function hasChanges(d) {
    for (const key of DATA_KEYS) {
      if (JSON.stringify(d[key] || []) !== lastSnapshots.current[key]) {
        return true
      }
    }
    return false
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
    setUpstashUrl('')
    setUpstashToken('')
    setLastSynced(null)
    setSyncError(null)
    setConnectionOk(null)
    setSyncStatus(null)
    lastSnapshots.current = {}
  }

  const push = useCallback(async (pushData) => {
    if (!upstashUrl || !upstashToken) return
    setSyncing(true)
    setSyncError(null)
    try {
      const updated = await pushChanged(upstashUrl, upstashToken, pushData, lastSnapshots.current)
      lastSnapshots.current = snapshotData(pushData)
      setLastSynced(new Date().toISOString())
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
        setConnectionOk(true) // connection works, just no data
        return null
      }
      lastSnapshots.current = snapshotData(result)
      setLastSynced(new Date().toISOString())
      setSyncStatus('synced')
      setConnectionOk(true)
      return result
    } catch (err) {
      setSyncError(err.message)
      setConnectionOk(false)
      return null
    } finally {
      setSyncing(false)
    }
  }, [upstashUrl, upstashToken])

  const syncNow = useCallback(async (syncData) => {
    await push(syncData)
  }, [push])

  // Track modified state when data changes
  useEffect(() => {
    if (!isConfigured || !data) return
    // Only mark modified if we've synced at least once
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

  // Auto-sync every 60s when data has changed
  useEffect(() => {
    if (!isConfigured || !data) return

    const interval = setInterval(() => {
      if (hasChanges(data)) {
        push(data)
      }
    }, AUTO_SYNC_INTERVAL)

    return () => clearInterval(interval)
  }, [isConfigured, data, push])

  return {
    syncing,
    lastSynced,
    syncError,
    isConfigured,
    connectionOk,
    syncStatus,
    saveCredentials,
    clearCredentials,
    push,
    pull,
    syncNow,
  }
}
