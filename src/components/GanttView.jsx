import { useMemo, useState } from 'react'
import {
  addDays,
  differenceInDays,
  format,
  startOfWeek,
  endOfWeek,
  isWithinInterval,
  isSameDay,
  subWeeks,
  addWeeks,
  eachDayOfInterval,
  isToday,
} from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { parseDate } from '../utils/date'

const DAY_WIDTH = 40
const ROW_HEIGHT = 36
const HEADER_HEIGHT = 50

export default function GanttView({ tasks, lists, people, onSelectTask }) {
  const ganttTasks = tasks.filter((t) => t.startDate && t.dueDate)

  const [weekOffset, setWeekOffset] = useState(0)

  const timelineStart = startOfWeek(addWeeks(new Date(), weekOffset - 1))
  const timelineEnd = endOfWeek(addWeeks(new Date(), weekOffset + 3))
  const days = eachDayOfInterval({ start: timelineStart, end: timelineEnd })
  const totalWidth = days.length * DAY_WIDTH

  function getBarStyle(task) {
    const start = parseDate(task.startDate)
    const end = parseDate(task.dueDate)
    const dayOffset = differenceInDays(start, timelineStart)
    const duration = differenceInDays(end, start) + 1
    return {
      left: dayOffset * DAY_WIDTH,
      width: Math.max(duration * DAY_WIDTH - 4, DAY_WIDTH - 4),
    }
  }

  function getListName(task) {
    const list = lists.find((l) => l.id === task.listId)
    return list?.name || ''
  }

  function getAssigneeName(task) {
    const ids = task.assigneeIds || []
    if (!ids.length) return null
    return ids.map((id) => people.find((p) => p.id === id)?.name).filter(Boolean).join(', ')
  }

  function getAssigneeColor(task) {
    const ids = task.assigneeIds || []
    if (!ids.length) return 'var(--accent)'
    const person = people.find((p) => p.id === ids[0])
    return person?.color || 'var(--accent)'
  }

  const todayOffset = differenceInDays(new Date(), timelineStart) * DAY_WIDTH + DAY_WIDTH / 2

  return (
    <div className="gantt-view">
      <div className="gantt-controls">
        <button onClick={() => setWeekOffset((w) => w - 1)}>
          <ChevronLeft size={18} />
        </button>
        <button
          onClick={() => setWeekOffset(0)}
          style={{ fontSize: 13, padding: '4px 12px', color: 'var(--accent)' }}
        >
          Today
        </button>
        <button onClick={() => setWeekOffset((w) => w + 1)}>
          <ChevronRight size={18} />
        </button>
        <span className="gantt-range">
          {format(timelineStart, 'MMM d')} - {format(timelineEnd, 'MMM d, yyyy')}
        </span>
      </div>

      {ganttTasks.length === 0 && (
        <div className="empty-state">
          <h3>No tasks with date ranges</h3>
          <p>Set start and end dates on tasks to see them on the Gantt chart</p>
        </div>
      )}

      {ganttTasks.length > 0 && (
        <div className="gantt-container">
          {/* Left labels */}
          <div className="gantt-labels">
            <div className="gantt-label-header">Task</div>
            {ganttTasks.map((task) => (
              <div
                key={task.id}
                className="gantt-label-row"
                onClick={() => onSelectTask(task.id)}
              >
                <span className="gantt-label-title">{task.title}</span>
                <span className="gantt-label-meta">{getListName(task)}</span>
              </div>
            ))}
          </div>

          {/* Chart area */}
          <div className="gantt-chart-scroll">
            <div className="gantt-chart" style={{ width: totalWidth }}>
              {/* Day headers */}
              <div className="gantt-day-headers" style={{ width: totalWidth }}>
                {days.map((day) => (
                  <div
                    key={day.toISOString()}
                    className={`gantt-day-header ${isToday(day) ? 'today' : ''}`}
                    style={{ width: DAY_WIDTH }}
                  >
                    <span className="gantt-day-dow">{format(day, 'EEE')}</span>
                    <span className="gantt-day-num">{format(day, 'd')}</span>
                  </div>
                ))}
              </div>

              {/* Rows */}
              <div className="gantt-rows">
                {/* Vertical grid lines */}
                {days.map((day, i) => (
                  <div
                    key={day.toISOString()}
                    className={`gantt-grid-line ${isToday(day) ? 'today' : ''}`}
                    style={{ left: i * DAY_WIDTH, width: DAY_WIDTH }}
                  />
                ))}

                {/* Today line */}
                <div
                  className="gantt-today-line"
                  style={{ left: todayOffset }}
                />

                {/* Task bars */}
                {ganttTasks.map((task, idx) => {
                  const bar = getBarStyle(task)
                  const assignee = getAssigneeName(task)
                  const color = getAssigneeColor(task)
                  return (
                    <div
                      key={task.id}
                      className="gantt-row"
                      style={{ height: ROW_HEIGHT }}
                    >
                      <div
                        className={`gantt-bar ${task.completed ? 'completed' : ''}`}
                        style={{
                          left: bar.left,
                          width: bar.width,
                          background: task.completed
                            ? 'var(--completed)'
                            : color,
                        }}
                        onClick={() => onSelectTask(task.id)}
                        title={`${task.title}${assignee ? ` (${assignee})` : ''}`}
                      >
                        <span className="gantt-bar-label">{task.title}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
