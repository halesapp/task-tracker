import { useState } from 'preact/hooks'
import { parseDate } from '../utils/date'
import {
  X,
  Check,
  Star,
  Trash2,
  Plus,
  User,
  Play,
  Flag,
  Tag,
  AlertTriangle,
  ArrowUpRight,
  CornerDownRight,
} from 'lucide-preact'

const PRIORITIES = [
  { value: 'none', label: 'None', color: 'var(--text-tertiary)' },
  { value: 'low', label: 'Low', color: '#107c10' },
  { value: 'medium', label: 'Medium', color: '#ffb900' },
  { value: 'high', label: 'High', color: '#f7630c' },
]

export default function TaskDetail({
  task,
  onClose,
  onToggle,
  onToggleImportant,
  onUpdate,
  onDelete,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
  onPromoteSubtask,
  onDemoteTask,
  siblingTasks,
  people,
  tags,
  onAddTag,
}) {
  const [title, setTitle] = useState(task.title)
  const [note, setNote] = useState(task.note || '')
  const [subtaskInput, setSubtaskInput] = useState('')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showStartPicker, setShowStartPicker] = useState(false)
  const [showAssigneePicker, setShowAssigneePicker] = useState(false)
  const [showPriorityPicker, setShowPriorityPicker] = useState(false)
  const [showTagPicker, setShowTagPicker] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [showDemotePicker, setShowDemotePicker] = useState(false)

  function handleTitleBlur() {
    if (title.trim() && title !== task.title) {
      onUpdate(task.id, { title: title.trim() })
    }
  }

  function handleNoteBlur() {
    if (note !== task.note) {
      onUpdate(task.id, { note })
    }
  }

  function handleAddSubtask() {
    if (subtaskInput.trim()) {
      onAddSubtask(task.id, subtaskInput.trim())
      setSubtaskInput('')
    }
  }

  function toggleTag(tagId) {
    const current = task.tagIds || []
    const next = current.includes(tagId)
      ? current.filter((id) => id !== tagId)
      : [...current, tagId]
    onUpdate(task.id, { tagIds: next })
  }

  function handleCreateTag() {
    if (newTagName.trim()) {
      const tag = onAddTag(newTagName.trim())
      const current = task.tagIds || []
      onUpdate(task.id, { tagIds: [...current, tag.id] })
      setNewTagName('')
    }
  }

  const assignees = (task.assigneeIds || [])
    .map((id) => people.find((p) => p.id === id))
    .filter(Boolean)

  const currentPriority = PRIORITIES.find((p) => p.value === (task.priority || 'none'))
  const taskTags = (task.tagIds || [])
    .map((id) => tags.find((t) => t.id === id))
    .filter(Boolean)

  return (
    <div className="detail-panel">
      <div className="detail-header">
        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Task Details</span>
        <button className="detail-close" onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      <div className="detail-body">
        <div className="detail-task-title">
          <div
            className={`checkbox ${task.completed ? 'checked' : ''}`}
            onClick={() => onToggle(task.id)}
          >
            {task.completed && <Check size={12} strokeWidth={3} />}
          </div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
          />
          <button
            className={`task-important-btn ${task.important ? 'active' : ''}`}
            onClick={() => onToggleImportant(task.id)}
          >
            <Star size={18} fill={task.important ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* Subtasks */}
        <div className="subtask-section">
          <h4>Steps</h4>
          {task.subtasks.map((sub) => (
            <div key={sub.id} className="subtask-item">
              <div
                className={`checkbox ${sub.completed ? 'checked' : ''}`}
                onClick={() => onToggleSubtask(task.id, sub.id)}
              >
                {sub.completed && <Check size={10} strokeWidth={3} />}
              </div>
              <span className={`subtask-title ${sub.completed ? 'completed' : ''}`}>
                {sub.title}
              </span>
              <button
                className="delete-subtask"
                title="Promote to task"
                onClick={() => onPromoteSubtask(task.id, sub.id)}
              >
                <ArrowUpRight size={14} />
              </button>
              <button
                className="delete-subtask"
                onClick={() => onDeleteSubtask(task.id, sub.id)}
              >
                <X size={14} />
              </button>
            </div>
          ))}
          <div className="add-subtask">
            <Plus size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
            <input
              value={subtaskInput}
              onChange={(e) => setSubtaskInput(e.target.value)}
              placeholder="Add step"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddSubtask()
              }}
            />
          </div>
        </div>

        {/* Priority */}
        <div
          className={`detail-field ${task.priority && task.priority !== 'none' ? 'has-value' : ''}`}
          onClick={() => setShowPriorityPicker(!showPriorityPicker)}
          style={task.priority && task.priority !== 'none' ? { color: currentPriority.color } : undefined}
        >
          <span className="field-icon" style={task.priority && task.priority !== 'none' ? { color: currentPriority.color } : undefined}>
            <AlertTriangle size={18} />
          </span>
          <span>{task.priority && task.priority !== 'none' ? `Priority: ${currentPriority.label}` : 'Set priority'}</span>
          {task.priority && task.priority !== 'none' && (
            <button
              style={{ marginLeft: 'auto' }}
              onClick={(e) => {
                e.stopPropagation()
                onUpdate(task.id, { priority: 'none' })
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>
        {showPriorityPicker && (
          <div className="priority-picker">
            {PRIORITIES.map((p) => (
              <div
                key={p.value}
                className={`priority-option ${task.priority === p.value ? 'active' : ''}`}
                onClick={() => {
                  onUpdate(task.id, { priority: p.value })
                  setShowPriorityPicker(false)
                }}
              >
                <span className="priority-dot-lg" style={{ background: p.color }} />
                <span>{p.label}</span>
                {task.priority === p.value && (
                  <Check size={14} style={{ marginLeft: 'auto', color: 'var(--accent)' }} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Tags */}
        <div
          className={`detail-field ${taskTags.length > 0 ? 'has-value' : ''}`}
          onClick={() => setShowTagPicker(!showTagPicker)}
        >
          <span className="field-icon"><Tag size={18} /></span>
          <span>{taskTags.length > 0 ? `${taskTags.length} tag${taskTags.length > 1 ? 's' : ''}` : 'Add tags'}</span>
        </div>
        {taskTags.length > 0 && !showTagPicker && (
          <div className="detail-tags-display">
            {taskTags.map((tag) => (
              <span
                key={tag.id}
                className="tag-chip"
                style={{ background: tag.color + '22', color: tag.color }}
              >
                {tag.name}
                <button onClick={() => toggleTag(tag.id)}><X size={10} /></button>
              </span>
            ))}
          </div>
        )}
        {showTagPicker && (
          <div className="tag-picker">
            {tags.map((tag) => {
              const isSelected = (task.tagIds || []).includes(tag.id)
              return (
                <div
                  key={tag.id}
                  className={`tag-option ${isSelected ? 'active' : ''}`}
                  onClick={() => toggleTag(tag.id)}
                >
                  <span className="tag-dot" style={{ background: tag.color }} />
                  <span>{tag.name}</span>
                  {isSelected && <Check size={14} style={{ marginLeft: 'auto', color: 'var(--accent)' }} />}
                </div>
              )
            })}
            <div className="tag-create-row">
              <Plus size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
              <input
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Create new tag"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateTag()
                }}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        )}

        {/* Assignees */}
        <div
          className={`detail-field ${assignees.length > 0 ? 'has-value' : ''}`}
          onClick={() => setShowAssigneePicker(!showAssigneePicker)}
        >
          <span className="field-icon"><User size={18} /></span>
          {assignees.length > 0 ? (
            <span className="assignee-chips">
              {assignees.map((person) => (
                <span key={person.id} className="assignee-chip" style={{ background: person.color + '22', color: person.color }}>
                  {person.name}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onUpdate(task.id, { assigneeIds: (task.assigneeIds || []).filter((id) => id !== person.id) })
                    }}
                  >
                    <X size={10} />
                  </button>
                </span>
              ))}
            </span>
          ) : (
            <span>Assign to someone</span>
          )}
        </div>
        {showAssigneePicker && (
          <div className="assignee-picker">
            {people.length === 0 && (
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)', padding: '6px 0' }}>
                No people added yet. Add people from the People view.
              </div>
            )}
            {people.map((person) => {
              const isAssigned = (task.assigneeIds || []).includes(person.id)
              return (
                <div
                  key={person.id}
                  className="assignee-option"
                  onClick={() => {
                    const current = task.assigneeIds || []
                    const next = isAssigned
                      ? current.filter((id) => id !== person.id)
                      : [...current, person.id]
                    onUpdate(task.id, { assigneeIds: next })
                  }}
                >
                  <div className="person-avatar-sm" style={{ background: person.color }} data-tooltip={person.name}>
                    {person.name.charAt(0).toUpperCase()}
                  </div>
                  <span>{person.name}</span>
                  {isAssigned && (
                    <Check size={14} style={{ marginLeft: 'auto', color: 'var(--accent)' }} />
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Start date */}
        <div
          className={`detail-field ${task.startDate ? 'has-value' : ''}`}
          onClick={() => setShowStartPicker(!showStartPicker)}
        >
          <span className="field-icon"><Play size={18} /></span>
          <span>{task.startDate ? 'Start: ' + parseDate(task.startDate).toLocaleDateString() : 'Add start date'}</span>
          {task.startDate && (
            <button
              style={{ marginLeft: 'auto' }}
              onClick={(e) => {
                e.stopPropagation()
                onUpdate(task.id, { startDate: null })
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>
        {showStartPicker && (
          <div className="date-picker-inline">
            <input
              type="date"
              value={task.startDate ? task.startDate.split('T')[0] : ''}
              onChange={(e) => {
                const val = e.target.value || null
                const updates = { startDate: val }
                if (val && task.dueDate && val > task.dueDate.split('T')[0]) {
                  updates.dueDate = val
                }
                onUpdate(task.id, updates)
                setShowStartPicker(false)
              }}
            />
          </div>
        )}

        {/* End date */}
        <div
          className={`detail-field ${task.dueDate ? 'has-value' : ''}`}
          onClick={() => setShowDatePicker(!showDatePicker)}
        >
          <span className="field-icon"><Flag size={18} /></span>
          <span>{task.dueDate ? 'End: ' + parseDate(task.dueDate).toLocaleDateString() : 'Add end date'}</span>
          {task.dueDate && (
            <button
              style={{ marginLeft: 'auto' }}
              onClick={(e) => {
                e.stopPropagation()
                onUpdate(task.id, { dueDate: null })
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>
        {showDatePicker && (
          <div className="date-picker-inline">
            <input
              type="date"
              value={task.dueDate ? task.dueDate.split('T')[0] : ''}
              onChange={(e) => {
                const val = e.target.value || null
                const updates = { dueDate: val }
                if (val && task.startDate && val < task.startDate.split('T')[0]) {
                  updates.startDate = val
                }
                onUpdate(task.id, updates)
                setShowDatePicker(false)
              }}
            />
          </div>
        )}

        {/* Move to subtask of */}
        <div
          className="detail-field"
          onClick={() => setShowDemotePicker(!showDemotePicker)}
        >
          <span className="field-icon"><CornerDownRight size={18} /></span>
          <span>Move to subtask of…</span>
        </div>
        {showDemotePicker && (
          <div className="assignee-picker">
            {(!siblingTasks || siblingTasks.length === 0) ? (
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)', padding: '6px 0' }}>
                No other tasks in this list.
              </div>
            ) : (
              siblingTasks.map((t) => (
                <div
                  key={t.id}
                  className="assignee-option"
                  onClick={() => {
                    onDemoteTask(task.id, t.id)
                    setShowDemotePicker(false)
                  }}
                >
                  <div className={`checkbox ${t.completed ? 'checked' : ''}`} style={{ flexShrink: 0, pointerEvents: 'none' }}>
                    {t.completed && <Check size={10} strokeWidth={3} />}
                  </div>
                  <span>{t.title}</span>
                </div>
              ))
            )}
          </div>
        )}

        {/* Note */}
        <div className="detail-note">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onBlur={handleNoteBlur}
            placeholder="Add a note"
          />
        </div>
      </div>

      <div className="detail-footer">
        <span>Created {new Date(task.createdAt).toLocaleDateString()}</span>
        <button className="detail-delete" onClick={() => onDelete(task.id)}>
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  )
}
