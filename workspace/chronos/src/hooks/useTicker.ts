import { useEffect, useRef, useState } from 'react'

export function useTicker(fps: number = 60): number {
  const [now, setNow] = useState<number>(Date.now())
  const rafRef = useRef<number | null>(null)
  const lastRef = useRef<number>(performance.now())
  const interval = 1000 / fps

  useEffect(() => {
    function loop(t: number) {
      const last = lastRef.current
      if (t - last >= interval) {
        lastRef.current = t
        setNow(Date.now())
      }
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [interval])

  return now
}

