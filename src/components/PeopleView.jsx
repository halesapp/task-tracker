import { useState } from 'react'
import { Plus, Trash2, Users, ChevronDown, User } from 'lucide-react'

export default function PeopleView({
  people,
  groups,
  lists,
  tasks,
  onAddPerson,
  onDeletePerson,
  onRenamePerson,
  onSelectView,
}) {
  const [newName, setNewName] = useState('')
  const [expandedPeople, setExpandedPeople] = useState({})

  function handleAdd() {
    if (newName.trim()) {
      onAddPerson(newName.trim())
      setNewName('')
    }
  }

  function toggleExpand(personId) {
    setExpandedPeople((prev) => ({ ...prev, [personId]: !prev[personId] }))
  }

  function getPersonGroups(personId) {
    return groups.filter((g) => g.personId === personId)
  }

  function getPersonTasks(personId) {
    return tasks.filter((t) => (t.assigneeIds || []).includes(personId))
  }

  function getGroupLists(group) {
    return group.listIds.map((id) => lists.find((l) => l.id === id)).filter(Boolean)
  }

  return (
    <div style={{ padding: '0 32px 32px' }}>
      <div className="add-task" style={{ margin: '0 0 24px' }}>
        <Plus size={20} className="plus-icon" />
        <input
          placeholder="Add a person"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
      </div>

      {people.length === 0 && (
        <div className="empty-state">
          <Users size={80} className="empty-icon" />
          <h3>No people yet</h3>
          <p>Add people to assign task groups and track work</p>
        </div>
      )}

      {people.map((person) => {
        const personGroups = getPersonGroups(person.id)
        const personTasks = getPersonTasks(person.id)
        const expanded = expandedPeople[person.id] !== false

        return (
          <div key={person.id} className="person-card">
            <div className="person-card-header" onClick={() => toggleExpand(person.id)}>
              <div className="person-avatar" style={{ background: person.color }}>
                {person.name.charAt(0).toUpperCase()}
              </div>
              <div className="person-info">
                <div className="person-name">{person.name}</div>
                <div className="person-stats">
                  {personGroups.length} group{personGroups.length !== 1 ? 's' : ''}
                  {' \u00b7 '}
                  {personTasks.length} task{personTasks.length !== 1 ? 's' : ''} assigned
                </div>
              </div>
              <ChevronDown
                size={16}
                style={{
                  transition: 'transform 0.15s',
                  transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                  color: 'var(--text-tertiary)',
                }}
              />
              <button
                className="detail-delete"
                onClick={(e) => {
                  e.stopPropagation()
                  onDeletePerson(person.id)
                }}
              >
                <Trash2 size={14} />
              </button>
            </div>

            {expanded && (
              <div className="person-card-body">
                {personGroups.length > 0 && (
                  <div className="person-groups">
                    <div className="person-section-label">Assigned Groups</div>
                    {personGroups.map((group) => (
                      <div key={group.id} className="person-group-item">
                        <span className="person-group-name">{group.name}</span>
                        <span className="person-group-lists">
                          {getGroupLists(group).map((l) => l.name).join(', ') || 'No lists'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {personTasks.length > 0 && (
                  <div className="person-tasks">
                    <div className="person-section-label">Assigned Tasks</div>
                    {personTasks.slice(0, 5).map((task) => (
                      <div key={task.id} className="person-task-item">
                        <div
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: task.completed ? 'var(--completed)' : 'var(--accent)',
                            flexShrink: 0,
                          }}
                        />
                        <span style={{
                          textDecoration: task.completed ? 'line-through' : 'none',
                          color: task.completed ? 'var(--completed)' : 'var(--text-primary)',
                        }}>
                          {task.title}
                        </span>
                      </div>
                    ))}
                    {personTasks.length > 5 && (
                      <div style={{ fontSize: 12, color: 'var(--text-tertiary)', paddingLeft: 14 }}>
                        +{personTasks.length - 5} more
                      </div>
                    )}
                  </div>
                )}

                {personGroups.length === 0 && personTasks.length === 0 && (
                  <div style={{ fontSize: 13, color: 'var(--text-tertiary)', padding: '8px 0' }}>
                    No groups or tasks assigned yet
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
