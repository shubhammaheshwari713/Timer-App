import { useEffect } from 'react'
import { useStore, type CounterItem } from '../store'
import { percent } from '../lib/time'
import { useTicker } from '../hooks/useTicker'
import { Play, Square, RotateCcw, Plus, Trash2 } from 'lucide-react'

function CounterCard({ item }: { item: CounterItem }) {
  const now = useTicker(60)
  const { startCounter, stopCounter, resetCounter, removeCounter, setCounterConfig, renameCounter } = useStore()
  const running = item.startedAtMs != null

  useEffect(() => {
    if (!running) return
    const elapsed = now - (item.startedAtMs as number)
    if (elapsed >= item.intervalMs) {
      const steps = Math.floor(elapsed / item.intervalMs)
      const delta = steps * item.step * (item.direction === 'down' ? -1 : 1)
      const next = item.value + delta
      if ((item.direction === 'up' && next >= item.target) || (item.direction === 'down' && next <= item.target)) {
        setCounterConfig(item.id, { value: item.target, startedAtMs: null as any })
      } else {
        setCounterConfig(item.id, { value: next, startedAtMs: (item.startedAtMs as number) + steps * item.intervalMs as any })
      }
    }
  }, [now])

  const progress = percent(
    item.direction === 'up' ? item.value - item.start : item.start - item.value,
    Math.abs(item.target - item.start),
  )

  return (
    <div className="card" style={{ borderColor: item.color }}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
          <input className="bg-transparent text-lg font-semibold outline-none" value={item.label} onChange={(e) => renameCounter(item.id, e.target.value)} />
        </div>
        <div className="flex gap-2">
          {!running ? (
            <button className="btn-success" onClick={() => startCounter(item.id)}>
              <Play size={16} /> Start
            </button>
          ) : (
            <button className="btn-warning" onClick={() => stopCounter(item.id)}>
              <Square size={16} /> Pause
            </button>
          )}
          <button className="btn-outline" onClick={() => resetCounter(item.id)}>
            <RotateCcw size={16} /> Reset
          </button>
          <button className="btn-danger" onClick={() => removeCounter(item.id)}>
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <label className="text-sm">Start<input className="input mt-1" type="number" value={item.start} onChange={(e) => setCounterConfig(item.id, { start: Number(e.target.value) })} /></label>
        <label className="text-sm">Target<input className="input mt-1" type="number" value={item.target} onChange={(e) => setCounterConfig(item.id, { target: Number(e.target.value) })} /></label>
        <label className="text-sm">Step<input className="input mt-1" type="number" value={item.step} onChange={(e) => setCounterConfig(item.id, { step: Number(e.target.value) })} /></label>
        <label className="text-sm">Interval (s)
          <input className="input mt-1" type="number" step={0.1} min={0.1} max={10} value={item.intervalMs / 1000}
            onChange={(e) => setCounterConfig(item.id, { intervalMs: Math.round(Number(e.target.value) * 1000) })} />
        </label>
        <div className="col-span-2 flex items-center gap-2">
          <label className="text-sm">Direction</label>
          <select className="input" value={item.direction} onChange={(e) => setCounterConfig(item.id, { direction: e.target.value as any })}>
            <option value="up">Up</option>
            <option value="down">Down</option>
          </select>
        </div>
      </div>
      <div className="mt-4 text-5xl font-bold tabular-nums">{item.value}</div>
      <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
      </div>
    </div>
  )
}

export function CounterPage() {
  const { counters, addCounter } = useStore()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Counter</h2>
        <button className="btn-primary" onClick={() => addCounter()}>
          <Plus size={16} /> Add Counter
        </button>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {counters.map((c) => (
          <CounterCard key={c.id} item={c} />
        ))}
        {counters.length === 0 && (
          <div className="card">
            <p className="text-slate-600 dark:text-slate-300">No counters yet. Click "Add Counter" to create one.</p>
          </div>
        )}
      </div>
    </div>
  )
}

