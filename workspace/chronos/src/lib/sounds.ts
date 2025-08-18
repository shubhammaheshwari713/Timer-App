type SoundType = 'beep' | 'chime' | 'bell'

let audioContext: AudioContext | null = null

function getContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  }
  return audioContext
}

export async function playSound(type: SoundType): Promise<void> {
  const ctx = getContext()
  const duration = type === 'beep' ? 0.2 : type === 'chime' ? 0.5 : 0.6
  const startTime = ctx.currentTime + 0.01
  const volume = ctx.createGain()
  volume.connect(ctx.destination)
  volume.gain.setValueAtTime(0.0001, startTime)
  volume.gain.exponentialRampToValueAtTime(0.5, startTime + 0.05)
  volume.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)

  if (type === 'beep') {
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, startTime)
    osc.connect(volume)
    osc.start(startTime)
    osc.stop(startTime + duration)
  } else if (type === 'chime') {
    const osc = ctx.createOscillator()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(660, startTime)
    osc.frequency.exponentialRampToValueAtTime(990, startTime + 0.15)
    osc.connect(volume)
    osc.start(startTime)
    osc.stop(startTime + duration)
  } else {
    // bell-like: multiple partials
    const base = 520
    const freqs = [1, 2.01, 2.99, 4.2].map((m) => m * base)
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator()
      const g = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(f, startTime)
      g.gain.setValueAtTime(0.0001, startTime)
      g.gain.exponentialRampToValueAtTime(0.4 / (i + 1), startTime + 0.05)
      g.gain.exponentialRampToValueAtTime(0.0001, startTime + duration + i * 0.05)
      osc.connect(g)
      g.connect(volume)
      osc.start(startTime)
      osc.stop(startTime + duration + i * 0.05)
    })
  }
}

