import { useMemo, useState } from 'react'
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  startOfWeek, endOfWeek, isSameMonth, isToday, subDays,
  addMonths, subMonths,
} from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, MessageCircle } from 'lucide-react'
import { cn, formatWIB } from '@/lib/utils'

const WEEK_DAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']

export interface CalendarEvent {
  id: string
  kind: 'task' | 'class' | 'gcal'
  title: string
  date: string             // ISO
  durationMins?: number | null
  media?: 'online' | 'offline' | null
  teamCode?: string | null
  href?: string
  /** For all-day Google events — render without a time prefix. */
  allDay?: boolean
  meta?: Record<string, unknown>
}

interface CalendarGridProps {
  events: CalendarEvent[]
  /** Color hint for the "today" badge. Defaults to primary. */
  accent?: 'primary' | 'teal' | 'purple' | 'amber'
  /** Toolbar slot for actions like "Tambahkan Kelas". */
  toolbar?: React.ReactNode
  /** Click handler for an event (defaults to nothing). */
  onEventClick?: (event: CalendarEvent) => void
  /** Click handler for a day cell (e.g. open create modal). */
  onDayClick?: (date: Date) => void
}

const ACCENT_TODAY: Record<NonNullable<CalendarGridProps['accent']>, string> = {
  primary: 'bg-primary-600 text-white',
  teal:    'bg-accent-teal text-white',
  purple:  'bg-accent-purple text-white',
  amber:   'bg-accent-amber text-white',
}

export function CalendarGrid({
  events, accent = 'primary', toolbar, onEventClick, onDayClick,
}: CalendarGridProps) {
  const [current, setCurrent] = useState(new Date())

  const days = useMemo(() => {
    const monthStart = startOfMonth(current)
    const monthEnd = endOfMonth(current)
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
    return eachDayOfInterval({ start: calStart, end: calEnd })
  }, [current])

  // Pre-bucket events by yyyy-mm-dd for cheap lookup.
  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()
    for (const e of events) {
      const key = formatWIB(e.date, 'yyyy-MM-dd')
      const arr = map.get(key) ?? []
      arr.push(e)
      map.set(key, arr)
    }
    // Sort each bucket by time.
    for (const arr of map.values()) arr.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    return map
  }, [events])

  // Compute WA reminder hints: H-2 for tasks, H-1 for classes.
  // Google Calendar events are external — no WA reminder fires for them.
  const remindersByDay = useMemo(() => {
    const map = new Map<string, number>()
    for (const e of events) {
      if (e.kind === 'gcal') continue
      const lead = e.kind === 'task' ? 2 : 1
      const remindDate = subDays(new Date(e.date), lead)
      const key = formatWIB(remindDate.toISOString(), 'yyyy-MM-dd')
      map.set(key, (map.get(key) ?? 0) + 1)
    }
    return map
  }, [events])

  return (
    <div className="space-y-4">
      {/* ── Header / toolbar ──────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text-primary">
            {format(current, 'MMMM yyyy', { locale: localeId })}
          </h2>
          <div className="flex items-center gap-1 rounded-xl border border-surface-200 bg-white p-1 shadow-soft">
            <button
              onClick={() => setCurrent(subMonths(current, 1))}
              className="h-8 w-8 flex items-center justify-center rounded-lg text-text-secondary hover:bg-surface-50 hover:text-text-primary transition-colors"
              aria-label="Bulan sebelumnya"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCurrent(new Date())}
              className="px-3 h-8 rounded-lg text-xs font-bold text-text-secondary hover:bg-surface-50 hover:text-text-primary transition-colors"
            >
              Hari ini
            </button>
            <button
              onClick={() => setCurrent(addMonths(current, 1))}
              className="h-8 w-8 flex items-center justify-center rounded-lg text-text-secondary hover:bg-surface-50 hover:text-text-primary transition-colors"
              aria-label="Bulan berikutnya"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
        {toolbar && <div className="flex items-center gap-2">{toolbar}</div>}
      </div>

      {/* ── Legend ────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
        <LegendDot color="bg-primary-500" label="Kelas" />
        <LegendDot color="bg-accent-amber" label="Tugas" />
        <LegendDot color="bg-text-tertiary" label="Google Calendar" />
        <span className="inline-flex items-center gap-1.5 text-text-tertiary">
          <MessageCircle className="h-3 w-3 text-accent-green" />
          WA reminder H-2 tugas / H-1 kelas
        </span>
      </div>

      {/* ── Grid ──────────────────────────────────────── */}
      <div className="rounded-2xl border border-surface-200 bg-white overflow-hidden shadow-soft">
        {/* Day headers */}
        <div className="grid grid-cols-7 bg-surface-50/50 border-b border-surface-200">
          {WEEK_DAYS.map((d) => (
            <div key={d} className="py-3 text-center text-[10px] font-bold uppercase tracking-[0.14em] text-text-tertiary">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const key = formatWIB(day.toISOString(), 'yyyy-MM-dd')
            const dayEvents = eventsByDay.get(key) ?? []
            const reminderCount = remindersByDay.get(key) ?? 0
            const inMonth = isSameMonth(day, current)
            const today = isToday(day)

            return (
              <button
                key={day.toString()}
                onClick={() => onDayClick?.(day)}
                className={cn(
                  'group relative text-left min-h-[110px] p-2 border-b border-r border-surface-100 transition-colors',
                  'hover:bg-primary-50/30',
                  !inMonth && 'bg-surface-50/40',
                  // remove right border on last col, bottom border on last row
                )}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold tabular-nums',
                      today ? cn(ACCENT_TODAY[accent], 'shadow-soft') : inMonth ? 'text-text-primary' : 'text-text-tertiary',
                    )}
                  >
                    {format(day, 'd')}
                  </span>
                  {reminderCount > 0 && (
                    <span title={`${reminderCount} WA reminder akan terkirim`} className="inline-flex items-center gap-0.5 text-[9px] font-bold text-accent-green">
                      <MessageCircle className="h-3 w-3" />
                      {reminderCount}
                    </span>
                  )}
                </div>

                {dayEvents.length > 0 && (
                  <div className="mt-1.5 space-y-1">
                    {dayEvents.slice(0, 3).map((ev) => (
                      <EventChip key={ev.id} event={ev} onClick={() => onEventClick?.(ev)} />
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="px-1 text-[10px] font-semibold text-text-tertiary">
                        +{dayEvents.length - 3} lagi
                      </div>
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-text-tertiary">
      <span className={cn('h-2 w-2 rounded-full', color)} />
      {label}
    </span>
  )
}

interface EventChipProps {
  event: CalendarEvent
  onClick?: () => void
}
function EventChip({ event, onClick }: EventChipProps) {
  const classes =
    event.kind === 'task'
      ? 'bg-accent-amber/15 text-accent-amber hover:bg-accent-amber/25'
      : event.kind === 'gcal'
        ? 'bg-surface-100 text-text-secondary hover:bg-surface-200 border border-dashed border-surface-300'
        : 'bg-primary-100 text-primary-800 hover:bg-primary-200'

  const showTime = event.kind !== 'task' && !event.allDay

  return (
    <div
      role={onClick ? 'button' : undefined}
      onClick={onClick ? (e) => { e.stopPropagation(); onClick() } : undefined}
      title={event.title}
      className={cn(
        'flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold truncate transition-colors',
        classes,
      )}
    >
      {showTime && (
        <span className="tabular-nums opacity-70">
          {formatWIB(event.date, 'HH:mm')}
        </span>
      )}
      {event.kind === 'gcal' && event.allDay && (
        <span className="text-[8px] uppercase tracking-wider opacity-60">All</span>
      )}
      <span className="truncate">{event.title}</span>
    </div>
  )
}
