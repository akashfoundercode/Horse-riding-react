import React, { useState, useEffect, useRef } from 'react'
import { Sparkles, Trophy, Zap } from 'lucide-react'

// All real website game assets preloaded before entering the game
const PRELOAD_ASSETS = [
  '/loader/laoder.png',
  '/loader/loaderline.png',
  '/sprites/mainlogo.png',
  '/sprites/BG TRACK.png',
  '/sprites/MAINFINSHLINE.png',
  '/sprites/GATE.png',
  '/HORSES/dust.gif',
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
  '/SOUND/SCREESHOTCAPTURE.mp3',
]

const DURATION_MS = 2800

export default function DerbyAssetLoader({ onComplete }) {
  const [progress, setProgress] = useState(0)
  const [isFadingOut, setIsFadingOut] = useState(false)
  const isFinishedRef = useRef(false)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true

    // Background preload images & audio
    PRELOAD_ASSETS.forEach((src) => {
      if (src.endsWith('.mp3')) {
        const audio = new Audio()
        audio.src = src
      } else {
        const img = new Image()
        img.src = src
      }
    })

    // Fixed absolute start time so re-renders CAN NEVER restart the counter
    if (!globalThis.__DERBY_LOADER_START_TIME__) {
      globalThis.__DERBY_LOADER_START_TIME__ = Date.now()
    }
    const startTime = globalThis.__DERBY_LOADER_START_TIME__

    const timer = setInterval(() => {
      if (!mountedRef.current || isFinishedRef.current) return

      const elapsed = Date.now() - startTime
      const current = Math.min(100, Math.floor((elapsed / DURATION_MS) * 100))

      setProgress(current)

      if (current >= 100) {
        isFinishedRef.current = true
        clearInterval(timer)
        delete globalThis.__DERBY_LOADER_START_TIME__
        setIsFadingOut(true)
        setTimeout(() => {
          if (mountedRef.current && onComplete) {
            onComplete()
          }
        }, 120)
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
        zIndex: 99999,
        backgroundColor: '#000000',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingBottom: 'clamp(20px, 4vh, 40px)',
        fontFamily: "'Segoe UI', Roboto, sans-serif",
        color: '#ffffff',
        transition: 'opacity 0.22s ease-out',
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
