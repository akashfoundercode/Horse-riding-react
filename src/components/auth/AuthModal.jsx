import React, { useState } from 'react'
import {
  User,
  Lock,
  Mail,
  Phone,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Zap,
  X,
  Eye,
  EyeOff,
  Coins,
  Trophy,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'

export default function AuthModal({ isOpen, onClose }) {
  const { login, register, guestLogin, isLoading } = useAuth()
  const [tab, setTab] = useState('login') // 'login' | 'register'
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage('')

    if (tab === 'login') {
      if (!identifier || !password) {
        setErrorMessage('Please enter your email/phone and password.')
        return
      }
      const res = await login({ identifier, password })
      if (!res.success) {
        setErrorMessage(res.error || 'Login failed')
      } else {
        onClose()
      }
    } else {
      if (!username || !identifier || !password) {
        setErrorMessage('Please fill in all registration fields.')
        return
      }
      const res = await register({ username, identifier, password })
      if (!res.success) {
        setErrorMessage(res.error || 'Registration failed')
      } else {
        onClose()
      }
    }
  }

  const handleGuest = async () => {
    setErrorMessage('')
    const res = await guestLogin()
    if (res.success) {
      onClose()
    } else {
      setErrorMessage(res.error || 'Guest login failed')
    }
  }

  return (
    <div className="modal-backdrop-generic" onClick={onClose} style={{ zIndex: 9999 }}>
      <div
        className="auth-modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(180deg, #1e2430 0%, #0d1117 100%)',
          border: '2px solid rgba(245, 158, 11, 0.45)',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.85), 0 0 35px rgba(245, 158, 11, 0.25)',
          width: '92%',
          maxWidth: '440px',
          padding: '24px',
          color: '#ffffff',
          position: 'relative',
          fontFamily: "'Segoe UI', Roboto, sans-serif",
          animation: 'scaleUpModal 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
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
            color: '#94a3b8',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: '0.2s',
          }}
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '52px',
              height: '52px',
              background: 'radial-gradient(circle, rgba(245, 158, 11, 0.3) 0%, rgba(245, 158, 11, 0.05) 70%)',
              border: '1px solid rgba(245, 158, 11, 0.5)',
              borderRadius: '50%',
              marginBottom: '10px',
            }}
          >
            <Trophy size={26} className="text-amber-400" />
          </div>
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '800', letterSpacing: '0.5px', color: '#fbbf24' }}>
            DERBY CASINO ARENA
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#94a3b8' }}>
            Login or Register to access high-roller live odds & instant 10X payouts
          </p>
        </div>

        {/* Tab Switcher */}
        <div
          style={{
            display: 'flex',
            background: 'rgba(0, 0, 0, 0.4)',
            padding: '4px',
            borderRadius: '10px',
            marginBottom: '18px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <button
            type="button"
            onClick={() => {
              setTab('login')
              setErrorMessage('')
            }}
            style={{
              flex: 1,
              padding: '9px 0',
              border: 'none',
              borderRadius: '8px',
              background: tab === 'login' ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'transparent',
              color: tab === 'login' ? '#000000' : '#94a3b8',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer',
              transition: '0.2s',
            }}
          >
            SIGN IN
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('register')
              setErrorMessage('')
            }}
            style={{
              flex: 1,
              padding: '9px 0',
              border: 'none',
              borderRadius: '8px',
              background: tab === 'register' ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'transparent',
              color: tab === 'register' ? '#000000' : '#94a3b8',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer',
              transition: '0.2s',
            }}
          >
            NEW ACCOUNT (+10K COINS)
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#f87171',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              marginBottom: '14px',
              textAlign: 'center',
            }}
          >
            {errorMessage}
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {tab === 'register' && (
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#cbd5e1', fontWeight: '600', marginBottom: '5px' }}>
                JOCKEY USERNAME
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748b' }} />
                <input
                  type="text"
                  placeholder="e.g. Royal_Winner_7"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '10px 12px 10px 38px',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
              </div>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '11px', color: '#cbd5e1', fontWeight: '600', marginBottom: '5px' }}>
              EMAIL OR MOBILE NUMBER
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748b' }} />
              <input
                type="text"
                placeholder="player@gmail.com or 9876543210"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '10px 12px 10px 38px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', color: '#cbd5e1', fontWeight: '600', marginBottom: '5px' }}>
              PASSWORD
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748b' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '10px 38px 10px 38px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '10px',
                  background: 'transparent',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              marginTop: '8px',
              padding: '12px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
              border: '1px solid #fde68a',
              borderRadius: '8px',
              color: '#000000',
              fontWeight: '800',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)',
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            {isLoading ? 'PROCESSING...' : tab === 'login' ? 'SIGN IN & PLAY' : 'REGISTER & GET 10,000 COINS'}
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', margin: '18px 0 14px' }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
          <span style={{ padding: '0 10px', fontSize: '11px', color: '#64748b', fontWeight: '600' }}>OR CASUAL PLAY</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
        </div>

        {/* Guest 1-Click Button */}
        <button
          type="button"
          onClick={handleGuest}
          disabled={isLoading}
          style={{
            width: '100%',
            padding: '11px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '8px',
            color: '#e2e8f0',
            fontWeight: '700',
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: '0.2s',
          }}
        >
          <Zap size={16} className="text-amber-400" />
          <span>PLAY INSTANTLY AS GUEST (1-CLICK)</span>
        </button>

        {/* Footer Guarantee */}
        <div style={{ marginTop: '16px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontSize: '11px', color: '#64748b' }}>
          <ShieldCheck size={14} className="text-emerald-400" />
          <span>256-Bit SSL Encrypted Gaming Session</span>
        </div>
      </div>
    </div>
  )
}

