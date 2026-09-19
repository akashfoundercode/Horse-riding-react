import React, { useState, useEffect, useRef } from 'react'
import { Sparkles, Trophy, Zap } from 'lucide-react'
import { assetCacheService } from '../services/assetCacheService.js'

export default function DerbyAssetLoader({ onComplete }) {
  const [progress, setProgress] = useState(0)
  const [isFadingOut, setIsFadingOut] = useState(false)
  const [isMoving, setIsMoving] = useState(true)
  const isFinishedRef = useRef(false)
  const mountedRef = useRef(true)
  const realProgressRef = useRef(0)
  const isAssetsReadyRef = useRef(false)
  const displayedProgressRef = useRef(0)
  const prevProgressRef = useRef(0)
  const lastMoveTimeRef = useRef(Date.now())
  const isMovingRef = useRef(true)
  const imgRef = useRef(null)
  const canvasRef = useRef(null)

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

  useEffect(() => {
    mountedRef.current = true
    isFinishedRef.current = false
    isAssetsReadyRef.current = false
    displayedProgressRef.current = 0
    prevProgressRef.current = 0
    lastMoveTimeRef.current = Date.now()
    isMovingRef.current = true

    const finishLoader = () => {
      if (isFinishedRef.current) return
      isFinishedRef.current = true
      setProgress(100)
      captureFreezeFrame()
      isMovingRef.current = false
      setIsMoving(false)
      setIsFadingOut(true)
      setTimeout(() => {
        if (mountedRef.current && onComplete) {
          onComplete()
        }
      }, 200)
    }

    const handleProgress = (pct) => {
      if (!mountedRef.current) return
      realProgressRef.current = Math.max(realProgressRef.current, pct)
    }

    // 1. Actively preload and decode all game images in parallel
    assetCacheService
      .cacheAllAssets(handleProgress)
      .then(() => {
        if (!mountedRef.current) return
        isAssetsReadyRef.current = true
        realProgressRef.current = 100
      })
      .catch((err) => {
        console.warn('Asset loading warning:', err)
        if (!mountedRef.current) return
        isAssetsReadyRef.current = true
        realProgressRef.current = 100
      })

    // 2. Smoothly animate percentage bar towards 100%
    const startTime = Date.now()
    const timer = setInterval(() => {
      if (!mountedRef.current || isFinishedRef.current) return

      const elapsed = Date.now() - startTime
      // Natural progress based on elapsed time (reaches 100% by ~1.5s)
      const timeBasedProgress = Math.min(100, Math.floor((elapsed / 1500) * 100))

      const target = isAssetsReadyRef.current
        ? 100
        : Math.max(timeBasedProgress, realProgressRef.current)

      // Smooth step towards target
      if (displayedProgressRef.current < target) {
        const step = Math.max(1, Math.ceil((target - displayedProgressRef.current) * 0.2))
        displayedProgressRef.current = Math.min(100, displayedProgressRef.current + step)
        setProgress(displayedProgressRef.current)
      }

      // Check if horse is actively moving forward
      if (displayedProgressRef.current > prevProgressRef.current) {
        prevProgressRef.current = displayedProgressRef.current
        lastMoveTimeRef.current = Date.now()
        if (!isMovingRef.current) {
          isMovingRef.current = true
          setIsMoving(true)
        }
      }

      // Complete when 100% reached or time elapsed
      if (displayedProgressRef.current >= 100 || elapsed >= 1800) {
        clearInterval(timer)
        finishLoader()
      }
    }, 25)

    // Hard emergency safety timeout: never stay stuck past 2.0s
    const hardTimeout = setTimeout(() => {
      if (mountedRef.current && !isFinishedRef.current) {
        finishLoader()
      }
    }, 2000)

    return () => {
      mountedRef.current = false
      clearInterval(timer)
      clearTimeout(hardTimeout)
      assetCacheService.removeProgressListener(handleProgress)
    }
  }, [onComplete])

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

        {/* Clean Loader Dock Container directly on top of background without any background box/shadow */}
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
                transition: 'left 0.04s linear',
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
