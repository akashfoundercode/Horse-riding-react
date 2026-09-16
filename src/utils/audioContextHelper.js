/**
 * Safe AudioContext Helper
 * Automatically handles browser user-gesture requirements and prevents AudioContext autoplay warnings.
 */

let sharedAudioCtx = null

export function getSafeAudioContext() {
  if (typeof window === 'undefined') return null

  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return null

    if (!sharedAudioCtx) {
      sharedAudioCtx = new AudioCtx()
    }

    // If suspended, only attempt resume if user has already interacted
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {})
    }

    return sharedAudioCtx.state === 'running' ? sharedAudioCtx : null
  } catch (_) {
    return null
  }
}

// Global user gesture unlock listener
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    try {
      if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
        sharedAudioCtx.resume().catch(() => {})
      }
    } catch (_) {}
    window.removeEventListener('click', unlockAudio, true)
    window.removeEventListener('touchstart', unlockAudio, true)
    window.removeEventListener('keydown', unlockAudio, true)
  }

  window.addEventListener('click', unlockAudio, { capture: true, once: true, passive: true })
  window.addEventListener('touchstart', unlockAudio, { capture: true, once: true, passive: true })
  window.addEventListener('keydown', unlockAudio, { capture: true, once: true, passive: true })
}

export default getSafeAudioContext

