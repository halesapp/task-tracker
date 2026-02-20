import { useState } from 'react'
import { ChevronDown, ClipboardList } from 'lucide-react'
import TaskItem from './TaskItem'

const SECTIONS = [
  { value: 'high',   label: 'High',   color: '#d13438' },
  { value: 'medium', label: 'Medium', color: '#f7630c' },
  { value: 'low',    label: 'Low',    color: '#107c10' },
]

export default function PriorityView({
  tasks,
  onToggleTask,
  onToggleImportant,
  onSelectTask,
  selectedTaskId,
  lists,
  tags,
  people,
  settings,
}) {
  const [collapsed, setCollapsed] = useState({})

  function toggle(value) {
    setCollapsed((prev) => ({ ...prev, [value]: !prev[value] }))
  }

  function getListName(task) {
    return lists?.find((l) => l.id === task.listId)?.name || ''
  }

  const activeTasks = tasks.filter((t) => !t.completed && ['low', 'medium', 'high'].includes(t.priority))
  const isEmpty = activeTasks.length === 0

  return (
    <div className="task-list">
      {isEmpty && (
        <div className="empty-state">
          <ClipboardList size={80} className="empty-icon" />
          <h3>No priority tasks</h3>
          <p>Assign a Low, Medium, or High priority to tasks to see them here</p>
        </div>
      )}

      {SECTIONS.map(({ value, label, color }) => {
        const sectionTasks = activeTasks.filter((t) => t.priority === value)
        if (sectionTasks.length === 0) return null
        const isCollapsed = collapsed[value]

        return (
          <div key={value} className="priority-section">
            <div
              className="task-section-label priority-section-label"
              onClick={() => toggle(value)}
              style={{ '--section-color': color }}
            >
              <ChevronDown size={14} className={`chevron ${isCollapsed ? 'collapsed' : ''}`} />
              <span className="priority-section-dot" style={{ background: color }} />
              {label} ({sectionTasks.length})
            </div>
            {!isCollapsed && sectionTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={onToggleTask}
                onToggleImportant={onToggleImportant}
                onClick={() => onSelectTask(task.id)}
                selected={selectedTaskId === task.id}
                showListName
                listName={getListName(task)}
                tags={tags}
                people={people}
                settings={settings}
              />
            ))}
          </div>
        )
      })}
    </div>
  )
}
