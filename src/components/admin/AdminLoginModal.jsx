import React, { useState } from 'react'
import { adminAuthService } from '../../services/adminAuthService.js'

export default function AdminLoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [activeTab, setActiveTab] = useState('login') // 'login' | 'forgot' | 'reset'
  const [identifier, setIdentifier] = useState('horsesracing')
  const [password, setPassword] = useState('admin321')
  const [rememberMe, setRememberMe] = useState(true)
  const [forgotEmail, setForgotEmail] = useState('horsesracing@gmail.com')
  const [resetToken, setResetToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)

  if (!isOpen) return null

  const handleLogin = async (e) => {
    if (e) e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccessMsg(null)

    try {
      const res = await adminAuthService.login({
        email: identifier,
        username: identifier,
        password,
        rememberMe,
      })

      if (res.success) {
        setSuccessMsg('✅ Logged in successfully!')
        setTimeout(() => {
          if (onLoginSuccess) onLoginSuccess(res)
          onClose()
        }, 500)
      } else {
        setError(res.message || 'Login failed')
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async (e) => {
    if (e) e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccessMsg(null)

    try {
      const res = await adminAuthService.forgotPassword({
        email: forgotEmail,
        username: forgotEmail,
      })

      setSuccessMsg(res.message || 'Reset instructions sent!')
      if (res.resetToken) {
        setResetToken(res.resetToken)
      }
    } catch (err) {
      setError(err.message || 'Failed to process forgot password request.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    if (e) e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccessMsg(null)

    try {
      const res = await adminAuthService.resetPassword({
        email: forgotEmail,
        token: resetToken,
        newPassword,
        confirmPassword,
      })

      setSuccessMsg(res.message || 'Password reset successfully!')
      setTimeout(() => {
        setActiveTab('login')
        setPassword(newPassword)
      }, 1200)
    } catch (err) {
      setError(err.message || 'Failed to reset password.')
    } finally {
      setIsLoading(false)
    }
  }

  const fillQuickCredentials = () => {
    setIdentifier('horsesracing')
    setPassword('admin321')
    setError(null)
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          background: 'linear-gradient(145deg, #141824 0%, #0d1017 100%)',
          border: '1px solid #d4af37',
          borderRadius: '16px',
          boxShadow: '0 0 35px rgba(212, 175, 55, 0.3), 0 20px 50px rgba(0, 0, 0, 0.9)',
          overflow: 'hidden',
          color: '#fff',
          fontFamily: "'Inter', system-ui, sans-serif",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(90deg, #b8860b 0%, #ffd700 50%, #b8860b 100%)',
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: '#1a1300',
            fontWeight: 800,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            fontSize: '15px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🏇</span>
            <span>DERBY ADMIN PORTAL</span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(0, 0, 0, 0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '26px',
              height: '26px',
              cursor: 'pointer',
              color: '#1a1300',
              fontWeight: 900,
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>

        {/* Tab Selection */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid rgba(212, 175, 55, 0.2)',
            background: 'rgba(0, 0, 0, 0.3)',
          }}
        >
          <button
            type="button"
            onClick={() => { setActiveTab('login'); setError(null); setSuccessMsg(null); }}
            style={{
              flex: 1,
              padding: '12px',
              background: activeTab === 'login' ? 'rgba(212, 175, 55, 0.15)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'login' ? '2px solid #ffd700' : '2px solid transparent',
              color: activeTab === 'login' ? '#ffd700' : '#8a99ad',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            🔐 Admin Login
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('forgot'); setError(null); setSuccessMsg(null); }}
            style={{
              flex: 1,
              padding: '12px',
              background: activeTab === 'forgot' ? 'rgba(212, 175, 55, 0.15)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'forgot' ? '2px solid #ffd700' : '2px solid transparent',
              color: activeTab === 'forgot' ? '#ffd700' : '#8a99ad',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            🔑 Forgot Password
          </button>
          {resetToken && (
            <button
              type="button"
              onClick={() => { setActiveTab('reset'); setError(null); setSuccessMsg(null); }}
              style={{
                flex: 1,
                padding: '12px',
                background: activeTab === 'reset' ? 'rgba(212, 175, 55, 0.15)' : 'transparent',
                border: 'none',
                borderBottom: activeTab === 'reset' ? '2px solid #ffd700' : '2px solid transparent',
                color: activeTab === 'reset' ? '#ffd700' : '#8a99ad',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              🔄 Reset
            </button>
          )}
        </div>

        {/* Content Body */}
        <div style={{ padding: '20px' }}>
          {/* Messages */}
          {error && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#fca5a5',
                padding: '10px 14px',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '13px',
                lineHeight: '1.4',
              }}
            >
              ⚠️ {error}
            </div>
          )}

          {successMsg && (
            <div
              style={{
                background: 'rgba(34, 197, 94, 0.15)',
                border: '1px solid rgba(34, 197, 94, 0.4)',
                color: '#86efac',
                padding: '10px 14px',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '13px',
                lineHeight: '1.4',
              }}
            >
              {successMsg}
            </div>
          )}

          {/* Quick Fill Preset Box */}
          <div
            style={{
              background: 'rgba(212, 175, 55, 0.08)',
              border: '1px dashed rgba(212, 175, 55, 0.3)',
              borderRadius: '8px',
              padding: '10px 14px',
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '12px',
            }}
          >
            <div>
              <span style={{ color: '#ffd700', fontWeight: 700 }}>Default Admin: </span>
              <span style={{ color: '#cbd5e1' }}>horsesracing / admin321</span>
            </div>
            <button
              type="button"
              onClick={fillQuickCredentials}
              style={{
                background: 'rgba(212, 175, 55, 0.25)',
                border: '1px solid #ffd700',
                borderRadius: '6px',
                color: '#ffd700',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Auto-Fill
            </button>
          </div>

          {/* LOGIN TAB */}
          {activeTab === 'login' && (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px', fontWeight: 600 }}>
                  ADMIN USERNAME / EMAIL
                </label>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="horsesracing"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: '#1a202c',
                    border: '1px solid #334155',
                    color: '#fff',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px', fontWeight: 600 }}>
                  ADMIN PASSWORD
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="admin321"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: '#1a202c',
                    border: '1px solid #334155',
                    color: '#fff',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    style={{ accentColor: '#d4af37' }}
                  />
                  Remember Admin
                </label>
                <button
                  type="button"
                  onClick={() => { setActiveTab('forgot'); setError(null); }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ffd700',
                    fontSize: '12px',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  Forgot Password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  marginTop: '6px',
                  background: 'linear-gradient(135deg, #ffd700 0%, #b8860b 100%)',
                  color: '#1a1300',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px',
                  fontWeight: 800,
                  fontSize: '14px',
                  letterSpacing: '0.04em',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 15px rgba(212, 175, 55, 0.4)',
                  transition: 'all 0.2s',
                  opacity: isLoading ? 0.7 : 1,
                }}
              >
                {isLoading ? 'VERIFYING...' : 'LOGIN TO ADMIN CONTROL'}
              </button>
            </form>
          )}

          {/* FORGOT PASSWORD TAB */}
          {activeTab === 'forgot' && (
            <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px', fontWeight: 600 }}>
                  REGISTERED ADMIN EMAIL / USERNAME
                </label>
                <input
                  type="text"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="horsesracing@gmail.com"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: '#1a202c',
                    border: '1px solid #334155',
                    color: '#fff',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.5 }}>
                Enter the admin identifier (<code style={{ color: '#ffd700' }}>horsesracing</code>) to request a password reset instructions API token.
              </div>

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  marginTop: '6px',
                  background: 'linear-gradient(135deg, #ffd700 0%, #b8860b 100%)',
                  color: '#1a1300',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px',
                  fontWeight: 800,
                  fontSize: '14px',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 15px rgba(212, 175, 55, 0.4)',
                }}
              >
                {isLoading ? 'SENDING REQUEST...' : 'SEND RESET INSTRUCTIONS'}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('login')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '13px',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                ← Back to Login
              </button>
            </form>
          )}

          {/* RESET PASSWORD TAB */}
          {activeTab === 'reset' && (
            <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px', fontWeight: 600 }}>
                  RESET TOKEN / CODE
                </label>
                <input
                  type="text"
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  placeholder="Reset Token"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: '#1a202c',
                    border: '1px solid #334155',
                    color: '#fff',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px', fontWeight: 600 }}>
                  NEW PASSWORD
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: '#1a202c',
                    border: '1px solid #334155',
                    color: '#fff',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px', fontWeight: 600 }}>
                  CONFIRM NEW PASSWORD
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: '#1a202c',
                    border: '1px solid #334155',
                    color: '#fff',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  marginTop: '6px',
                  background: 'linear-gradient(135deg, #ffd700 0%, #b8860b 100%)',
                  color: '#1a1300',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px',
                  fontWeight: 800,
                  fontSize: '14px',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 15px rgba(212, 175, 55, 0.4)',
                }}
              >
                {isLoading ? 'UPDATING...' : 'CONFIRM PASSWORD RESET'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
