import type { ReactNode } from 'react'
import clsx from 'clsx'

export type TabKey = 'timer' | 'stopwatch' | 'counter' | 'settings'

export function TabBar({ value, onChange }: { value: TabKey, onChange: (v: TabKey) => void }) {
  const tabs: { key: TabKey, label: string }[] = [
    { key: 'timer', label: 'Timer' },
    { key: 'stopwatch', label: 'Stopwatch' },
    { key: 'counter', label: 'Counter' },
    { key: 'settings', label: 'Settings' },
  ]
  return (
    <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/70 backdrop-blur dark:border-slate-800 dark:bg-slate-950/60">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="flex gap-2">
          {tabs.map((t) => (
            <button
              key={t.key}
              className={clsx('tab-trigger', 'text-sm', value === t.key && 'data-[active=true]')}
              data-active={value === t.key}
              onClick={() => onChange(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <a className="hidden text-xs text-slate-500 hover:underline md:block" href="https://github.com" target="_blank" rel="noreferrer">Chronos</a>
      </div>
    </div>
  )
}

export function Page({ children }: { children: ReactNode }) {
  return <div className="mx-auto max-w-5xl px-4 py-6">{children}</div>
}