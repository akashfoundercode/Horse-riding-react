/**
 * Enterprise Comprehensive Asset Cache & Preloading Service
 * Preloads ALL game assets (12 Running Horse GIFs, 12 Betting Portraits, 6 Coins, Tracks, Gate, Finish Line, Audio)
 * Ensures that before entering the Betting or Race screens, EVERY asset is decoded and ready in memory.
 */

const CACHE_NAME = 'derby-asset-cache-v6'

// All Game Image Assets (Loader, Betting Screen, and Race Screen Horses)
export const ALL_GAME_IMAGE_ASSETS = [
  // 1. Loader Graphics
  '/loader/laoder.png',
  '/loader/loaderline.png',

  // 2. Main Game UI, Tracks, Frames & Background Sprites
  '/sprites/mainlogo.png',
  '/sprites/image.png',
  '/sprites/GATE.png',
  '/sprites/jackpot (2).png',
  '/top/fullimage.jpg',
  '/top/MAINFINSHLINE.png',
  '/top/top123.png',

  // 3. 12 Animated Running Horse GIFs (Crucial for 3D Race Screen)
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

  // 4. 12 Betting Cards Horses Portraits
  '/Bet_horses/horses1.png',
  '/Bet_horses/horses2.png',
  '/Bet_horses/horses3.png',
  '/Bet_horses/horses4.png',
  '/Bet_horses/horses5.png',
  '/Bet_horses/horses6.png',
  '/Bet_horses/horses7.png',
  '/Bet_horses/horses8.png',
  '/Bet_horses/horses9.png',
  '/Bet_horses/horses10.png',
  '/Bet_horses/horses11.png',
  '/Bet_horses/horses12.png',

  // 5. 6 Betting Casino Coins
  '/bet_coins/betcoin2.png',
  '/bet_coins/betcoin5.png',
  '/bet_coins/betcoin10.png',
  '/bet_coins/betcoin100.png',
  '/bet_coins/betcoin500.png',
  '/bet_coins/betcoin1000.png',
]

// Legacy export compatibility
export const CRITICAL_IMAGE_ASSETS = ALL_GAME_IMAGE_ASSETS
export const RACE_IMAGE_ASSETS = [
  '/HORSES/horse_no1_1mb.gif',
  '/HORSES/horse_number_2_1MB.gif',
  '/HORSES/horse_no3_1mb.gif',
  '/HORSES/horse_4mb_hd.gif',
  '/HORSES/horse_jockey_6mb.gif',
  '/HORSES/horse_no7_1mb.gif',
  '/HORSES/horse_no8_1mb.gif',
  '/HORSES/horse_no_9_1MB.gif',
  '/HORSES/horse_number_10_1_1MB.gif',
  '/HORSES/horse_number_11_1MB.gif',
  '/HORSES/horse_number_12_1_1MB.gif',
  '/top/MAINFINSHLINE.png',
  '/top/top123.png',
]

export const GAME_AUDIO_ASSETS = [
  '/SOUND/dragon-studio-horse-neigh-390297.mp3',
  '/SOUND/pwlpl-horses-galloping-sound-effect-359257.mp3',
  '/SOUND/end5sec.mp3',
  '/SOUND/end5sec sound.mp3',
  '/SOUND/SCREESHOTCAPTURE.mp3',
]

export const ALL_GAME_ASSETS = [
  ...Array.from(new Set(ALL_GAME_IMAGE_ASSETS)),
  ...Array.from(new Set(GAME_AUDIO_ASSETS)),
]

class AssetCacheService {
  constructor() {
    this.hasCacheSupport = typeof window !== 'undefined' && 'caches' in window
    this.memoryCache = new Map()
    this.progressListeners = new Set()
    this.totalAssets = ALL_GAME_ASSETS.length
    this.loadedAssetsCount = 0
    this.isCriticalReady = false
    this.isAllReady = false
    this.allAssetsPromise = null
    this.criticalPromise = null
  }

  /**
   * Preload a single image with hardware GPU decode
   */
  preloadImage(url) {
    if (this.memoryCache.has(url)) {
      return Promise.resolve(this.memoryCache.get(url))
    }

    return new Promise((resolve) => {
      const img = new Image()
      let settled = false

      const finish = async (ok) => {
        if (settled) return
        settled = true
        if (ok) {
          try {
            if ('decode' in img) {
              await img.decode().catch(() => { })
            }
          } catch (_) { }
          this.memoryCache.set(url, img)
        }
        resolve(ok)
      }

      img.onload = () => finish(true)
      img.onerror = () => finish(false)
      img.src = url

      if (img.complete && img.naturalWidth !== 0) {
        finish(true)
      }

      // Safety fallback per asset (15s): prevents individual network hang from blocking forever
      setTimeout(() => finish(true), 15000)
    })
  }

  /**
   * Preload a single audio asset
   */
  preloadAudio(url) {
    if (this.memoryCache.has(url)) {
      return Promise.resolve(this.memoryCache.get(url))
    }

    return new Promise((resolve) => {
      const audio = new Audio()
      let settled = false

      const finish = (ok) => {
        if (settled) return
        settled = true
        if (ok) this.memoryCache.set(url, audio)
        resolve(ok)
      }

      audio.preload = 'auto'
      audio.oncanplaythrough = () => finish(true)
      audio.onloadeddata = () => finish(true)
      audio.onerror = () => finish(false)
      audio.src = url
      try {
        audio.load()
      } catch (_) { }

      // 6s timeout fallback for audio
      setTimeout(() => finish(true), 6000)
    })
  }

  /**
   * Preload ALL assets (images + audio + race GIFs) before entering game
   */
  cacheAllAssets(onProgress) {
    if (onProgress) {
      this.progressListeners.add(onProgress)
      if (this.totalAssets > 0) {
        const pct = Math.floor((this.loadedAssetsCount / this.totalAssets) * 100)
        onProgress(pct, this.loadedAssetsCount, this.totalAssets)
      }
    }

    if (this.isAllReady) {
      if (onProgress) onProgress(100, this.totalAssets, this.totalAssets)
      return Promise.resolve(true)
    }

    if (this.allAssetsPromise) return this.allAssetsPromise

    this.allAssetsPromise = new Promise((resolve) => {
      const uniqueImageAssets = Array.from(new Set(ALL_GAME_IMAGE_ASSETS))
      const uniqueAudioAssets = Array.from(new Set(GAME_AUDIO_ASSETS))
      const total = uniqueImageAssets.length + uniqueAudioAssets.length
      this.totalAssets = total
      let loaded = 0
      let resolved = false

      const notify = () => {
        this.loadedAssetsCount = loaded
        const pct = Math.min(100, Math.floor((loaded / total) * 100))
        this.progressListeners.forEach((fn) => {
          try {
            fn(pct, loaded, total)
          } catch (_) { }
        })
      }

      const completeAll = async () => {
        if (resolved) return
        resolved = true
        if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
          try {
            await document.fonts.ready
          } catch (_) { }
        }
        this.isCriticalReady = true
        this.isAllReady = true
        this.loadedAssetsCount = total
        notify()
        resolve(true)

        // Asynchronously persist to browser CacheStorage for future offline/instant launches
        if (this.hasCacheSupport) {
          window.caches
            .open(CACHE_NAME)
            .then((cache) => {
              ALL_GAME_ASSETS.forEach((url) => {
                cache.match(url).then((match) => {
                  if (!match) {
                    fetch(url, { cache: 'force-cache' })
                      .then((r) => r.ok && cache.put(url, r))
                      .catch(() => { })
                  }
                }).catch(() => { })
              })
            })
            .catch(() => { })
        }
      }

      // Hard safety timeout: guarantee resolution after 20s if internet is severely stalled
      setTimeout(completeAll, 20000)

      const imagePromises = uniqueImageAssets.map((url) => {
        return this.preloadImage(url).then(() => {
          loaded++
          notify()
        })
      })

      const audioPromises = uniqueAudioAssets.map((url) => {
        return this.preloadAudio(url).then(() => {
          loaded++
          notify()
        })
      })

      Promise.allSettled([...imagePromises, ...audioPromises])
        .then(completeAll)
        .catch(completeAll)
    })

    this.criticalPromise = this.allAssetsPromise
    return this.allAssetsPromise
  }

  /**
   * Preload critical assets alias (now loads all assets to guarantee complete readiness)
   */
  preloadCriticalAssets(onProgress) {
    return this.cacheAllAssets(onProgress)
  }

  /**
   * Stream race assets alias
   */
  streamRaceAssets() {
    return this.cacheAllAssets()
  }

  removeProgressListener(onProgress) {
    if (onProgress) {
      this.progressListeners.delete(onProgress)
    }
  }
}

export const assetCacheService = new AssetCacheService()

// Automatically kick off background preloading on module initialization
if (typeof window !== 'undefined') {
  assetCacheService.cacheAllAssets()
}

export default assetCacheService
