import React, { useState, useEffect, useRef } from 'react'
import { Sparkles } from 'lucide-react'

export default function GrandGateLoader({ onComplete }) {
  const [isOpening, setIsOpening] = useState(false)
  const [isDone, setIsDone] = useState(false)
  const [progress, setProgress] = useState(0)
  const [statusText, setStatusText] = useState('Entering Royal Derby Arena...')
  const completedRef = useRef(false)

  const handleFinish = () => {
    if (completedRef.current) return
    completedRef.current = true
    setIsDone(true)
    if (onComplete) onComplete()
  }

  const triggerOpen = () => {
    if (isOpening || isDone) return
    setIsOpening(true)
    try {
      const audio = new Audio('/SOUND/dragon-studio-horse-neigh-390297.mp3')
      audio.volume = 0.35
      audio.play().catch(() => { })
    } catch (_) { }

    setTimeout(() => {
      handleFinish()
    }, 1500)
  }

  useEffect(() => {
    // 1. Preload key loader assets
    const preloadList = [
      '/loader/loader1.png',
      '/loader/loader2.png',
    ]
    preloadList.forEach((src) => {
      const img = new Image()
      img.src = src
    })

    // 2. Smooth progress increment
    const statusMessages = [
      { at: 20, msg: 'Assembling Royal Derby Gates...' },
      { at: 55, msg: 'Preparing 12 Thoroughbred Champions...' },
      { at: 85, msg: 'Unlocking Arena Gates...' },
    ]

    const startTime = Date.now()
    const totalDuration = 1800 // 1.8s

    const tProgress = setInterval(() => {
      const elapsed = Date.now() - startTime
      const p = Math.min(100, Math.round((elapsed / totalDuration) * 100))
      setProgress(p)

      const matched = [...statusMessages].reverse().find((item) => p >= item.at)
      if (matched) setStatusText(matched.msg)

      if (p >= 100) {
        clearInterval(tProgress)
        setTimeout(() => {
          triggerOpen()
        }, 150)
      }
    }, 30)

    // Fallback: guaranteed reveal after 3.2s
    const fallbackTimer = setTimeout(() => {
      handleFinish()
    }, 3200)

    return () => {
      clearInterval(tProgress)
      clearTimeout(fallbackTimer)
    }
  }, [])

  if (isDone) return null

  return (
    <div
      className="grand-gate-loader-root"
      onClick={triggerOpen}
      title="Click anywhere to open immediately"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        overflow: 'hidden',
        cursor: isOpening ? 'default' : 'pointer',
        userSelect: 'none',
      }}
    >
      {/* BACKGROUND ATMOSPHERE LAYER */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 50% 40%, rgba(255, 215, 0, 0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* The transparent PNGs are anchored by their inner edges, so their gates
          meet at the centre on every viewport instead of being stretched/cropped. */}
      <div
        className={`gate-door gate-door--left ${isOpening ? 'gate-door--opening' : ''}`}
      >
        <img
          src="/loader/loader1.png"
          alt="Royal Gate Left"
          className="gate-door-image"
          draggable="false"
        />
      </div>

      <div
        className={`gate-door gate-door--right ${isOpening ? 'gate-door--opening' : ''}`}
      >
        {/* The same art is mirrored so both door panels are one matched set. */}
        <img
          src="/loader/loader1.png"
          alt="Royal Gate Right"
          className="gate-door-image"
          draggable="false"
        />
      </div>

      {/* CENTER ORNATE BADGE & PROGRESS BAR */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          bottom: 'clamp(20px, 5.5vh, 50px)',
          transform: isOpening
            ? 'translateX(-50%) scale(0.85)'
            : 'translateX(-50%) scale(1)',
          zIndex: 30,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '10px',
          width: 'clamp(280px, 45vw, 500px)',
          opacity: isOpening ? 0 : 1,
          transition: 'opacity 0.35s ease, transform 0.4s ease',
          pointerEvents: 'none',
        }}
      >
        {/* Golden Royal Derby Plaque */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '7px 18px',
            borderRadius: '12px',
            background: 'linear-gradient(180deg, rgba(28, 14, 5, 0.95) 0%, rgba(10, 4, 1, 0.98) 100%)',
            border: '1.5px solid #ffd700',
            boxShadow:
              '0 10px 30px rgba(0, 0, 0, 0.9), 0 0 20px rgba(255, 215, 0, 0.45), inset 0 1px 2px rgba(255, 255, 255, 0.3)',
          }}
        >
          <span style={{ fontSize: '18px' }}>🧲</span>
          <span
            style={{
              fontFamily: "'Cinzel', 'Playfair Display', serif, system-ui",
              fontSize: 'clamp(14px, 1.8vw, 19px)',
              fontWeight: 900,
              letterSpacing: '0.1em',
              background: 'linear-gradient(180deg, #fff3c4 0%, #ffd700 45%, #f59f00 70%, #d97706 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 2px 8px rgba(0,0,0,0.8)',
            }}
          >
            TEZ RAFTER DERBY
          </span>
          <span style={{ fontSize: '16px' }}>🏇</span>
        </div>

        {/* Progress Bar & Status Text */}
        <div style={{ width: '100%' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '5px',
              padding: '0 4px',
            }}
          >
            <span
              style={{
                fontSize: 'clamp(11px, 1.15vw, 13px)',
                fontWeight: 700,
                color: '#ffd700',
                letterSpacing: '0.04em',
                textShadow: '0 1px 4px #000',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <Sparkles size={12} className="text-amber-400" /> {statusText}
            </span>
            <span
              style={{
                fontSize: 'clamp(12px, 1.25vw, 14px)',
                fontWeight: 900,
                color: '#ffffff',
                letterSpacing: '0.05em',
                textShadow: '0 0 8px rgba(255,215,0,0.8)',
              }}
            >
              {progress}%
            </span>
          </div>

          {/* Track */}
          <div
            style={{
              width: '100%',
              height: '9px',
              background: 'rgba(0, 0, 0, 0.85)',
              border: '1.2px solid #854d0e',
              borderRadius: '8px',
              padding: '2px',
              boxShadow: 'inset 0 2px 5px rgba(0, 0, 0, 0.95)',
              overflow: 'hidden',
            }}
          >
            {/* Fill */}
            <div
              style={{
                width: `${progress}%`,
                height: '100%',
                borderRadius: '6px',
                background: 'linear-gradient(90deg, #f59f00 0%, #ffd700 50%, #fef08a 100%)',
                boxShadow: '0 0 12px rgba(255, 215, 0, 0.85)',
                transition: 'width 0.08s ease-out',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
