/**
 * Enterprise Asset Cache Service
 * Provides permanent client-side persistent storage and CacheStorage for all game images, GIFs, and audio.
 * Prevents re-downloading large images over slow networks.
 */

const CACHE_NAME = 'derby-asset-cache-v2'

export const ALL_GAME_ASSETS = [
  '/loader/laoder.png',
  '/loader/loaderline.png',
  '/sprites/mainlogo.png',
  '/sprites/image.png',
  '/top/fullimage.png',
  '/top/MAINFINSHLINE.png',
  '/sprites/GATE.png',
  '/HORSES/dust.gif',
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
  '/bet_coins/betcoin2.png',
  '/bet_coins/betcoin5.png',
  '/bet_coins/betcoin10.png',
  '/bet_coins/betcoin100.png',
  '/bet_coins/betcoin500.png',
  '/bet_coins/betcoin1000.png',
  '/SOUND/dragon-studio-horse-neigh-390297.mp3',
  '/SOUND/pwlpl-horses-galloping-sound-effect-359257.mp3',
  '/SOUND/end5sec sound.mp3',
  '/SOUND/SCREESHOTCAPTURE.mp3',
]

class AssetCacheService {
  constructor() {
    this.hasCacheSupport = typeof window !== 'undefined' && 'caches' in window
    this.memoryCache = new Map()
  }

  /**
   * Preload and permanently cache all game assets into browser CacheStorage & memory
   */
  async cacheAllAssets(onProgress) {
    let loadedCount = 0
    const total = ALL_GAME_ASSETS.length

    // 1. Try CacheStorage first
    let cache = null
    if (this.hasCacheSupport) {
      try {
        cache = await window.caches.open(CACHE_NAME)
      } catch (err) {
        console.warn('CacheStorage not accessible, falling back to memory preload:', err)
      }
    }

    const tasks = ALL_GAME_ASSETS.map(async (url) => {
      try {
        // Parallel CacheStorage fetch + memory decode
        if (cache) {
          const match = await cache.match(url)
          if (!match) {
            const resp = await fetch(url, { cache: 'force-cache' }).catch(() => null)
            if (resp && resp.ok) {
              await cache.put(url, resp.clone()).catch(() => { })
            }
          }
        }

        // Full browser memory decode so images never pop in late
        if (url.endsWith('.mp3')) {
          await new Promise((resolve) => {
            const audio = new Audio()
            audio.preload = 'auto'
            audio.oncanplaythrough = () => {
              this.memoryCache.set(url, audio)
              resolve()
            }
            audio.onerror = () => resolve()
            audio.src = url
            setTimeout(resolve, 3000) // Fallback timeout per sound
          })
        } else {
          await new Promise((resolve) => {
            const img = new Image()
            img.onload = async () => {
              try {
                if ('decode' in img) {
                  await img.decode()
                }
              } catch (_) { }
              this.memoryCache.set(url, img)
              resolve()
            }
            img.onerror = () => resolve()
            img.src = url
          })
        }
      } catch (_) {
        // Soft fail per asset so loading is never blocked
      } finally {
        loadedCount++
        if (onProgress) {
          onProgress(Math.floor((loadedCount / total) * 100))
        }
      }
    })

    await Promise.allSettled(tasks)
    try {
      localStorage.setItem('derby_assets_cached_v2', 'true')
      localStorage.setItem('derby_assets_cached_at', String(Date.now()))
    } catch (_) { }
    return true
  }

  isCachedLocally() {
    try {
      return localStorage.getItem('derby_assets_cached_v2') === 'true'
    } catch (_) {
      return false
    }
  }
}

export const assetCacheService = new AssetCacheService()
export default assetCacheService

