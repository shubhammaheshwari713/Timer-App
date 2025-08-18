import { useEffect, useState } from 'react'
import { TabBar, Page, type TabKey } from './components/Tabs'
import { StopwatchPage } from './components/Stopwatch'
import { TimerPage } from './components/Timer'
import { CounterPage } from './components/Counter'
import { SettingsPage } from './components/Settings'

function App() {
  const [tab, setTab] = useState<TabKey>('timer')
  useEffect(() => {
    document.title = 'Chronos — Timer • Stopwatch • Counter'
  }, [])
  return (
    <div className="min-h-full bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <TabBar value={tab} onChange={setTab} />
      <Page>
        {tab === 'timer' && <TimerPage />}
        {tab === 'stopwatch' && <StopwatchPage />}
        {tab === 'counter' && <CounterPage />}
        {tab === 'settings' && <SettingsPage />}
      </Page>
    </div>
  )
}

export default App
