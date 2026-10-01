/**
 * Race Countdown Voice & Chime Announcer
 * Provides spoken voice announcement ("Three", "Two", "One", "GO!") using Web Speech API,
 * paired with authentic racing starter chimes via Web Audio API.
 */

import { getSafeAudioContext } from './audioContextHelper.js'

let isVoiceUnlocked = false

// Unlock speech synthesis and audio context on user gesture
if (typeof window !== 'undefined') {
  const unlockVoice = () => {
    try {
      if ('speechSynthesis' in window && !isVoiceUnlocked) {
        // Silent instant utterance to unlock on iOS / Chrome
        const silent = new SpeechSynthesisUtterance('')
        silent.volume = 0
        window.speechSynthesis.speak(silent)
        isVoiceUnlocked = true
      }
    } catch (_) {}
    window.removeEventListener('click', unlockVoice, true)
    window.removeEventListener('touchstart', unlockVoice, true)
  }

  window.addEventListener('click', unlockVoice, { capture: true, once: true, passive: true })
  window.addEventListener('touchstart', unlockVoice, { capture: true, once: true, passive: true })
}

/**
 * Play progressive starter chimes for race countdown
 * 3 -> C5 (523 Hz)
 * 2 -> E5 (659 Hz)
 * 1 -> G5 (784 Hz)
 * 0 / GO -> A5 + C6 Dual High Fanfare Tone
 */
export function playRaceCountdownChime(countdownValue, volume = 0.5) {
  if (volume <= 0) return

  try {
    const ctx = getSafeAudioContext()
    if (!ctx) return

    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    if (countdownValue === 0) {
      // "GO!" - Punchy double fanfare chime
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(880, now) // A5
      osc.frequency.setValueAtTime(1046.5, now + 0.08) // C6
      gain.gain.setValueAtTime(Math.min(1, volume * 0.7), now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.4)
    } else {
      // 3, 2, 1 - Distinct stepped starter beeps
      const freqs = { 3: 523.25, 2: 659.25, 1: 783.99 }
      const freq = freqs[countdownValue] || 587.33

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now)
      gain.gain.setValueAtTime(Math.min(1, volume * 0.5), now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.25)
    }
  } catch (_) {}
}

/**
 * Spoken Voice Announcement for 3, 2, 1, GO!
 * Uses Web Speech API with energetic rate and pitch.
 */
export function speakCountdown(countdownValue, volume = 1.0) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  if (volume <= 0) return

  try {
    // Cancel any previous utterance to prevent queue lag
    window.speechSynthesis.cancel()

    let speechText = ''
    if (countdownValue === 3) speechText = 'Three'
    else if (countdownValue === 2) speechText = 'Two'
    else if (countdownValue === 1) speechText = 'One'
    else if (countdownValue === 0) speechText = 'GO!'
    else speechText = String(countdownValue)

    const utterance = new SpeechSynthesisUtterance(speechText)
    utterance.volume = Math.max(0, Math.min(1, volume))
    utterance.rate = countdownValue === 0 ? 1.25 : 1.15 // Fast & punchy
    utterance.pitch = countdownValue === 0 ? 1.3 : 1.1 // Slightly higher pitch on GO

    // Select the best natural-sounding voice
    const voices = window.speechSynthesis.getVoices()
    if (voices && voices.length > 0) {
      const preferred =
        voices.find((v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel') || v.name.includes('Siri'))) ||
        voices.find((v) => v.lang.startsWith('en')) ||
        voices[0]
      if (preferred) {
        utterance.voice = preferred
      }
    }

    window.speechSynthesis.speak(utterance)
  } catch (err) {
    console.warn('[CountdownAnnouncer] SpeechSynthesis notice:', err)
  }
}

/**
 * Combined Voice & Chime trigger for Countdown Overlay
 */
export function announceCountdownStep(countdownValue, volume = 0.8) {
  // 1. Spoken voice announcement ("Three", "Two", "One", "GO!")
  speakCountdown(countdownValue, volume)

  // 2. High-precision starter audio chime
  playRaceCountdownChime(countdownValue, volume)
}

export default announceCountdownStep
