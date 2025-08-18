import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { nanoid } from 'nanoid'

export type StopwatchLap = {
  id: string
  timestampMs: number
  lapMs: number
  totalMs: number
}

export type StopwatchItem = {
  id: string
  label: string
  startedAtMs: number | null
  accumulatedMs: number
  laps: StopwatchLap[]
  color: string
}

export type TimerItem = {
  id: string
  label: string
  totalMs: number
  startedAtMs: number | null
  remainingMs: number
  color: string
  sound: 'beep' | 'chime' | 'bell' | 'silent'
}

export type CounterDirection = 'up' | 'down'

export type CounterItem = {
  id: string
  label: string
  start: number
  target: number
  value: number
  direction: CounterDirection
  step: number
  intervalMs: number
  startedAtMs: number | null
  color: string
}

export type ThemeMode = 'light' | 'dark' | 'system'

type State = {
  theme: ThemeMode
  stopwatches: StopwatchItem[]
  timers: TimerItem[]
  counters: CounterItem[]
}

type Actions = {
  setTheme: (theme: ThemeMode) => void
  // Stopwatch
  addStopwatch: (label?: string) => void
  removeStopwatch: (id: string) => void
  startStopwatch: (id: string) => void
  stopStopwatch: (id: string) => void
  resetStopwatch: (id: string) => void
  lapStopwatch: (id: string) => void
  renameStopwatch: (id: string, label: string) => void

  // Timer
  addTimer: (presetMs: number, label?: string) => void
  removeTimer: (id: string) => void
  startTimer: (id: string) => void
  stopTimer: (id: string) => void
  resetTimer: (id: string) => void
  setTimerRemaining: (id: string, ms: number) => void
  renameTimer: (id: string, label: string) => void
  setTimerSound: (id: string, sound: TimerItem['sound']) => void

  // Counter
  addCounter: (config?: Partial<Omit<CounterItem, 'id' | 'value' | 'startedAtMs'>>) => void
  removeCounter: (id: string) => void
  startCounter: (id: string) => void
  stopCounter: (id: string) => void
  resetCounter: (id: string) => void
  setCounterConfig: (id: string, config: Partial<CounterItem>) => void
  renameCounter: (id: string, label: string) => void
}

const palette = ['#1e40af', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']
function nextColor(index: number) {
  return palette[index % palette.length]
}

export const useStore = create<State & Actions>()(
  persist(
    (set) => ({
      theme: 'system',
      stopwatches: [],
      timers: [],
      counters: [],

      setTheme: (theme) => set({ theme }),

      addStopwatch: (label) =>
        set((s) => ({
          stopwatches: [
            ...s.stopwatches,
            {
              id: nanoid(),
              label: label || `Stopwatch ${s.stopwatches.length + 1}`,
              startedAtMs: null,
              accumulatedMs: 0,
              laps: [],
              color: nextColor(s.stopwatches.length),
            },
          ],
        })),
      removeStopwatch: (id) => set((s) => ({ stopwatches: s.stopwatches.filter((w) => w.id !== id) })),
      startStopwatch: (id) => set((s) => ({
        stopwatches: s.stopwatches.map((w) => (w.id === id && w.startedAtMs == null ? { ...w, startedAtMs: Date.now() } : w)),
      })),
      stopStopwatch: (id) => set((s) => ({
        stopwatches: s.stopwatches.map((w) => {
          if (w.id !== id || w.startedAtMs == null) return w
          const elapsed = Date.now() - w.startedAtMs
          return { ...w, startedAtMs: null, accumulatedMs: w.accumulatedMs + elapsed }
        }),
      })),
      resetStopwatch: (id) => set((s) => ({
        stopwatches: s.stopwatches.map((w) => (w.id === id ? { ...w, startedAtMs: null, accumulatedMs: 0, laps: [] } : w)),
      })),
      lapStopwatch: (id) => set((s) => ({
        stopwatches: s.stopwatches.map((w) => {
          if (w.id !== id) return w
          const now = Date.now()
          const total = (w.startedAtMs ? now - w.startedAtMs : 0) + w.accumulatedMs
          const lastTotal = w.laps.length ? w.laps[w.laps.length - 1].totalMs : 0
          const lapMs = total - lastTotal
          const lap = { id: nanoid(), timestampMs: now, lapMs, totalMs: total }
          return { ...w, laps: [...w.laps, lap] }
        }),
      })),
      renameStopwatch: (id, label) => set((s) => ({
        stopwatches: s.stopwatches.map((w) => (w.id === id ? { ...w, label } : w)),
      })),

      addTimer: (presetMs, label) =>
        set((s) => ({
          timers: [
            ...s.timers,
            {
              id: nanoid(),
              label: label || `Timer ${s.timers.length + 1}`,
              totalMs: presetMs,
              startedAtMs: null,
              remainingMs: presetMs,
              color: nextColor(s.timers.length),
              sound: 'chime',
            },
          ],
        })),
      removeTimer: (id) => set((s) => ({ timers: s.timers.filter((t) => t.id !== id) })),
      startTimer: (id) => set((s) => ({
        timers: s.timers.map((t) => (t.id === id && t.startedAtMs == null ? { ...t, startedAtMs: Date.now() } : t)),
      })),
      stopTimer: (id) => set((s) => ({
        timers: s.timers.map((t) => {
          if (t.id !== id || t.startedAtMs == null) return t
          const elapsed = Date.now() - t.startedAtMs
          const remain = Math.max(0, t.remainingMs - elapsed)
          return { ...t, startedAtMs: null, remainingMs: remain }
        }),
      })),
      resetTimer: (id) => set((s) => ({
        timers: s.timers.map((t) => (t.id === id ? { ...t, startedAtMs: null, remainingMs: t.totalMs } : t)),
      })),
      setTimerRemaining: (id, ms) => set((s) => ({
        timers: s.timers.map((t) => (t.id === id ? { ...t, remainingMs: ms } : t)),
      })),
      renameTimer: (id, label) => set((s) => ({
        timers: s.timers.map((t) => (t.id === id ? { ...t, label } : t)),
      })),
      setTimerSound: (id, sound) => set((s) => ({
        timers: s.timers.map((t) => (t.id === id ? { ...t, sound } : t)),
      })),

      addCounter: (config) => set((s) => {
        const base: CounterItem = {
          id: nanoid(),
          label: `Counter ${s.counters.length + 1}`,
          start: 0,
          target: 100,
          value: 0,
          direction: 'up',
          step: 1,
          intervalMs: 100,
          startedAtMs: null,
          color: nextColor(s.counters.length),
        }
        const merged = { ...base, ...config, value: (config?.start ?? base.start) }
        return { counters: [...s.counters, merged] }
      }),
      removeCounter: (id) => set((s) => ({ counters: s.counters.filter((c) => c.id !== id) })),
      startCounter: (id) => set((s) => ({
        counters: s.counters.map((c) => (c.id === id && c.startedAtMs == null ? { ...c, startedAtMs: Date.now() } : c)),
      })),
      stopCounter: (id) => set((s) => ({
        counters: s.counters.map((c) => (c.id === id ? { ...c, startedAtMs: null } : c)),
      })),
      resetCounter: (id) => set((s) => ({
        counters: s.counters.map((c) => (c.id === id ? { ...c, value: c.start, startedAtMs: null } : c)),
      })),
      setCounterConfig: (id, config) => set((s) => ({
        counters: s.counters.map((c) => (c.id === id ? { ...c, ...config } : c)),
      })),
      renameCounter: (id, label) => set((s) => ({
        counters: s.counters.map((c) => (c.id === id ? { ...c, label } : c)),
      })),
    }),
    {
      name: 'chronos-state',
      partialize: (state) => ({
        theme: state.theme,
        stopwatches: state.stopwatches,
        timers: state.timers,
        counters: state.counters,
      }),
    },
  ),
)