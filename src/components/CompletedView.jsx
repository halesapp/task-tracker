import { useState, useMemo } from 'react'
import { Check, Trash2, CheckSquare, Square } from 'lucide-react'
import { parseDate } from '../utils/date'
import { format } from 'date-fns'

export default function CompletedView({ tasks, lists, onDeleteTasks, onSelectTask }) {
  const [selected, setSelected] = useState(new Set())

  const completedTasks = useMemo(
    () => tasks.filter((t) => t.completed),
    [tasks]
  )

  function getListName(task) {
    return lists.find((l) => l.id === task.listId)?.name || ''
  }

  function getListColor(task) {
    return lists.find((l) => l.id === task.listId)?.color || 'var(--accent)'
  }

  function toggleSelect(taskId) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(taskId)) next.delete(taskId)
      else next.add(taskId)
      return next
    })
  }

  function toggleSelectAll() {
    if (selected.size === completedTasks.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(completedTasks.map((t) => t.id)))
    }
  }

  function handleDeleteSelected() {
    onDeleteTasks([...selected])
    setSelected(new Set())
  }

  const allSelected = completedTasks.length > 0 && selected.size === completedTasks.length
  const someSelected = selected.size > 0

  return (
    <div className="completed-view">
      <div className="completed-toolbar">
        <button
          className={`completed-select-all ${allSelected ? 'active' : ''}`}
          onClick={toggleSelectAll}
          title={allSelected ? 'Deselect all' : 'Select all'}
        >
          {allSelected ? <CheckSquare size={16} /> : <Square size={16} />}
          <span>{allSelected ? 'Deselect all' : 'Select all'}</span>
        </button>

        {someSelected && (
          <button
            className="completed-delete-btn"
            onClick={handleDeleteSelected}
          >
            <Trash2 size={15} />
            <span>Delete {selected.size === completedTasks.length ? 'all' : selected.size}</span>
          </button>
        )}
      </div>

      {completedTasks.length === 0 ? (
        <div className="empty-state">
          <Check size={80} className="empty-icon" style={{ opacity: 0.15 }} />
          <h3>No completed tasks</h3>
          <p>Completed tasks will appear here</p>
        </div>
      ) : (
        <div className="completed-list">
          {completedTasks.map((task) => {
            const isSelected = selected.has(task.id)
            const listName = getListName(task)
            const listColor = getListColor(task)
            return (
              <div
                key={task.id}
                className={`completed-item ${isSelected ? 'selected' : ''}`}
                onClick={() => onSelectTask(task.id)}
              >
                <div
                  className="completed-item-check"
                  onClick={(e) => { e.stopPropagation(); toggleSelect(task.id) }}
                >
                  {isSelected
                    ? <CheckSquare size={16} style={{ color: 'var(--accent)' }} />
                    : <Square size={16} />
                  }
                </div>
                <div
                  className="checkbox checked"
                  style={{ flexShrink: 0, pointerEvents: 'none' }}
                >
                  <Check size={12} strokeWidth={3} />
                </div>
                <div className="completed-item-body">
                  <span className="completed-item-title">{task.title}</span>
                  <div className="completed-item-meta">
                    {listName && (
                      <span className="list-tag" style={{ color: listColor }}>
                        {listName}
                      </span>
                    )}
                    {task.dueDate && (
                      <span className="due-tag">
                        {format(parseDate(task.dueDate), 'MMM d')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
