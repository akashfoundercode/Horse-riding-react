import { useState, useEffect } from 'react'
import { assetCacheService } from '../services/assetCacheService.js'

/**
 * Enterprise Custom Hook for tracking Asset Loading Progress
 */
export function useAssetLoader() {
  const [progress, setProgress] = useState(0)
  const [isReady, setIsReady] = useState(assetCacheService.isCriticalReady)

  useEffect(() => {
    if (assetCacheService.isCriticalReady) {
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

    assetCacheService.preloadCriticalAssets(handleProgress)

    return () => {
      assetCacheService.removeProgressListener(handleProgress)
    }
  }, [])

  return { progress, isReady }
}

export default useAssetLoader

