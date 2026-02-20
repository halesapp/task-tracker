import { Settings, X, CalendarDays, Tag, Users, Type } from 'lucide-react'

const FONT_SIZE_MIN = 11
const FONT_SIZE_MAX = 20

function Toggle({ checked, onChange }) {
  return (
    <button
      className={`settings-toggle ${checked ? 'on' : 'off'}`}
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
    >
      <span className="settings-toggle-thumb" />
    </button>
  )
}

function FontSlider({ label, value, onChange }) {
  return (
    <div className="settings-font-row">
      <span className="settings-font-label">{label}</span>
      <div className="settings-font-controls">
        <button
          className="settings-font-btn"
          onClick={() => onChange(Math.max(FONT_SIZE_MIN, value - 1))}
          disabled={value <= FONT_SIZE_MIN}
        >−</button>
        <span className="settings-font-value">{value}px</span>
        <button
          className="settings-font-btn"
          onClick={() => onChange(Math.min(FONT_SIZE_MAX, value + 1))}
          disabled={value >= FONT_SIZE_MAX}
        >+</button>
        <input
          type="range"
          min={FONT_SIZE_MIN}
          max={FONT_SIZE_MAX}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="settings-font-slider"
        />
      </div>
    </div>
  )
}

export default function SettingsPanel({ settings, onUpdate, onClose }) {
  const s = settings || {}

  return (
    <div className="sync-panel">
      <div className="sync-panel-header">
        <Settings size={18} />
        <span>Settings</span>
        <button className="detail-close" onClick={onClose} style={{ marginLeft: 'auto' }}>
          <X size={16} />
        </button>
      </div>

      <div className="sync-panel-body">
        <div className="settings-section-title">Task Details</div>
        <p className="sync-description" style={{ marginBottom: 12 }}>
          Choose what appears below task titles in the list.
        </p>

        <div className="settings-toggle-row">
          <CalendarDays size={15} />
          <span>Show dates</span>
          <Toggle
            checked={s.showDates !== false}
            onChange={(v) => onUpdate({ showDates: v })}
          />
        </div>

        <div className="settings-toggle-row">
          <Tag size={15} />
          <span>Show tags</span>
          <Toggle
            checked={s.showTags !== false}
            onChange={(v) => onUpdate({ showTags: v })}
          />
        </div>

        <div className="settings-toggle-row">
          <Users size={15} />
          <span>Show people</span>
          <Toggle
            checked={s.showPeople !== false}
            onChange={(v) => onUpdate({ showPeople: v })}
          />
        </div>

        <div className="settings-section-title" style={{ marginTop: 20 }}>
          <Type size={14} style={{ display: 'inline', verticalAlign: -2, marginRight: 6 }} />
          Font Sizes
        </div>

        <FontSlider
          label="Task list"
          value={s.taskListSize || 14}
          onChange={(v) => onUpdate({ taskListSize: v })}
        />
        <FontSlider
          label="Sidebar"
          value={s.sidebarSize || 14}
          onChange={(v) => onUpdate({ sidebarSize: v })}
        />
        <FontSlider
          label="Detail panel"
          value={s.detailSize || 14}
          onChange={(v) => onUpdate({ detailSize: v })}
        />
      </div>
    </div>
  )
}
