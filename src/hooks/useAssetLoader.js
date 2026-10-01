import { useState, useEffect } from 'react'
import { assetCacheService } from '../services/assetCacheService.js'

/**
 * Enterprise Custom Hook for tracking Asset Loading Progress
 */
export function useAssetLoader() {
  const [progress, setProgress] = useState(0)
  const [isReady, setIsReady] = useState(assetCacheService.isAllReady)

  useEffect(() => {
    if (assetCacheService.isAllReady) {
      setProgress(100)
      setIsReady(true)
      return
    }

    const handleProgress = (pct) => {
      setProgress(pct)
      if (pct >= 100) {
        setIsReady(true)
      }
    }

    assetCacheService.cacheAllAssets(handleProgress)

    return () => {
      assetCacheService.removeProgressListener(handleProgress)
    }
  }, [])

  return { progress, isReady }
}

export default useAssetLoader
