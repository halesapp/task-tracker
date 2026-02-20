import { useState } from 'react'
import { Check, Star, CalendarDays, ListChecks, ArrowUp, ArrowDown, ChevronDown, List } from 'lucide-react'
import { format, isPast, isToday } from 'date-fns'
import { parseDate } from '../utils/date'
import ContextMenu from './ContextMenu'

const priorityColors = {
  low: '#107c10',
  medium: '#ffb900',
  high: '#f7630c',
}

export default function TaskItem({
  task,
  onToggle,
  onToggleImportant,
  onToggleSubtask,
  onClick,
  selected,
  showListName,
  listName,
  tags,
  people,
  settings,
  onMoveUp,
  onMoveDown,
  lists,
  onMoveTaskToList,
}) {
  const [subtasksExpanded, setSubtasksExpanded] = useState(false)
  const [ctxMenu, setCtxMenu] = useState(null)

  const completedSubtasks = task.subtasks.filter((s) => s.completed).length
  const totalSubtasks = task.subtasks.length
  const hasDueDate = !!task.dueDate
  const dueDate = hasDueDate ? parseDate(task.dueDate) : null
  const isOverdue = dueDate && isPast(dueDate) && !isToday(dueDate) && !task.completed
  const hasPriority = task.priority && task.priority !== 'none'
  const taskTags = (task.tagIds || [])
    .map((id) => tags?.find((t) => t.id === id))
    .filter(Boolean)
  const taskPeople = (task.assigneeIds || [])
    .map((id) => people?.find((p) => p.id === id))
    .filter(Boolean)

  const showDates = settings?.showDates !== false
  const showTags = settings?.showTags !== false
  const showPeople = settings?.showPeople !== false

  return (
    <div
      className={`task-item ${task.completed ? 'completed' : ''} ${selected ? 'selected' : ''}`}
      onClick={onClick}
      onContextMenu={(e) => {
        if (!lists?.length || !onMoveTaskToList) return
        e.preventDefault()
        setCtxMenu({ x: e.clientX, y: e.clientY })
      }}
    >
      {hasPriority && (
        <div
          className="task-priority-bar"
          style={{ background: priorityColors[task.priority] }}
        />
      )}

      <div
        className={`checkbox ${task.completed ? 'checked' : ''}`}
        onClick={(e) => {
          e.stopPropagation()
          onToggle(task.id)
        }}
      >
        {task.completed && <Check size={12} strokeWidth={3} />}
      </div>

      <div className="task-content">
        <div className="task-title">{task.title}</div>
        <div className="task-meta">
          {showListName && listName && (
            <span className="list-tag">{listName}</span>
          )}
          {hasPriority && (
            <span className="priority-tag" style={{ color: priorityColors[task.priority] }}>
              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
            </span>
          )}
          {showDates && hasDueDate && (
            <span className={`due-tag ${isOverdue ? 'overdue' : ''}`}>
              <CalendarDays size={11} />
              {isToday(dueDate) ? 'Today' : format(dueDate, 'MMM d')}
            </span>
          )}
          {totalSubtasks > 0 && (
            <button
              className="subtask-count-btn"
              onClick={(e) => {
                e.stopPropagation()
                setSubtasksExpanded((v) => !v)
              }}
            >
              <ListChecks size={11} />
              {completedSubtasks}/{totalSubtasks}
              <ChevronDown size={10} className={`subtask-chevron ${subtasksExpanded ? 'expanded' : ''}`} />
            </button>
          )}
          {showTags && taskTags.map((tag) => (
            <span
              key={tag.id}
              className="task-tag-chip"
              style={{ background: tag.color + '22', color: tag.color }}
            >
              {tag.name}
            </span>
          ))}
          {showPeople && taskPeople.length > 0 && (
            <span className="task-assignees">
              {taskPeople.slice(0, 3).map((person) => (
                <span
                  key={person.id}
                  className="task-assignee-dot"
                  style={{ background: person.color }}
                  data-tooltip={person.name}
                >
                  {person.name.charAt(0).toUpperCase()}
                </span>
              ))}
            </span>
          )}
        </div>

        {subtasksExpanded && totalSubtasks > 0 && (
          <div className="task-subtask-list" onClick={(e) => e.stopPropagation()}>
            {task.subtasks.map((sub) => (
              <div
                key={sub.id}
                className={`task-subtask-item ${sub.completed ? 'completed' : ''}`}
                onClick={() => onToggleSubtask?.(task.id, sub.id)}
              >
                <div className={`subtask-checkbox ${sub.completed ? 'checked' : ''}`}>
                  {sub.completed && <Check size={10} strokeWidth={3} />}
                </div>
                <span>{sub.title}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {(onMoveUp || onMoveDown) && (
        <span className="task-reorder-btns">
          <button
            className="group-reorder-btn"
            disabled={!onMoveUp}
            onClick={(e) => { e.stopPropagation(); onMoveUp?.() }}
            title="Move up"
          >
            <ArrowUp size={12} />
          </button>
          <button
            className="group-reorder-btn"
            disabled={!onMoveDown}
            onClick={(e) => { e.stopPropagation(); onMoveDown?.() }}
            title="Move down"
          >
            <ArrowDown size={12} />
          </button>
        </span>
      )}

      <button
        className={`task-important-btn ${task.important ? 'active' : ''}`}
        onClick={(e) => {
          e.stopPropagation()
          onToggleImportant(task.id)
        }}
      >
        <Star size={16} fill={task.important ? 'currentColor' : 'none'} />
      </button>

      {ctxMenu && lists?.length > 0 && (
        <ContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          items={[
            {
              label: 'Move to list',
              icon: <List size={14} />,
              submenu: lists.map((l) => ({
                label: l.name,
                check: l.id === task.listId,
                onClick: () => onMoveTaskToList(task.id, l.id),
              })),
            },
          ]}
          onClose={() => setCtxMenu(null)}
        />
      )}
    </div>
  )
}
