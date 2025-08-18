export function pad2(value: number): string {
  return value.toString().padStart(2, '0')
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function formatStopwatch(ms: number, fractionDigits: 3 = 3): string {
  const totalMs = Math.max(0, Math.floor(ms))
  const minutes = Math.floor(totalMs / 60000)
  const seconds = Math.floor((totalMs % 60000) / 1000)
  const remainderMs = totalMs % 1000
  const fraction = (remainderMs / 1000).toFixed(fractionDigits).slice(2)
  return `${pad2(minutes)}:${pad2(seconds)}.${fraction}`
}

export function formatHMS(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  if (hours > 0) {
    return `${hours}:${pad2(minutes)}:${pad2(seconds)}`
  }
  return `${pad2(minutes)}:${pad2(seconds)}`
}

export function parseToMs(hours: number, minutes: number, seconds: number): number {
  hours = Number.isFinite(hours) ? hours : 0
  minutes = Number.isFinite(minutes) ? minutes : 0
  seconds = Number.isFinite(seconds) ? seconds : 0
  return Math.max(0, hours * 3600000 + minutes * 60000 + seconds * 1000)
}

export function percent(progress: number, total: number): number {
  if (total <= 0) return 0
  return clamp((progress / total) * 100, 0, 100)
}

export function downloadBlob(filename: string, data: Blob) {
  const url = URL.createObjectURL(data)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function nowMs(): number {
  return Date.now()
}

