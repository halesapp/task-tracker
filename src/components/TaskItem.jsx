import { Check, Star, CalendarDays, ListChecks } from 'lucide-react'
import { format, isPast, isToday } from 'date-fns'

const priorityColors = {
  low: '#107c10',
  medium: '#ffb900',
  high: '#f7630c',
}

export default function TaskItem({
  task,
  onToggle,
  onToggleImportant,
  onClick,
  selected,
  showListName,
  listName,
  tags,
}) {
  const completedSubtasks = task.subtasks.filter((s) => s.completed).length
  const totalSubtasks = task.subtasks.length
  const hasDueDate = !!task.dueDate
  const dueDate = hasDueDate ? new Date(task.dueDate) : null
  const isOverdue = dueDate && isPast(dueDate) && !isToday(dueDate) && !task.completed
  const hasPriority = task.priority && task.priority !== 'none'
  const taskTags = (task.tagIds || [])
    .map((id) => tags?.find((t) => t.id === id))
    .filter(Boolean)

  return (
    <div
      className={`task-item ${task.completed ? 'completed' : ''} ${selected ? 'selected' : ''}`}
      onClick={onClick}
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
          {hasDueDate && (
            <span className={`due-tag ${isOverdue ? 'overdue' : ''}`}>
              <CalendarDays size={11} />
              {isToday(dueDate) ? 'Today' : format(dueDate, 'MMM d')}
            </span>
          )}
          {totalSubtasks > 0 && (
            <span className="subtask-count">
              <ListChecks size={11} />
              {completedSubtasks}/{totalSubtasks}
            </span>
          )}
          {taskTags.map((tag) => (
            <span
              key={tag.id}
              className="task-tag-chip"
              style={{ background: tag.color + '22', color: tag.color }}
            >
              {tag.name}
            </span>
          ))}
        </div>
      </div>

      <button
        className={`task-important-btn ${task.important ? 'active' : ''}`}
        onClick={(e) => {
          e.stopPropagation()
          onToggleImportant(task.id)
        }}
      >
        <Star size={16} fill={task.important ? 'currentColor' : 'none'} />
      </button>
    </div>
  )
}
