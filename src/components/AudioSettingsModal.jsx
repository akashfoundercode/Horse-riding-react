import React from 'react'
import {
  Volume2,
  VolumeX,
  Sliders,
  X,
  RotateCcw,
  Coins,
  Bell,
  Play,
  Sparkles,
} from 'lucide-react'

import { DEFAULT_AUDIO_SETTINGS } from '../config/audioConstants.js'
export { DEFAULT_AUDIO_SETTINGS }

export default function AudioSettingsModal({
  isOpen,
  onClose,
  audioSettings,
  setAudioSettings,
  onTestSound,
}) {
  if (!isOpen) return null

  const { masterMute, gameVoice, coinVoice, horseVoice } = audioSettings

  const updateSetting = (category, field, value) => {
    setAudioSettings((prev) => {
      const updated = {
        ...prev,
        [category]: {
          ...prev[category],
          [field]: value,
        },
      }
      try {
        localStorage.setItem('horse_race_audio_settings', JSON.stringify(updated))
      } catch (_) { }
      return updated
    })
  }

  const toggleMasterMute = () => {
    setAudioSettings((prev) => {
      const updated = {
        ...prev,
        masterMute: !prev.masterMute,
      }
      try {
        localStorage.setItem('horse_race_audio_settings', JSON.stringify(updated))
      } catch (_) { }
      return updated
    })
  }

  const handleReset = () => {
    setAudioSettings(DEFAULT_AUDIO_SETTINGS)
    try {
      localStorage.setItem('horse_race_audio_settings', JSON.stringify(DEFAULT_AUDIO_SETTINGS))
    } catch (_) { }
  }

  return (
    <div className="modal-backdrop-generic" onClick={onClose}>
      <div className="audio-settings-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="add-coins-header">
          <div className="add-coins-title-wrap">
            <span className="add-coins-icon" style={{ display: 'inline-flex', alignItems: 'center' }}>
              <Sliders size={22} className="text-amber-400" />
            </span>
            <div>
              <h2 className="add-coins-title">AUDIO & SOUND SETTINGS</h2>
              <p className="add-coins-subtitle">Adjust volume levels or mute individual sound channels</p>
            </div>
          </div>
          <button
            className="modal-close-btn"
            onClick={onClose}
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Master Mute All Banner */}
        <div className="audio-master-bar">
          <div className="audio-master-info">
            <span className="audio-master-label">Master Game Sound</span>
            <span className="audio-master-sub">
              {masterMute ? 'All game sounds are currently muted' : 'Audio channels are active'}
            </span>
          </div>
          <button
            className={`audio-master-toggle ${masterMute ? 'audio-master-toggle--muted' : ''}`}
            onClick={toggleMasterMute}
          >
            {masterMute ? (
              <>
                <VolumeX size={16} className="text-red-400" /> UNMUTE ALL
              </>
            ) : (
              <>
                <Volume2 size={16} className="text-emerald-400" /> MUTE ALL
              </>
            )}
          </button>
        </div>

        {/* 3 Channels Grid */}
        <div className="audio-channels-list">
          {/* 1. Game Voice & Alerts */}
          <div className={`audio-channel-card ${gameVoice.muted || masterMute ? 'audio-channel-card--muted' : ''}`}>
            <div className="audio-card-head">
              <div className="audio-card-title-wrap">
                <span className="audio-channel-icon audio-channel-icon--game">
                  <Bell size={18} />
                </span>
                <div>
                  <div className="audio-channel-name">Game Voice & Alerts</div>
                  <div className="audio-channel-desc">Countdown alert, 5s warning, photo finish shutter</div>
                </div>
              </div>
              <button
                className={`audio-mute-btn ${gameVoice.muted ? 'audio-mute-btn--active' : ''}`}
                onClick={() => updateSetting('gameVoice', 'muted', !gameVoice.muted)}
                title={gameVoice.muted ? 'Unmute Game Voice' : 'Mute Game Voice'}
              >
                {gameVoice.muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
            </div>

            <div className="audio-slider-row">
              <input
                type="range"
                min="0"
                max="100"
                value={gameVoice.muted ? 0 : Math.round(gameVoice.volume * 100)}
                disabled={gameVoice.muted || masterMute}
                onChange={(e) => {
                  const val = Number(e.target.value) / 100
                  updateSetting('gameVoice', 'volume', val)
                  if (gameVoice.muted) updateSetting('gameVoice', 'muted', false)
                }}
                className="audio-range-slider"
              />
              <span className="audio-val-pct">
                {gameVoice.muted || masterMute ? '0%' : `${Math.round(gameVoice.volume * 100)}%`}
              </span>
              <button
                className="audio-test-sound-btn"
                onClick={() => onTestSound && onTestSound('game')}
                title="Test sound"
              >
                <Play size={11} className="fill-current" /> Test
              </button>
            </div>
          </div>

          {/* 2. Coin Voice & Bet Sounds */}
          <div className={`audio-channel-card ${coinVoice.muted || masterMute ? 'audio-channel-card--muted' : ''}`}>
            <div className="audio-card-head">
              <div className="audio-card-title-wrap">
                <span className="audio-channel-icon audio-channel-icon--coin">
                  <Coins size={18} />
                </span>
                <div>
                  <div className="audio-channel-name">Coin Voice & Bet Chips</div>
                  <div className="audio-channel-desc">Coin selection click, tap to bet placement, double/clear</div>
                </div>
              </div>
              <button
                className={`audio-mute-btn ${coinVoice.muted ? 'audio-mute-btn--active' : ''}`}
                onClick={() => updateSetting('coinVoice', 'muted', !coinVoice.muted)}
                title={coinVoice.muted ? 'Unmute Coin Voice' : 'Mute Coin Voice'}
              >
                {coinVoice.muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
            </div>

            <div className="audio-slider-row">
              <input
                type="range"
                min="0"
                max="100"
                value={coinVoice.muted ? 0 : Math.round(coinVoice.volume * 100)}
                disabled={coinVoice.muted || masterMute}
                onChange={(e) => {
                  const val = Number(e.target.value) / 100
                  updateSetting('coinVoice', 'volume', val)
                  if (coinVoice.muted) updateSetting('coinVoice', 'muted', false)
                }}
                className="audio-range-slider"
              />
              <span className="audio-val-pct">
                {coinVoice.muted || masterMute ? '0%' : `${Math.round(coinVoice.volume * 100)}%`}
              </span>
              <button
                className="audio-test-sound-btn"
                onClick={() => onTestSound && onTestSound('coin')}
                title="Test sound"
              >
                <Play size={11} className="fill-current" /> Test
              </button>
            </div>
          </div>

          {/* 3. Horses Voice (Neigh & Gallop) */}
          <div className={`audio-channel-card ${horseVoice.muted || masterMute ? 'audio-channel-card--muted' : ''}`}>
            <div className="audio-card-head">
              <div className="audio-card-title-wrap">
                <span className="audio-channel-icon audio-channel-icon--horse">
                  🐴
                </span>
                <div>
                  <div className="audio-channel-name">Horses Voice (Neigh & Gallop)</div>
                  <div className="audio-channel-desc">Race start horse neigh and galloping sprint sound effects</div>
                </div>
              </div>
              <button
                className={`audio-mute-btn ${horseVoice.muted ? 'audio-mute-btn--active' : ''}`}
                onClick={() => updateSetting('horseVoice', 'muted', !horseVoice.muted)}
                title={horseVoice.muted ? 'Unmute Horse Voice' : 'Mute Horse Voice'}
              >
                {horseVoice.muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
            </div>

            <div className="audio-slider-row">
              <input
                type="range"
                min="0"
                max="100"
                value={horseVoice.muted ? 0 : Math.round(horseVoice.volume * 100)}
                disabled={horseVoice.muted || masterMute}
                onChange={(e) => {
                  const val = Number(e.target.value) / 100
                  updateSetting('horseVoice', 'volume', val)
                  if (horseVoice.muted) updateSetting('horseVoice', 'muted', false)
                }}
                className="audio-range-slider"
              />
              <span className="audio-val-pct">
                {horseVoice.muted || masterMute ? '0%' : `${Math.round(horseVoice.volume * 100)}%`}
              </span>
              <button
                className="audio-test-sound-btn"
                onClick={() => onTestSound && onTestSound('horse')}
                title="Test sound"
              >
                <Play size={11} className="fill-current" /> Test
              </button>
            </div>
          </div>
        </div>

        {/* Footer with Reset & Done buttons */}
        <div className="audio-settings-footer">
          <button className="audio-reset-btn" onClick={handleReset}>
            <RotateCcw size={14} /> Reset Defaults
          </button>
          <button className="claim-coins-btn" onClick={onClose} style={{ padding: '8px 24px' }}>
            <Sparkles size={15} className="text-amber-300" /> DONE
          </button>
        </div>
      </div>
    </div>
  )
}

