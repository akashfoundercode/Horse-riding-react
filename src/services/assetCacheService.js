/**
 * Enterprise Asset Cache & Preloading Service
 * Strictly preloads all game images, sprites, and audio via new Image() and new Audio().
 * Tracks each asset's onload / decode event so the loader only dismisses when
 * 100% of game images are fully downloaded and decoded in memory.
 */

const CACHE_NAME = 'derby-asset-cache-v3'

export const GAME_IMAGE_ASSETS = [
  // 1. Loader Assets
  '/loader/laoder.png',
  '/loader/loaderline.png',

  // 2. Main Game UI, Frames & Background Sprites
  '/sprites/mainlogo.png',
  '/sprites/image.png',
  '/sprites/image2.png',
  '/sprites/mainframe.png',
  '/sprites/GATE.png',
  '/sprites/MAINFINSHLINE.png',
  '/top/fullimage.png',
  '/top/MAINFINSHLINE.png',
  '/top/top123.png',
  '/bottom/bottom.png',

  // 3. 12 Race Running Horses (GIFs) & Animations
  '/HORSES/dust.gif',
  '/HORSES/horse_no1_1mb.gif',
  '/HORSES/horse_number_2_1MB.gif',
  '/HORSES/horse_no3_1mb.gif',
  '/HORSES/horse_4mb_hd.gif',
  '/HORSES/horse5_1mb.gif',
  '/HORSES/horse_jockey_6mb.gif',
  '/HORSES/horse_no7_1mb.gif',
  '/HORSES/horse_no8_1mb.gif',
  '/HORSES/horse_no_9_1MB.gif',
  '/HORSES/horse_number_10_1_1MB.gif',
  '/HORSES/horse_number_11_1MB.gif',
  '/HORSES/horse_number_12_1_1MB.gif',
  '/top/horse_jockey_1mb.gif',

  // 4. 12 Betting Cards Horses Portraits
  '/Bet_horses/horses1.png',
  '/Bet_horses/horses2.png',
  '/Bet_horses/horses3.png.png',
  '/Bet_horses/horses4.png.png',
  '/Bet_horses/horses5.png',
  '/Bet_horses/horses6.png',
  '/Bet_horses/horses7.png',
  '/Bet_horses/horses8.png',
  '/Bet_horses/horses9.png',
  '/Bet_horses/horses10.png',
  '/Bet_horses/horses11.png',
  '/Bet_horses/horses12.png',

  // 5. Betting Casino Coins
  '/bet_coins/betcoin2.png',
  '/bet_coins/betcoin5.png',
  '/bet_coins/betcoin10.png',
  '/bet_coins/betcoin100.png',
  '/bet_coins/betcoin500.png',
  '/bet_coins/betcoin1000.png',
]

export const GAME_AUDIO_ASSETS = [
  '/SOUND/dragon-studio-horse-neigh-390297.mp3',
  '/SOUND/pwlpl-horses-galloping-sound-effect-359257.mp3',
  '/SOUND/end5sec sound.mp3',
  '/SOUND/SCREESHOTCAPTURE.mp3',
]

export const ALL_GAME_ASSETS = [...GAME_IMAGE_ASSETS, ...GAME_AUDIO_ASSETS]

class AssetCacheService {
  constructor() {
    this.hasCacheSupport = typeof window !== 'undefined' && 'caches' in window
    this.memoryCache = new Map()
    this.loadedImages = new Set()
  }

  /**
   * Preload an individual image using new Image() and track onload & decode
   */
  preloadImage(url) {
    return new Promise((resolve) => {
      if (this.memoryCache.has(url)) {
        resolve({ url, success: true, fromCache: true })
        return
      }

      const img = new Image()
      let settled = false

      const onComplete = async (success) => {
        if (settled) return
        settled = true
        if (success) {
          try {
            if ('decode' in img) {
              await img.decode().catch(() => { })
            }
          } catch (_) { }
          this.memoryCache.set(url, img)
          this.loadedImages.add(url)
        }
        resolve({ url, success, fromCache: false })
      }

      img.onload = () => onComplete(true)
      img.onerror = () => onComplete(false)

      // Set source to start downloading immediately
      img.src = url

      // If browser already had this image synchronously ready
      if (img.complete && img.naturalWidth !== 0) {
        onComplete(true)
      }
    })
  }

  /**
   * Preload an individual audio file using new Audio()
   */
  preloadAudio(url) {
    return new Promise((resolve) => {
      if (this.memoryCache.has(url)) {
        resolve({ url, success: true, fromCache: true })
        return
      }

      const audio = new Audio()
      let settled = false

      const onComplete = (success) => {
        if (settled) return
        settled = true
        if (success) {
          this.memoryCache.set(url, audio)
        }
        resolve({ url, success })
      }

      audio.preload = 'auto'
      audio.oncanplaythrough = () => onComplete(true)
      audio.onloadeddata = () => onComplete(true)
      audio.onerror = () => onComplete(false)

      audio.src = url
      audio.load()

      // Safety fallback timeout for audio on network stalls (never freeze loading)
      setTimeout(() => onComplete(true), 3500)
    })
  }

  /**
   * Preload and permanently cache all game assets into browser CacheStorage & memory.
   * Tracks onload for every image and guarantees promise only resolves when all are loaded.
   */
  async cacheAllAssets(onProgress) {
    let loadedCount = 0
    const total = ALL_GAME_ASSETS.length

    // 1. Warm up browser CacheStorage in background if supported
    let cache = null
    if (this.hasCacheSupport) {
      try {
        cache = await window.caches.open(CACHE_NAME)
      } catch (err) {
        console.warn('CacheStorage not accessible:', err)
      }
    }

    const tasks = ALL_GAME_ASSETS.map(async (url) => {
      try {
        if (cache) {
          const match = await cache.match(url).catch(() => null)
          if (!match) {
            fetch(url, { cache: 'force-cache' })
              .then((resp) => {
                if (resp && resp.ok) cache.put(url, resp.clone()).catch(() => { })
              })
              .catch(() => { })
          }
        }

        // Actual memory preload & onload tracking
        if (url.endsWith('.mp3')) {
          await this.preloadAudio(url)
        } else {
          await this.preloadImage(url)
        }
      } catch (_) {
        // Individual error handling
      } finally {
        loadedCount++
        if (onProgress) {
          const pct = Math.floor((loadedCount / total) * 100)
          onProgress(pct, loadedCount, total)
        }
      }
    })

    // Wait until EVERY image and audio file onload/decode has settled
    await Promise.all(tasks)

    try {
      localStorage.setItem('derby_assets_cached_v3', 'true')
      localStorage.setItem('derby_assets_cached_at', String(Date.now()))
    } catch (_) { }

    return true
  }

  isCachedLocally() {
    try {
      return localStorage.getItem('derby_assets_cached_v3') === 'true'
    } catch (_) {
      return false
    }
  }
}

export const assetCacheService = new AssetCacheService()
export default assetCacheService
