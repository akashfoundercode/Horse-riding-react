import React, { useState } from 'react'
import {
  ShieldAlert,
  Lock,
  Mail,
  KeyRound,
  Eye,
  EyeOff,
  X,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  RefreshCw,
} from 'lucide-react'
import { adminAuthService } from '../../services/adminAuthService.js'

export default function AdminLoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [activeTab, setActiveTab] = useState('login') // 'login' | 'forgot' | 'reset'
  const [email, setEmail] = useState('horsesracing')
  const [password, setPassword] = useState('admin321')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  if (!isOpen) return null

  const handleAutoFill = () => {
    setEmail('horsesracing')
    setPassword('admin321')
    setErrorMsg('')
  }

  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')
    setIsLoading(true)

    try {
      const result = await adminAuthService.login({
        email,
        username: email,
        password,
      })

      setSuccessMsg(result.message || 'Admin login successful!')
      setTimeout(() => {
        if (typeof onLoginSuccess === 'function') {
          onLoginSuccess(result.user)
        }
        onClose()
      }, 1000)
    } catch (err) {
      setErrorMsg(err.message || 'Failed to authenticate admin.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')
    setIsLoading(true)

    try {
      const result = await adminAuthService.forgotPassword({
        email,
        username: email,
      })

      setSuccessMsg(result.message || 'Reset link dispatched.')
      if (result.resetToken) {
        setResetToken(result.resetToken)
      }
      setTimeout(() => {
        setActiveTab('reset')
      }, 1500)
    } catch (err) {
      setErrorMsg(err.message || 'Error sending forgot password request.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')
    setIsLoading(true)

    try {
      const result = await adminAuthService.resetPassword({
        email,
        token: resetToken,
        newPassword,
        confirmPassword,
      })

      setSuccessMsg(result.message || 'Password reset successfully!')
      setTimeout(() => {
        setPassword(newPassword)
        setActiveTab('login')
      }, 1500)
    } catch (err) {
      setErrorMsg(err.message || 'Error resetting password.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="tez-modal-backdrop" onClick={onClose} style={{ zIndex: 999999 }}>
      <div
        className="tez-admin-login-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '440px',
          background: 'linear-gradient(180deg, #181c28 0%, #0d1017 100%)',
          borderRadius: '16px',
          border: '1px solid rgba(212, 151, 85, 0.4)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.9), 0 0 30px rgba(212, 151, 85, 0.2)',
          padding: '28px',
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
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(212, 151, 85, 0.3) 0%, rgba(255, 215, 0, 0.1) 100%)',
              border: '2px solid #d49755',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px auto',
              boxShadow: '0 0 20px rgba(212, 151, 85, 0.35)',
            }}
          >
            <ShieldAlert size={28} color="#ffd700" />
          </div>
          <h2
            style={{
              fontSize: '20px',
              fontWeight: '800',
              letterSpacing: '1px',
              color: '#ffd700',
              textShadow: '0 2px 8px rgba(0, 0, 0, 0.8)',
              margin: '0 0 4px 0',
              textTransform: 'uppercase',
            }}
          >
            Derby Admin Portal
          </h2>
          <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
            Executive Game & Betting Management Control
          </p>
        </div>

        {/* Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            background: 'rgba(0, 0, 0, 0.4)',
            borderRadius: '10px',
            padding: '4px',
            marginBottom: '20px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <button
            type="button"
            onClick={() => {
              setActiveTab('login')
              setErrorMsg('')
              setSuccessMsg('')
            }}
            style={{
              flex: 1,
              padding: '8px',
              border: 'none',
              borderRadius: '8px',
              background: activeTab === 'login' ? 'linear-gradient(135deg, #d49755, #b87a32)' : 'transparent',
              color: activeTab === 'login' ? '#000000' : '#94a3b8',
              fontWeight: '700',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            Admin Login
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('forgot')
              setErrorMsg('')
              setSuccessMsg('')
            }}
            style={{
              flex: 1,
              padding: '8px',
              border: 'none',
              borderRadius: '8px',
              background: activeTab === 'forgot' || activeTab === 'reset' ? 'linear-gradient(135deg, #d49755, #b87a32)' : 'transparent',
              color: activeTab === 'forgot' || activeTab === 'reset' ? '#000000' : '#94a3b8',
              fontWeight: '700',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            Forgot Password
          </button>
        </div>

        {/* Notifications */}
        {errorMsg && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid #ef4444',
              borderRadius: '8px',
              padding: '10px 14px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: '#fca5a5',
              fontSize: '12px',
            }}
          >
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div
            style={{
              background: 'rgba(34, 197, 94, 0.15)',
              border: '1px solid #22c55e',
              borderRadius: '8px',
              padding: '10px 14px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: '#86efac',
              fontSize: '12px',
            }}
          >
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* 1. LOGIN TAB */}
        {activeTab === 'login' && (
          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Username/Email Input */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#cbd5e1', marginBottom: '6px', fontWeight: '600' }}>
                Admin Email / Username
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', color: '#d49755' }} />
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="horsesracing"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 38px',
                    background: 'rgba(0, 0, 0, 0.5)',
                    border: '1px solid rgba(212, 151, 85, 0.3)',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#cbd5e1', marginBottom: '6px', fontWeight: '600' }}>
                Admin Password
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', color: '#d49755' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 38px 10px 38px',
                    background: 'rgba(0, 0, 0, 0.5)',
                    border: '1px solid rgba(212, 151, 85, 0.3)',
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
                    right: '12px',
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Autofill helper badge */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
              <button
                type="button"
                onClick={handleAutoFill}
                style={{
                  background: 'rgba(212, 151, 85, 0.15)',
                  border: '1px dashed #d49755',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  color: '#ffd700',
                  fontSize: '10px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Sparkles size={12} /> Fill: horsesracing / admin321
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('forgot')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '11px',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Forgot Password?
              </button>
            </div>

            {/* Login Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                marginTop: '10px',
                padding: '12px',
                background: 'linear-gradient(135deg, #ffd700 0%, #d49755 100%)',
                border: 'none',
                borderRadius: '8px',
                color: '#000000',
                fontWeight: '800',
                fontSize: '13px',
                letterSpacing: '0.8px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 15px rgba(212, 151, 85, 0.4)',
              }}
            >
              {isLoading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" /> Authenticating...
                </>
              ) : (
                <>
                  Secure Admin Login <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        )}

        {/* 2. FORGOT PASSWORD TAB */}
        {activeTab === 'forgot' && (
          <form onSubmit={handleForgotSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#cbd5e1', marginBottom: '6px', fontWeight: '600' }}>
                Admin Email / Username
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', color: '#d49755' }} />
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="horsesracing"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 38px',
                    background: 'rgba(0, 0, 0, 0.5)',
                    border: '1px solid rgba(212, 151, 85, 0.3)',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0' }}>
              We will verify your admin credentials and send a password reset token.
            </p>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                marginTop: '10px',
                padding: '12px',
                background: 'linear-gradient(135deg, #ffd700 0%, #d49755 100%)',
                border: 'none',
                borderRadius: '8px',
                color: '#000000',
                fontWeight: '800',
                fontSize: '13px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              {isLoading ? 'Processing...' : 'Send Reset Instructions'}
            </button>
          </form>
        )}

        {/* 3. RESET PASSWORD TAB */}
        {activeTab === 'reset' && (
          <form onSubmit={handleResetSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#cbd5e1', marginBottom: '6px', fontWeight: '600' }}>
                New Password
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <KeyRound size={16} style={{ position: 'absolute', left: '12px', color: '#d49755' }} />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 38px',
                    background: 'rgba(0, 0, 0, 0.5)',
                    border: '1px solid rgba(212, 151, 85, 0.3)',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#cbd5e1', marginBottom: '6px', fontWeight: '600' }}>
                Confirm New Password
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <KeyRound size={16} style={{ position: 'absolute', left: '12px', color: '#d49755' }} />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 38px',
                    background: 'rgba(0, 0, 0, 0.5)',
                    border: '1px solid rgba(212, 151, 85, 0.3)',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                marginTop: '10px',
                padding: '12px',
                background: 'linear-gradient(135deg, #ffd700 0%, #d49755 100%)',
                border: 'none',
                borderRadius: '8px',
                color: '#000000',
                fontWeight: '800',
                fontSize: '13px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
              }}
            >
              {isLoading ? 'Updating...' : 'Set New Admin Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
