import React, { useState, useEffect, useRef } from 'react'
import {
  Info,
  X,
  Minus,
  Plus,
  Sparkles,
  Trophy,
  RotateCcw,
  Flame,
  CheckCircle,
  Volume2,
  VolumeX,
  Play,
  Settings,
  History,
} from 'lucide-react'

export const CHIP_OPTIONS = [
  { value: 2, label: '2', img: '/bet_coins/betcoin2.png' },
  { value: 5, label: '5', img: '/bet_coins/betcoin5.png' },
  { value: 10, label: '10', img: '/bet_coins/betcoin10.png' },
  { value: 100, label: '100', img: '/bet_coins/betcoin100.png' },
  { value: 500, label: '500', img: '/bet_coins/betcoin500.png' },
  { value: 1000, label: '1000', img: '/bet_coins/betcoin1000.png' },
]

export default function TezRafterBettingBoard({
  horses,
  balance,
  totalBet,
  lastWin,
  betsByHorse,
  betCoinsByHorse,
  selectedChip,
  setSelectedChip,
  onPlaceBet,
  onRemoveBet,
  onClearBets,
  onDoubleBets,
  onStartRace,
  audioSettings,
  onOpenSettings,
  timerSeconds,
  isBettingLocked,
  previousResults,
  onOpenHistory,
  onOpenTutorial,
  onOpenAddCoins,
  isCheatEnabled,
  onToggleCheat,
}) {
  const [showInfoModal, setShowInfoModal] = useState(false)
  const prevTimerRef = useRef(timerSeconds)
  const end5SecAudioRef = useRef(null)

  const getEffectiveVolume = (category) => {
    if (!audioSettings || audioSettings.masterMute) return 0
    const cat = audioSettings[category]
    if (!cat || cat.muted) return 0
    return Math.max(0, Math.min(1, cat.volume))
  }

  // Initialize and preload the end 5 sec sound file
  useEffect(() => {
    try {
      const audio = new Audio('/SOUND/end5sec%20sound.mp3')
      audio.preload = 'auto'
      audio.volume = 1.0
      end5SecAudioRef.current = audio
    } catch (_) { }

    return () => {
      if (end5SecAudioRef.current) {
        try {
          end5SecAudioRef.current.pause()
          end5SecAudioRef.current.currentTime = 0
        } catch (_) { }
      }
    }
  }, [])

  // 1. Tactile Casino Chip Placement Sound
  const playTactileChipSound = () => {
    try {
      const coinVol = getEffectiveVolume('coinVoice')
      if (coinVol <= 0) return
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (!AudioCtx) return
      const ctx = new AudioCtx()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(950, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(360, ctx.currentTime + 0.06)
      gain.gain.setValueAtTime(coinVol * 0.45, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.06)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.06)
    } catch (_) { }
  }

  // 2. Page-Flip / Mechanical Card Turnover Sound (When normal timer counts down)
  const playPageFlipTickSound = () => {
    try {
      const gameVol = getEffectiveVolume('gameVoice')
      if (gameVol <= 0) return
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (!AudioCtx) return
      const ctx = new AudioCtx()

      const bufferSize = Math.floor(ctx.sampleRate * 0.035)
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.007))
      }
      const noise = ctx.createBufferSource()
      noise.buffer = buffer

      const filter = ctx.createBiquadFilter()
      filter.type = 'bandpass'
      filter.frequency.setValueAtTime(2200, ctx.currentTime)
      filter.Q.setValueAtTime(2.2, ctx.currentTime)

      const gain = ctx.createGain()
      gain.gain.setValueAtTime(gameVol * 0.16, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.035)

      noise.connect(filter)
      filter.connect(gain)
      gain.connect(ctx.destination)
      noise.start(ctx.currentTime)
    } catch (_) { }
  }

  // 3. Fallback Urgent Alert Countdown Sound (In case audio element is blocked)
  const playAlertCountdownSound = (sec) => {
    try {
      const gameVol = getEffectiveVolume('gameVoice')
      if (gameVol <= 0) return
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (!AudioCtx) return
      const ctx = new AudioCtx()

      const baseFreq = 800 + (6 - sec) * 130

      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(baseFreq, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.2, ctx.currentTime + 0.12)

      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(2800, ctx.currentTime)

      gain.gain.setValueAtTime(gameVol * 0.35, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.13)

      osc.connect(filter)
      filter.connect(gain)
      gain.connect(ctx.destination)

      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.13)

      const osc2 = ctx.createOscillator()
      const gain2 = ctx.createGain()
      osc2.type = 'sine'
      osc2.frequency.setValueAtTime(baseFreq * 1.5, ctx.currentTime + 0.05)
      gain2.gain.setValueAtTime(0.0, ctx.currentTime)
      gain2.gain.setValueAtTime(gameVol * 0.22, ctx.currentTime + 0.05)
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15)
      osc2.connect(gain2)
      gain2.connect(ctx.destination)
      osc2.start(ctx.currentTime + 0.05)
      osc2.stop(ctx.currentTime + 0.15)
    } catch (_) { }
  }

  // Audio trigger on timer change
  useEffect(() => {
    if (prevTimerRef.current !== timerSeconds) {
      const gameVol = getEffectiveVolume('gameVoice')
      if (timerSeconds === 5) {
        // Trigger user's custom end5sec sound
        if (end5SecAudioRef.current && gameVol > 0) {
          end5SecAudioRef.current.volume = gameVol * 1.0
          end5SecAudioRef.current.currentTime = 0
          end5SecAudioRef.current.play().catch(() => {
            playAlertCountdownSound(5)
          })
        } else if (gameVol > 0) {
          playAlertCountdownSound(5)
        }
      } else if (timerSeconds < 5 && timerSeconds > 0) {
        // If file is not playing (or not supported), use fallback
        if (!end5SecAudioRef.current || end5SecAudioRef.current.paused) {
          playAlertCountdownSound(timerSeconds)
        }
      } else if (timerSeconds > 5) {
        if (end5SecAudioRef.current && !end5SecAudioRef.current.paused) {
          end5SecAudioRef.current.pause()
          end5SecAudioRef.current.currentTime = 0
        }
        playPageFlipTickSound()
      }
      prevTimerRef.current = timerSeconds
    }
  }, [timerSeconds, audioSettings])

  const handleCardClick = (horseNumber) => {
    if (isBettingLocked) return
    playTactileChipSound()
    onPlaceBet(horseNumber, selectedChip)
  }

  const handleChipSelect = (chipVal) => {
    playTactileChipSound()
    setSelectedChip(chipVal)
  }

  return (
    <div className="tez-rafter-root">
      <div className="tez-frame-container">
        {/* 1. TOP ORNATE HEADER SECTION (Placed over the top wooden frame plaque) */}
        <header className="tez-frame-header">
          <div className="tez-brand-logo">
            <span className="tez-brand-title">Tez</span>
            <span
              className="tez-brand-horseshoe"
              onClick={onToggleCheat}
              style={{
                cursor: 'pointer',
                userSelect: 'none',
                display: 'inline-block',
                transition: 'transform 0.15s ease',
              }}
              title=""
            >
              🧲
            </span>
            <span className="tez-brand-title">Rafter</span>
          </div>

          <div className="tez-counters-group">
            {/* Points Display */}
            <div
              className="tez-counter-box tez-counter-box--points"
              onClick={onOpenAddCoins}
              title="Click to Recharge Coins"
            >
              <span className="tez-cbox-label">Points</span>
              <span className="tez-cbox-value">{balance.toFixed(2)}</span>
            </div>

            {/* Play (Total Bet) Display */}
            <div className="tez-counter-box tez-counter-box--play">
              <span className="tez-cbox-label">Play</span>
              <span className="tez-cbox-value">{totalBet.toFixed(2)}</span>
            </div>

            {/* Win Display */}
            <div className="tez-counter-box tez-counter-box--win">
              <span className="tez-cbox-label">Win</span>
              <span className="tez-cbox-value">
                {lastWin !== null ? lastWin.toFixed(2) : '0.00'}
              </span>
            </div>
          </div>

          <div className="tez-header-actions">
            <div
              className="tez-points-pill"
              onClick={onOpenAddCoins}
              title="Click to Add Coins"
            >
              <span className="tez-pts-lbl">COINS:</span>
              <span className="tez-pts-val">{balance.toFixed(0)}</span>
              <span className="tez-pts-add">+</span>
            </div>

            {onOpenHistory && (
              <button
                className="tez-header-icon-btn"
                onClick={onOpenHistory}
                title="Betting & Match Records History (दांव और मैच इतिहास)"
              >
                <History size={18} />
              </button>
            )}

            {onOpenSettings && (
              <button
                className="tez-header-icon-btn"
                onClick={onOpenSettings}
                title="Audio & Sound Settings (Game, Coins, Horses)"
              >
                <Settings size={18} />
              </button>
            )}
            <button
              className="tez-header-icon-btn"
              onClick={() => setShowInfoModal(true)}
              title="Game Info & Rules"
            >
              <Info size={18} />
            </button>
          </div>
        </header>

        {/* 2. INNER ARENA (12 HORSES GRID + PREVIOUS RESULTS SIDEBAR) */}
        <div className="tez-main-arena">
          {/* Blurry Atmosphere Racetrack Background Layer */}
          <div className="tez-arena-bg-layer" />

          {/* Betting Grid Area */}
          <div className="tez-grid-section">
            {isBettingLocked && (
              <div className="tez-lock-banner">
                <span className="tez-lock-text">⚠️ BETS CLOSED — RACE STARTING IN {timerSeconds}s ⚠️</span>
              </div>
            )}

            <div className="tez-horses-grid">
              {horses.map((h) => {
                const horseBet = betsByHorse[h.number] || 0
                const isSelected = horseBet > 0
                const placedChipVal = betCoinsByHorse?.[h.number] || selectedChip
                const placedChipObj =
                  CHIP_OPTIONS.find((c) => c.value === placedChipVal) ||
                  CHIP_OPTIONS.find((c) => c.value === selectedChip) ||
                  CHIP_OPTIONS[0]

                return (
                  <div
                    key={h.number}
                    className={`tez-horse-card ${isSelected ? 'tez-horse-card--active' : ''} ${isBettingLocked ? 'tez-horse-card--locked' : ''
                      }`}
                    onClick={() => handleCardClick(h.number)}
                  >
                    {/* Top Name Bar */}
                    <div className="tez-card-header">
                      <span className="tez-card-name">{h.name}</span>
                    </div>

                    {/* Card Portrait Body (Clean image without floating coin obstruction) */}
                    <div className="tez-card-body">
                      <img
                        src={h.portraitImg || h.img}
                        alt={h.name}
                        className="tez-card-horse-img"
                        crossOrigin="anonymous"
                        draggable="false"
                      />
                    </div>

                    {/* Bottom Black Bet Box with Interactive [-] & [+] Stepper */}
                    <div className="tez-card-footer">
                      <div className={`tez-bet-slot ${horseBet > 0 ? 'tez-bet-slot--has-bet' : ''}`}>
                        {horseBet > 0 ? (
                          <div className="tez-bet-stepper">
                            <button
                              type="button"
                              className="tez-stepper-btn tez-stepper-btn--minus"
                              onClick={(e) => {
                                e.stopPropagation()
                                playTactileChipSound()
                                if (onRemoveBet) onRemoveBet(h.number, selectedChip)
                              }}
                              disabled={isBettingLocked}
                              title={`Remove ${selectedChip} coins`}
                            >
                              <Minus size={13} />
                            </button>

                            <div className="tez-stepper-amount-wrap">
                              <img
                                src={placedChipObj.img}
                                alt="Coin"
                                className="tez-stepper-coin-img"
                              />
                              <span className="tez-slot-bet-val">{horseBet}</span>
                            </div>

                            <button
                              type="button"
                              className="tez-stepper-btn tez-stepper-btn--plus"
                              onClick={(e) => {
                                e.stopPropagation()
                                playTactileChipSound()
                                onPlaceBet(h.number, selectedChip)
                              }}
                              disabled={isBettingLocked || balance < selectedChip}
                              title={`Add ${selectedChip} coins`}
                            >
                              <Plus size={13} />
                            </button>
                          </div>
                        ) : (
                          <span className="tez-slot-tap-text">TAP TO BET</span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* SIDEBAR: PREVIOUS GAME RESULTS / LATEST RESULTS */}
          <aside className="tez-sidebar-board">
            <div className="tez-results-section">
              <div
                className="tez-sb-header"
                onClick={onOpenHistory}
                style={{ cursor: 'pointer' }}
                title="Click to view all match results and photo-finishes"
              >
                <span className="tez-sb-title">PREVIOUS GAME RESULTS</span>
              </div>

              <div className="tez-results-list">
                {previousResults && previousResults.length > 0 ? (
                  previousResults.slice(0, 10).map((res, idx) => (
                    <div key={idx} className="tez-res-row">
                      <div className="tez-res-badge">{res.number}</div>
                      <div className="tez-res-name">{res.name}</div>
                      {res.multiplier && res.multiplier > 1 && (
                        <div className="tez-res-mult">{res.multiplier}X</div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="tez-results-empty">No race history yet</div>
                )}
              </div>
            </div>
          </aside>
        </div>

        {/* 4. BOTTOM CONTROLS WOODEN PLANK */}
        <footer className="tez-bottom-plank">
          {/* Casino Chips Selector */}
          <div className="tez-chips-cluster">
            {CHIP_OPTIONS.map((chip) => {
              const isActive = selectedChip === chip.value
              return (
                <div key={chip.value} className="tez-chip-wrapper">
                  <button
                    type="button"
                    className={`tez-casino-chip ${isActive ? 'tez-chip--active' : ''} ${isBettingLocked ? 'tez-chip--disabled' : ''
                      }`}
                    onClick={() => {
                      if (!isBettingLocked) {
                        playTactileChipSound()
                        setSelectedChip(chip.value)
                      }
                    }}
                    disabled={isBettingLocked}
                    title={`Select ${chip.label} Coin`}
                  >
                    <div className="tez-chip-bezel-rim" />
                    <img
                      src={chip.img}
                      alt={`Bet Coin ${chip.label}`}
                      className="tez-chip-img"
                      draggable="false"
                      crossOrigin="anonymous"
                    />
                    {isActive && (
                      <>
                        <div className="tez-chip-ring-light-sweep" />
                        <div className="tez-chip-ring-light-halo" />
                        <div className="tez-chip-active-dot" />
                      </>
                    )}
                    <span className="tez-chip-press-overlay" />
                  </button>
                </div>
              )
            })}
          </div>

          {/* Action Buttons: Clear, Double & Hidden/Invisible Instant Trigger */}
          <div className="tez-actions-cluster" style={{ position: 'relative' }}>
            <button
              type="button"
              className="tez-action-btn tez-action-btn--clear"
              onClick={onClearBets}
              disabled={isBettingLocked || totalBet === 0}
              title="Clear all bets for this round"
            >
              Clear
            </button>
            <button
              type="button"
              className="tez-action-btn tez-action-btn--double"
              onClick={onDoubleBets}
              disabled={isBettingLocked || totalBet === 0 || balance < totalBet}
              title="Double all current bets"
            >
              Double
            </button>
            {onStartRace && (
              <button
                type="button"
                onClick={onStartRace}
                style={{
                  opacity: 0,
                  width: '36px',
                  height: '32px',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  margin: 0,
                }}
                title=""
                aria-hidden="true"
                tabIndex={-1}
              />
            )}
          </div>

          {/* Giant 3D Countdown Timer */}
          <div className={`tez-timer-display ${timerSeconds <= 5 ? 'tez-timer-display--urgent' : ''}`}>
            <span key={timerSeconds} className="tez-timer-num tez-flip-digit">
              {timerSeconds}
            </span>
            <div className="tez-timer-labels">
              <span className="tez-timer-sub-sec">SEC</span>
              <span className="tez-timer-sub-left">LEFT</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Info / Rules Modal */}
      {showInfoModal && (
        <div className="tez-info-modal-backdrop" onClick={() => setShowInfoModal(false)}>
          <div className="tez-info-modal" onClick={(e) => e.stopPropagation()}>
            <div className="tez-info-modal-header">
              <h3>🐴 Tez Rafter — Game Rules</h3>
              <button className="tez-modal-close-btn" onClick={() => setShowInfoModal(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="tez-info-modal-body">
              <p>
                <strong>1. 40-Second Automatic Cycle:</strong> A new race starts automatically every 40 seconds.
              </p>
              <p>
                <strong>2. Multi-Horse Betting:</strong> Select a chip (2, 5, 10, 100, 500, 1000) and click on any horse card to place or stack your bets.
              </p>
              <p>
                <strong>3. 5-Second Lock:</strong> Betting closes when only 5 seconds remain on the countdown.
              </p>
              <p>
                <strong>4. Massive 10X Payout:</strong> If your chosen horse wins the race, you win <strong>10x</strong> your placed bet on that horse!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

