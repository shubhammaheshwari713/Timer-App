import { useStore, type StopwatchItem } from '../store'
import { formatStopwatch } from '../lib/time'
import { useTicker } from '../hooks/useTicker'
import { Download, Play, Square, RotateCcw, Flag, Plus, Trash2 } from 'lucide-react'

function StopwatchCard({ item }: { item: StopwatchItem }) {
  const now = useTicker(60)
  const running = item.startedAtMs != null
  const elapsed = running ? now - (item.startedAtMs as number) + item.accumulatedMs : item.accumulatedMs
  const laps = item.laps
  const { startStopwatch, stopStopwatch, resetStopwatch, lapStopwatch, removeStopwatch, renameStopwatch } = useStore()

  function exportCSV() {
    const header = 'Lap,Split (ms),Split,Total (ms),Total\n'
    const rows = laps.map((lap, i) => {
      return `${i + 1},${lap.lapMs},${formatStopwatch(lap.lapMs)},${lap.totalMs},${formatStopwatch(lap.totalMs)}`
    })
    const csv = header + rows.join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${item.label.replace(/\s+/g, '_')}_laps.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="card" style={{ borderColor: item.color }}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
          <input
            className="bg-transparent text-lg font-semibold outline-none"
            value={item.label}
            onChange={(e) => renameStopwatch(item.id, e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {!running ? (
            <button className="btn-success" onClick={() => startStopwatch(item.id)}>
              <Play size={16} /> Start
            </button>
          ) : (
            <button className="btn-warning" onClick={() => stopStopwatch(item.id)}>
              <Square size={16} /> Stop
            </button>
          )}
          <button className="btn-outline" onClick={() => resetStopwatch(item.id)}>
            <RotateCcw size={16} /> Reset
          </button>
          <button className="btn-outline" onClick={() => lapStopwatch(item.id)} disabled={!running}>
            <Flag size={16} /> Lap
          </button>
          <button className="btn-outline" onClick={exportCSV} disabled={laps.length === 0}>
            <Download size={16} /> CSV
          </button>
          <button className="btn-danger" onClick={() => removeStopwatch(item.id)}>
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      <div className="mt-4 text-5xl tabular-nums">
        {formatStopwatch(elapsed, 3)}
      </div>
      {laps.length > 0 && (
        <div className="mt-4 max-h-48 overflow-auto rounded-lg border border-slate-200 dark:border-slate-800">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
              <tr>
                <th className="px-3 py-2 text-left">Lap</th>
                <th className="px-3 py-2 text-left">Split</th>
                <th className="px-3 py-2 text-left">Total</th>
              </tr>
            </thead>
            <tbody>
              {laps.map((lap, i) => (
                <tr key={lap.id} className="odd:bg-white even:bg-slate-50 dark:odd:bg-slate-900 dark:even:bg-slate-950">
                  <td className="px-3 py-2">{i + 1}</td>
                  <td className="px-3 py-2">{formatStopwatch(lap.lapMs, 3)}</td>
                  <td className="px-3 py-2">{formatStopwatch(lap.totalMs, 3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export function StopwatchPage() {
  const { stopwatches, addStopwatch } = useStore()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Stopwatch</h2>
        <button className="btn-primary" onClick={() => addStopwatch()}>
          <Plus size={16} /> Add Stopwatch
        </button>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {stopwatches.map((sw) => (
          <StopwatchCard key={sw.id} item={sw} />
        ))}
        {stopwatches.length === 0 && (
          <div className="card">
            <p className="text-slate-600 dark:text-slate-300">No stopwatches yet. Click "Add Stopwatch" to create one.</p>
          </div>
        )}
      </div>
    </div>
  )
}