import { useState } from 'react'
import {
  Sun,
  Star,
  CalendarDays,
  CalendarRange,
  Home,
  List,
  Plus,
  ChevronDown,
  FolderPlus,
  Users,
  GanttChart,
  Search,
  Moon,
  SunMedium,
  ArrowUp,
  ArrowDown,
  Cloud,
  Flag,
  Trash2,
  Tag,
} from 'lucide-react'

const smartLists = [
  { id: '_all', name: 'All Tasks', icon: Home, className: 'all-tasks' },
  { id: '_important', name: 'Important', icon: Star, className: 'important' },
  { id: '_planned', name: 'Planned', icon: CalendarDays, className: 'planned' },
  { id: '_priority', name: 'Priority', icon: Flag, className: 'priority' },
  { id: '_calendar', name: 'Calendar', icon: CalendarRange, className: 'calendar' },
  { id: '_people', name: 'People', icon: Users, className: 'people' },
  { id: '_gantt', name: 'Gantt Chart', icon: GanttChart, className: 'gantt' },
  { id: '_tags', name: 'Tags', icon: Tag, className: 'tags' },
]

function getListIcon() {
  return List
}

export default function Sidebar({
  data,
  activeView,
  onSelectView,
  onAddList,
  onAddGroup,
  onRenameList,
  onRenameGroup,
  onMoveGroup,
  onMoveList,
  onDeleteList,
  onDeleteGroup,
  taskCounts,
  onOpenSearch,
  onOpenSync,
  syncConnected,
  syncStatus,
  connectionOk,
  darkMode,
  onToggleDarkMode,
  onDeleteAll,
}) {
  const [collapsedGroups, setCollapsedGroups] = useState({})
  const [addingListInGroup, setAddingListInGroup] = useState(null)
  const [editingGroupId, setEditingGroupId] = useState(null)
  const [editingListId, setEditingListId] = useState(null)
  const [editName, setEditName] = useState('')
  const [newListName, setNewListName] = useState('')
  const [addingGroup, setAddingGroup] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')

  function toggleGroup(groupId) {
    setCollapsedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }))
  }

  function handleAddList(groupId) {
    if (newListName.trim()) {
      onAddList(newListName.trim(), groupId)
      setNewListName('')
      setAddingListInGroup(null)
    }
  }

  function handleAddGroup() {
    if (newGroupName.trim()) {
      onAddGroup(newGroupName.trim())
      setNewGroupName('')
      setAddingGroup(false)
    }
  }

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="app-icon">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M4 5h12M4 10h12M4 15h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <h1>To Do</h1>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4, alignItems: 'center' }}>
          {syncConnected && syncStatus && (
            <span className={`sync-status-label ${syncStatus}`}>
              {syncStatus === 'synced' ? 'Synced' : 'Modified'}
            </span>
          )}
          <button
            className={`sidebar-icon-btn ${syncConnected ? 'sync-connected' : ''}`}
            onClick={onOpenSync}
            title="Cloud sync"
          >
            <span className="sync-cloud-wrapper">
              <Cloud size={16} />
              {syncConnected && (
                <span className={`sync-dot ${connectionOk === true ? 'ok' : connectionOk === false ? 'err' : ''}`} />
              )}
            </span>
          </button>
          <button
            className="sidebar-icon-btn"
            onClick={onToggleDarkMode}
            title={darkMode ? 'Light mode' : 'Dark mode'}
          >
            {darkMode ? <SunMedium size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </div>

      {/* Delete all data */}
      <div style={{ padding: '4px 8px 0' }}>
        <button className="sidebar-delete-all-btn" onClick={onDeleteAll}>
          <Trash2 size={15} />
          <span>Delete all data</span>
        </button>
      </div>

      {/* Search button */}
      <div style={{ padding: '4px 8px' }}>
        <button className="sidebar-search-btn" onClick={onOpenSearch}>
          <Search size={15} />
          <span>Search</span>
          <kbd>Ctrl+K</kbd>
        </button>
      </div>

      <div className="sidebar-smart-lists">
        {smartLists.map((item) => {
          const Icon = item.icon
          const count = taskCounts[item.id] || 0
          return (
            <div
              key={item.id}
              className={`sidebar-item ${item.className} ${activeView === item.id ? 'active' : ''}`}
              onClick={() => onSelectView(item.id)}
            >
              <span className="icon"><Icon size={18} /></span>
              <span>{item.name}</span>
              {count > 0 && <span className="count">{count}</span>}
            </div>
          )
        })}
      </div>

      <div className="sidebar-divider" />

      {data.groups.map((group, groupIndex) => {
        const collapsed = collapsedGroups[group.id]
        const groupLists = group.listIds
          .map((id) => data.lists.find((l) => l.id === id))
          .filter(Boolean)
        const isFirst = groupIndex === 0
        const isLast = groupIndex === data.groups.length - 1

        return (
          <div key={group.id} className="sidebar-group">
            <div
              className="sidebar-group-header"
              onClick={() => toggleGroup(group.id)}
              onDoubleClick={(e) => {
                e.stopPropagation()
                setEditingGroupId(group.id)
                setEditName(group.name)
              }}
            >
              <ChevronDown size={16} className={`chevron ${collapsed ? 'collapsed' : ''}`} />
              {editingGroupId === group.id ? (
                <input
                  className="editable-name-input"
                  value={editName}
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (editName.trim()) onRenameGroup(group.id, editName.trim())
                      setEditingGroupId(null)
                    }
                    if (e.key === 'Escape') setEditingGroupId(null)
                  }}
                  onBlur={() => {
                    if (editName.trim()) onRenameGroup(group.id, editName.trim())
                    setEditingGroupId(null)
                  }}
                />
              ) : (
                <span>{group.name}</span>
              )}
              {group.personId && editingGroupId !== group.id && (() => {
                const person = data.people?.find((p) => p.id === group.personId)
                return person ? (
                  <span className="group-person-tag" style={{ background: person.color + '22', color: person.color }}>
                    {person.name}
                  </span>
                ) : null
              })()}
              {editingGroupId !== group.id && (
                <span className="group-reorder-btns">
                  <button
                    className="group-reorder-btn"
                    disabled={isFirst}
                    onClick={(e) => { e.stopPropagation(); onMoveGroup(group.id, -1) }}
                    title="Move up"
                  >
                    <ArrowUp size={12} />
                  </button>
                  <button
                    className="group-reorder-btn"
                    disabled={isLast}
                    onClick={(e) => { e.stopPropagation(); onMoveGroup(group.id, 1) }}
                    title="Move down"
                  >
                    <ArrowDown size={12} />
                  </button>
                  <button
                    className="group-reorder-btn group-delete-btn"
                    onClick={(e) => { e.stopPropagation(); onDeleteGroup(group.id) }}
                    title="Delete group"
                  >
                    <Trash2 size={12} />
                  </button>
                </span>
              )}
            </div>
            {!collapsed && (
              <div className="sidebar-group-lists">
                {groupLists.map((list, listIndex) => {
                  const Icon = getListIcon()
                  const count = taskCounts[list.id] || 0
                  const isFirstList = listIndex === 0
                  const isLastList = listIndex === groupLists.length - 1
                  return (
                    <div
                      key={list.id}
                      className={`sidebar-item ${activeView === list.id ? 'active' : ''}`}
                      onClick={() => onSelectView(list.id)}
                      onDoubleClick={(e) => {
                        e.stopPropagation()
                        setEditingListId(list.id)
                        setEditName(list.name)
                      }}
                    >
                      <span className="icon" style={{ color: list.color }}>
                        <Icon size={18} />
                      </span>
                      {editingListId === list.id ? (
                        <input
                          className="editable-name-input"
                          value={editName}
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              if (editName.trim()) onRenameList(list.id, editName.trim())
                              setEditingListId(null)
                            }
                            if (e.key === 'Escape') setEditingListId(null)
                          }}
                          onBlur={() => {
                            if (editName.trim()) onRenameList(list.id, editName.trim())
                            setEditingListId(null)
                          }}
                        />
                      ) : (
                        <span>{list.name}</span>
                      )}
                      {editingListId !== list.id && (
                        <span className="sidebar-item-actions">
                          {count > 0 && <span className="count">{count}</span>}
                          <span className="list-reorder-btns">
                            <button
                              className="group-reorder-btn"
                              disabled={isFirstList}
                              onClick={(e) => { e.stopPropagation(); onMoveList(group.id, list.id, -1) }}
                              title="Move up"
                            >
                              <ArrowUp size={12} />
                            </button>
                            <button
                              className="group-reorder-btn"
                              disabled={isLastList}
                              onClick={(e) => { e.stopPropagation(); onMoveList(group.id, list.id, 1) }}
                              title="Move down"
                            >
                              <ArrowDown size={12} />
                            </button>
                          </span>
                          <button
                            className="sidebar-item-delete"
                            onClick={(e) => { e.stopPropagation(); onDeleteList(list.id) }}
                            title="Delete list"
                          >
                            <Trash2 size={12} />
                          </button>
                        </span>
                      )}
                    </div>
                  )
                })}
                {addingListInGroup === group.id ? (
                  <div className="sidebar-add-input">
                    <input
                      autoFocus
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddList(group.id)
                        if (e.key === 'Escape') {
                          setAddingListInGroup(null)
                          setNewListName('')
                        }
                      }}
                      onBlur={() => {
                        if (newListName.trim()) handleAddList(group.id)
                        else {
                          setAddingListInGroup(null)
                          setNewListName('')
                        }
                      }}
                      placeholder="List name"
                    />
                  </div>
                ) : (
                  <div
                    className="sidebar-item"
                    onClick={() => setAddingListInGroup(group.id)}
                    style={{ color: 'var(--accent)', fontSize: 13 }}
                  >
                    <span className="icon"><Plus size={16} /></span>
                    <span>New list</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}

      <div className="sidebar-bottom">
        {addingGroup ? (
          <div className="sidebar-add-input">
            <input
              autoFocus
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddGroup()
                if (e.key === 'Escape') {
                  setAddingGroup(false)
                  setNewGroupName('')
                }
              }}
              onBlur={() => {
                if (newGroupName.trim()) handleAddGroup()
                else {
                  setAddingGroup(false)
                  setNewGroupName('')
                }
              }}
              placeholder="Group name"
            />
          </div>
        ) : (
          <button className="sidebar-add-btn" onClick={() => setAddingGroup(true)}>
            <FolderPlus size={18} />
            <span>New group</span>
          </button>
        )}
      </div>
    </div>
  )
}
