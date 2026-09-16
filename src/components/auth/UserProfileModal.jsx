import React from 'react'
import {
  User,
  Crown,
  LogOut,
  Coins,
  ShieldCheck,
  Trophy,
  Calendar,
  X,
  Mail,
  Phone,
  Sparkles,
  Zap,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import { useWallet } from '../../context/WalletContext.jsx'

export default function UserProfileModal({ isOpen, onClose }) {
  const { user, logout, isGuest, setIsAuthModalOpen } = useAuth()
  const { balance } = useWallet()

  if (!isOpen || !user) return null

  const handleLogout = async () => {
    await logout()
    onClose()
  }

  const handleSwitchToFullAccount = () => {
    onClose()
    setIsAuthModalOpen(true)
  }

  return (
    <div className="modal-backdrop-generic" onClick={onClose} style={{ zIndex: 9999 }}>
      <div
        className="profile-modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(180deg, #1e2430 0%, #0d1117 100%)',
          border: '2px solid rgba(245, 158, 11, 0.45)',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.85), 0 0 35px rgba(245, 158, 11, 0.25)',
          width: '92%',
          maxWidth: '420px',
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

        {/* User Avatar & Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
          <div
            style={{
              position: 'relative',
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #f59e0b 0%, #78350f 100%)',
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(245, 158, 11, 0.5)',
            }}
          >
            <img
              src={user.avatar || '/Bet_horses/horses7.png'}
              alt="Avatar"
              style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
            />
            <span
              style={{
                position: 'absolute',
                bottom: '-4px',
                right: '-4px',
                background: '#eab308',
                color: '#000000',
                fontSize: '10px',
                fontWeight: '900',
                padding: '2px 5px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
              }}
            >
              <Crown size={10} /> VIP {user.vipLevel || 1}
            </span>
          </div>

          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#f8fafc' }}>
              {user.username}
            </h3>
            <span
              style={{
                display: 'inline-block',
                marginTop: '4px',
                fontSize: '11px',
                fontWeight: '700',
                padding: '2px 8px',
                borderRadius: '12px',
                background: isGuest ? 'rgba(148, 163, 184, 0.15)' : 'rgba(16, 185, 129, 0.2)',
                color: isGuest ? '#94a3b8' : '#34d399',
                border: isGuest ? '1px solid rgba(148, 163, 184, 0.3)' : '1px solid rgba(16, 185, 129, 0.4)',
              }}
            >
              {isGuest ? '⚡ Temporary Guest Account' : '✓ Verified VIP Player'}
            </span>
          </div>
        </div>

        {/* Balance Card */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.05) 100%)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '12px',
            padding: '14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
          }}
        >
          <div>
            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' }}>
              Available Coin Balance
            </span>
            <div style={{ fontSize: '24px', fontWeight: '900', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Coins size={22} className="text-amber-400" />
              <span>{typeof balance === 'number' ? balance.toLocaleString() : balance}</span>
            </div>
          </div>
        </div>

        {/* User Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
          <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Account ID</span>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#cbd5e1', marginTop: '2px' }}>{user.id}</div>
          </div>
          <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Multiplier Tier</span>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#eab308', marginTop: '2px' }}>10X Derby Multiplier</div>
          </div>
        </div>

        {/* Guest Warning / Upgrade Prompt */}
        {isGuest && (
          <div
            style={{
              background: 'rgba(234, 179, 8, 0.1)',
              border: '1px solid rgba(234, 179, 8, 0.3)',
              borderRadius: '8px',
              padding: '10px 12px',
              marginBottom: '16px',
              fontSize: '12px',
              color: '#fef08a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <strong>Save your progress!</strong>
              <div style={{ fontSize: '11px', color: '#fde047' }}>Register now to claim +10,000 bonus coins.</div>
            </div>
            <button
              onClick={handleSwitchToFullAccount}
              style={{
                background: '#eab308',
                color: '#000000',
                border: 'none',
                fontWeight: '800',
                fontSize: '11px',
                padding: '6px 10px',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              UPGRADE
            </button>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleLogout}
            style={{
              flex: 1,
              padding: '11px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              borderRadius: '8px',
              color: '#f87171',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <LogOut size={16} />
            <span>LOG OUT</span>
          </button>
        </div>
      </div>
    </div>
  )
}

