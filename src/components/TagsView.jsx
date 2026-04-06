import { useState } from 'preact/hooks'
import { Plus, Trash2, Tag } from 'lucide-preact'

export default function TagsView({ tags, tasks, onAddTag, onDeleteTag, onRenameTag, onUpdateTag }) {
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState('#788CDE')
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')

  function handleAdd() {
    if (newName.trim()) {
      onAddTag(newName.trim(), newColor)
      setNewName('')
    }
  }

  function getTaskCount(tagId) {
    return tasks.filter((t) => (t.tagIds || []).includes(tagId)).length
  }

  return (
    <div style={{ padding: '0 32px 32px' }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, alignItems: 'center' }}>
        <input
          type="color"
          value={newColor}
          onChange={(e) => setNewColor(e.target.value)}
          className="tag-color-input"
          title="Pick color for new tag"
        />
        <div className="add-task" style={{ flex: 1, margin: 0 }}>
          <Plus size={20} className="plus-icon" />
          <input
            placeholder="Add a tag"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
        </div>
      </div>

      {tags.length === 0 && (
        <div className="empty-state">
          <Tag size={80} className="empty-icon" />
          <h3>No tags yet</h3>
          <p>Add tags to organize and filter your tasks</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {tags.map((tag) => {
          const count = getTaskCount(tag.id)
          const isEditing = editingId === tag.id

          return (
            <div key={tag.id} className="tag-manage-row">
              <input
                type="color"
                value={tag.color}
                onChange={(e) => onUpdateTag(tag.id, { color: e.target.value })}
                className="tag-color-input"
                title="Change color"
              />
              {isEditing ? (
                <input
                  className="tag-name-edit"
                  value={editName}
                  autoFocus
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (editName.trim()) onRenameTag(tag.id, editName.trim())
                      setEditingId(null)
                    }
                    if (e.key === 'Escape') setEditingId(null)
                  }}
                  onBlur={() => {
                    if (editName.trim()) onRenameTag(tag.id, editName.trim())
                    setEditingId(null)
                  }}
                />
              ) : (
                <span
                  className="tag-manage-name"
                  onDoubleClick={() => { setEditingId(tag.id); setEditName(tag.name) }}
                  title="Double-click to rename"
                >
                  {tag.name}
                </span>
              )}
              <span className="tag-manage-count">{count} task{count !== 1 ? 's' : ''}</span>
              <button
                className="detail-delete"
                onClick={() => onDeleteTag(tag.id)}
                title="Delete tag"
              >
                <Trash2 size={14} />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
