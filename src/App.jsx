import { useState, useMemo, useRef, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import TaskListView from './components/TaskListView'
import TaskDetail from './components/TaskDetail'
import CalendarView from './components/CalendarView'
import PeopleView from './components/PeopleView'
import GanttView from './components/GanttView'
import PriorityView from './components/PriorityView'
import DeleteAllModal from './components/DeleteAllModal'
import SearchOverlay from './components/SearchOverlay'
import SyncPanel from './components/SyncPanel'
import TagsView from './components/TagsView'
import { useStore } from './hooks/useStore'
import { useSync } from './hooks/useSync'
import { Download, Upload } from 'lucide-react'

function loadDarkMode() {
  try {
    const stored = localStorage.getItem('todo-dark-mode')
    if (stored !== null) return stored === 'true'
    return false // light mode by default
  } catch {
    return true
  }
}

export default function App() {
  const store = useStore()
  const { data } = store
  const [activeView, setActiveView] = useState('_all')
  const [selectedTaskId, setSelectedTaskId] = useState(null)
  const [calendarSelectedDate, setCalendarSelectedDate] = useState(null)
  const [filters, setFilters] = useState({})
  const [showSearch, setShowSearch] = useState(false)
  const [showSync, setShowSync] = useState(false)
  const [showDeleteAll, setShowDeleteAll] = useState(false)
  const [darkMode, setDarkMode] = useState(loadDarkMode)
  const sync = useSync(data)
  const fileInputRef = useRef(null)
  const addTaskInputRef = useRef(null)

  const selectedTask = data.tasks.find((t) => t.id === selectedTaskId) || null

  // Apply dark mode class
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    localStorage.setItem('todo-dark-mode', darkMode)
  }, [darkMode])

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e) {
      // Ctrl+K or Cmd+K for search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setShowSearch(true)
      }
      // Ctrl+S or Cmd+S for immediate sync
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (sync.isConfigured) {
          sync.syncNow(data)
        }
      }
      // Ctrl+N or Cmd+N for new task
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault()
        addTaskInputRef.current?.focus()
      }
      // Escape to close panels
      if (e.key === 'Escape') {
        if (showSearch) {
          setShowSearch(false)
        } else if (selectedTaskId) {
          setSelectedTaskId(null)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showSearch, selectedTaskId, sync, data])

  const taskCounts = useMemo(() => {
    const counts = {}
    const incomplete = data.tasks.filter((t) => !t.completed)

    counts['_all'] = incomplete.length
    counts['_important'] = incomplete.filter((t) => t.important).length
    counts['_planned'] = incomplete.filter((t) => t.dueDate).length
    counts['_priority'] = incomplete.filter((t) => t.priority && t.priority !== 'none').length
    counts['_people'] = data.people?.length || 0
    counts['_gantt'] = data.tasks.filter((t) => t.startDate && t.endDate).length

    data.lists.forEach((list) => {
      counts[list.id] = incomplete.filter((t) => t.listId === list.id).length
    })

    return counts
  }, [data.tasks, data.lists, data.people])

  function getViewTasks() {
    let tasks
    switch (activeView) {
      case '_all':
        tasks = [...data.tasks]
        break
      case '_important':
        tasks = data.tasks.filter((t) => t.important)
        break
      case '_planned':
        tasks = data.tasks.filter((t) => t.dueDate)
        break
      case '_priority':
        tasks = data.tasks.filter((t) => t.priority && t.priority !== 'none')
        break
      case '_calendar':
      case '_gantt':
        tasks = [...data.tasks]
        break
      default:
        tasks = data.tasks.filter((t) => t.listId === activeView)
        break
    }

    // Apply filters
    if (filters.assigned === 'assigned') {
      tasks = tasks.filter((t) => t.assigneeIds?.length > 0)
    } else if (filters.assigned === 'unassigned') {
      tasks = tasks.filter((t) => !t.assigneeIds?.length)
    }

    if (filters.dated === 'dated') {
      tasks = tasks.filter((t) => t.dueDate)
    } else if (filters.dated === 'undated') {
      tasks = tasks.filter((t) => !t.dueDate)
    }

    if (filters.importance === 'important') {
      tasks = tasks.filter((t) => t.important)
    } else if (filters.importance === 'not-important') {
      tasks = tasks.filter((t) => !t.important)
    }

    if (filters.listId) {
      tasks = tasks.filter((t) => t.listId === filters.listId)
    }

    if (filters.groupId) {
      const group = data.groups.find((g) => g.id === filters.groupId)
      if (group) {
        const listIds = new Set(group.listIds)
        tasks = tasks.filter((t) => listIds.has(t.listId))
      }
    }

    if (filters.personId) {
      tasks = tasks.filter((t) => (t.assigneeIds || []).includes(filters.personId))
    }

    if (filters.completion === 'completed') {
      tasks = tasks.filter((t) => t.completed)
    } else if (filters.completion === 'active') {
      tasks = tasks.filter((t) => !t.completed)
    }

    if (filters.priority) {
      tasks = tasks.filter((t) => (t.priority || 'none') === filters.priority)
    }

    if (filters.tagId) {
      tasks = tasks.filter((t) => (t.tagIds || []).includes(filters.tagId))
    }

    return tasks
  }

  function getViewTitle() {
    switch (activeView) {
      case '_all': return 'All Tasks'
      case '_important': return 'Important'
      case '_planned': return 'Planned'
      case '_priority': return 'Priority'
      case '_calendar': return 'Calendar'
      case '_people': return 'People'
      case '_gantt': return 'Gantt Chart'
      case '_tags': return 'Tags'
      default: {
        const list = data.lists.find((l) => l.id === activeView)
        return list?.name || 'Tasks'
      }
    }
  }

  function getViewSubtitle() {
    if (activeView === '_all') {
      return new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      })
    }
    return null
  }

  function getAccentColor() {
    switch (activeView) {
      case '_all': return '#2564cf'
      case '_important': return '#d13438'
      case '_planned': return '#107c10'
      case '_priority': return '#f7630c'
      case '_calendar': return '#8764b8'
      case '_people': return '#0078d4'
      case '_gantt': return '#e74856'
      case '_tags': return '#8764b8'
      default: {
        const list = data.lists.find((l) => l.id === activeView)
        return list?.color || '#2564cf'
      }
    }
  }

  function handleAddTask(title, options = {}) {
    const targetListId = options.listId ||
      (activeView.startsWith('_') ? data.lists[0]?.id : activeView)

    if (!targetListId) return

    const task = store.addTask(targetListId, title)
    const updates = {}

    if (options.dueDate) updates.dueDate = options.dueDate
    if (options.startDate) updates.startDate = options.startDate
    if (options.endDate) updates.endDate = options.endDate
    if (options.assigneeId) updates.assigneeIds = [options.assigneeId]
    if (options.important) updates.important = true
    if (options.priority) updates.priority = options.priority

    if (activeView === '_important') {
      updates.important = true
    }
    if (activeView === '_planned' && !updates.dueDate) {
      updates.dueDate = new Date().toISOString()
    }

    if (Object.keys(updates).length > 0) {
      store.updateTask(task.id, updates)
    }
  }

  function handleDeleteTask(taskId) {
    store.deleteTask(taskId)
    setSelectedTaskId(null)
  }

  function handleDeleteList(listId) {
    store.deleteList(listId)
    if (activeView === listId) {
      setActiveView('_all')
      setSelectedTaskId(null)
      setFilters({})
    }
  }

  function handleDeleteGroup(groupId) {
    const group = data.groups.find((g) => g.id === groupId)
    store.deleteGroup(groupId)
    if (group && group.listIds.includes(activeView)) {
      setActiveView('_all')
      setSelectedTaskId(null)
      setFilters({})
    }
  }

  function handleSearchSelect(taskId) {
    setSelectedTaskId(taskId)
  }

  async function handleSyncPush() {
    await sync.push(data)
  }

  async function handleSyncPull() {
    const pulled = await sync.pull()
    if (pulled) {
      localStorage.setItem('todo-app-data', JSON.stringify(pulled))
      window.location.reload()
    }
  }

  function handleDeleteAll() {
    localStorage.removeItem('todo-app-data')
    window.location.reload()
  }

  function handleExport() {
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `todo-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImport(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target.result)
        if (!(imported.groups && imported.lists && imported.tasks)) {
          alert('Invalid backup file format')
          return
        }

        if (sync.isConfigured) {
          const hasExistingTasks = data.tasks.length > 0
          const msg = hasExistingTasks
            ? 'You have a cloud sync connection and existing tasks.\n\n' +
              '• This will OVERWRITE all local tasks with the imported file.\n' +
              '• The imported data will auto-sync to your database on the next sync cycle, replacing what\'s there.\n\n' +
              'If you want to MERGE tasks instead, cancel and manually add them.\n\n' +
              'Continue with overwrite?'
            : 'You have a cloud sync connection.\n\n' +
              'The imported data will auto-sync to your database on the next sync cycle.\n\n' +
              'Continue?'
          if (!confirm(msg)) return
        }

        localStorage.setItem('todo-app-data', JSON.stringify(imported))
        window.location.reload()
      } catch {
        alert('Failed to parse backup file')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const viewTasks = getViewTasks()
  const isCalendar = activeView === '_calendar'
  const isPeople = activeView === '_people'
  const isGantt = activeView === '_gantt'
  const isPriority = activeView === '_priority'
  const isTags = activeView === '_tags'

  return (
    <div className="app">
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleImport}
        style={{ display: 'none' }}
      />
      <Sidebar
        data={data}
        activeView={activeView}
        onSelectView={(view) => {
          setActiveView(view)
          setSelectedTaskId(null)
          setCalendarSelectedDate(null)
          setFilters({})
        }}
        onAddList={store.addList}
        onAddGroup={store.addGroup}
        onRenameList={store.renameList}
        onRenameGroup={store.renameGroup}
        onMoveGroup={store.moveGroup}
        onMoveList={store.moveList}
        onDeleteList={handleDeleteList}
        onDeleteGroup={handleDeleteGroup}
        taskCounts={taskCounts}
        onOpenSearch={() => setShowSearch(true)}
        onOpenSync={() => setShowSync(true)}
        syncConnected={sync.isConfigured}
        syncStatus={sync.syncStatus}
        connectionOk={sync.connectionOk}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode((d) => !d)}
        onDeleteAll={() => setShowDeleteAll(true)}
      />

      <div className="main">
        {isCalendar ? (
          <>
            <div className="main-header">
              <h2 style={{ color: getAccentColor() }}>Calendar</h2>
            </div>
            <CalendarView
              tasks={data.tasks}
              onSelectDate={(d) => setCalendarSelectedDate(d)}
            />
          </>
        ) : isPeople ? (
          <>
            <div className="main-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ color: getAccentColor() }}>People</h2>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="toolbar-btn" onClick={handleExport} title="Export data">
                  <Download size={16} />
                  <span>Export</span>
                </button>
                <button className="toolbar-btn" onClick={() => fileInputRef.current?.click()} title="Import data">
                  <Upload size={16} />
                  <span>Import</span>
                </button>
              </div>
            </div>
            <PeopleView
              people={data.people || []}
              groups={data.groups}
              lists={data.lists}
              tasks={data.tasks}
              onAddPerson={store.addPerson}
              onDeletePerson={store.deletePerson}
              onRenamePerson={store.renamePerson}
              onSelectView={setActiveView}
            />
          </>
        ) : isPriority ? (
          <>
            <div className="main-header">
              <h2 style={{ color: getAccentColor() }}>Priority</h2>
            </div>
            <PriorityView
              tasks={data.tasks}
              onToggleTask={store.toggleTask}
              onToggleImportant={store.toggleImportant}
              onSelectTask={setSelectedTaskId}
              selectedTaskId={selectedTaskId}
              lists={data.lists}
              tags={data.tags || []}
            />
          </>
        ) : isTags ? (
          <>
            <div className="main-header">
              <h2 style={{ color: getAccentColor() }}>Tags</h2>
            </div>
            <TagsView
              tags={data.tags || []}
              tasks={data.tasks}
              onAddTag={store.addTag}
              onDeleteTag={store.deleteTag}
              onRenameTag={store.renameTag}
              onUpdateTag={store.updateTag}
            />
          </>
        ) : isGantt ? (
          <>
            <div className="main-header">
              <h2 style={{ color: getAccentColor() }}>Gantt Chart</h2>
            </div>
            <GanttView
              tasks={viewTasks}
              lists={data.lists}
              people={data.people || []}
              onSelectTask={setSelectedTaskId}
            />
          </>
        ) : (
          <TaskListView
            key={activeView}
            title={getViewTitle()}
            subtitle={getViewSubtitle()}
            accentColor={getAccentColor()}
            tasks={viewTasks}
            onAddTask={handleAddTask}
            onToggleTask={store.toggleTask}
            onToggleImportant={store.toggleImportant}
            onToggleSubtask={store.toggleSubtask}
            onSelectTask={setSelectedTaskId}
            selectedTaskId={selectedTaskId}
            showListName={activeView.startsWith('_')}
            lists={data.lists}
            groups={data.groups}
            people={data.people || []}
            tags={data.tags || []}
            listId={activeView.startsWith('_') ? null : activeView}
            onUpdateTask={store.updateTask}
            onMoveTask={store.moveTask}
            filters={filters}
            onSetFilters={setFilters}
            addTaskInputRef={addTaskInputRef}
            defaultFiltersOpen={activeView !== '_important' && activeView !== '_planned'}
          />
        )}
      </div>

      {selectedTask && (
        <TaskDetail
          key={selectedTask.id}
          task={selectedTask}
          onClose={() => setSelectedTaskId(null)}
          onToggle={store.toggleTask}
          onToggleImportant={store.toggleImportant}
          onUpdate={store.updateTask}
          onDelete={handleDeleteTask}
          onAddSubtask={store.addSubtask}
          onToggleSubtask={store.toggleSubtask}
          onDeleteSubtask={store.deleteSubtask}
          people={data.people || []}
          tags={data.tags || []}
          onAddTag={store.addTag}
        />
      )}

      {showSearch && (
        <SearchOverlay
          tasks={data.tasks}
          lists={data.lists}
          tags={data.tags || []}
          onSelect={handleSearchSelect}
          onClose={() => setShowSearch(false)}
        />
      )}

      {showDeleteAll && (
        <DeleteAllModal
          onConfirm={handleDeleteAll}
          onClose={() => setShowDeleteAll(false)}
        />
      )}

      {showSync && (
        <div className="search-overlay" onClick={() => setShowSync(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ paddingTop: 80 }}>
            <SyncPanel
              syncing={sync.syncing}
              lastSynced={sync.lastSynced}
              syncError={sync.syncError}
              isConfigured={sync.isConfigured}
              onSaveCredentials={sync.saveCredentials}
              onClearCredentials={sync.clearCredentials}
              onPush={handleSyncPush}
              onPull={handleSyncPull}
              onExport={handleExport}
              fileInputRef={fileInputRef}
              onClose={() => setShowSync(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
