import React, { useState } from 'react'
import {
  ArrowDownLeft,
  ArrowUpRight,
  Coins,
  ReceiptText,
  ShieldCheck,
  X,
  Trophy,
  Filter,
  PlusCircle,
  TrendingUp,
} from 'lucide-react'

const labels = {
  deposit: 'Wallet Recharge',
  bet: 'Derby Race Bet',
  refund: 'Bet Cancelled',
  payout: '10X Race Winning',
}

export default function WalletModal({ isOpen, onClose, wallet, onRecharge }) {
  const [filterType, setFilterType] = useState('all') // 'all' | 'bet' | 'payout' | 'deposit'

  if (!isOpen) return null

  const entries = wallet?.transactions || []
  const balance = wallet?.balance || 0

  const filteredEntries = entries.filter((entry) => {
    if (filterType === 'all') return true
    return entry.type === filterType
  })

  return (
    <div className="modal-backdrop-generic" onClick={onClose} style={{ zIndex: 9999 }}>
      <section
        className="wallet-modal"
        onClick={(event) => event.stopPropagation()}
        aria-label="Game wallet"
        style={{
          background: 'linear-gradient(180deg, #1e2430 0%, #0d1117 100%)',
          border: '2px solid rgba(245, 158, 11, 0.45)',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.85), 0 0 35px rgba(245, 158, 11, 0.25)',
          maxWidth: '480px',
          width: '92%',
          color: '#ffffff',
        }}
      >
        <header className="wallet-modal__header" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '12px' }}>
          <div>
            <span className="wallet-modal__eyebrow" style={{ color: '#f59e0b', letterSpacing: '1px' }}>
              REAL-TIME CASINO WALLET
            </span>
            <h2 style={{ color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 0 0' }}>
              <Coins size={22} className="text-amber-400" /> Coin Wallet & Ledger
            </h2>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close wallet">
            <X size={16} />
          </button>
        </header>

        <div
          className="wallet-modal__balance"
          style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.18) 0%, rgba(217, 119, 6, 0.06) 100%)',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            borderRadius: '12px',
            margin: '16px 0',
            padding: '16px',
            textAlign: 'center',
          }}
        >
          <span style={{ fontSize: '11px', color: '#94a3b8', letterSpacing: '1px' }}>TOTAL ACCREDITED BALANCE</span>
          <strong style={{ fontSize: '28px', color: '#fbbf24', display: 'block', margin: '4px 0' }}>
            {typeof balance === 'number' ? balance.toLocaleString() : balance} <small style={{ fontSize: '14px', color: '#fde68a' }}>COINS</small>
          </strong>
          <p style={{ margin: 0, fontSize: '12px', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
            <ShieldCheck size={14} /> 100% Cryptographically Verified In-Memory & REST Ledger
          </p>
        </div>

        {/* Quick Recharge Buttons */}
        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', marginBottom: '6px', textTransform: 'uppercase' }}>
            Free Coin Reward
          </div>
          <button
            type="button"
            onClick={() => onRecharge && onRecharge(10)}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.25) 100%)',
              border: '1.5px solid #10b981',
              color: '#34d399',
              fontWeight: '800',
              padding: '10px 14px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontSize: '13px',
              boxShadow: '0 2px 10px rgba(16, 185, 129, 0.2)',
            }}
          >
            <PlusCircle size={16} /> CLAIM +10 FREE COINS
          </button>
        </div>

        {/* Filter Ledger Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div className="wallet-modal__ledger-title" style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ReceiptText size={15} className="text-amber-400" /> Activity History
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            {[
              { id: 'all', label: 'All' },
              { id: 'payout', label: 'Wins' },
              { id: 'bet', label: 'Bets' },
              { id: 'deposit', label: 'Recharges' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id)}
                style={{
                  background: filterType === f.id ? '#f59e0b' : 'rgba(255, 255, 255, 0.06)',
                  color: filterType === f.id ? '#000000' : '#94a3b8',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '3px 8px',
                  fontSize: '11px',
                  fontWeight: '700',
                  cursor: 'pointer',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Ledger Entries */}
        <div
          className="wallet-modal__ledger"
          style={{
            maxHeight: '220px',
            overflowY: 'auto',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '10px',
            padding: '8px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          {filteredEntries.length ? (
            filteredEntries.slice(0, 30).map((entry) => {
              const credit = entry.amount > 0
              return (
                <div
                  className="wallet-modal__entry"
                  key={entry.id || `${entry.time}_${Math.random()}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      className={credit ? 'wallet-modal__entry-icon wallet-modal__entry-icon--in' : 'wallet-modal__entry-icon'}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: credit ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        color: credit ? '#34d399' : '#f87171',
                      }}
                    >
                      {credit ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                    </span>
                    <div>
                      <strong style={{ fontSize: '13px', display: 'block', color: '#f8fafc' }}>
                        {labels[entry.type] || entry.type}
                      </strong>
                      <small style={{ fontSize: '11px', color: '#64748b' }}>
                        {entry.note || 'Horse Derby'} · {entry.time}
                      </small>
                    </div>
                  </div>
                  <b
                    style={{
                      fontSize: '13px',
                      color: credit ? '#34d399' : '#f87171',
                      fontWeight: '800',
                    }}
                  >
                    {credit ? '+' : ''}
                    {typeof entry.amount === 'number' ? entry.amount.toFixed(2) : entry.amount}
                  </b>
                </div>
              )
            })
          ) : (
            <p className="wallet-modal__empty" style={{ textAlign: 'center', padding: '20px', color: '#64748b', fontSize: '12px' }}>
              No transactions found for this filter.
            </p>
          )}
        </div>
      </section>
    </div>
  )
}
