import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  format,
  isSameMonth,
  isSameDay,
  isToday,
} from 'date-fns'
import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function CalendarView({ tasks, onSelectDate }) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calStart = startOfWeek(monthStart)
  const calEnd = endOfWeek(monthEnd)

  const days = []
  let day = calStart
  while (day <= calEnd) {
    days.push(day)
    day = addDays(day, 1)
  }

  function getTasksForDay(d) {
    return tasks.filter((t) => {
      if (!t.dueDate) return false
      return isSameDay(new Date(t.dueDate), d)
    })
  }

  return (
    <div className="calendar-view">
      <div className="calendar-nav">
        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
          <ChevronLeft size={18} />
        </button>
        <h3>{format(currentMonth, 'MMMM yyyy')}</h3>
        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
          <ChevronRight size={18} />
        </button>
        <button
          onClick={() => setCurrentMonth(new Date())}
          style={{ fontSize: 13, padding: '4px 12px', color: 'var(--accent)' }}
        >
          Today
        </button>
      </div>

      <div className="calendar-grid">
        {dayHeaders.map((dh) => (
          <div key={dh} className="calendar-day-header">{dh}</div>
        ))}
        {days.map((d) => {
          const dayTasks = getTasksForDay(d)
          const inMonth = isSameMonth(d, currentMonth)
          const today = isToday(d)
          return (
            <div
              key={d.toISOString()}
              className={`calendar-day ${!inMonth ? 'other-month' : ''} ${today ? 'today' : ''}`}
              onClick={() => onSelectDate(d)}
            >
              <div className="day-number">
                {format(d, 'd')}
              </div>
              {dayTasks.slice(0, 3).map((t) => (
                <div
                  key={t.id}
                  className={`calendar-task-dot ${t.completed ? 'completed' : ''}`}
                >
                  {t.title}
                </div>
              ))}
              {dayTasks.length > 3 && (
                <div className="calendar-task-count">+{dayTasks.length - 3} more</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
