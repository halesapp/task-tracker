import { useState, useRef, useEffect, useMemo } from 'preact/hooks'
import { Search, X, Check, Star, Tag } from 'lucide-preact'

export default function SearchOverlay({ tasks, lists, tags, onSelect, onClose }) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const results = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    return tasks
      .filter((task) => {
        if (task.title.toLowerCase().includes(q)) return true
        if (task.note && task.note.toLowerCase().includes(q)) return true
        if (task.subtasks?.some((s) => s.title.toLowerCase().includes(q))) return true
        const taskTags = (task.tagIds || [])
          .map((id) => tags.find((t) => t.id === id))
          .filter(Boolean)
        if (taskTags.some((t) => t.name.toLowerCase().includes(q))) return true
        return false
      })
      .slice(0, 12)
  }, [query, tasks, tags])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  function handleKeyDown(e) {
    if (e.key === 'Escape') {
      onClose()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      onSelect(results[selectedIndex].id)
      onClose()
    }
  }

  function getListName(task) {
    const list = lists.find((l) => l.id === task.listId)
    return list?.name || ''
  }

  function highlightMatch(text) {
    if (!query.trim()) return text
    const idx = text.toLowerCase().indexOf(query.toLowerCase())
    if (idx === -1) return text
    return (
      <>
        {text.slice(0, idx)}
        <mark>{text.slice(idx, idx + query.length)}</mark>
        {text.slice(idx + query.length)}
      </>
    )
  }

  return (
    <div className="search-overlay" onClick={onClose}>
      <div className="search-modal" onClick={(e) => e.stopPropagation()}>
        <div className="search-input-row">
          <Search size={18} className="search-icon" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search tasks, notes, tags..."
          />
          <div className="search-shortcut">ESC</div>
        </div>

        {query.trim() && (
          <div className="search-results">
            {results.length === 0 && (
              <div className="search-empty">No tasks found</div>
            )}
            {results.map((task, idx) => {
              const taskTags = (task.tagIds || [])
                .map((id) => tags.find((t) => t.id === id))
                .filter(Boolean)
              return (
                <div
                  key={task.id}
                  className={`search-result ${idx === selectedIndex ? 'selected' : ''}`}
                  onClick={() => {
                    onSelect(task.id)
                    onClose()
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  <div className={`search-result-check ${task.completed ? 'completed' : ''}`}>
                    {task.completed && <Check size={10} strokeWidth={3} />}
                  </div>
                  <div className="search-result-content">
                    <div className="search-result-title">
                      {highlightMatch(task.title)}
                    </div>
                    <div className="search-result-meta">
                      <span>{getListName(task)}</span>
                      {task.important && <Star size={10} fill="var(--important)" color="var(--important)" />}
                      {task.priority && task.priority !== 'none' && (
                        <span className={`priority-dot priority-${task.priority}`} />
                      )}
                      {taskTags.map((tag) => (
                        <span
                          key={tag.id}
                          className="search-result-tag"
                          style={{ background: tag.color + '22', color: tag.color }}
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {!query.trim() && (
          <div className="search-hints">
            <div className="search-hint">Type to search tasks by title, notes, or tags</div>
            <div className="search-hint-keys">
              <span><kbd>↑↓</kbd> Navigate</span>
              <span><kbd>Enter</kbd> Select</span>
              <span><kbd>Esc</kbd> Close</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
