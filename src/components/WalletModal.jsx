import React, { useState, useEffect } from 'react'
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
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Clock,
} from 'lucide-react'
import { walletService, deduplicateTransactions } from '../services/walletService.js'

export default function WalletModal({ isOpen, onClose, wallet, onRecharge }) {
  const [filterType, setFilterType] = useState('all') // 'all' | 'credit' | 'debit'
  const [transactions, setTransactions] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  const balance = wallet?.balance || 0

  const loadTransactions = (targetPage = 1) => {
    setIsLoading(true)
    walletService
      .getTransactions(targetPage, 20)
      .then((res) => {
        if (res) {
          const rawList = Array.isArray(res.transactions) ? res.transactions : (Array.isArray(res) ? res : [])
          const list = deduplicateTransactions(rawList)
          setTransactions(list)
          if (typeof res.totalPages === 'number') setTotalPages(res.totalPages)
          if (typeof res.total === 'number') setTotalCount(res.total)
          if (typeof res.page === 'number') setPage(res.page)
        }
      })
      .catch(() => { })
      .finally(() => {
        setIsLoading(false)
      })
  }

  useEffect(() => {
    if (isOpen) {
      loadTransactions(1)
    }
  }, [isOpen])

  // Listen for live ledger updates from socket
  useEffect(() => {
    const handleLedgerUpdate = () => {
      loadTransactions(page)
    }
    window.addEventListener('derby:ledger_transaction', handleLedgerUpdate)
    window.addEventListener('derby:coins_updated', handleLedgerUpdate)
    return () => {
      window.removeEventListener('derby:ledger_transaction', handleLedgerUpdate)
      window.removeEventListener('derby:coins_updated', handleLedgerUpdate)
    }
  }, [page])

  if (!isOpen) return null

  const filteredEntries = transactions.filter((entry) => {
    if (filterType === 'all') return true
    const isCredit = entry.type === 'credit' || entry.category === 'bet_win' || entry.category === 'deposit'
    if (filterType === 'credit') return isCredit
    if (filterType === 'debit') return !isCredit
    return true
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
          maxWidth: '520px',
          width: '94%',
          color: '#ffffff',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <header className="wallet-modal__header" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', padding: '16px 20px 12px' }}>
          <div>
            <span className="wallet-modal__eyebrow" style={{ color: '#f59e0b', letterSpacing: '1px', fontSize: '11px', fontWeight: '800' }}>
              LIVE TRANSACTION LEDGER
            </span>
            <h2 style={{ color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 0 0', fontSize: '18px' }}>
              <Coins size={22} className="text-amber-400" /> Wallet & Coin History
            </h2>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close wallet" style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '50%', color: '#94a3b8', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={16} />
          </button>
        </header>

        {/* Content Body */}
        <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1 }}>
          {/* Balance Banner */}
          <div
            className="wallet-modal__balance"
            style={{
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.18) 0%, rgba(217, 119, 6, 0.06) 100%)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              borderRadius: '12px',
              padding: '14px',
              textAlign: 'center',
              marginBottom: '14px',
            }}
          >
            <span style={{ fontSize: '11px', color: '#94a3b8', letterSpacing: '1px', fontWeight: '700' }}>AVAILABLE BALANCE</span>
            <strong style={{ fontSize: '26px', color: '#fbbf24', display: 'block', margin: '4px 0' }}>
              {typeof balance === 'number' ? balance.toFixed(2) : balance} <small style={{ fontSize: '14px', color: '#fde68a' }}>COINS</small>
            </strong>
            {/* Sync text and Stats strip commented out as requested */}
            {/* <p style={{ margin: 0, fontSize: '11px', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              <ShieldCheck size={14} /> Synced with Database REST API (/api/wallet/transactions)
            </p> */}

            {/* Quick User Stats Strip (Commented out)
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '8px',
                marginTop: '10px',
                paddingTop: '10px',
                borderTop: '1px solid rgba(245, 158, 11, 0.2)',
              }}
            >
              <div>
                <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block' }}>TOTAL WINS</span>
                <strong style={{ fontSize: '14px', color: '#fde047' }}>
                  🏆 {wallet?.totalWins || 0}
                </strong>
              </div>
              <div>
                <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block' }}>TOTAL WON</span>
                <strong style={{ fontSize: '14px', color: '#34d399' }}>
                  ₹{typeof wallet?.totalWon === 'number' ? wallet.totalWon.toFixed(2) : (wallet?.totalWon || '0.00')}
                </strong>
              </div>
              <div>
                <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block' }}>NET P/L</span>
                <strong style={{ fontSize: '14px', color: (wallet?.netProfitLoss || 0) >= 0 ? '#34d399' : '#f87171' }}>
                  {wallet?.displayNetProfitLoss || ((wallet?.netProfitLoss || 0) >= 0 ? '+' : '') + `₹${(wallet?.netProfitLoss || 0).toFixed(2)}`}
                </strong>
              </div>
            </div> */}
          </div>

          {/* Filter & Controls */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ReceiptText size={15} className="text-amber-400" />
              <span>History ({totalCount})</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                onClick={() => loadTransactions(page)}
                title="Refresh Ledger"
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '6px',
                  color: '#94a3b8',
                  padding: '4px 8px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '11px',
                }}
              >
                <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
              </button>

              <div style={{ display: 'flex', gap: '3px' }}>
                {[
                  { id: 'all', label: 'All' },
                  { id: 'credit', label: 'Wins / Credits' },
                  { id: 'debit', label: 'Bets / Debits' },
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
          </div>

          {/* Ledger Entries List */}
          <div
            style={{
              maxHeight: '260px',
              overflowY: 'auto',
              background: 'rgba(0, 0, 0, 0.35)',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              padding: '4px 8px',
            }}
          >
            {isLoading && !filteredEntries.length ? (
              <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8', fontSize: '12px' }}>
                <RefreshCw size={16} className="animate-spin" style={{ margin: '0 auto 6px' }} />
                Loading wallet transactions...
              </div>
            ) : filteredEntries.length ? (
              filteredEntries.map((entry, idx) => {
                const isCredit = entry.type === 'credit' || entry.category === 'bet_win' || entry.category === 'deposit'
                const amt = Number(entry.amount || 0)
                const balAfter = entry.balanceAfter !== undefined ? Number(entry.balanceAfter).toFixed(2) : null
                const dateStr = entry.createdAt
                  ? new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                  : (entry.time || '')

                return (
                  <div
                    key={entry.transactionId || entry.id || idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 6px',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                      <span
                        style={{
                          width: '28px',
                          height: '28px',
                          minWidth: '28px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: isCredit ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                          color: isCredit ? '#34d399' : '#f87171',
                        }}
                      >
                        {isCredit ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                      </span>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {entry.description || (isCredit ? 'Winning Payout' : 'Race Bet Placed')}
                        </div>
                        <div style={{ fontSize: '10.5px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                          <span><Clock size={10} style={{ display: 'inline', marginRight: '2px' }} />{dateStr}</span>
                          {balAfter !== null && <span>• Bal: ₹{balAfter}</span>}
                          {entry.category && (
                            <span style={{ textTransform: 'uppercase', fontSize: '9.5px', padding: '1px 4px', borderRadius: '3px', background: 'rgba(255,255,255,0.06)', color: '#94a3b8' }}>
                              {entry.category.replace('_', ' ')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: '13px',
                        color: isCredit ? '#34d399' : '#f87171',
                        fontWeight: '800',
                        marginLeft: '10px',
                        textAlign: 'right',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {isCredit ? '+' : '-'}₹{amt.toFixed(2)}
                    </div>
                  </div>
                )
              })
            ) : (
              <p style={{ textAlign: 'center', padding: '24px', color: '#64748b', fontSize: '12px' }}>
                No transactions recorded yet.
              </p>
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginTop: '12px' }}>
              <button
                type="button"
                disabled={page <= 1 || isLoading}
                onClick={() => loadTransactions(page - 1)}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  borderRadius: '6px',
                  color: page <= 1 ? '#475569' : '#f8fafc',
                  padding: '4px 8px',
                  cursor: page <= 1 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '11px',
                }}
              >
                <ChevronLeft size={14} /> Prev
              </button>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                Page <strong style={{ color: '#fbbf24' }}>{page}</strong> of {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages || isLoading}
                onClick={() => loadTransactions(page + 1)}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  borderRadius: '6px',
                  color: page >= totalPages ? '#475569' : '#f8fafc',
                  padding: '4px 8px',
                  cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '11px',
                }}
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
