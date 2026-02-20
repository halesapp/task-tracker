import { useState } from 'react'
import {
  Plus,
  ClipboardList,
  ChevronDown,
  ChevronUp,
  CalendarDays,
  Star,
  User,
  Play,
  Flag,
  Filter,
  X,
  AlertTriangle,
  Tag,
} from 'lucide-react'
import TaskItem from './TaskItem'

const PRIORITIES = [
  { value: 'none', label: 'None' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
]

export default function TaskListView({
  title,
  subtitle,
  tasks,
  accentColor,
  onAddTask,
  onToggleTask,
  onToggleImportant,
  onToggleSubtask,
  onSelectTask,
  selectedTaskId,
  showListName,
  lists,
  groups,
  people,
  tags,
  listId,
  onUpdateTask,
  onMoveTask,
  onMoveTaskToList,
  filters,
  onSetFilters,
  addTaskInputRef,
  defaultFiltersOpen = true,
  settings,
}) {
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [showCompleted, setShowCompleted] = useState(true)
  const [showOptional, setShowOptional] = useState(false)
  const [showFilters, setShowFilters] = useState(defaultFiltersOpen)
  const [selectedListId, setSelectedListId] = useState(listId || lists[0]?.id || '')
  const [dueDate, setDueDate] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [assigneeId, setAssigneeId] = useState('')
  const [important, setImportant] = useState(false)

  const activeTasks = tasks.filter((t) => !t.completed)
  const completedTasks = tasks.filter((t) => t.completed)

  const activeFilterCount = Object.values(filters || {}).filter(Boolean).length

  function handleAdd() {
    if (!newTaskTitle.trim()) return

    const targetList = listId || selectedListId
    if (!targetList) return

    const options = { listId: targetList }
    if (dueDate) options.dueDate = dueDate
    if (startDate) options.startDate = startDate
    if (endDate) options.endDate = endDate
    if (assigneeId) options.assigneeId = assigneeId
    if (important) options.important = true

    onAddTask(newTaskTitle.trim(), options)

    setNewTaskTitle('')
    setDueDate('')
    setStartDate('')
    setEndDate('')
    setAssigneeId('')
    setImportant(false)
    setShowOptional(false)
  }

  function getListName(task) {
    const list = lists?.find((l) => l.id === task.listId)
    return list?.name || ''
  }

  function setFilter(key, value) {
    onSetFilters({ ...filters, [key]: value || undefined })
  }

  function clearFilters() {
    onSetFilters({})
  }

  return (
    <>
      <div className="main-header">
        <h2 style={accentColor ? { color: accentColor } : undefined}>{title}</h2>
        {subtitle && <div className="subtitle">{subtitle}</div>}
      </div>

      {/* Filter bar */}
      <div className="filter-bar-container">
        <button
          className={`filter-toggle-btn ${activeFilterCount > 0 ? 'has-filters' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={14} />
          <span>Filter</span>
          {activeFilterCount > 0 && (
            <span className="filter-badge">{activeFilterCount}</span>
          )}
        </button>

        {activeFilterCount > 0 && (
          <button className="filter-clear-btn" onClick={clearFilters}>
            <X size={12} />
            Clear all
          </button>
        )}

        {/* Active filter chips */}
        {filters?.assigned && (
          <span className="filter-chip">
            {filters.assigned === 'assigned' ? 'Assigned' : 'Unassigned'}
            <button onClick={() => setFilter('assigned', null)}><X size={10} /></button>
          </span>
        )}
        {filters?.dated && (
          <span className="filter-chip">
            {filters.dated === 'dated' ? 'Has date' : 'No date'}
            <button onClick={() => setFilter('dated', null)}><X size={10} /></button>
          </span>
        )}
        {filters?.importance && (
          <span className="filter-chip">
            {filters.importance === 'important' ? 'Important' : 'Not important'}
            <button onClick={() => setFilter('importance', null)}><X size={10} /></button>
          </span>
        )}
        {filters?.completion && (
          <span className="filter-chip">
            {filters.completion === 'completed' ? 'Completed' : 'Active'}
            <button onClick={() => setFilter('completion', null)}><X size={10} /></button>
          </span>
        )}
        {filters?.priority && (
          <span className="filter-chip">
            Priority: {PRIORITIES.find((p) => p.value === filters.priority)?.label}
            <button onClick={() => setFilter('priority', null)}><X size={10} /></button>
          </span>
        )}
        {filters?.tagId && (
          <span className="filter-chip">
            Tag: {tags?.find((t) => t.id === filters.tagId)?.name || '?'}
            <button onClick={() => setFilter('tagId', null)}><X size={10} /></button>
          </span>
        )}
        {filters?.listId && (
          <span className="filter-chip">
            List: {lists.find((l) => l.id === filters.listId)?.name || '?'}
            <button onClick={() => setFilter('listId', null)}><X size={10} /></button>
          </span>
        )}
        {filters?.groupId && (
          <span className="filter-chip">
            Group: {groups?.find((g) => g.id === filters.groupId)?.name || '?'}
            <button onClick={() => setFilter('groupId', null)}><X size={10} /></button>
          </span>
        )}
        {filters?.personId && (
          <span className="filter-chip">
            Person: {people?.find((p) => p.id === filters.personId)?.name || '?'}
            <button onClick={() => setFilter('personId', null)}><X size={10} /></button>
          </span>
        )}
      </div>

      {showFilters && (
        <div className="filter-panel">
          <div className="filter-group">
            <div className="filter-label">Assignment</div>
            <div className="filter-options">
              <button
                className={`filter-option ${filters?.assigned === 'assigned' ? 'active' : ''}`}
                onClick={() => setFilter('assigned', filters?.assigned === 'assigned' ? null : 'assigned')}
              >
                <User size={13} /> Assigned
              </button>
              <button
                className={`filter-option ${filters?.assigned === 'unassigned' ? 'active' : ''}`}
                onClick={() => setFilter('assigned', filters?.assigned === 'unassigned' ? null : 'unassigned')}
              >
                <User size={13} /> Unassigned
              </button>
            </div>
          </div>

          <div className="filter-group">
            <div className="filter-label">Due date</div>
            <div className="filter-options">
              <button
                className={`filter-option ${filters?.dated === 'dated' ? 'active' : ''}`}
                onClick={() => setFilter('dated', filters?.dated === 'dated' ? null : 'dated')}
              >
                <CalendarDays size={13} /> Has date
              </button>
              <button
                className={`filter-option ${filters?.dated === 'undated' ? 'active' : ''}`}
                onClick={() => setFilter('dated', filters?.dated === 'undated' ? null : 'undated')}
              >
                <CalendarDays size={13} /> No date
              </button>
            </div>
          </div>

          <div className="filter-group">
            <div className="filter-label">Importance</div>
            <div className="filter-options">
              <button
                className={`filter-option ${filters?.importance === 'important' ? 'active' : ''}`}
                onClick={() => setFilter('importance', filters?.importance === 'important' ? null : 'important')}
              >
                <Star size={13} /> Important
              </button>
              <button
                className={`filter-option ${filters?.importance === 'not-important' ? 'active' : ''}`}
                onClick={() => setFilter('importance', filters?.importance === 'not-important' ? null : 'not-important')}
              >
                <Star size={13} /> Not important
              </button>
            </div>
          </div>

          <div className="filter-group">
            <div className="filter-label">Priority</div>
            <div className="filter-options">
              {PRIORITIES.filter((p) => p.value !== 'none').map((p) => (
                <button
                  key={p.value}
                  className={`filter-option ${filters?.priority === p.value ? 'active' : ''}`}
                  onClick={() => setFilter('priority', filters?.priority === p.value ? null : p.value)}
                >
                  <AlertTriangle size={13} /> {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <div className="filter-label">Status</div>
            <div className="filter-options">
              <button
                className={`filter-option ${filters?.completion === 'active' ? 'active' : ''}`}
                onClick={() => setFilter('completion', filters?.completion === 'active' ? null : 'active')}
              >
                Active
              </button>
              <button
                className={`filter-option ${filters?.completion === 'completed' ? 'active' : ''}`}
                onClick={() => setFilter('completion', filters?.completion === 'completed' ? null : 'completed')}
              >
                Completed
              </button>
            </div>
          </div>

          {tags && tags.length > 0 && (
            <div className="filter-group">
              <div className="filter-label">Tag</div>
              <div className="filter-options">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    className={`filter-option ${filters?.tagId === tag.id ? 'active' : ''}`}
                    onClick={() => setFilter('tagId', filters?.tagId === tag.id ? null : tag.id)}
                  >
                    <span className="filter-person-dot" style={{ background: tag.color }} />
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!listId && groups && groups.length > 0 && (
            <div className="filter-group">
              <div className="filter-label">Group</div>
              <div className="filter-options">
                {groups.map((g) => (
                  <button
                    key={g.id}
                    className={`filter-option ${filters?.groupId === g.id ? 'active' : ''}`}
                    onClick={() => setFilter('groupId', filters?.groupId === g.id ? null : g.id)}
                  >
                    {g.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!listId && lists.length > 1 && (
            <div className="filter-group">
              <div className="filter-label">List</div>
              <div className="filter-options">
                {lists.map((l) => (
                  <button
                    key={l.id}
                    className={`filter-option ${filters?.listId === l.id ? 'active' : ''}`}
                    onClick={() => setFilter('listId', filters?.listId === l.id ? null : l.id)}
                  >
                    {l.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {people && people.length > 0 && (
            <div className="filter-group">
              <div className="filter-label">Person</div>
              <div className="filter-options">
                {people.map((p) => (
                  <button
                    key={p.id}
                    className={`filter-option ${filters?.personId === p.id ? 'active' : ''}`}
                    onClick={() => setFilter('personId', filters?.personId === p.id ? null : p.id)}
                  >
                    <span className="filter-person-dot" style={{ background: p.color }} />
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {onAddTask && (
        <div className="add-task-container">
          <div className="add-task">
            <Plus size={20} className="plus-icon" />
            <input
              ref={addTaskInputRef}
              placeholder="Add a task"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAdd()
              }}
            />
            <button
              className="expand-btn"
              onClick={() => setShowOptional(!showOptional)}
              title="Show more options"
            >
              {showOptional ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>

          {showOptional && (
            <div className="add-task-options">
              {!listId && (
                <div className="option-row">
                  <label>List</label>
                  <select value={selectedListId} onChange={(e) => setSelectedListId(e.target.value)}>
                    {lists.map((l) => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="option-row">
                <label><CalendarDays size={14} /> Due date</label>
                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>

              <div className="option-row">
                <label><Play size={14} /> Start date</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>

              <div className="option-row">
                <label><Flag size={14} /> End date</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>

              {people && people.length > 0 && (
                <div className="option-row">
                  <label><User size={14} /> Assign to</label>
                  <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
                    <option value="">None</option>
                    {people.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="option-row">
                <label><Star size={14} /> Important</label>
                <button
                  className={`toggle-btn ${important ? 'active' : ''}`}
                  onClick={() => setImportant(!important)}
                >
                  {important ? 'Yes' : 'No'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="task-list">
        {activeTasks.length === 0 && completedTasks.length === 0 && (
          <div className="empty-state">
            <ClipboardList size={80} className="empty-icon" />
            <h3>{activeFilterCount > 0 ? 'No tasks match filters' : 'No tasks yet'}</h3>
            <p>{activeFilterCount > 0 ? 'Try adjusting your filters' : 'Add a task to get started'}</p>
          </div>
        )}

        {activeTasks.map((task, index) => (
          <TaskItem
            key={task.id}
            task={task}
            onToggle={onToggleTask}
            onToggleImportant={onToggleImportant}
            onToggleSubtask={onToggleSubtask}
            onClick={() => onSelectTask(task.id)}
            selected={selectedTaskId === task.id}
            showListName={showListName}
            listName={getListName(task)}
            tags={tags}
            people={people}
            settings={settings}
            onMoveUp={listId && index > 0 ? () => onMoveTask(task.id, -1) : null}
            onMoveDown={listId && index < activeTasks.length - 1 ? () => onMoveTask(task.id, 1) : null}
            lists={lists}
            onMoveTaskToList={onMoveTaskToList}
          />
        ))}

        {completedTasks.length > 0 && (
          <>
            <div
              className="task-section-label"
              onClick={() => setShowCompleted(!showCompleted)}
            >
              <ChevronDown size={14} className={`chevron ${!showCompleted ? 'collapsed' : ''}`} />
              Completed ({completedTasks.length})
            </div>
            {showCompleted &&
              completedTasks.map((task, index) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={onToggleTask}
                  onToggleImportant={onToggleImportant}
                  onClick={() => onSelectTask(task.id)}
                  selected={selectedTaskId === task.id}
                  showListName={showListName}
                  listName={getListName(task)}
                  tags={tags}
                  people={people}
                  settings={settings}
                  onMoveUp={listId && index > 0 ? () => onMoveTask(task.id, -1) : null}
                  onMoveDown={listId && index < completedTasks.length - 1 ? () => onMoveTask(task.id, 1) : null}
                  lists={lists}
                  onMoveTaskToList={onMoveTaskToList}
                />
              ))}
          </>
        )}
      </div>
    </>
  )
}
