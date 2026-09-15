import React, { useEffect, useState } from 'react'
import { Trophy, Zap, Camera, Gem, Lightbulb, X } from 'lucide-react'

const DOWNLOAD_TIPS = [
  'Tip: Horse #1 (ROYAL) has high acceleration in the final stretch!',
  'Tip: Multiplier pays 10x your bet amount on every winning horse!',
  'Tip: High-speed photo finish cameras verify the winner down to the millisecond!',
  'Tip: You can adjust your chips anytime from 10 to 500 points.',
]

export default function GameDownloader({ onComplete, onCancel }) {
  const [progress, setProgress] = useState(0)
  const [tipIndex, setTipIndex] = useState(0)
  const [statusText, setStatusText] = useState('Connecting to Derby Server...')

  useEffect(() => {
    const tipInterval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % DOWNLOAD_TIPS.length)
    }, 1200)

    let current = 0
    const progressInterval = setInterval(() => {
      current += Math.floor(Math.random() * 12) + 8
      if (current >= 100) {
        current = 100
        setProgress(100)
        setStatusText('Assets verified! Launching Derby Race...')
        clearInterval(progressInterval)
        clearInterval(tipInterval)
        setTimeout(() => {
          onComplete()
        }, 600)
      } else {
        setProgress(current)
        if (current < 30) setStatusText('Downloading HD Racetrack Textures (4.2 MB)...')
        else if (current < 70) setStatusText('Loading 12 Jockey Sprites & Sound FX...')
        else setStatusText('Initializing Photo Finish Camera System...')
      }
    }, 180)

    return () => {
      clearInterval(tipInterval)
      clearInterval(progressInterval)
    }
  }, [onComplete])

  return (
    <div className="downloader-backdrop">
      <div className="downloader-card">
        {/* Top Header */}
        <div className="downloader-header">
          <div className="downloader-game-info">
            <div className="downloader-game-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Trophy size={22} className="text-amber-400" />
            </div>
            <div>
              <h3 className="downloader-game-title">REAL HORSE DERBY RACING 3D</h3>
              <p className="downloader-game-version">Version 2.4.0 • 12 Runners • 10x Payout</p>
            </div>
          </div>
          {onCancel && (
            <button className="downloader-cancel-btn" onClick={onCancel} title="Back to Lobby" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={16} />
            </button>
          )}
        </div>

        {/* Center Animation Visual */}
        <div className="downloader-visual-area">
          <div className="downloader-horse-gallop-anim">
            <img src="/HORSES/horse5_1mb.gif" alt="Downloading" className="downloader-horse-img" />
            <div className="downloader-dust-trail" />
          </div>
        </div>

        {/* Progress Bar & Status */}
        <div className="downloader-progress-section">
          <div className="downloader-status-row">
            <span className="downloader-status-text">{statusText}</span>
            <span className="downloader-percent-text">{progress}%</span>
          </div>

          <div className="downloader-progress-track">
            <div
              className="downloader-progress-fill"
              style={{ width: `${progress}%` }}
            >
              <div className="downloader-progress-glow" />
            </div>
          </div>
        </div>

        {/* Tip Box */}
        <div className="downloader-tip-box">
          <span className="tip-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Lightbulb size={12} className="text-amber-400" /> GAME TIP
          </span>
          <p className="tip-content">{DOWNLOAD_TIPS[tipIndex]}</p>
        </div>
      </div>
    </div>
  )
}

