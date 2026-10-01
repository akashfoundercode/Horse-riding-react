import React, { useState, useEffect, useRef } from 'react'
import { Zap } from 'lucide-react'
import { assetCacheService } from '../services/assetCacheService.js'

// Core assets required by the main 3D loader itself
export const LOADER_CORE_ASSETS = [
  '/loader/laoder.png',
  '/loader/loaderline.png',
  '/sprites/mainlogo.png',
  '/HORSES/horse5_1mb.gif',
]

export default function DerbyAssetLoader({ onComplete }) {
  const [progress, setProgress] = useState(0)
  const [isFadingOut, setIsFadingOut] = useState(false)
  const [isMoving, setIsMoving] = useState(true)
  const isFinishedRef = useRef(false)
  const mountedRef = useRef(true)
  const realProgressRef = useRef(0)
  const isAssetsReadyRef = useRef(false)
  const displayedProgressRef = useRef(0)
  const imgRef = useRef(null)
  const canvasRef = useRef(null)

  // Stage 1: Rounded Circle Loader state (shows until loader's own assets are decoded)
  const [isLoaderAssetsReady, setIsLoaderAssetsReady] = useState(() => {
    return LOADER_CORE_ASSETS.every((url) => assetCacheService.memoryCache.has(url))
  })
  const [showCircleLoader, setShowCircleLoader] = useState(!isLoaderAssetsReady)

  const captureFreezeFrame = () => {
    if (imgRef.current && canvasRef.current) {
      try {
        const imgEl = imgRef.current
        const canvas = canvasRef.current
        const w = imgEl.naturalWidth || imgEl.clientWidth || 300
        const h = imgEl.naturalHeight || imgEl.clientHeight || 200
        if (canvas.width !== w) canvas.width = w
        if (canvas.height !== h) canvas.height = h
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        if (ctx) {
          ctx.clearRect(0, 0, w, h)
          ctx.drawImage(imgEl, 0, 0, w, h)
        }
      } catch (_) { }
    }
  }

  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  useEffect(() => {
    mountedRef.current = true
    isFinishedRef.current = false
    isAssetsReadyRef.current = false
    displayedProgressRef.current = 0
    realProgressRef.current = 0
    setIsMoving(true)

    // 0. Stage 1: Preload the loader's own assets first so rounded loader can smoothly transition
    if (!isLoaderAssetsReady) {
      Promise.all(LOADER_CORE_ASSETS.map((url) => assetCacheService.preloadImage(url)))
        .then(() => {
          if (mountedRef.current) {
            setIsLoaderAssetsReady(true)
            setTimeout(() => {
              if (mountedRef.current) setShowCircleLoader(false)
            }, 350)
          }
        })
        .catch(() => {
          if (mountedRef.current) {
            setIsLoaderAssetsReady(true)
            setTimeout(() => {
              if (mountedRef.current) setShowCircleLoader(false)
            }, 350)
          }
        })
    }

    const finishLoader = () => {
      if (isFinishedRef.current) return
      isFinishedRef.current = true
      setProgress(100)
      captureFreezeFrame()
      setIsMoving(false)
      setIsFadingOut(true)
      setTimeout(() => {
        if (mountedRef.current && onCompleteRef.current) {
          onCompleteRef.current()
        }
      }, 250)
    }

    const handleProgress = (pct) => {
      if (!mountedRef.current || isFinishedRef.current) return
      realProgressRef.current = Math.max(realProgressRef.current, pct)
    }

    // 1. Stage 2: Actively preload and decode ALL game assets (12 race horse GIFs, coins, tracks, sounds)
    assetCacheService
      .cacheAllAssets(handleProgress)
      .then(() => {
        if (!mountedRef.current || isFinishedRef.current) return
        isAssetsReadyRef.current = true
        realProgressRef.current = 100
      })
      .catch((err) => {
        console.warn('Asset loading warning:', err)
        if (!mountedRef.current || isFinishedRef.current) return
        isAssetsReadyRef.current = true
        realProgressRef.current = 100
      })

    // 2. Smoothly animate percentage bar towards real asset loading progress
    const timer = setInterval(() => {
      if (!mountedRef.current || isFinishedRef.current) return

      // Strictly stay under 95% until ALL assets are genuinely ready
      const target = isAssetsReadyRef.current
        ? 100
        : Math.min(95, Math.max(realProgressRef.current, 5))

      if (displayedProgressRef.current < target) {
        const diff = target - displayedProgressRef.current
        const step = Math.max(1, Math.min(diff, Math.ceil(diff * 0.18)))
        displayedProgressRef.current = Math.min(target, displayedProgressRef.current + step)
        setProgress(displayedProgressRef.current)
      }

      // Complete ONLY when all assets are confirmed ready AND displayed progress reaches 100%
      if (isAssetsReadyRef.current && displayedProgressRef.current >= 100) {
        clearInterval(timer)
        setTimeout(() => {
          if (mountedRef.current && !isFinishedRef.current) {
            finishLoader()
          }
        }, 250)
      }
    }, 25)

    // Hard emergency safety timeout (20s): avoids eternal lockup only on completely dead connections
    const hardTimeout = setTimeout(() => {
      if (mountedRef.current && !isFinishedRef.current) {
        isAssetsReadyRef.current = true
        displayedProgressRef.current = 100
        setProgress(100)
        finishLoader()
      }
    }, 20000)

    return () => {
      mountedRef.current = false
      clearInterval(timer)
      clearTimeout(hardTimeout)
      assetCacheService.removeProgressListener(handleProgress)
    }
  }, [])

  // Precise forward position calculation for horse on loaderline.png
  // Start Gate at ~10%, Finish Gate at ~82%
  const horseLeftPct = (10 + (progress * 0.72)).toFixed(2)

  return (
    <div
      className="derby-asset-loader-root"
      style={{
        transition: 'opacity 0.25s ease-out',
        opacity: isFadingOut ? 0 : 1,
        pointerEvents: isFadingOut ? 'none' : 'all',
      }}
    >
      {/* STAGE 1: ROUNDED CIRCLE LOADER (Active until loader's background, logo, trackline, and horse gif are decoded) */}
      {showCircleLoader && (
        <div
          className="derby-circle-loader-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999999,
            backgroundColor: '#070b14',
            backgroundImage: 'radial-gradient(ellipse at 50% 50%, #1e1308 0%, #070b14 85%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            userSelect: 'none',
            transition: 'opacity 0.35s ease-out',
            opacity: isLoaderAssetsReady ? 0 : 1,
            pointerEvents: isLoaderAssetsReady ? 'none' : 'all',
          }}
        >
          <div className="initial-spinner-ring" />
          <div className="initial-spinner-text">LOADING...</div>
        </div>
      )}

      {/* STAGE 2: 3D DERBY TRACK LOADER (Preloaded with background, logo, trackline, and running horse) */}
      {/* User Uploaded Loader Background Image - Subtle Blur Background */}
      <img
        src="/loader/laoder.png"
        alt="Derby Loader Background"
        loading="eager"
        fetchpriority="high"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center',
          filter: 'blur(4px) brightness(0.95)',
          transform: 'scale(1.03)',
        }}
      />

      {/* Main Content Wrap (Logo + Track Dock + Percent) */}
      <div className="derby-loader-content-wrap">
        {/* Main 3D Golden Game Logo - Centered above loader line */}
        <div className="derby-loader-logo-wrap">
          <img
            src="/sprites/mainlogo.png"
            alt="Horse Racing Main Logo"
            loading="eager"
            fetchpriority="high"
            className="derby-loader-logo-img"
          />
        </div>

        {/* Clean Loader Dock Container directly on top of background */}
        <div className="derby-loader-dock">
          {/* LOADERLINE 3D TRACK CONTAINER WITH RUNNING HORSE */}
          <div className="derby-loader-track-wrap">
            {/* User's Loaderline Track Graphic (Start & Finish Gates, Fences, Grass, Dirt) */}
            <img
              src="/loader/loaderline.png"
              alt="Track Loader Line"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                pointerEvents: 'none',
              }}
            />

            {/* Running Horse Galloping Directly on the Dirt Road of loaderline.png */}
            <div
              style={{
                position: 'absolute',
                left: `${horseLeftPct}%`,
                bottom: '36%',
                height: '38%',
                aspectRatio: '92 / 68',
                transform: 'translateX(-50%)',
                pointerEvents: 'none',
                zIndex: 5,
                transition: 'left 0.05s linear',
              }}
            >
              {/* Animated Running Horse GIF while moving forward */}
              <img
                ref={imgRef}
                src="/HORSES/horse5_1mb.gif"
                alt="Running Derby Horse"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 3px 6px rgba(0, 0, 0, 0.8)) drop-shadow(0 0 8px rgba(245, 158, 11, 0.4))',
                  display: isMoving ? 'block' : 'none',
                }}
              />
              {/* Frozen Snapshot Canvas when horse stops so legs freeze in place */}
              <canvas
                ref={canvasRef}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 3px 6px rgba(0, 0, 0, 0.8)) drop-shadow(0 0 8px rgba(245, 158, 11, 0.4))',
                  display: isMoving ? 'none' : 'block',
                }}
              />
            </div>
          </div>

          {/* Numerical Percentage & Status Text */}
          <div style={{ textAlign: 'center', marginTop: '2px' }}>
            <div
              style={{
                fontSize: '26px',
                fontWeight: '900',
                color: '#fbbf24',
                textShadow: '0 0 18px rgba(245, 158, 11, 0.65)',
                letterSpacing: '1px',
                lineHeight: 1.1,
                marginBottom: '3px',
              }}
            >
              {progress}%
            </div>
            <div
              style={{
                fontSize: '11px',
                fontWeight: '700',
                letterSpacing: '1.4px',
                color: '#cbd5e1',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Zap size={12} className="text-amber-400" />
              <span>{progress >= 100 ? 'GET READY FOR RACE! 🏁' : 'GET READY FOR RACE...'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
