import { useState, useEffect, useRef } from 'preact/hooks'
import { ChevronLeft, ChevronRight } from 'lucide-preact'

export default function ContextMenu({ x, y, items, onClose }) {
  const [expandedSubmenu, setExpandedSubmenu] = useState(null)
  const menuRef = useRef(null)

  // Adjust position to stay within viewport
  const [pos, setPos] = useState({ x, y })
  useEffect(() => {
    if (!menuRef.current) return
    const rect = menuRef.current.getBoundingClientRect()
    let nx = x
    let ny = y
    if (nx + rect.width > window.innerWidth) nx = window.innerWidth - rect.width - 8
    if (ny + rect.height > window.innerHeight) ny = window.innerHeight - rect.height - 8
    if (nx < 8) nx = 8
    if (ny < 8) ny = 8
    setPos({ x: nx, y: ny })
  }, [x, y, expandedSubmenu])

  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose()
    }
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) onClose()
    }
    document.addEventListener('keydown', handleKey)
    document.addEventListener('mousedown', handleClick)
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.removeEventListener('mousedown', handleClick)
    }
  }, [onClose])

  const displayItems = expandedSubmenu
    ? [
        {
          label: expandedSubmenu.label,
          isBack: true,
          onClick: () => setExpandedSubmenu(null),
        },
        { separator: true },
        ...expandedSubmenu.items,
      ]
    : items

  return (
    <div
      className="context-menu"
      ref={menuRef}
      style={{ left: pos.x, top: pos.y }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {displayItems.map((item, i) => {
        if (item.separator) {
          return <div key={i} className="context-menu-separator" />
        }
        if (item.isBack) {
          return (
            <div
              key={i}
              className="context-menu-item context-menu-back"
              onClick={item.onClick}
            >
              <ChevronLeft size={14} />
              {item.label}
            </div>
          )
        }
        if (item.submenu) {
          return (
            <div
              key={i}
              className={`context-menu-item${item.disabled ? ' disabled' : ''}`}
              onClick={() => {
                if (!item.disabled) setExpandedSubmenu({ label: item.label, items: item.submenu })
              }}
            >
              {item.icon && item.icon}
              <span style={{ flex: 1 }}>{item.label}</span>
              <ChevronRight size={14} style={{ opacity: 0.5 }} />
            </div>
          )
        }
        return (
          <div
            key={i}
            className={`context-menu-item${item.disabled ? ' disabled' : ''}${item.danger ? ' danger' : ''}${item.check ? ' checked' : ''}`}
            onClick={() => {
              if (!item.disabled) {
                item.onClick?.()
                onClose()
              }
            }}
          >
            {item.icon && item.icon}
            <span style={{ flex: 1 }}>{item.label}</span>
            {item.check && <span style={{ fontSize: 12 }}>✓</span>}
          </div>
        )
      })}
    </div>
  )
}
