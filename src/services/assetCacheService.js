/**
 * Enterprise Asset Cache & Preloading Service
 * - Preloads all game images, sprites, and audio via Promise.all and new Image().
 * - Tracks every image's onload and decode events.
 * - Non-blocking: Loader graphics appear instantly while all game assets download concurrently.
 */

const CACHE_NAME = 'derby-asset-cache-v4'

export const GAME_IMAGE_ASSETS = [
  // 1. Loader Graphics
  '/loader/loader.png',
  '/loader/laoder.png',
  '/loader/loaderline.png',

  // 2. Main Game UI, Frames & Background Sprites
  '/sprites/mainlogo.png',
  '/sprites/image.png',
  '/sprites/GATE.png',
  '/top/fullimage.png',
  '/top/fullimage.jpg',
  '/top/MAINFINSHLINE.png',
  '/top/top123.png',

  // 3. 12 Race Running Horses (GIFs) & Animations
  '/HORSES/horse5_1mb.gif',
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
    this.progressListeners = new Set()
    this.totalAssets = ALL_GAME_ASSETS.length
    this.loadedCount = 0
    this.isCompleted = false
    this.preloadingStarted = false
    this.preloadPromise = null
  }

  /**
   * Starts preloading ALL game images & sounds concurrently in parallel (Promise.all)
   */
  startPreloading() {
    if (this.preloadingStarted) return this.preloadPromise
    this.preloadingStarted = true

    this.preloadPromise = new Promise((resolve) => {
      let settledCount = 0
      const total = ALL_GAME_ASSETS.length

      const notify = () => {
        this.loadedCount = settledCount
        const pct = Math.floor((settledCount / total) * 100)
        this.progressListeners.forEach((fn) => {
          try {
            fn(pct, settledCount, total)
          } catch (_) { }
        })
      }

      // 1. Fire ALL image preloads simultaneously in parallel via Promise.all
      const imagePromises = GAME_IMAGE_ASSETS.map((url) => {
        return new Promise((res) => {
          const img = new Image()
          let done = false

          const finish = async (ok) => {
            if (done) return
            done = true
            if (ok) {
              try {
                if ('decode' in img) {
                  await img.decode().catch(() => { })
                }
              } catch (_) { }
              this.memoryCache.set(url, img)
            }
            settledCount++
            notify()
            res()
          }

          img.onload = () => finish(true)
          img.onerror = () => finish(false)

          // Start network request immediately
          img.src = url

          if (img.complete && img.naturalWidth !== 0) {
            finish(true)
          }
        })
      })

      // 2. Fire ALL audio preloads simultaneously in parallel
      const audioPromises = GAME_AUDIO_ASSETS.map((url) => {
        return new Promise((res) => {
          const audio = new Audio()
          let done = false

          const finish = (ok) => {
            if (done) return
            done = true
            if (ok) this.memoryCache.set(url, audio)
            settledCount++
            notify()
            res()
          }

          audio.preload = 'auto'
          audio.oncanplaythrough = () => finish(true)
          audio.onloadeddata = () => finish(true)
          audio.onerror = () => finish(false)
          audio.src = url
          audio.load()

          // 3.5s safety fallback for network stalls
          setTimeout(() => finish(true), 3500)
        })
      })

      // Parallel execution: Resolves when 100% of assets have fired onload
      Promise.all([...imagePromises, ...audioPromises]).then(async () => {
        // Also wait for document fonts to be ready
        if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
          try {
            await document.fonts.ready
          } catch (_) { }
        }
        this.isCompleted = true
        settledCount = total
        notify()
        resolve(true)
      })
    })

    // Background asynchronous CacheStorage caching (non-blocking)
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

    return this.preloadPromise
  }

  /**
   * Subscribe to live progress updates
   */
  cacheAllAssets(onProgress) {
    if (onProgress) {
      this.progressListeners.add(onProgress)
      const currentPct = Math.floor((this.loadedCount / this.totalAssets) * 100)
      onProgress(currentPct, this.loadedCount, this.totalAssets)
    }

    const promise = this.startPreloading()

    if (this.isCompleted) {
      return Promise.resolve(true)
    }
    return promise
  }

  removeProgressListener(onProgress) {
    if (onProgress) {
      this.progressListeners.delete(onProgress)
    }
  }
}

export const assetCacheService = new AssetCacheService()

// Automatically trigger preloading immediately on module load for zero-delay start
if (typeof window !== 'undefined') {
  assetCacheService.startPreloading()
}

export default assetCacheService
