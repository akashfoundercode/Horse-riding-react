import React, { useState, useEffect, useRef } from 'react'
import { Sparkles, Trophy, Zap } from 'lucide-react'
import { assetCacheService, ALL_GAME_ASSETS, GAME_IMAGE_ASSETS } from '../services/assetCacheService.js'

export default function DerbyAssetLoader({ onComplete }) {
  const [progress, setProgress] = useState(0)
  const [isFadingOut, setIsFadingOut] = useState(false)
  const isFinishedRef = useRef(false)
  const mountedRef = useRef(true)
  const realProgressRef = useRef(0)
  const isAssetsReadyRef = useRef(false)
  const displayedProgressRef = useRef(0)

  useEffect(() => {
    mountedRef.current = true
    isFinishedRef.current = false
    isAssetsReadyRef.current = false
    displayedProgressRef.current = 0

    // 1. Actively preload and decode all game images and sprites using new Image()
    assetCacheService
      .cacheAllAssets((pct, loaded, total) => {
        realProgressRef.current = pct
      })
      .then(() => {
        isAssetsReadyRef.current = true
        realProgressRef.current = 100
      })
      .catch((err) => {
        console.warn('Asset loading warning:', err)
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

      // STRICT GATE: Complete ONLY when 100% of all images have finished downloading/decoding
      if (displayedProgressRef.current >= 100 && isAssetsReadyRef.current) {
        isFinishedRef.current = true
        clearInterval(timer)
        setIsFadingOut(true)
        setTimeout(() => {
          if (mountedRef.current && onComplete) {
            onComplete()
          }
        }, 200)
      }
    }, 25)

    return () => {
      mountedRef.current = false
      clearInterval(timer)
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
              <img
                src="/HORSES/horse5_1mb.gif"
                alt="Running Derby Horse"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 3px 6px rgba(0, 0, 0, 0.8)) drop-shadow(0 0 8px rgba(245, 158, 11, 0.4))',
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
