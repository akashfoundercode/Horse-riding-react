import React, { useState, useEffect } from 'react'
import {
  Flame,
  Zap,
  Clock,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  X,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Layers,
  Activity,
  Sliders,
} from 'lucide-react'
import { adminAuthService } from '../../services/adminAuthService.js'

export default function AdminJackpotControlModal({
  isOpen,
  onClose,
  currentMultiplier = 1,
  currentDisplay = 'N',
}) {
  const [activeMode, setActiveMode] = useState('CONTINUOUS') // 'CONTINUOUS' | 'ROUNDS' | 'DURATION'
  const [selectedMultiplier, setSelectedMultiplier] = useState(
    currentMultiplier > 1 ? `${currentMultiplier}X` : '1X'
  )
  const [roundsCount, setRoundsCount] = useState(5)
  const [durationSeconds, setDurationSeconds] = useState(180)
  const [isLoading, setIsLoading] = useState(false)
  const [statusMsg, setStatusMsg] = useState('')
  const [isError, setIsError] = useState(false)
  const [adminUser, setAdminUser] = useState(null)

  useEffect(() => {
    if (isOpen) {
      setAdminUser(adminAuthService.getAdminUser())
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleApplyJackpot = async (overrideMultiplier, overrideMode) => {
    setIsLoading(true)
    setStatusMsg('')
    setIsError(false)

    const mult = overrideMultiplier || selectedMultiplier
    const mode = overrideMode || activeMode

    try {
      const result = await adminAuthService.setJackpot({
        multiplier: mult,
        mode: mode,
        rounds: roundsCount,
        durationSeconds: durationSeconds,
      })

      setIsError(false)
      setStatusMsg(result.message || `Jackpot successfully set to ${mult}!`)
      setSelectedMultiplier(mult)
      setTimeout(() => setStatusMsg(''), 4000)
    } catch (err) {
      setIsError(true)
      setStatusMsg(err.message || 'Failed to update jackpot settings.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetTo1X = () => {
    handleApplyJackpot('1X', 'CONTINUOUS')
  }

  const handleLogout = () => {
    adminAuthService.logout()
    onClose()
  }

  const multiplierOptions = ['1X', '2X', '3X', '4X', 'RANDOM']

  return (
    <div className="tez-modal-backdrop" onClick={onClose} style={{ zIndex: 999999 }}>
      <div
        className="tez-admin-jackpot-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '520px',
          background: 'linear-gradient(180deg, #181c28 0%, #0c0f16 100%)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 215, 0, 0.35)',
          boxShadow: '0 24px 70px rgba(0, 0, 0, 0.95), 0 0 40px rgba(255, 215, 0, 0.2)',
          padding: '24px',
          color: '#ffffff',
          position: 'relative',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#94a3b8',
          }}
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #ffd700 0%, #d49755 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(255, 215, 0, 0.4)',
              color: '#000000',
            }}
          >
            <Flame size={28} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: '#ffd700', letterSpacing: '0.8px' }}>
                ADMIN JACKPOT CONTROL
              </h2>
              <span
                style={{
                  background: 'rgba(34, 197, 94, 0.2)',
                  color: '#4ade80',
                  border: '1px solid #22c55e',
                  borderRadius: '10px',
                  padding: '2px 8px',
                  fontSize: '10px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Activity size={10} /> LIVE
              </span>
            </div>
            <p style={{ fontSize: '11.5px', color: '#94a3b8', margin: '2px 0 0 0' }}>
              Logged in as: <strong style={{ color: '#ffd700' }}>{adminUser?.username || 'horsesracing'}</strong>
            </p>
          </div>
        </div>

        {/* Live Status Indicator Bar */}
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '10px',
            padding: '10px 14px',
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>Current Live Jackpot:</span>
            <span
              style={{
                fontSize: '13px',
                fontWeight: '900',
                color: currentMultiplier > 1 ? '#ffd700' : '#94a3b8',
                background: currentMultiplier > 1 ? 'rgba(255, 215, 0, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                border: currentMultiplier > 1 ? '1px solid #ffd700' : '1px solid rgba(255, 255, 255, 0.1)',
                padding: '2px 10px',
                borderRadius: '6px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              {currentMultiplier > 1 && <Flame size={12} />}
              {currentDisplay || (currentMultiplier > 1 ? `${currentMultiplier}X` : 'N (1X Standard)')}
            </span>
          </div>

          <button
            type="button"
            onClick={handleResetTo1X}
            disabled={isLoading}
            style={{
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid #ef4444',
              borderRadius: '6px',
              padding: '4px 10px',
              color: '#f87171',
              fontSize: '11px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <RotateCcw size={12} /> Reset to 1X
          </button>
        </div>

        {/* Notifications */}
        {statusMsg && (
          <div
            style={{
              background: isError ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)',
              border: isError ? '1px solid #ef4444' : '1px solid #22c55e',
              borderRadius: '8px',
              padding: '10px 14px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: isError ? '#fca5a5' : '#86efac',
              fontSize: '12px',
              fontWeight: '600',
            }}
          >
            {isError ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
            <span>{statusMsg}</span>
          </div>
        )}

        {/* Control Mode Tabs */}
        <div
          style={{
            display: 'flex',
            background: 'rgba(0, 0, 0, 0.4)',
            borderRadius: '10px',
            padding: '4px',
            marginBottom: '18px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveMode('CONTINUOUS')}
            style={{
              flex: 1,
              padding: '8px 4px',
              border: 'none',
              borderRadius: '8px',
              background: activeMode === 'CONTINUOUS' ? 'linear-gradient(135deg, #ffd700, #d49755)' : 'transparent',
              color: activeMode === 'CONTINUOUS' ? '#000000' : '#94a3b8',
              fontWeight: '800',
              fontSize: '11px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
            }}
          >
            <Sliders size={12} /> Continuous (Standing)
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('ROUNDS')}
            style={{
              flex: 1,
              padding: '8px 4px',
              border: 'none',
              borderRadius: '8px',
              background: activeMode === 'ROUNDS' ? 'linear-gradient(135deg, #ffd700, #d49755)' : 'transparent',
              color: activeMode === 'ROUNDS' ? '#000000' : '#94a3b8',
              fontWeight: '800',
              fontSize: '11px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
            }}
          >
            <Layers size={12} /> Consecutive Rounds
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('DURATION')}
            style={{
              flex: 1,
              padding: '8px 4px',
              border: 'none',
              borderRadius: '8px',
              background: activeMode === 'DURATION' ? 'linear-gradient(135deg, #ffd700, #d49755)' : 'transparent',
              color: activeMode === 'DURATION' ? '#000000' : '#94a3b8',
              fontWeight: '800',
              fontSize: '11px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
            }}
          >
            <Clock size={12} /> Time Duration
          </button>
        </div>

        {/* Multiplier Selection Grid */}
        <div style={{ marginBottom: '18px' }}>
          <label style={{ display: 'block', fontSize: '11px', color: '#cbd5e1', marginBottom: '8px', fontWeight: '700' }}>
            SELECT TARGET MULTIPLIER:
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
            {multiplierOptions.map((opt) => {
              const isSelected = selectedMultiplier === opt
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setSelectedMultiplier(opt)}
                  style={{
                    padding: '12px 4px',
                    borderRadius: '10px',
                    border: isSelected ? '2px solid #ffd700' : '1px solid rgba(255, 255, 255, 0.12)',
                    background: isSelected
                      ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.3) 0%, rgba(212, 151, 85, 0.2) 100%)'
                      : 'rgba(0, 0, 0, 0.4)',
                    color: isSelected ? '#ffd700' : '#cbd5e1',
                    fontSize: '13px',
                    fontWeight: '900',
                    cursor: 'pointer',
                    boxShadow: isSelected ? '0 0 15px rgba(255, 215, 0, 0.4)' : 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '2px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {opt === 'RANDOM' ? <Sparkles size={14} /> : opt === '1X' ? <ShieldCheck size={14} /> : <Zap size={14} />}
                  <span>{opt}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Mode Specific Inputs */}
        {activeMode === 'ROUNDS' && (
          <div style={{ marginBottom: '18px', background: 'rgba(0, 0, 0, 0.3)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <label style={{ display: 'block', fontSize: '11px', color: '#ffd700', marginBottom: '6px', fontWeight: '700' }}>
              CONSECUTIVE ROUNDS COUNT:
            </label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {[3, 5, 10, 20].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setRoundsCount(count)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: roundsCount === count ? '1px solid #ffd700' : '1px solid rgba(255, 255, 255, 0.1)',
                    background: roundsCount === count ? 'rgba(255, 215, 0, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    color: roundsCount === count ? '#ffd700' : '#ffffff',
                    fontSize: '11px',
                    fontWeight: '700',
                    cursor: 'pointer',
                  }}
                >
                  {count} Rounds
                </button>
              ))}
              <input
                type="number"
                min="1"
                max="100"
                value={roundsCount}
                onChange={(e) => setRoundsCount(Number(e.target.value) || 1)}
                style={{
                  width: '60px',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  background: 'rgba(0, 0, 0, 0.6)',
                  border: '1px solid rgba(212, 151, 85, 0.4)',
                  color: '#ffffff',
                  fontSize: '12px',
                  textAlign: 'center',
                }}
              />
            </div>
            <p style={{ fontSize: '10.5px', color: '#94a3b8', margin: '6px 0 0 0' }}>
              Jackpot will stay active for exactly {roundsCount} rounds, then auto-revert to 1X.
            </p>
          </div>
        )}

        {activeMode === 'DURATION' && (
          <div style={{ marginBottom: '18px', background: 'rgba(0, 0, 0, 0.3)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <label style={{ display: 'block', fontSize: '11px', color: '#ffd700', marginBottom: '6px', fontWeight: '700' }}>
              TIME DURATION (SECONDS):
            </label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {[
                { label: '1 Min (60s)', val: 60 },
                { label: '3 Min (180s)', val: 180 },
                { label: '5 Min (300s)', val: 300 },
              ].map((item) => (
                <button
                  key={item.val}
                  type="button"
                  onClick={() => setDurationSeconds(item.val)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: durationSeconds === item.val ? '1px solid #ffd700' : '1px solid rgba(255, 255, 255, 0.1)',
                    background: durationSeconds === item.val ? 'rgba(255, 215, 0, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    color: durationSeconds === item.val ? '#ffd700' : '#ffffff',
                    fontSize: '11px',
                    fontWeight: '700',
                    cursor: 'pointer',
                  }}
                >
                  {item.label}
                </button>
              ))}
              <input
                type="number"
                min="10"
                max="3600"
                value={durationSeconds}
                onChange={(e) => setDurationSeconds(Number(e.target.value) || 60)}
                style={{
                  width: '65px',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  background: 'rgba(0, 0, 0, 0.6)',
                  border: '1px solid rgba(212, 151, 85, 0.4)',
                  color: '#ffffff',
                  fontSize: '12px',
                  textAlign: 'center',
                }}
              />
            </div>
            <p style={{ fontSize: '10.5px', color: '#94a3b8', margin: '6px 0 0 0' }}>
              Jackpot stays active for {durationSeconds} seconds, then auto-reverts to standard 1X.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={() => handleApplyJackpot()}
            disabled={isLoading}
            style={{
              flex: 1,
              padding: '12px',
              background: 'linear-gradient(135deg, #ffd700 0%, #d49755 100%)',
              border: 'none',
              borderRadius: '8px',
              color: '#000000',
              fontWeight: '900',
              fontSize: '13px',
              letterSpacing: '0.6px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: '0 4px 18px rgba(255, 215, 0, 0.4)',
            }}
          >
            <Flame size={16} /> {isLoading ? 'Broadcasting...' : `APPLY ${selectedMultiplier} JACKPOT`}
          </button>

          <button
            type="button"
            onClick={handleLogout}
            style={{
              padding: '12px 16px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '8px',
              color: '#94a3b8',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
            title="Admin Logout"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>
    </div>
  )
}
