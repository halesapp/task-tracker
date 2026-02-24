import { useState, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'

const STORAGE_KEY = 'todo-app-data'

const defaultSettings = {
  showDates: true,
  showTags: true,
  showPeople: true,
  taskListSize: 14,
  sidebarSize: 14,
  detailSize: 14,
}

const defaultData = {
  groups: [
    { id: 'default-group', name: 'Uncategorized lists', listIds: ['list-misc'], personId: null },
  ],
  lists: [
    { id: 'list-misc', name: 'Misc', icon: 'home', color: '#788CDE' },
  ],
  tasks: [],
  people: [],
  tags: [],
  settings: { ...defaultSettings },
}

function normalizeData(parsed) {
  if (!parsed.people) parsed.people = []
  if (!parsed.tags) parsed.tags = []
  if (!parsed.settings) parsed.settings = { ...defaultSettings }
  else parsed.settings = { ...defaultSettings, ...parsed.settings }
  parsed.groups = parsed.groups.map((g) => ({ personId: null, ...g }))
  parsed.tasks = parsed.tasks.map((t) => {
    const { assigneeId, endDate, ...rest } = {
      startDate: null,
      endDate: null,
      assigneeIds: [],
      priority: 'none',
      tagIds: [],
      ...t,
    }
    if (!rest.dueDate && endDate) rest.dueDate = endDate
    if (!rest.assigneeIds?.length && assigneeId) rest.assigneeIds = [assigneeId]
    return rest
  })
  return parsed
}

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return normalizeData(JSON.parse(raw))
  } catch {}
  return defaultData
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function useStore() {
  const [state, setState] = useState(() => ({ data: loadData(), history: [], future: [] }))
  const data = state.data

  const update = useCallback((updater) => {
    setState((prev) => {
      const next = updater(prev.data)
      saveData(next)
      return {
        data: next,
        history: [...prev.history.slice(-9), prev.data],
        future: [],
      }
    })
  }, [])

  const replaceData = useCallback((newData) => {
    const normalized = normalizeData(newData)
    saveData(normalized)
    setState({ data: normalized, history: [], future: [] })
  }, [])

  const undo = useCallback(() => {
    setState((prev) => {
      if (!prev.history.length) return prev
      const restored = prev.history[prev.history.length - 1]
      saveData(restored)
      return {
        data: restored,
        history: prev.history.slice(0, -1),
        future: [prev.data, ...prev.future.slice(0, 9)],
      }
    })
  }, [])

  const redo = useCallback(() => {
    setState((prev) => {
      if (!prev.future.length) return prev
      const restored = prev.future[0]
      saveData(restored)
      return {
        data: restored,
        history: [...prev.history.slice(-9), prev.data],
        future: prev.future.slice(1),
      }
    })
  }, [])

  const addTask = useCallback((listId, title) => {
    const task = {
      id: uuidv4(),
      listId,
      title,
      completed: false,
      important: false,
      createdAt: new Date().toISOString(),
      dueDate: null,
      startDate: null,
      assigneeIds: [],
      priority: 'none',
      tagIds: [],
      note: '',
      subtasks: [],
    }
    update((d) => ({ ...d, tasks: [...d.tasks, task] }))
    return task
  }, [update])

  const toggleTask = useCallback((taskId) => {
    update((d) => ({
      ...d,
      tasks: d.tasks.map((t) =>
        t.id === taskId ? { ...t, completed: !t.completed } : t
      ),
    }))
  }, [update])

  const toggleImportant = useCallback((taskId) => {
    update((d) => ({
      ...d,
      tasks: d.tasks.map((t) =>
        t.id === taskId ? { ...t, important: !t.important } : t
      ),
    }))
  }, [update])

  const deleteTask = useCallback((taskId) => {
    update((d) => ({
      ...d,
      tasks: d.tasks.filter((t) => t.id !== taskId),
    }))
  }, [update])

  const deleteTasks = useCallback((taskIds) => {
    const idSet = new Set(taskIds)
    update((d) => ({
      ...d,
      tasks: d.tasks.filter((t) => !idSet.has(t.id)),
    }))
  }, [update])

  const updateTask = useCallback((taskId, changes) => {
    update((d) => ({
      ...d,
      tasks: d.tasks.map((t) =>
        t.id === taskId ? { ...t, ...changes } : t
      ),
    }))
  }, [update])

  const addSubtask = useCallback((taskId, title) => {
    const subtask = { id: uuidv4(), title, completed: false }
    update((d) => ({
      ...d,
      tasks: d.tasks.map((t) =>
        t.id === taskId
          ? { ...t, subtasks: [...t.subtasks, subtask] }
          : t
      ),
    }))
  }, [update])

  const toggleSubtask = useCallback((taskId, subtaskId) => {
    update((d) => ({
      ...d,
      tasks: d.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              subtasks: t.subtasks.map((s) =>
                s.id === subtaskId ? { ...s, completed: !s.completed } : s
              ),
            }
          : t
      ),
    }))
  }, [update])

  const deleteSubtask = useCallback((taskId, subtaskId) => {
    update((d) => ({
      ...d,
      tasks: d.tasks.map((t) =>
        t.id === taskId
          ? { ...t, subtasks: t.subtasks.filter((s) => s.id !== subtaskId) }
          : t
      ),
    }))
  }, [update])

  const addList = useCallback((name, groupId) => {
    const list = { id: uuidv4(), name, icon: 'list', color: '#788CDE' }
    update((d) => ({
      ...d,
      lists: [...d.lists, list],
      groups: d.groups.map((g) =>
        g.id === groupId
          ? { ...g, listIds: [...g.listIds, list.id] }
          : g
      ),
    }))
    return list
  }, [update])

  const addGroup = useCallback((name) => {
    const group = { id: uuidv4(), name, listIds: [], personId: null }
    update((d) => ({ ...d, groups: [...d.groups, group] }))
    return group
  }, [update])

  const deleteList = useCallback((listId) => {
    update((d) => ({
      ...d,
      lists: d.lists.filter((l) => l.id !== listId),
      groups: d.groups.map((g) => ({
        ...g,
        listIds: g.listIds.filter((id) => id !== listId),
      })),
      tasks: d.tasks.filter((t) => t.listId !== listId),
    }))
  }, [update])

  const renameList = useCallback((listId, name) => {
    update((d) => ({
      ...d,
      lists: d.lists.map((l) => (l.id === listId ? { ...l, name } : l)),
    }))
  }, [update])

  const renameGroup = useCallback((groupId, name) => {
    update((d) => ({
      ...d,
      groups: d.groups.map((g) => (g.id === groupId ? { ...g, name } : g)),
    }))
  }, [update])

  const updateGroup = useCallback((groupId, changes) => {
    update((d) => ({
      ...d,
      groups: d.groups.map((g) => (g.id === groupId ? { ...g, ...changes } : g)),
    }))
  }, [update])

  const deleteGroup = useCallback((groupId) => {
    update((d) => {
      const group = d.groups.find((g) => g.id === groupId)
      if (!group) return d
      const listIdsToDelete = new Set(group.listIds)
      return {
        ...d,
        groups: d.groups.filter((g) => g.id !== groupId),
        lists: d.lists.filter((l) => !listIdsToDelete.has(l.id)),
        tasks: d.tasks.filter((t) => !listIdsToDelete.has(t.listId)),
      }
    })
  }, [update])

  const moveList = useCallback((groupId, listId, direction) => {
    update((d) => ({
      ...d,
      groups: d.groups.map((g) => {
        if (g.id !== groupId) return g
        const listIds = [...g.listIds]
        const idx = listIds.indexOf(listId)
        if (idx === -1) return g
        const newIdx = idx + direction
        if (newIdx < 0 || newIdx >= listIds.length) return g
        ;[listIds[idx], listIds[newIdx]] = [listIds[newIdx], listIds[idx]]
        return { ...g, listIds }
      }),
    }))
  }, [update])

  const moveListToGroup = useCallback((listId, targetGroupId) => {
    update((d) => ({
      ...d,
      groups: d.groups.map((g) => {
        if (g.id === targetGroupId) {
          if (g.listIds.includes(listId)) return g
          return { ...g, listIds: [...g.listIds, listId] }
        }
        return { ...g, listIds: g.listIds.filter((id) => id !== listId) }
      }),
    }))
  }, [update])

  const moveTask = useCallback((taskId, direction) => {
    update((d) => {
      const task = d.tasks.find((t) => t.id === taskId)
      if (!task) return d
      const peers = d.tasks.filter((t) => t.listId === task.listId && t.completed === task.completed)
      const idx = peers.findIndex((t) => t.id === taskId)
      const newIdx = idx + direction
      if (newIdx < 0 || newIdx >= peers.length) return d
      const swapId = peers[newIdx].id
      const tasks = [...d.tasks]
      const i = tasks.findIndex((t) => t.id === taskId)
      const j = tasks.findIndex((t) => t.id === swapId)
      ;[tasks[i], tasks[j]] = [tasks[j], tasks[i]]
      return { ...d, tasks }
    })
  }, [update])

  const moveGroup = useCallback((groupId, direction) => {
    update((d) => {
      const groups = [...d.groups]
      const idx = groups.findIndex((g) => g.id === groupId)
      if (idx === -1) return d
      const newIdx = idx + direction
      if (newIdx < 0 || newIdx >= groups.length) return d
      ;[groups[idx], groups[newIdx]] = [groups[newIdx], groups[idx]]
      return { ...d, groups }
    })
  }, [update])

  // People
  const addPerson = useCallback((name) => {
    const person = { id: uuidv4(), name, color: getPersonColor() }
    update((d) => ({ ...d, people: [...d.people, person] }))
    return person
  }, [update])

  const deletePerson = useCallback((personId) => {
    update((d) => ({
      ...d,
      people: d.people.filter((p) => p.id !== personId),
      groups: d.groups.map((g) =>
        g.personId === personId ? { ...g, personId: null } : g
      ),
      tasks: d.tasks.map((t) => ({
        ...t,
        assigneeIds: (t.assigneeIds || []).filter((id) => id !== personId),
      })),
    }))
  }, [update])

  const renamePerson = useCallback((personId, name) => {
    update((d) => ({
      ...d,
      people: d.people.map((p) => (p.id === personId ? { ...p, name } : p)),
    }))
  }, [update])

  const updatePerson = useCallback((personId, updates) => {
    update((d) => ({
      ...d,
      people: d.people.map((p) => (p.id === personId ? { ...p, ...updates } : p)),
    }))
  }, [update])

  // Tags
  const addTag = useCallback((name, color) => {
    const tag = { id: uuidv4(), name, color: color || getTagColor() }
    update((d) => ({ ...d, tags: [...d.tags, tag] }))
    return tag
  }, [update])

  const deleteTag = useCallback((tagId) => {
    update((d) => ({
      ...d,
      tags: d.tags.filter((t) => t.id !== tagId),
      tasks: d.tasks.map((t) => ({
        ...t,
        tagIds: (t.tagIds || []).filter((id) => id !== tagId),
      })),
    }))
  }, [update])

  const renameTag = useCallback((tagId, name) => {
    update((d) => ({
      ...d,
      tags: d.tags.map((t) => (t.id === tagId ? { ...t, name } : t)),
    }))
  }, [update])

  const updateTag = useCallback((tagId, changes) => {
    update((d) => ({
      ...d,
      tags: d.tags.map((t) => (t.id === tagId ? { ...t, ...changes } : t)),
    }))
  }, [update])

  const updateSettings = useCallback((changes) => {
    update((d) => ({ ...d, settings: { ...d.settings, ...changes } }))
  }, [update])

  const promoteSubtask = useCallback((parentTaskId, subtaskId) => {
    update((d) => {
      const parent = d.tasks.find((t) => t.id === parentTaskId)
      if (!parent) return d
      const sub = parent.subtasks.find((s) => s.id === subtaskId)
      if (!sub) return d
      const newTask = {
        id: uuidv4(),
        listId: parent.listId,
        title: sub.title,
        completed: sub.completed,
        important: false,
        createdAt: new Date().toISOString(),
        dueDate: null,
        startDate: null,
        assigneeIds: [],
        priority: 'none',
        tagIds: [],
        note: '',
        subtasks: [],
      }
      return {
        ...d,
        tasks: [
          ...d.tasks.map((t) =>
            t.id === parentTaskId
              ? { ...t, subtasks: t.subtasks.filter((s) => s.id !== subtaskId) }
              : t
          ),
          newTask,
        ],
      }
    })
  }, [update])

  const demoteTaskToSubtask = useCallback((taskId, targetTaskId) => {
    update((d) => {
      const task = d.tasks.find((t) => t.id === taskId)
      if (!task) return d
      const subtask = { id: task.id, title: task.title, completed: task.completed }
      return {
        ...d,
        tasks: d.tasks
          .filter((t) => t.id !== taskId)
          .map((t) =>
            t.id === targetTaskId
              ? { ...t, subtasks: [...t.subtasks, subtask] }
              : t
          ),
      }
    })
  }, [update])

  return {
    data,
    undo,
    canUndo: state.history.length > 0,
    redo,
    canRedo: state.future.length > 0,
    replaceData,
    addTask,
    toggleTask,
    toggleImportant,
    deleteTask,
    deleteTasks,
    updateTask,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    addList,
    addGroup,
    deleteList,
    deleteGroup,
    moveList,
    moveListToGroup,
    moveTask,
    renameList,
    renameGroup,
    updateGroup,
    moveGroup,
    addPerson,
    deletePerson,
    renamePerson,
    updatePerson,
    addTag,
    deleteTag,
    renameTag,
    updateTag,
    updateSettings,
    promoteSubtask,
    demoteTaskToSubtask,
  }
}

const personColors = [
  '#0078d4', '#e74856', '#00cc6a', '#f7630c',
  '#8764b8', '#00b7c3', '#ff8c00', '#e81123',
  '#0099bc', '#7a7574', '#567c73', '#c30052',
]
let colorIndex = 0
function getPersonColor() {
  const c = personColors[colorIndex % personColors.length]
  colorIndex++
  return c
}

const tagColors = [
  '#0078d4', '#e74856', '#00cc6a', '#f7630c',
  '#8764b8', '#ffb900', '#00b7c3', '#c30052',
]
let tagColorIndex = 0
function getTagColor() {
  const c = tagColors[tagColorIndex % tagColors.length]
  tagColorIndex++
  return c
}
