import React from 'react'
import { Smartphone, ShieldAlert, LogOut, ArrowRight, AlertTriangle } from 'lucide-react'
import { socketService } from '../../services/socketService.js'

export default function MultipleDeviceModal({ isOpen, onClose, onLoginAgain, reason }) {
  if (!isOpen) return null

  const handleReLogin = () => {
    if (socketService?.resetForceLogout) {
      socketService.resetForceLogout()
    }
    if (onLoginAgain) {
      onLoginAgain()
    } else if (onClose) {
      onClose()
    }
  }

  const displayMessage =
    reason || 'Aapka account kisi doosre device par login ho gaya hai.'

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.88)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        padding: '16px',
        userSelect: 'none',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '440px',
          background: 'linear-gradient(145deg, #180d0d 0%, #110808 60%, #1c0f08 100%)',
          border: '1.5px solid rgba(239, 68, 68, 0.45)',
          boxShadow: '0 0 40px rgba(239, 68, 68, 0.25), 0 20px 40px rgba(0, 0, 0, 0.8)',
          borderRadius: '20px',
          padding: '24px 22px 20px',
          color: '#ffffff',
          fontFamily: "'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
          textAlign: 'center',
          animation: 'scaleUpModal 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Ambient Top Glow */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '200px',
            height: '2px',
            background: 'linear-gradient(90deg, transparent, #ef4444, #f59e0b, transparent)',
            borderRadius: '999px',
          }}
        />

        {/* Warning Icon Badge */}
        <div
          style={{
            display: 'inline-flex',
            position: 'relative',
            alignItems: 'center',
            justifyContent: 'center',
            width: '68px',
            height: '68px',
            background: 'radial-gradient(circle, rgba(239, 68, 68, 0.25) 0%, rgba(239, 68, 68, 0.05) 75%)',
            border: '1.5px solid rgba(239, 68, 68, 0.5)',
            borderRadius: '50%',
            marginBottom: '14px',
            boxShadow: '0 0 20px rgba(239, 68, 68, 0.3)',
          }}
        >
          <Smartphone size={32} color="#fca5a5" />
          <div
            style={{
              position: 'absolute',
              bottom: '-2px',
              right: '-2px',
              background: '#ef4444',
              borderRadius: '50%',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid #180d0d',
            }}
          >
            <ShieldAlert size={14} color="#ffffff" />
          </div>
        </div>

        {/* Security Alert Pill */}
        <div style={{ marginBottom: '8px' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              fontWeight: '800',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              color: '#f87171',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              padding: '3px 12px',
              borderRadius: '20px',
            }}
          >
            <AlertTriangle size={12} />
            Security Notice
          </span>
        </div>

        {/* Modal Titles */}
        <h2
          style={{
            margin: '0 0 4px',
            fontSize: '19px',
            fontWeight: '900',
            letterSpacing: '0.5px',
            color: '#ffffff',
            textTransform: 'uppercase',
          }}
        >
          Session Terminated
        </h2>
        <p
          style={{
            margin: '0 0 16px',
            fontSize: '12px',
            color: '#fca5a5',
            fontWeight: '600',
          }}
        >
          Multiple Device Login Detected
        </p>

        {/* Message Container */}
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.45)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '12px',
            padding: '12px 14px',
            marginBottom: '16px',
            textAlign: 'left',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <LogOut size={18} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <p
                style={{
                  margin: '0 0 4px',
                  fontSize: '13px',
                  fontWeight: '700',
                  color: '#fee2e2',
                  lineHeight: '1.4',
                }}
              >
                {displayMessage}
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: '11.5px',
                  color: '#9ca3af',
                  lineHeight: '1.4',
                }}
              >
                Aapka account kisi doosre device par login hone ke karan is device se logout kiya gaya hai.
              </p>
            </div>
          </div>
        </div>

        {/* Notice Info Card */}
        <div
          style={{
            fontSize: '11px',
            color: '#a1a1aa',
            lineHeight: '1.45',
            marginBottom: '18px',
            padding: '0 6px',
          }}
        >
          Game fair-play aur account security ke liye ek samay par kewal ek device par play allowed hai.
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={handleReLogin}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '12px 16px',
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)',
            border: '1px solid rgba(251, 191, 36, 0.5)',
            borderRadius: '12px',
            color: '#000000',
            fontSize: '14px',
            fontWeight: '800',
            letterSpacing: '0.4px',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(245, 158, 11, 0.35)',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)'
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(245, 158, 11, 0.5)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(245, 158, 11, 0.35)'
          }}
        >
          <span>Phir Se Login Karein</span>
          <ArrowRight size={16} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  )
}
