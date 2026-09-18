/**
 * Universal Fullscreen and Screen Lock Helper
 * Supports standard Fullscreen API + WebKit (Safari/iOS/Android) + Moz + MS
 */

export function isFullscreenActive() {
  if (typeof document === 'undefined') return false
  return !!(
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement
  )
}

export async function toggleFullscreen(targetElement = document.documentElement) {
  if (typeof document === 'undefined') return false

  try {
    if (isFullscreenActive()) {
      if (document.exitFullscreen) {
        await document.exitFullscreen()
      } else if (document.webkitExitFullscreen) {
        await document.webkitExitFullscreen()
      } else if (document.mozCancelFullScreen) {
        await document.mozCancelFullScreen()
      } else if (document.msExitFullscreen) {
        await document.msExitFullscreen()
      }
      return false
    } else {
      if (targetElement.requestFullscreen) {
        await targetElement.requestFullscreen({ navigationUI: 'hide' }).catch(() => targetElement.requestFullscreen())
      } else if (targetElement.webkitRequestFullscreen) {
        await targetElement.webkitRequestFullscreen()
      } else if (targetElement.mozRequestFullScreen) {
        await targetElement.mozRequestFullScreen()
      } else if (targetElement.msRequestFullscreen) {
        await targetElement.msRequestFullscreen()
      }

      // Try locking orientation to landscape on mobile devices if supported
      if (screen && screen.orientation && typeof screen.orientation.lock === 'function') {
        try {
          await screen.orientation.lock('landscape').catch(() => { })
        } catch (_) { }
      }

      return true
    }
  } catch (err) {
    console.warn('[Fullscreen] Action failed or blocked by browser:', err)
    return isFullscreenActive()
  }
}

export function subscribeFullscreenChange(callback) {
  if (typeof document === 'undefined') return () => { }

  const handler = () => {
    callback(isFullscreenActive())
  }

  document.addEventListener('fullscreenchange', handler)
  document.addEventListener('webkitfullscreenchange', handler)
  document.addEventListener('mozfullscreenchange', handler)
  document.addEventListener('MSFullscreenChange', handler)

  return () => {
    document.removeEventListener('fullscreenchange', handler)
    document.removeEventListener('webkitfullscreenchange', handler)
    document.removeEventListener('mozfullscreenchange', handler)
    document.removeEventListener('MSFullscreenChange', handler)
  }
}

