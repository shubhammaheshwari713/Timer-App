import { useEffect } from 'react'
import { useStore } from '../store'
import { Moon, Sun, MonitorCog } from 'lucide-react'

export function SettingsPage() {
  const { theme, setTheme } = useStore()

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [theme])

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Settings</h2>
      <div className="card space-y-3">
        <label className="text-sm font-medium">Theme</label>
        <div className="flex gap-2">
          <button className={`btn-outline ${theme === 'light' ? 'ring-2 ring-primary/40' : ''}`} onClick={() => setTheme('light')}>
            <Sun size={16} /> Light
          </button>
          <button className={`btn-outline ${theme === 'dark' ? 'ring-2 ring-primary/40' : ''}`} onClick={() => setTheme('dark')}>
            <Moon size={16} /> Dark
          </button>
          <button className={`btn-outline ${theme === 'system' ? 'ring-2 ring-primary/40' : ''}`} onClick={() => setTheme('system')}>
            <MonitorCog size={16} /> System
          </button>
        </div>
      </div>
      <div className="card space-y-2">
        <p className="text-sm text-slate-600 dark:text-slate-300">Your timers, stopwatches and counters persist locally. Enable notifications in your browser for alerts when timers complete.</p>
        <div className="flex gap-2">
          {'Notification' in window && Notification.permission !== 'granted' && (
            <button className="btn-primary" onClick={() => Notification.requestPermission()}>
              Enable Notifications
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

