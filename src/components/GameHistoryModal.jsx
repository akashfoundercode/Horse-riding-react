import React, { useState, useEffect } from 'react'
import {
  History,
  Coins,
  ReceiptText,
  CheckCircle2,
  XCircle,
  ArrowDownLeft,
  ArrowUpRight,
  X,
  Camera,
  Medal,
  Clock,
  Download,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react'
import { gameApiService } from '../services/gameApiService.js'
import { walletService, deduplicateTransactions } from '../services/walletService.js'
import { storageService } from '../services/storageService.js'

/**
 * Deduplicates bet records by ID, match number, and horse
 */
export function deduplicateBets(list) {
  if (!Array.isArray(list)) return []
  const seenIds = new Set()
  const mapByMatchAndHorse = new Map()
  const result = []

  for (const raw of list) {
    if (!raw) continue
    const item = { ...raw }

    // 1. Check unique ID if available
    const rawId = item.id || item._id || item.betId || item.bet_id
    if (rawId && seenIds.has(String(rawId))) {
      continue
    }
    if (rawId) {
      seenIds.add(String(rawId))
    }

    const gameNo = String(item.gameNumber || item.game_serial || item.matchNumber || item.roundId || item.raceId || '')
    const horseNo = Number(item.myHorseNumber || item.horseSerial || item.horse_serial || item.horseNumber || item.horseId || 0)
    const matchKey = gameNo && horseNo ? `${gameNo}_${horseNo}` : null

    // If duplicate in the same match for the same horse, merge stakes or deduplicate
    if (matchKey && mapByMatchAndHorse.has(matchKey)) {
      const existing = mapByMatchAndHorse.get(matchKey)
      const amt1 = Number(existing.betAmount || existing.amount || 0)
      const amt2 = Number(item.betAmount || item.amount || 0)

      // If exact duplicate (same timestamp and amount or same id), skip
      if (existing.id === item.id || (existing.time === item.time && amt1 === amt2)) {
        continue
      }
      // If multiple chip additions on the same horse in this match round, merge the stake
      existing.betAmount = amt1 + amt2
      existing.displayAmount = `₹${existing.betAmount.toFixed(2)}`
      if (existing.isWon) {
        const mult = existing.multiplier || 10
        existing.payout = existing.betAmount * mult
        existing.payoutAmount = existing.payout
        existing.displayPayoutAmount = `+₹${existing.payout.toFixed(2)}`
        existing.netProfit = existing.payout - existing.betAmount
        existing.displayNetProfit = `+₹${existing.netProfit.toFixed(2)}`
      } else {
        existing.payout = -existing.betAmount
        existing.netProfit = -existing.betAmount
        existing.displayNetProfit = `-₹${existing.betAmount.toFixed(2)}`
      }
      continue
    }

    if (matchKey) {
      mapByMatchAndHorse.set(matchKey, item)
    }
    result.push(item)
  }

  return result
}

export default function GameHistoryModal({ isOpen, onClose, history = [] }) {
  const [activeTab, setActiveTab] = useState('bets') // 'bets' | 'wallet'
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [balance, setBalance] = useState(0)

  // 1. Bet History State
  const [serverBets, setServerBets] = useState([])
  const [betPage, setBetPage] = useState(1)
  const [betTotalPages, setBetTotalPages] = useState(1)
  const [betTotalCount, setBetTotalCount] = useState(0)
  const [isBetLoading, setIsBetLoading] = useState(false)

  // 2. Wallet Transactions State
  const [transactions, setTransactions] = useState([])
  const [walletPage, setWalletPage] = useState(1)
  const [walletTotalPages, setWalletTotalPages] = useState(1)
  const [walletTotalCount, setWalletTotalCount] = useState(0)
  const [isWalletLoading, setIsWalletLoading] = useState(false)

  // Load live balance
  const syncBalance = () => {
    const w = storageService.getWallet()
    if (w && typeof w.balance === 'number') {
      setBalance(w.balance)
    }
  }

  // Fetch live bet history: GET /api/bets/history?page=1&limit=20
  const loadBetHistory = (targetPage = 1) => {
    if (!isOpen) return
    setIsBetLoading(true)
    gameApiService
      .fetchBetHistory(targetPage, 20)
      .then((res) => {
        if (!res) return
        const list = Array.isArray(res) ? res : (res.bets || res.history || res.data || [])
        if (Array.isArray(list)) {
          const formatted = list.map((b, idx) => {
            const isWon = Boolean(b.is_won || b.isWon || b.isWinner || b.status === 'WON' || (b.payout && b.payout > 0) || (b.payoutAmount && b.payoutAmount > 0))
            const betAmt = Number(b.amount || b.coins || b.bet_amount || b.betAmount || 0)
            const payoutAmt = Number(b.payoutAmount || b.payout || b.win_amount || b.winAmount || b.potentialPayout || 0)
            const horseSerial = b.horseSerial || b.horse_serial || b.horse_number || b.horseNumber || b.horse_id || b.horseId || 1
            const winHorse = b.winner_horse_id || b.winner_horse || b.winner_number || b.winnerNumber || (isWon ? horseSerial : null)

            return {
              id: b.id || `BET_${b.game_serial || b.gameSerial}_${horseSerial}_${idx}`,
              matchNumber: b.game_serial || b.gameSerial || b.game_id || b.id || (list.length - idx),
              gameNumber: b.game_serial || b.gameSerial || b.game_id || b.id || '101',
              time: b.created_at || b.createdAt
                ? new Date(b.created_at || b.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                : new Date().toLocaleTimeString(),
              winnerNumber: winHorse,
              winnerName: b.winner_name || b.winnerName || (winHorse ? `Horse #${winHorse}` : 'TBD'),
              myHorseNumber: horseSerial,
              myHorseName: b.horseName || b.horse_name || `Horse #${horseSerial}`,
              betAmount: betAmt,
              displayAmount: b.displayAmount || `₹${betAmt.toFixed(2)}`,
              payout: isWon ? payoutAmt : -betAmt,
              payoutAmount: isWon ? payoutAmt : 0,
              displayPayoutAmount: b.displayPayoutAmount || (isWon ? `+₹${payoutAmt.toFixed(2)}` : '₹0.00'),
              winCalculation: b.winCalculation || (isWon ? `₹${betAmt} × 10X = ₹${payoutAmt}` : null),
              netProfit: Number(b.netProfit !== undefined ? b.netProfit : (isWon ? payoutAmt - betAmt : -betAmt)),
              displayNetProfit: b.displayNetProfit || (isWon ? `+₹${(payoutAmt - betAmt).toFixed(2)}` : `-₹${betAmt.toFixed(2)}`),
              multiplier: parseFloat(b.multiplier || b.odds || b.jackpot_multiplier || 1) || 1,
              isWon: isWon,
              status: b.status || (isWon ? 'WON' : 'LOST'),
              hasBet: true,
              screenshot: b.screenshot || b.screenshot_url || null,
            }
          })
          const deduplicated = deduplicateBets(formatted)
          setServerBets(deduplicated)
          if (res.total || res.totalCount) setBetTotalCount(res.total || res.totalCount || deduplicated.length)
          if (res.totalPages || res.total_pages || res.pagination?.totalPages) {
            setBetTotalPages(res.totalPages || res.total_pages || res.pagination?.totalPages || 1)
          }
          if (typeof res.page === 'number') setBetPage(res.page)
        }
      })
      .catch((err) => {
        console.warn('Failed to load bet history:', err)
      })
      .finally(() => {
        setIsBetLoading(false)
      })
  }

  // Fetch live wallet transactions: GET /api/wallet/transactions?page=1&limit=20
  const loadWalletTransactions = (targetPage = 1) => {
    if (!isOpen) return
    setIsWalletLoading(true)
    walletService
      .getTransactions(targetPage, 20)
      .then((res) => {
        if (res) {
          const rawList = Array.isArray(res.transactions) ? res.transactions : (Array.isArray(res) ? res : [])
          const list = deduplicateTransactions(rawList)
          setTransactions(list)
          if (typeof res.totalPages === 'number') setWalletTotalPages(res.totalPages)
          if (typeof res.total === 'number') setWalletTotalCount(res.total)
          if (typeof res.page === 'number') setWalletPage(res.page)
        }
      })
      .catch((err) => {
        console.warn('Failed to load wallet transactions:', err)
        const saved = storageService.getWallet() || {}
        if (Array.isArray(saved.transactions)) {
          const list = deduplicateTransactions(saved.transactions)
          setTransactions(list)
          setWalletTotalCount(list.length)
        }
      })
      .finally(() => {
        setIsWalletLoading(false)
      })
  }

  useEffect(() => {
    if (isOpen) {
      syncBalance()
      if (activeTab === 'bets') {
        loadBetHistory(betPage)
      } else {
        loadWalletTransactions(walletPage)
      }
    }
  }, [isOpen, activeTab, betPage, walletPage])

  // Real-time socket events listener (debounced to prevent double-fetching on multiple simultaneous events)
  useEffect(() => {
    let timer = null
    const handleUpdate = () => {
      syncBalance()
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        if (isOpen) {
          if (activeTab === 'bets') loadBetHistory(betPage)
          else loadWalletTransactions(walletPage)
        }
      }, 100)
    }
    window.addEventListener('derby:ledger_transaction', handleUpdate)
    window.addEventListener('derby:coins_updated', handleUpdate)
    return () => {
      if (timer) clearTimeout(timer)
      window.removeEventListener('derby:ledger_transaction', handleUpdate)
      window.removeEventListener('derby:coins_updated', handleUpdate)
    }
  }, [isOpen, activeTab, betPage, walletPage])

  if (!isOpen) return null

  // Combined Bet History (Server API + Local fallback)
  const combinedBets = deduplicateBets(
    serverBets.length > 0 ? serverBets : history.filter((r) => (r.betAmount && r.betAmount > 0) || r.hasBet)
  )
  const displayedBetRaces = combinedBets

  return (
    <div className="modal-backdrop-generic" onClick={onClose} style={{ zIndex: 9999 }}>
      <div
        className="game-history-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '94%',
          maxWidth: '820px',
          maxHeight: '90vh',
          background: 'linear-gradient(180deg, #240944 0%, #120324 100%)',
          border: '1.5px solid rgba(255, 211, 61, 0.45)',
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(138, 43, 226, 0.35)',
          overflow: 'hidden',
          color: '#ffffff',
          animation: 'modalPop 0.22s cubic-bezier(0.2, 0.9, 0.3, 1.2) forwards',
        }}
      >
        {/* Top Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px',
            background: 'rgba(0, 0, 0, 0.45)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #ffd33d 0%, #f59f00 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#1a052e',
                boxShadow: '0 0 14px rgba(255, 211, 61, 0.4)',
              }}
            >
              <History size={22} />
            </div>
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: '18px',
                  fontWeight: 900,
                  letterSpacing: '0.04em',
                  color: '#ffd33d',
                }}
              >
                HORSE RACING — HISTORY & WALLET LEDGER
              </h2>
              <p style={{ margin: 0, fontSize: '11.5px', color: '#dfcbff', opacity: 0.85 }}>
                Track your game bets, win payouts, deposits, and live coin transactions
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Balance Badge */}
            <div
              style={{
                background: 'rgba(255, 211, 61, 0.15)',
                border: '1px solid rgba(255, 211, 61, 0.35)',
                borderRadius: '8px',
                padding: '4px 10px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Coins size={14} className="text-amber-400" />
              <span style={{ fontSize: '11px', color: '#dfcbff', fontWeight: 700 }}>BALANCE:</span>
              <strong style={{ fontSize: '13px', color: '#ffd33d' }}>
                ₹{typeof balance === 'number' ? balance.toFixed(2) : balance}
              </strong>
            </div>

            <button
              onClick={onClose}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* 2 MAIN TABS: BET HISTORY vs WALLET HISTORY */}
        <div
          style={{
            display: 'flex',
            padding: '8px 16px',
            background: 'rgba(0, 0, 0, 0.35)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            gap: '10px',
          }}
        >
          {/* TAB 1: BET HISTORY */}
          <button
            type="button"
            onClick={() => setActiveTab('bets')}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: '10px',
              border:
                activeTab === 'bets' ? '1.5px solid #ffd33d' : '1px solid rgba(255, 255, 255, 0.12)',
              background:
                activeTab === 'bets'
                  ? 'linear-gradient(135deg, rgba(255, 211, 61, 0.25) 0%, rgba(245, 159, 0, 0.15) 100%)'
                  : 'rgba(255, 255, 255, 0.04)',
              color: activeTab === 'bets' ? '#ffd33d' : '#dfcbff',
              fontSize: '13px',
              fontWeight: 900,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: activeTab === 'bets' ? '0 0 16px rgba(255, 211, 61, 0.25)' : 'none',
              transition: 'all 0.18s ease',
            }}
          >
            <Coins size={16} />
            <span>🎯 BET HISTORY</span>
            <span
              style={{
                fontSize: '11px',
                padding: '2px 7px',
                borderRadius: '12px',
                background: activeTab === 'bets' ? '#ffd33d' : 'rgba(255, 255, 255, 0.1)',
                color: activeTab === 'bets' ? '#1a052e' : '#ffffff',
                fontWeight: 900,
              }}
            >
              {betTotalCount || displayedBetRaces.length}
            </span>
          </button>

          {/* TAB 2: WALLET HISTORY */}
          <button
            type="button"
            onClick={() => setActiveTab('wallet')}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: '10px',
              border:
                activeTab === 'wallet' ? '1.5px solid #ffd33d' : '1px solid rgba(255, 255, 255, 0.12)',
              background:
                activeTab === 'wallet'
                  ? 'linear-gradient(135deg, rgba(255, 211, 61, 0.25) 0%, rgba(245, 159, 0, 0.15) 100%)'
                  : 'rgba(255, 255, 255, 0.04)',
              color: activeTab === 'wallet' ? '#ffd33d' : '#dfcbff',
              fontSize: '13px',
              fontWeight: 900,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: activeTab === 'wallet' ? '0 0 16px rgba(255, 211, 61, 0.25)' : 'none',
              transition: 'all 0.18s ease',
            }}
          >
            <ReceiptText size={16} />
            <span>💳 WALLET HISTORY</span>
            <span
              style={{
                fontSize: '11px',
                padding: '2px 7px',
                borderRadius: '12px',
                background: activeTab === 'wallet' ? '#ffd33d' : 'rgba(255, 255, 255, 0.1)',
                color: activeTab === 'wallet' ? '#1a052e' : '#ffffff',
                fontWeight: 900,
              }}
            >
              {walletTotalCount || transactions.length}
            </span>
          </button>
        </div>

        {/* TAB 1 CONTENT: BET HISTORY */}
        {activeTab === 'bets' && (
          <>
            <div
              className="hide-scrollbar"
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '12px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                minHeight: '260px',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
            >
              {isBetLoading && displayedBetRaces.length === 0 ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '40px 20px',
                    textAlign: 'center',
                    color: '#dfcbff',
                  }}
                >
                  <RefreshCw size={24} className="animate-spin" style={{ marginBottom: '8px', color: '#ffd33d' }} />
                  <span>Loading bet records...</span>
                </div>
              ) : displayedBetRaces.length === 0 ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '40px 20px',
                    textAlign: 'center',
                    color: '#a78bfa',
                    opacity: 0.8,
                  }}
                >
                  <Coins size={44} style={{ marginBottom: '12px', opacity: 0.5 }} />
                  <h3 style={{ margin: '0 0 4px', fontSize: '15px', color: '#ffffff' }}>
                    No Bet History Found
                  </h3>
                  <p style={{ margin: 0, fontSize: '12px', maxWidth: '320px' }}>
                    Place chips on any of the 12 derby horses during the betting phase to record your stakes!
                  </p>
                </div>
              ) : (
                displayedBetRaces.map((race, idx) => (
                  <div
                    key={race.id || idx}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'auto 1fr auto auto',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 14px',
                      minHeight: '64px',
                      flexShrink: 0,
                      width: '100%',
                      boxSizing: 'border-box',
                      background: race.isWon
                        ? 'linear-gradient(90deg, rgba(16, 185, 129, 0.14) 0%, rgba(20, 6, 38, 0.8) 100%)'
                        : 'linear-gradient(90deg, rgba(239, 68, 68, 0.09) 0%, rgba(20, 6, 38, 0.8) 100%)',
                      border: race.isWon
                        ? '1px solid rgba(16, 185, 129, 0.4)'
                        : '1px solid rgba(239, 68, 68, 0.28)',
                      borderRadius: '10px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {/* Status Badge */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: race.isWon ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.2)',
                        color: race.isWon ? '#34d399' : '#f87171',
                      }}
                    >
                      {race.isWon ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                    </div>

                    {/* Bet Details */}
                    <div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginBottom: '3px',
                        }}
                      >
                        <span style={{ fontSize: '13px', fontWeight: 900, color: '#ffffff' }}>
                          MATCH #{race.matchNumber || (displayedBetRaces.length - idx)}
                        </span>
                        <span
                          style={{
                            fontSize: '11px',
                            color: '#9ca3af',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                          }}
                        >
                          <Clock size={11} /> {race.time}
                        </span>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '11.5px',
                        }}
                      >
                        <span
                          style={{
                            color: '#ffd33d',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                            fontWeight: 800,
                          }}
                        >
                          <Medal size={12} className="text-amber-400" /> Winner: #{race.winnerNumber}{' '}
                          {race.winnerName}
                        </span>
                        <span style={{ color: '#d1d5db' }}>
                          • Your Pick:{' '}
                          <strong style={{ color: race.isWon ? '#34d399' : '#f87171' }}>
                            #{race.myHorseNumber} {race.myHorseName}
                          </strong>
                        </span>
                        <span style={{ color: '#a78bfa', fontWeight: 700 }}>
                          • Bet: {race.betAmount} PTS
                        </span>
                      </div>
                    </div>

                    {/* Photo Finish Button */}
                    {race.screenshot ? (
                      <button
                        type="button"
                        onClick={() => setSelectedPhoto(race.screenshot)}
                        title="View Photo Finish Snapshot"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '5px 9px',
                          borderRadius: '6px',
                          background: 'rgba(255, 211, 61, 0.15)',
                          border: '1px solid rgba(255, 211, 61, 0.4)',
                          color: '#ffd33d',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        <Camera size={13} /> Photo
                      </button>
                    ) : (
                      <div />
                    )}

                    {/* Net Outcome */}
                    <div style={{ textAlign: 'right', minWidth: '85px' }}>
                      <span
                        style={{
                          fontSize: '14px',
                          fontWeight: 900,
                          color: race.isWon ? '#00ff88' : '#ff5252',
                          display: 'block',
                        }}
                      >
                        {race.isWon ? `+${race.payout}` : `-${race.betAmount}`} PTS
                      </span>
                      <span
                        style={{
                          fontSize: '9.5px',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          color: race.isWon ? '#34d399' : '#f87171',
                          letterSpacing: '0.04em',
                        }}
                      >
                        {race.isWon ? 'VICTORY (10x)' : 'LOST'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Bet Pagination Controls */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 16px',
                background: 'rgba(0, 0, 0, 0.3)',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => loadBetHistory(betPage)}
                  disabled={isBetLoading}
                  title="Refresh bet history"
                  style={{
                    padding: '5px 10px',
                    borderRadius: '6px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#ffd33d',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <RefreshCw size={12} className={isBetLoading ? 'animate-spin' : ''} /> Refresh
                </button>
                <span style={{ fontSize: '11.5px', color: '#dfcbff' }}>
                  Page <strong>{betPage}</strong> of <strong>{betTotalPages}</strong> ({betTotalCount || displayedBetRaces.length} bets)
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setBetPage((p) => Math.max(1, p - 1))}
                  disabled={betPage <= 1 || isBetLoading}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '6px',
                    background: betPage > 1 ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: betPage > 1 ? '#ffffff' : '#6b7280',
                    fontSize: '11px',
                    cursor: betPage > 1 ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <ChevronLeft size={13} /> Prev
                </button>
                <button
                  type="button"
                  onClick={() => setBetPage((p) => Math.min(betTotalPages, p + 1))}
                  disabled={betPage >= betTotalPages || isBetLoading}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '6px',
                    background: betPage < betTotalPages ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: betPage < betTotalPages ? '#ffffff' : '#6b7280',
                    fontSize: '11px',
                    cursor: betPage < betTotalPages ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  Next <ChevronRight size={13} />
                </button>
              </div>
            </div>
          </>
        )}

        {/* TAB 2 CONTENT: WALLET HISTORY */}
        {activeTab === 'wallet' && (
          <>
            <div
              className="hide-scrollbar"
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '12px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                minHeight: '260px',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
            >
              {isWalletLoading && transactions.length === 0 ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '40px 20px',
                    textAlign: 'center',
                    color: '#dfcbff',
                  }}
                >
                  <RefreshCw size={24} className="animate-spin" style={{ marginBottom: '8px', color: '#ffd33d' }} />
                  <span>Loading wallet transactions...</span>
                </div>
              ) : transactions.length === 0 ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '40px 20px',
                    textAlign: 'center',
                    color: '#a78bfa',
                    opacity: 0.8,
                  }}
                >
                  <ReceiptText size={44} style={{ marginBottom: '12px', opacity: 0.5 }} />
                  <h3 style={{ margin: '0 0 4px', fontSize: '15px', color: '#ffffff' }}>
                    No Transactions Recorded Yet
                  </h3>
                  <p style={{ margin: 0, fontSize: '12px', maxWidth: '320px' }}>
                    Recharge coins or play races to see your live credit and debit transactions ledger!
                  </p>
                </div>
              ) : (
                deduplicateTransactions(transactions).map((entry, idx) => {
                  const isCredit = entry.type === 'credit' || entry.category === 'bet_win' || entry.category === 'deposit'
                  const amt = Number(entry.amount || 0)
                  const balAfter = entry.balanceAfter !== undefined ? Number(entry.balanceAfter).toFixed(2) : null
                  const dateStr = entry.createdAt
                    ? new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                    : (entry.time || new Date().toLocaleTimeString())

                  return (
                    <div
                      key={entry.transactionId || entry.id || idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        minHeight: '56px',
                        flexShrink: 0,
                        width: '100%',
                        boxSizing: 'border-box',
                        background: isCredit
                          ? 'linear-gradient(90deg, rgba(16, 185, 129, 0.14) 0%, rgba(20, 6, 38, 0.8) 100%)'
                          : 'linear-gradient(90deg, rgba(239, 68, 68, 0.09) 0%, rgba(20, 6, 38, 0.8) 100%)',
                        border: isCredit
                          ? '1px solid rgba(16, 185, 129, 0.4)'
                          : '1px solid rgba(239, 68, 68, 0.28)',
                        borderRadius: '10px',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                        {/* Direction Icon */}
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            minWidth: '32px',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: isCredit ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.2)',
                            color: isCredit ? '#34d399' : '#f87171',
                          }}
                        >
                          {isCredit ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                        </div>

                        {/* Details */}
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div
                            style={{
                              fontSize: '13px',
                              fontWeight: 800,
                              color: '#ffffff',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {entry.description || (isCredit ? 'Winning Payout' : 'Race Bet Placed')}
                          </div>

                          <div
                            style={{
                              fontSize: '11px',
                              color: '#dfcbff',
                              opacity: 0.8,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              marginTop: '2px',
                              flexWrap: 'wrap',
                            }}
                          >
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                              <Clock size={11} /> {dateStr}
                            </span>
                            {balAfter !== null && (
                              <span style={{ color: '#ffd33d', fontWeight: 700 }}>
                                • Bal: ₹{balAfter}
                              </span>
                            )}
                            {entry.category && (
                              <span
                                style={{
                                  textTransform: 'uppercase',
                                  fontSize: '9.5px',
                                  padding: '1px 5px',
                                  borderRadius: '4px',
                                  background: isCredit ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.2)',
                                  color: isCredit ? '#34d399' : '#fca5a5',
                                  fontWeight: 800,
                                }}
                              >
                                {entry.category.replace('_', ' ')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Amount */}
                      <div
                        style={{
                          textAlign: 'right',
                          minWidth: '90px',
                          marginLeft: '12px',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '15px',
                            fontWeight: 900,
                            color: isCredit ? '#00ff88' : '#ff5252',
                            display: 'block',
                          }}
                        >
                          {isCredit ? '+' : '-'}₹{amt.toFixed(2)}
                        </span>
                        <span
                          style={{
                            fontSize: '9.5px',
                            fontWeight: 800,
                            color: isCredit ? '#34d399' : '#f87171',
                            letterSpacing: '0.04em',
                          }}
                        >
                          {isCredit ? 'CREDIT / WIN' : 'DEBIT / BET'}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Wallet Pagination Controls */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 16px',
                background: 'rgba(0, 0, 0, 0.3)',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => loadWalletTransactions(walletPage)}
                  disabled={isWalletLoading}
                  title="Refresh wallet ledger"
                  style={{
                    padding: '5px 10px',
                    borderRadius: '6px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#ffd33d',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <RefreshCw size={12} className={isWalletLoading ? 'animate-spin' : ''} /> Refresh
                </button>
                <span style={{ fontSize: '11.5px', color: '#dfcbff' }}>
                  Page <strong>{walletPage}</strong> of <strong>{walletTotalPages}</strong> ({walletTotalCount || transactions.length} records)
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setWalletPage((p) => Math.max(1, p - 1))}
                  disabled={walletPage <= 1 || isWalletLoading}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '6px',
                    background: walletPage > 1 ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: walletPage > 1 ? '#ffffff' : '#6b7280',
                    fontSize: '11px',
                    cursor: walletPage > 1 ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <ChevronLeft size={13} /> Prev
                </button>
                <button
                  type="button"
                  onClick={() => setWalletPage((p) => Math.min(walletTotalPages, p + 1))}
                  disabled={walletPage >= walletTotalPages || isWalletLoading}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '6px',
                    background: walletPage < walletTotalPages ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: walletPage < walletTotalPages ? '#ffffff' : '#6b7280',
                    fontSize: '11px',
                    cursor: walletPage < walletTotalPages ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  Next <ChevronRight size={13} />
                </button>
              </div>
            </div>
          </>
        )}

        {/* Bottom Close Button */}
        <div
          style={{
            padding: '10px 16px',
            background: 'rgba(0, 0, 0, 0.45)',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: '11.5px', color: '#9ca3af' }}>
            Showing {activeTab === 'bets' ? displayedBetRaces.length : transactions.length} items
          </span>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 24px',
              borderRadius: '8px',
              background: 'linear-gradient(180deg, #ffd33d 0%, #f59f00 100%)',
              border: 'none',
              color: '#1a052e',
              fontSize: '13px',
              fontWeight: 900,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(255, 211, 61, 0.3)',
            }}
          >
            CLOSE
          </button>
        </div>
      </div>

      {/* High-Resolution Snapshot Preview Modal */}
      {selectedPhoto && (
        <div
          className="modal-backdrop-generic"
          style={{ zIndex: 10000 }}
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '92vw',
              maxHeight: '90vh',
              background: '#0a0a0a',
              borderRadius: '14px',
              overflow: 'hidden',
              border: '2px solid #ffd33d',
              boxShadow: '0 0 50px rgba(0,0,0,0.95), 0 0 30px rgba(255, 211, 61, 0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with Title & Download */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 16px',
                background: 'rgba(20, 10, 35, 0.9)',
                borderBottom: '1px solid rgba(255, 211, 61, 0.3)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#ffd33d',
                  fontWeight: 900,
                  fontSize: '13px',
                }}
              >
                <Camera size={16} /> PHOTO-FINISH HIGH-SPEED SNAPSHOT
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <a
                  href={selectedPhoto}
                  download="photo-finish-record.jpg"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: 'rgba(255, 211, 61, 0.2)',
                    border: '1px solid #ffd33d',
                    color: '#ffd33d',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 700,
                    textDecoration: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <Download size={13} /> Save Image
                </a>
                <button
                  type="button"
                  onClick={() => setSelectedPhoto(null)}
                  style={{
                    background: 'rgba(255,255,255,0.15)',
                    border: 'none',
                    color: '#ffffff',
                    borderRadius: '50%',
                    width: '28px',
                    height: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <img
              src={selectedPhoto}
              alt="Photo Finish Snapshot"
              style={{ width: '100%', maxHeight: '78vh', objectFit: 'contain', display: 'block' }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
