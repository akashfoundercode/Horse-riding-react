import React, { useState } from 'react'
import {
  User,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  X,
  Eye,
  EyeOff,
  Coins,
  Trophy,
  UserCheck,
  Shield,
  Sparkles,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'

export default function AuthModal({ isOpen, onClose }) {
  const { login, register, isLoading } = useAuth()
  const [tab, setTab] = useState('login') // 'login' | 'register'

  // Form fields
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    if (tab === 'login') {
      if (!username.trim() || !password) {
        setErrorMessage('Please enter username/email and password.')
        return
      }
      const res = await login({
        username: username.trim(),
        email: username.includes('@') ? username.trim() : email.trim(),
        password,
      })
      if (!res.success) {
        setErrorMessage(res.error || 'Invalid username/email or password')
      } else {
        setSuccessMessage('Logged in successfully!')
        setTimeout(() => {
          onClose()
        }, 800)
      }
    } else {
      if (!username.trim() || username.trim().length < 3) {
        setErrorMessage('Username must be at least 3 characters.')
        return
      }
      if (!email.trim() || !email.includes('@')) {
        setErrorMessage('Please enter a valid email address.')
        return
      }
      if (!password || password.length < 6) {
        setErrorMessage('Password must be at least 6 characters.')
        return
      }
      const res = await register({
        username: username.trim(),
        email: email.trim(),
        password,
        name: name.trim() || username.trim(),
        role: 'user',
      })
      if (!res.success) {
        setErrorMessage(res.error || 'Registration failed. Username or email may already exist.')
      } else {
        setSuccessMessage('Account created successfully!')
        setTimeout(() => {
          onClose()
        }, 800)
      }
    }
  }

  return (
    <div className="modal-backdrop-generic" onClick={onClose} style={{ zIndex: 99999 }}>
      <div
        className="auth-modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(180deg, #181d29 0%, #0d1117 100%)',
          border: '1.5px solid rgba(245, 158, 11, 0.45)',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.95), 0 0 35px rgba(245, 158, 11, 0.2)',
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
        <div style={{ textAlign: 'center', marginBottom: '18px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '50px',
              height: '50px',
              background: 'radial-gradient(circle, rgba(245, 158, 11, 0.3) 0%, rgba(245, 158, 11, 0.05) 70%)',
              border: '1px solid rgba(245, 158, 11, 0.5)',
              borderRadius: '50%',
              marginBottom: '10px',
            }}
          >
            <Trophy size={24} className="text-amber-400" />
          </div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', letterSpacing: '0.5px', color: '#fbbf24' }}>
            HORSE RACING ARENA
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94a3b8' }}>
            {tab === 'login' ? 'Sign in to access your wallet & live bets' : 'Create an account & claim 1000 Free Coins!'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div
          style={{
            display: 'flex',
            background: 'rgba(0, 0, 0, 0.4)',
            padding: '4px',
            borderRadius: '10px',
            marginBottom: '16px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <button
            type="button"
            onClick={() => {
              setTab('login')
              setErrorMessage('')
              setSuccessMessage('')
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
              setSuccessMessage('')
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
            REGISTER
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

        {/* Success Alert */}
        {successMessage && (
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.2)',
              border: '1px solid rgba(16, 185, 129, 0.5)',
              color: '#34d399',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              marginBottom: '14px',
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <Sparkles size={16} /> {successMessage}
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Full Name (Only for Register) */}
          {tab === 'register' && (
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#cbd5e1', fontWeight: '700', marginBottom: '5px' }}>
                FULL NAME
              </label>
              <div style={{ position: 'relative' }}>
                <UserCheck size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748b' }} />
                <input
                  type="text"
                  placeholder="e.g. Akash Rai"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
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

          {/* Username (Min 3 chars) */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', color: '#cbd5e1', fontWeight: '700', marginBottom: '5px' }}>
              {tab === 'login' ? 'USERNAME OR EMAIL' : 'USERNAME'} {tab === 'register' && <span style={{ color: '#94a3b8', fontWeight: 'normal' }}>(min 3 chars)</span>}
            </label>
            <div style={{ position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748b' }} />
              <input
                type="text"
                placeholder={tab === 'login' ? 'e.g. akashr123 or akashr@example.com' : 'e.g. akashr123'}
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

          {/* Email Address (Only for Register) */}
          {tab === 'register' && (
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#cbd5e1', fontWeight: '700', marginBottom: '5px' }}>
                EMAIL ADDRESS
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748b' }} />
                <input
                  type="email"
                  placeholder="e.g. akashr@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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

          {/* Password (Min 6 chars) */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', color: '#cbd5e1', fontWeight: '700', marginBottom: '5px' }}>
              PASSWORD {tab === 'register' && <span style={{ color: '#94a3b8', fontWeight: 'normal' }}>(min 6 chars)</span>}
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

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              marginTop: '6px',
              padding: '12px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
              border: '1px solid #fde68a',
              borderRadius: '8px',
              color: '#000000',
              fontWeight: '900',
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
            {isLoading ? 'CONNECTING...' : tab === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'}
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Footer Guarantee */}
        <div style={{ marginTop: '16px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontSize: '11px', color: '#64748b' }}>
          <ShieldCheck size={14} className="text-emerald-400" />
          <span>Secure Tokenized REST Authentication API</span>
        </div>
      </div>
    </div>
  )
}
