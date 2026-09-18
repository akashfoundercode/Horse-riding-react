import React, { useState, useEffect, useRef } from 'react'
import { Sparkles, Trophy, Zap } from 'lucide-react'
import { assetCacheService, ALL_GAME_ASSETS, GAME_IMAGE_ASSETS } from '../services/assetCacheService.js'

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

    const handleProgress = (pct) => {
      if (!mountedRef.current) return
      realProgressRef.current = pct
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

    // 2. Smoothly animate percentage bar towards the actual downloaded assets progress
    const timer = setInterval(() => {
      if (!mountedRef.current || isFinishedRef.current) return

      const target = isAssetsReadyRef.current ? 100 : Math.min(98, realProgressRef.current)

      // Smooth step towards target
      if (displayedProgressRef.current < target) {
        const step = Math.max(1, Math.ceil((target - displayedProgressRef.current) * 0.15))
        displayedProgressRef.current = Math.min(target, displayedProgressRef.current + step)
        setProgress(displayedProgressRef.current)
      }

      // Check if horse is actively moving forward or paused
      if (displayedProgressRef.current > prevProgressRef.current) {
        prevProgressRef.current = displayedProgressRef.current
        lastMoveTimeRef.current = Date.now()
        if (!isMovingRef.current) {
          isMovingRef.current = true
          setIsMoving(true)
        }
      } else if (Date.now() - lastMoveTimeRef.current > 180) {
        // Horse has stopped moving forward -> Freeze legs on canvas!
        if (isMovingRef.current) {
          captureFreezeFrame()
          isMovingRef.current = false
          setIsMoving(false)
        }
      }

      // STRICT GATE: Complete ONLY when 100% of all images have finished downloading/decoding
      if (displayedProgressRef.current >= 100 && isAssetsReadyRef.current) {
        isFinishedRef.current = true
        captureFreezeFrame()
        isMovingRef.current = false
        setIsMoving(false)
        clearInterval(timer)
        setIsFadingOut(true)
        setTimeout(() => {
          if (mountedRef.current && onComplete) {
            onComplete()
          }
        }, 220)
      }
    }, 20)

    return () => {
      mountedRef.current = false
      clearInterval(timer)
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
