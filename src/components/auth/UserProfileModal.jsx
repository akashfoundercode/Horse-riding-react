import React, { useEffect, useState } from 'react'
import {
  User,
  Crown,
  LogOut,
  Coins,
  ShieldCheck,
  Trophy,
  X,
  TrendingUp,
  TrendingDown,
  Activity,
  RotateCw,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import { useWallet } from '../../context/WalletContext.jsx'
import { userService } from '../../services/userService.js'

export default function UserProfileModal({ isOpen, onClose }) {
  const { user, logout, isGuest, setIsAuthModalOpen } = useAuth()
  const { balance } = useWallet()
  const [profileData, setProfileData] = useState(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(false)

  useEffect(() => {
    if (isOpen && user) {
      setIsLoadingProfile(true)
      userService
        .getProfile()
        .then((data) => {
          if (data) {
            setProfileData(data)
          }
        })
        .catch((err) => {
          console.warn('Failed to load profile details:', err)
        })
        .finally(() => {
          setIsLoadingProfile(false)
        })
    }
  }, [isOpen, user])

  if (!isOpen || !user) return null

  const handleLogout = async () => {
    await logout()
    onClose()
  }

  const handleSwitchToFullAccount = () => {
    onClose()
    setIsAuthModalOpen(true)
  }

  const displayName = profileData?.name || user.name || user.username || 'Player'
  const displayUsername = profileData?.username || user.username || 'player'
  const displayCoins =
    typeof profileData?.coins === 'number'
      ? profileData.coins
      : typeof balance === 'number'
        ? balance
        : 0

  const totalBets = profileData?.totalBets ?? profileData?.userStats?.totalBets ?? user.totalBets ?? 0
  const totalWins = profileData?.totalWins ?? profileData?.userStats?.totalWins ?? user.totalWins ?? 0
  const totalWon = profileData?.totalWon ?? profileData?.userStats?.totalWon ?? user.totalWon ?? 0
  const totalLost = profileData?.totalLost ?? (totalBets > totalWins ? totalBets - totalWins : 0)
  const winRate = totalBets > 0 ? (((totalWins || totalWon) / totalBets) * 100).toFixed(1) : '0.0'

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
          maxWidth: '430px',
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#f8fafc' }}>
                {displayName}
              </h3>
              {isLoadingProfile && (
                <RotateCw size={14} className="animate-spin text-amber-400" />
              )}
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
              @{displayUsername}
            </div>
            <span
              style={{
                display: 'inline-block',
                marginTop: '4px',
                fontSize: '11px',
                fontWeight: '700',
                padding: '2px 8px',
                borderRadius: '12px',
                background:
                  user.role === 'admin'
                    ? 'rgba(239, 68, 68, 0.2)'
                    : isGuest
                      ? 'rgba(148, 163, 184, 0.15)'
                      : 'rgba(16, 185, 129, 0.2)',
                color: user.role === 'admin' ? '#f87171' : isGuest ? '#94a3b8' : '#34d399',
                border:
                  user.role === 'admin'
                    ? '1px solid rgba(239, 68, 68, 0.4)'
                    : isGuest
                      ? '1px solid rgba(148, 163, 184, 0.3)'
                      : '1px solid rgba(16, 185, 129, 0.4)',
              }}
            >
              {user.role === 'admin'
                ? '🛡️ Admin Account'
                : isGuest
                  ? '⚡ Guest Account'
                  : '✓ Player Account'}
            </span>
          </div>
        </div>

        {/* Balance Card */}
        <div
          style={{
            background:
              'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.05) 100%)',
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
            <span
              style={{
                fontSize: '11px',
                color: '#94a3b8',
                fontWeight: '600',
                textTransform: 'uppercase',
              }}
            >
              Available Coin Balance
            </span>
            <div
              style={{
                fontSize: '24px',
                fontWeight: '900',
                color: '#fbbf24',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Coins size={22} className="text-amber-400" />
              <span>{displayCoins.toLocaleString()}</span>
            </div>
          </div>
          <div
            style={{
              textAlign: 'right',
              background: 'rgba(0,0,0,0.3)',
              padding: '6px 10px',
              borderRadius: '8px',
            }}
          >
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>Win Rate</div>
            <div style={{ fontSize: '14px', fontWeight: '800', color: '#10b981' }}>
              {winRate}%
            </div>
          </div>
        </div>

        {/* User Stats Grid — Live API Data */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr 1fr',
            gap: '6px',
            marginBottom: '18px',
          }}
        >
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.6)',
              padding: '8px 4px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: '9px',
                color: '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px',
              }}
            >
              <Activity size={11} className="text-blue-400" />
              <span>BETS</span>
            </div>
            <div style={{ fontSize: '15px', fontWeight: '800', color: '#f8fafc', marginTop: '3px' }}>
              {totalBets}
            </div>
          </div>

          <div
            style={{
              background: 'rgba(234, 179, 8, 0.1)',
              padding: '8px 4px',
              borderRadius: '8px',
              border: '1px solid rgba(234, 179, 8, 0.3)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: '9px',
                color: '#facc15',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px',
              }}
            >
              <Trophy size={11} />
              <span>WINS</span>
            </div>
            <div style={{ fontSize: '15px', fontWeight: '800', color: '#facc15', marginTop: '3px' }}>
              {totalWins}
            </div>
          </div>

          <div
            style={{
              background: 'rgba(16, 185, 129, 0.08)',
              padding: '8px 4px',
              borderRadius: '8px',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: '9px',
                color: '#34d399',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px',
              }}
            >
              <TrendingUp size={11} />
              <span>WON</span>
            </div>
            <div style={{ fontSize: '15px', fontWeight: '800', color: '#34d399', marginTop: '3px' }}>
              ₹{typeof totalWon === 'number' ? totalWon.toFixed(0) : totalWon}
            </div>
          </div>

          <div
            style={{
              background: 'rgba(239, 68, 68, 0.08)',
              padding: '8px 4px',
              borderRadius: '8px',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: '9px',
                color: '#f87171',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px',
              }}
            >
              <TrendingDown size={11} />
              <span>LOST</span>
            </div>
            <div style={{ fontSize: '15px', fontWeight: '800', color: '#f87171', marginTop: '3px' }}>
              {totalLost}
            </div>
          </div>
        </div>

        {/* Account Info Details */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            marginBottom: '18px',
          }}
        >
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.6)',
              padding: '8px 10px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <span style={{ fontSize: '10px', color: '#64748b' }}>Account ID</span>
            <div
              style={{
                fontSize: '11px',
                fontWeight: '700',
                color: '#cbd5e1',
                marginTop: '2px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {user.id || 'usr_player'}
            </div>
          </div>
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.6)',
              padding: '8px 10px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <span style={{ fontSize: '10px', color: '#64748b' }}>Multiplier Tier</span>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#eab308', marginTop: '2px' }}>
              10X Derby Multiplier
            </div>
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
              <div style={{ fontSize: '11px', color: '#fde047' }}>
                Register now to secure your account and coins.
              </div>
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
