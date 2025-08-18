import { useEffect } from 'react'
import { useStore, type TimerItem } from '../store'
import { formatHMS, parseToMs, percent } from '../lib/time'
import { useTicker } from '../hooks/useTicker'
import { playSound } from '../lib/sounds'
import { Play, Square, RotateCcw, Plus, Trash2, Bell } from 'lucide-react'

const PRESETS: { label: string, ms: number }[] = [
  { label: '1m', ms: 60_000 },
  { label: '5m', ms: 5 * 60_000 },
  { label: '15m', ms: 15 * 60_000 },
  { label: '30m', ms: 30 * 60_000 },
  { label: '1h', ms: 60 * 60_000 },
]

function TimerCard({ item }: { item: TimerItem }) {
  const now = useTicker(60)
  const { startTimer, stopTimer, resetTimer, setTimerRemaining, removeTimer, renameTimer, setTimerSound } = useStore()
  const running = item.startedAtMs != null
  const remain = running ? Math.max(0, item.remainingMs - (now - (item.startedAtMs as number))) : item.remainingMs
  const done = remain <= 0
  const pct = percent(item.totalMs - remain, item.totalMs)

  useEffect(() => {
    if (done && running) {
      stopTimer(item.id)
      try {
        if (item.sound !== 'silent') {
          playSound(item.sound as any).catch(() => {})
        }
        document.body.classList.add('animate-flash')
        setTimeout(() => document.body.classList.remove('animate-flash'), 1500)
        if ('Notification' in window) {
          if (Notification.permission === 'granted') new Notification(`${item.label} finished`)
        }
      } catch {}
    }
  }, [done])

  return (
    <div className="card" style={{ borderColor: item.color }}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
          <input className="bg-transparent text-lg font-semibold outline-none" value={item.label} onChange={(e) => renameTimer(item.id, e.target.value)} />
        </div>
        <div className="flex gap-2">
          {!running ? (
            <button className="btn-success" onClick={() => startTimer(item.id)}>
              <Play size={16} /> Start
            </button>
          ) : (
            <button className="btn-warning" onClick={() => stopTimer(item.id)}>
              <Square size={16} /> Pause
            </button>
          )}
          <button className="btn-outline" onClick={() => resetTimer(item.id)}>
            <RotateCcw size={16} /> Reset
          </button>
          <button className="btn-danger" onClick={() => removeTimer(item.id)}>
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-3">
        <div className="text-4xl tabular-nums">{formatHMS(remain)}</div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          <input type="number" min={0} placeholder="hh" className="input" onChange={(e) => setTimerRemaining(item.id, parseToMs(Number(e.target.value), Math.floor(remain / 60000) % 60, Math.floor(remain / 1000) % 60))} />
          <input type="number" min={0} max={59} placeholder="mm" className="input" onChange={(e) => setTimerRemaining(item.id, parseToMs(0, Number(e.target.value), Math.floor(remain / 1000) % 60))} />
          <input type="number" min={0} max={59} placeholder="ss" className="input" onChange={(e) => setTimerRemaining(item.id, parseToMs(0, Math.floor(remain / 60000) % 60, Number(e.target.value)))} />
          {['beep','chime','bell','silent'].map((s) => (
            <button key={s} className={`btn-outline ${item.sound === s ? 'ring-2 ring-primary/40' : ''}`} onClick={() => setTimerSound(item.id, s as any)}>
              <Bell size={14} /> {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export function TimerPage() {
  const { timers, addTimer } = useStore()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Timer</h2>
        <div className="flex gap-2">
          {PRESETS.map((p) => (
            <button key={p.label} className="btn-outline" onClick={() => addTimer(p.ms, `Timer ${p.label}`)}>{p.label}</button>
          ))}
          <button className="btn-primary" onClick={() => addTimer(5 * 60_000)}>
            <Plus size={16} /> Add Timer
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {timers.map((t) => (
          <TimerCard key={t.id} item={t} />
        ))}
        {timers.length === 0 && (
          <div className="card">
            <p className="text-slate-600 dark:text-slate-300">No timers yet. Use presets or "Add Timer" to create one.</p>
          </div>
        )}
      </div>
    </div>
  )
}