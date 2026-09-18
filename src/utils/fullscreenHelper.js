/**
 * Universal Fullscreen and Screen Lock Helper
 * Supports standard Fullscreen API + WebKit (Safari/iOS/Android) + Moz + MS
 * With automatic fallbacks and address-bar collapse triggers
 */

export function isFullscreenActive() {
  if (typeof document === 'undefined') return false
  return !!(
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.webkitCurrentFullScreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement
  )
}

export function isFullscreenSupported() {
  if (typeof document === 'undefined') return false
  const doc = document.documentElement || document.body
  return !!(
    doc.requestFullscreen ||
    doc.webkitRequestFullscreen ||
    doc.webkitRequestFullScreen ||
    doc.mozRequestFullScreen ||
    doc.msRequestFullscreen
  )
}

export async function toggleFullscreen(targetElement = document.documentElement) {
  if (typeof document === 'undefined') return false

  try {
    if (isFullscreenActive()) {
      const exitFn =
        document.exitFullscreen ||
        document.webkitExitFullscreen ||
        document.webkitCancelFullScreen ||
        document.mozCancelFullScreen ||
        document.msExitFullscreen
      if (exitFn) {
        await exitFn.call(document)
      }
      return false
    } else {
      const elem = targetElement || document.documentElement || document.body || document.getElementById('root')
      const requestFn =
        elem.requestFullscreen ||
        elem.webkitRequestFullscreen ||
        elem.webkitRequestFullScreen ||
        elem.mozRequestFullScreen ||
        elem.msRequestFullscreen

      if (requestFn) {
        try {
          await requestFn.call(elem)
        } catch (e) {
          // If first attempt failed, try on document.body or document.documentElement
          try {
            if (document.documentElement && document.documentElement.requestFullscreen) {
              await document.documentElement.requestFullscreen()
            } else if (document.body && document.body.requestFullscreen) {
              await document.body.requestFullscreen()
            }
          } catch (_) { }
        }
      }

      // Try orientation locking to landscape for mobile gaming if supported
      try {
        if (screen && screen.orientation && typeof screen.orientation.lock === 'function') {
          screen.orientation.lock('landscape').catch(() => { })
        }
      } catch (_) { }

      // Scroll minimal 1px to prompt browser address bar hide on mobile
      try {
        window.scrollTo(0, 1)
      } catch (_) { }

      return true
    }
  } catch (err) {
    console.warn('[Fullscreen] Action error:', err)
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
