import React, { useState, useEffect, useRef } from 'react'
import { Sparkles, Trophy, Zap } from 'lucide-react'
import { assetCacheService, ALL_GAME_ASSETS } from '../services/assetCacheService.js'

const MIN_ANIMATION_MS = 2800

export default function DerbyAssetLoader({ onComplete }) {
  const [progress, setProgress] = useState(0)
  const [isFadingOut, setIsFadingOut] = useState(false)
  const isFinishedRef = useRef(false)
  const mountedRef = useRef(true)
  const startTimeRef = useRef(Date.now())
  const realProgressRef = useRef(0)
  const isAssetsReadyRef = useRef(false)

  useEffect(() => {
    mountedRef.current = true
    startTimeRef.current = Date.now()

    // 1. Actively download and decode all game assets into GPU/RAM
    assetCacheService.cacheAllAssets((pct) => {
      realProgressRef.current = pct
    }).then(() => {
      isAssetsReadyRef.current = true
    }).catch(() => {
      isAssetsReadyRef.current = true
    })

    const timer = setInterval(() => {
      if (!mountedRef.current || isFinishedRef.current) return

      const elapsed = Date.now() - startTimeRef.current
      const timeRatio = Math.min(1, elapsed / MIN_ANIMATION_MS)
      const realRatio = (realProgressRef.current || 0) / 100

      // Progress is smoothly driven by time and actual downloaded assets
      let current = Math.floor(Math.min(timeRatio, Math.max(0.2, realRatio)) * 100)

      // STRICT GATE: Hold at 99% until 100% of game assets are completely decoded in memory
      if (!isAssetsReadyRef.current) {
        current = Math.min(98, current)
      } else if (timeRatio >= 1) {
        current = 100
      }

      setProgress(current)

      if (current >= 100 && isAssetsReadyRef.current) {
        isFinishedRef.current = true
        clearInterval(timer)
        setIsFadingOut(true)
        setTimeout(() => {
          if (mountedRef.current && onComplete) {
            onComplete()
          }
        }, 150)
      }
    }, 20)

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
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        backgroundColor: '#070b14',
        backgroundImage: 'radial-gradient(ellipse at 50% 35%, #1e150a 0%, #080c16 80%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingBottom: 'clamp(20px, 4vh, 40px)',
        fontFamily: "'Segoe UI', Roboto, sans-serif",
        color: '#ffffff',
        transition: 'opacity 0.25s ease-out',
        opacity: isFadingOut ? 0 : 1,
        pointerEvents: isFadingOut ? 'none' : 'all',
        userSelect: 'none',
        overflow: 'hidden',
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

      {/* Main 3D Golden Game Logo - Centered above loader line */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          width: 'min(86vw, 440px)',
          marginBottom: 'clamp(14px, 3vh, 28px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          pointerEvents: 'none',
        }}
      >
        <img
          src="/sprites/mainlogo.png"
          alt="Horse Racing Main Logo"
          loading="eager"
          fetchpriority="high"
          style={{
            width: '100%',
            height: 'auto',
            maxHeight: 'min(36vh, 220px)',
            objectFit: 'contain',
            filter: 'drop-shadow(0 12px 30px rgba(0, 0, 0, 0.85)) drop-shadow(0 0 16px rgba(245, 158, 11, 0.45))',
          }}
        />
      </div>

      {/* Clean Loader Dock Container directly on top of background without any background box/shadow */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          width: 'min(94vw, 680px)',
          background: 'transparent',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* LOADERLINE 3D TRACK CONTAINER WITH RUNNING HORSE */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '2170 / 725',
            maxHeight: '170px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
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
  )
}
