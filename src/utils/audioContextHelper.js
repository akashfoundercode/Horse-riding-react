/**
 * Audio Context & Sound Effects Manager
 * Provides reliable, cross-browser audio playback with:
 * - Automatic user-gesture unlocking (Chrome, Safari, iOS, Android)
 * - MP3 playback with automatic fallback to WebAudio procedural synthesis
 * - Horse neigh, galloping hooves, coins, camera shutter, and countdown sounds
 */

let sharedAudioCtx = null
let isAudioUnlocked = false
let activeGallopSynthTimer = null

/**
 * Get or initialize safe AudioContext
 */
export function getSafeAudioContext() {
  if (typeof window === 'undefined') return null

  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return null

    if (!sharedAudioCtx) {
      sharedAudioCtx = new AudioCtx()
    }

    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {})
    }

    return sharedAudioCtx
  } catch (_) {
    return null
  }
}

/**
 * Global unlock function called on any user interaction
 */
export function unlockAudio() {
  if (isAudioUnlocked) return
  try {
    const ctx = getSafeAudioContext()
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().then(() => {
        isAudioUnlocked = true
      }).catch(() => {})
    } else if (ctx && ctx.state === 'running') {
      isAudioUnlocked = true
    }

    // Play a 1-sample silent buffer to unlock iOS Safari
    if (ctx) {
      const buffer = ctx.createBuffer(1, 1, 22050)
      const source = ctx.createBufferSource()
      source.buffer = buffer
      source.connect(ctx.destination)
      source.start(0)
    }
  } catch (_) {}
}

// Attach user gesture listeners to unlock audio immediately on first interaction
if (typeof window !== 'undefined') {
  const handleInteraction = () => {
    unlockAudio()
  }

  window.addEventListener('pointerdown', handleInteraction, { capture: true, passive: true })
  window.addEventListener('touchstart', handleInteraction, { capture: true, passive: true })
  window.addEventListener('click', handleInteraction, { capture: true, passive: true })
  window.addEventListener('keydown', handleInteraction, { capture: true, passive: true })
}

/**
 * 1. PROCEDURAL HORSE GALLOP SYNTHESIZER
 * Simulates rhythmic turf hoofbeats (dum-dum-clop-clop) via WebAudio
 */
export function startProceduralGallop(volume = 0.8) {
  stopProceduralGallop()
  const ctx = getSafeAudioContext()
  if (!ctx || volume <= 0) return

  let step = 0
  const beatIntervalMs = 125 // ~480 BPM galloping cadence

  const playHoofStep = () => {
    try {
      if (!sharedAudioCtx || sharedAudioCtx.state !== 'running') return
      const t = sharedAudioCtx.currentTime
      const isLeadStep = step % 4 === 0 || step % 4 === 1
      step++

      // Turf impact low thump
      const osc = sharedAudioCtx.createOscillator()
      const oscGain = sharedAudioCtx.createGain()
      osc.type = 'sine'
      const startFreq = isLeadStep ? 110 : 85
      osc.frequency.setValueAtTime(startFreq, t)
      osc.frequency.exponentialRampToValueAtTime(35, t + 0.05)
      oscGain.gain.setValueAtTime(volume * (isLeadStep ? 0.45 : 0.32), t)
      oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05)
      osc.connect(oscGain)
      oscGain.connect(sharedAudioCtx.destination)
      osc.start(t)
      osc.stop(t + 0.05)

      // Clop noise texture
      const bufferSize = Math.floor(sharedAudioCtx.sampleRate * 0.03)
      const buffer = sharedAudioCtx.createBuffer(1, bufferSize, sharedAudioCtx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sharedAudioCtx.sampleRate * 0.005))
      }
      const noise = sharedAudioCtx.createBufferSource()
      noise.buffer = buffer

      const filter = sharedAudioCtx.createBiquadFilter()
      filter.type = 'bandpass'
      filter.frequency.setValueAtTime(isLeadStep ? 900 : 700, t)
      filter.Q.setValueAtTime(3.5, t)

      const noiseGain = sharedAudioCtx.createGain()
      noiseGain.gain.setValueAtTime(volume * (isLeadStep ? 0.35 : 0.22), t)
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.03)

      noise.connect(filter)
      filter.connect(noiseGain)
      noiseGain.connect(sharedAudioCtx.destination)
      noise.start(t)
    } catch (_) {}
  }

  playHoofStep()
  activeGallopSynthTimer = setInterval(playHoofStep, beatIntervalMs)
}

export function stopProceduralGallop() {
  if (activeGallopSynthTimer) {
    clearInterval(activeGallopSynthTimer)
    activeGallopSynthTimer = null
  }
}

/**
 * 2. PROCEDURAL HORSE NEIGH SYNTHESIZER
 * Simulates expressive horse whinny/neigh
 */
export function playProceduralHorseNeigh(volume = 0.9) {
  try {
    const ctx = getSafeAudioContext()
    if (!ctx || volume <= 0) return
    const t = ctx.currentTime

    // Main vocal formant oscillator
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.type = 'sawtooth'

    // Formant pitch envelope (rises, vibrates, drops)
    osc1.frequency.setValueAtTime(450, t)
    osc1.frequency.linearRampToValueAtTime(780, t + 0.18)
    osc1.frequency.setValueAtTime(820, t + 0.35)
    osc1.frequency.exponentialRampToValueAtTime(320, t + 0.85)

    // Vibrato LFO
    const lfo = ctx.createOscillator()
    const lfoGain = ctx.createGain()
    lfo.frequency.setValueAtTime(14, t) // Fast whinny modulation
    lfoGain.gain.setValueAtTime(45, t)
    lfo.connect(osc1.frequency)

    // Bandpass formant filter
    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(1400, t)
    filter.frequency.linearRampToValueAtTime(2200, t + 0.25)
    filter.frequency.exponentialRampToValueAtTime(800, t + 0.85)
    filter.Q.setValueAtTime(4.0, t)

    gain1.gain.setValueAtTime(0.001, t)
    gain1.gain.linearRampToValueAtTime(volume * 0.45, t + 0.12)
    gain1.gain.setValueAtTime(volume * 0.40, t + 0.45)
    gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.85)

    osc1.connect(filter)
    filter.connect(gain1)
    gain1.connect(ctx.destination)

    lfo.start(t)
    osc1.start(t)
    lfo.stop(t + 0.85)
    osc1.stop(t + 0.85)
  } catch (_) {}
}

/**
 * 3. CAMERA SHUTTER & FINISH SOUND
 */
export function playProceduralShutter(volume = 0.85) {
  try {
    const ctx = getSafeAudioContext()
    if (!ctx || volume <= 0) return
    const t = ctx.currentTime

    // Mechanical Mirror Slap
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(750, t)
    osc.frequency.exponentialRampToValueAtTime(50, t + 0.08)
    gain.gain.setValueAtTime(volume * 0.7, t)
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(t)
    osc.stop(t + 0.08)

    // Crisp snap
    const snapOsc = ctx.createOscillator()
    const snapGain = ctx.createGain()
    snapOsc.type = 'sawtooth'
    snapOsc.frequency.setValueAtTime(1400, t + 0.04)
    snapOsc.frequency.exponentialRampToValueAtTime(120, t + 0.16)
    snapGain.gain.setValueAtTime(volume * 0.6, t + 0.04)
    snapGain.gain.exponentialRampToValueAtTime(0.01, t + 0.16)
    snapOsc.connect(snapGain)
    snapGain.connect(ctx.destination)
    snapOsc.start(t + 0.04)
    snapOsc.stop(t + 0.16)
  } catch (_) {}
}

/**
 * 4. START RACE BUZZER / GATE BELL
 */
export function playRaceStartBell(volume = 0.8) {
  try {
    const ctx = getSafeAudioContext()
    if (!ctx || volume <= 0) return
    const t = ctx.currentTime

    const osc1 = ctx.createOscillator()
    const osc2 = ctx.createOscillator()
    const gain = ctx.createGain()

    osc1.type = 'sine'
    osc2.type = 'triangle'
    osc1.frequency.setValueAtTime(880, t) // A5
    osc2.frequency.setValueAtTime(1760, t) // A6

    gain.gain.setValueAtTime(volume * 0.5, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6)

    osc1.connect(gain)
    osc2.connect(gain)
    gain.connect(ctx.destination)

    osc1.start(t)
    osc2.start(t)
    osc1.stop(t + 0.6)
    osc2.stop(t + 0.6)
  } catch (_) {}
}

export default getSafeAudioContext
