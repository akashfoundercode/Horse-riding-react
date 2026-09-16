import React, { useState } from 'react'
import {
  History,
  Trophy,
  TrendingUp,
  TrendingDown,
  Coins,
  CheckCircle2,
  XCircle,
  Trash2,
  X,
  Camera,
  Medal,
  Clock,
  Zap,
  Filter,
  Download,
} from 'lucide-react'

export default function GameHistoryModal({ isOpen, onClose, history = [], onClearHistory }) {
  const [activeTab, setActiveTab] = useState('bets') // 'bets' | 'matches'
  const [betFilter, setBetFilter] = useState('all') // 'all' | 'won' | 'lost'
  const [matchFilter, setMatchFilter] = useState('all') // 'all' | 'bet_only' | 'mult_only'
  const [selectedPhoto, setSelectedPhoto] = useState(null)

  if (!isOpen) return null

  // Process Bet History (where player placed bets or participated)
  const allBetRaces = history.filter((r) => (r.betAmount && r.betAmount > 0) || r.hasBet)
  const displayedBetRaces = allBetRaces.filter((r) => {
    if (betFilter === 'won') return r.isWon
    if (betFilter === 'lost') return !r.isWon
    return true
  })

  const totalBetsCount = allBetRaces.length
  const totalWinsCount = allBetRaces.filter((r) => r.isWon).length
  const winRate = totalBetsCount > 0 ? Math.round((totalWinsCount / totalBetsCount) * 100) : 0
  const netProfit = allBetRaces.reduce(
    (sum, r) => sum + (r.isWon ? (r.payout || 0) : -(r.betAmount || 0)),
    0
  )

  // Process Game Matches History (All game rounds run)
  const allMatchRaces = history
  const displayedMatchRaces = allMatchRaces.filter((r) => {
    if (matchFilter === 'bet_only') return (r.betAmount && r.betAmount > 0) || r.hasBet
    if (matchFilter === 'mult_only') return r.multiplier && r.multiplier > 1
    return true
  })

  // Find most frequent winner
  const winnerCounts = {}
  allMatchRaces.forEach((r) => {
    if (r.winnerNumber) {
      winnerCounts[r.winnerNumber] = (winnerCounts[r.winnerNumber] || 0) + 1
    }
  })
  let topWinnerNum = null
  let topWinnerCount = 0
  Object.entries(winnerCounts).forEach(([num, count]) => {
    if (count > topWinnerCount) {
      topWinnerCount = count
      topWinnerNum = num
    }
  })
  const topWinnerName =
    allMatchRaces.find((r) => String(r.winnerNumber) === String(topWinnerNum))?.winnerName || 'N/A'

  return (
    <div className="modal-backdrop-generic" onClick={onClose}>
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
                HORSE RACING — RACE & BET RECORDS
              </h2>
              <p style={{ margin: 0, fontSize: '11.5px', color: '#dfcbff', opacity: 0.85 }}>
                Track your bets, match winners, and high-speed photo-finish snapshots
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {history.length > 0 && onClearHistory && (
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to clear all history records?')) {
                    onClearHistory()
                  }
                }}
                title="Clear all race history"
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  color: '#fca5a5',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '11px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <Trash2 size={13} /> Clear
              </button>
            )}
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

        {/* 2 MAIN TABS: BET HISTORY vs GAME MATCHES RESULTS */}
        <div
          style={{
            display: 'flex',
            padding: '8px 16px',
            background: 'rgba(0, 0, 0, 0.35)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            gap: '10px',
          }}
        >
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
              {allBetRaces.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('matches')}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: '10px',
              border:
                activeTab === 'matches'
                  ? '1.5px solid #ffd33d' : '1px solid rgba(255, 255, 255, 0.12)',
              background:
                activeTab === 'matches'
                  ? 'linear-gradient(135deg, rgba(255, 211, 61, 0.25) 0%, rgba(245, 159, 0, 0.15) 100%)'
                  : 'rgba(255, 255, 255, 0.04)',
              color: activeTab === 'matches' ? '#ffd33d' : '#dfcbff',
              fontSize: '13px',
              fontWeight: 900,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: activeTab === 'matches' ? '0 0 16px rgba(255, 211, 61, 0.25)' : 'none',
              transition: 'all 0.18s ease',
            }}
          >
            <Trophy size={16} />
            <span>🏆 GAME MATCHES RESULTS</span>
            <span
              style={{
                fontSize: '11px',
                padding: '2px 7px',
                borderRadius: '12px',
                background: activeTab === 'matches' ? '#ffd33d' : 'rgba(255, 255, 255, 0.1)',
                color: activeTab === 'matches' ? '#1a052e' : '#ffffff',
                fontWeight: 900,
              }}
            >
              {allMatchRaces.length}
            </span>
          </button>
        </div>

        {/* TAB 1: BET HISTORY CONTENT */}
        {activeTab === 'bets' && (
          <>
            {/* Stats Summary Strip */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '8px',
                padding: '10px 16px',
                background: 'rgba(0, 0, 0, 0.25)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <span style={{ fontSize: '10px', color: '#a78bfa', fontWeight: 700, display: 'block' }}>
                  TOTAL BETS
                </span>
                <span style={{ fontSize: '16px', fontWeight: 900, color: '#ffffff' }}>
                  {totalBetsCount}
                </span>
              </div>
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <span style={{ fontSize: '10px', color: '#34d399', fontWeight: 700, display: 'block' }}>
                  WON BETS
                </span>
                <span style={{ fontSize: '16px', fontWeight: 900, color: '#34d399' }}>
                  {totalWinsCount}
                </span>
              </div>
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <span style={{ fontSize: '10px', color: '#fbbf24', fontWeight: 700, display: 'block' }}>
                  WIN RATE
                </span>
                <span style={{ fontSize: '16px', fontWeight: 900, color: '#fbbf24' }}>
                  {winRate}%
                </span>
              </div>
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <span
                  style={{
                    fontSize: '10px',
                    color: netProfit >= 0 ? '#34d399' : '#f87171',
                    fontWeight: 700,
                    display: 'block',
                  }}
                >
                  NET COINS
                </span>
                <span
                  style={{
                    fontSize: '16px',
                    fontWeight: 900,
                    color: netProfit >= 0 ? '#00ff88' : '#ff5252',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px',
                  }}
                >
                  {netProfit >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {netProfit >= 0 ? `+${netProfit}` : `${netProfit}`} PTS
                </span>
              </div>
            </div>

            {/* Filter Pills */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                background: 'rgba(0,0,0,0.15)',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              <span
                style={{
                  fontSize: '11px',
                  color: '#9ca3af',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                }}
              >
                <Filter size={11} /> Filter:
              </span>
              <button
                type="button"
                onClick={() => setBetFilter('all')}
                style={{
                  padding: '3px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: '1px solid',
                  borderColor: betFilter === 'all' ? '#ffd33d' : 'rgba(255,255,255,0.15)',
                  background: betFilter === 'all' ? '#ffd33d' : 'rgba(255,255,255,0.05)',
                  color: betFilter === 'all' ? '#1a052e' : '#ffffff',
                }}
              >
                All Bets ({allBetRaces.length})
              </button>
              <button
                type="button"
                onClick={() => setBetFilter('won')}
                style={{
                  padding: '3px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: '1px solid',
                  borderColor: betFilter === 'won' ? '#34d399' : 'rgba(255,255,255,0.15)',
                  background: betFilter === 'won' ? 'rgba(52, 211, 153, 0.25)' : 'rgba(255,255,255,0.05)',
                  color: betFilter === 'won' ? '#34d399' : '#ffffff',
                }}
              >
                Won ({totalWinsCount})
              </button>
              <button
                type="button"
                onClick={() => setBetFilter('lost')}
                style={{
                  padding: '3px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: '1px solid',
                  borderColor: betFilter === 'lost' ? '#f87171' : 'rgba(255,255,255,0.15)',
                  background: betFilter === 'lost' ? 'rgba(248, 113, 113, 0.25)' : 'rgba(255,255,255,0.05)',
                  color: betFilter === 'lost' ? '#f87171' : '#ffffff',
                }}
              >
                Lost ({totalBetsCount - totalWinsCount})
              </button>
            </div>

            {/* Bet History List */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '12px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                minHeight: '220px',
              }}
            >
              {displayedBetRaces.length === 0 ? (
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
                          MATCH #{race.matchNumber || (allBetRaces.length - idx)}
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
          </>
        )}

        {/* TAB 2: GAME MATCHES RESULTS CONTENT */}
        {activeTab === 'matches' && (
          <>
            {/* Stats Summary Strip for Matches */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '8px',
                padding: '10px 16px',
                background: 'rgba(0, 0, 0, 0.25)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <span style={{ fontSize: '10px', color: '#a78bfa', fontWeight: 700, display: 'block' }}>
                  TOTAL MATCHES
                </span>
                <span style={{ fontSize: '16px', fontWeight: 900, color: '#ffffff' }}>
                  {allMatchRaces.length}
                </span>
              </div>
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <span style={{ fontSize: '10px', color: '#ffd33d', fontWeight: 700, display: 'block' }}>
                  TOP WINNER
                </span>
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: 900,
                    color: '#ffd33d',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px',
                  }}
                >
                  {topWinnerNum ? `#${topWinnerNum} ${topWinnerName}` : 'None'}
                </span>
              </div>
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <span style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 700, display: 'block' }}>
                  WIN PAYOUT
                </span>
                <span style={{ fontSize: '16px', fontWeight: 900, color: '#38bdf8' }}>
                  10X FIXED
                </span>
              </div>
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <span style={{ fontSize: '10px', color: '#34d399', fontWeight: 700, display: 'block' }}>
                  RECENT WINNER
                </span>
                <span style={{ fontSize: '14px', fontWeight: 900, color: '#34d399' }}>
                  {allMatchRaces.length > 0
                    ? `#${allMatchRaces[0].winnerNumber} ${allMatchRaces[0].winnerName}`
                    : 'None'}
                </span>
              </div>
            </div>

            {/* Filter Pills for Matches */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                background: 'rgba(0,0,0,0.15)',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              <span
                style={{
                  fontSize: '11px',
                  color: '#9ca3af',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                }}
              >
                <Filter size={11} /> Filter:
              </span>
              <button
                type="button"
                onClick={() => setMatchFilter('all')}
                style={{
                  padding: '3px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: '1px solid',
                  borderColor: matchFilter === 'all' ? '#ffd33d' : 'rgba(255,255,255,0.15)',
                  background: matchFilter === 'all' ? '#ffd33d' : 'rgba(255,255,255,0.05)',
                  color: matchFilter === 'all' ? '#1a052e' : '#ffffff',
                }}
              >
                All Matches ({allMatchRaces.length})
              </button>
              <button
                type="button"
                onClick={() => setMatchFilter('bet_only')}
                style={{
                  padding: '3px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: '1px solid',
                  borderColor: matchFilter === 'bet_only' ? '#38bdf8' : 'rgba(255,255,255,0.15)',
                  background:
                    matchFilter === 'bet_only' ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255,255,255,0.05)',
                  color: matchFilter === 'bet_only' ? '#38bdf8' : '#ffffff',
                }}
              >
                With My Bets ({allBetRaces.length})
              </button>
              <button
                type="button"
                onClick={() => setMatchFilter('mult_only')}
                style={{
                  padding: '3px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: '1px solid',
                  borderColor: matchFilter === 'mult_only' ? '#ec4899' : 'rgba(255,255,255,0.15)',
                  background:
                    matchFilter === 'mult_only' ? 'rgba(236, 72, 153, 0.25)' : 'rgba(255,255,255,0.05)',
                  color: matchFilter === 'mult_only' ? '#ec4899' : '#ffffff',
                }}
              >
                Multiplier Bonuses (2X+)
              </button>
            </div>

            {/* Game Matches List */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '12px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                minHeight: '220px',
              }}
            >
              {displayedMatchRaces.length === 0 ? (
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
                  <Trophy size={44} style={{ marginBottom: '12px', opacity: 0.5 }} />
                  <h3 style={{ margin: '0 0 4px', fontSize: '15px', color: '#ffffff' }}>
                    No Game Matches Yet
                  </h3>
                  <p style={{ margin: 0, fontSize: '12px', maxWidth: '320px' }}>
                    Match results and winning horses will appear here after each race finishes!
                  </p>
                </div>
              ) : (
                displayedMatchRaces.map((race, idx) => (
                  <div
                    key={race.id || idx}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'auto 1fr auto auto',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 14px',
                      background:
                        'linear-gradient(90deg, rgba(255, 211, 61, 0.08) 0%, rgba(20, 6, 38, 0.85) 100%)',
                      border: '1px solid rgba(255, 211, 61, 0.3)',
                      borderRadius: '10px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {/* Champion Trophy / Badge */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, #ffd33d 0%, #f59f00 100%)',
                        color: '#1a052e',
                        fontWeight: 900,
                        fontSize: '15px',
                        boxShadow: '0 0 10px rgba(255, 211, 61, 0.35)',
                      }}
                    >
                      #{race.winnerNumber}
                    </div>

                    {/* Match & Winner Info */}
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
                          MATCH #{race.matchNumber || (allMatchRaces.length - idx)}
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
                        {race.multiplier && race.multiplier > 1 && (
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 900,
                              background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
                              color: '#ffffff',
                              padding: '1px 6px',
                              borderRadius: '4px',
                            }}
                          >
                            {race.multiplier}X BONUS
                          </span>
                        )}
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
                            fontWeight: 900,
                          }}
                        >
                          <Trophy size={12} className="text-amber-400" /> Winner: {race.winnerName}
                        </span>
                        <span style={{ color: '#a78bfa', display: 'flex', alignItems: 'center', gap: '2px' }}>
                          <Zap size={11} /> {race.winnerSpeed || '9.8'}/10 Speed
                        </span>
                        {race.betAmount > 0 ? (
                          <span
                            style={{
                              color: race.isWon ? '#34d399' : '#f87171',
                              fontWeight: 800,
                              background: race.isWon
                                ? 'rgba(52, 211, 153, 0.15)'
                                : 'rgba(248, 113, 113, 0.15)',
                              padding: '1px 6px',
                              borderRadius: '4px',
                            }}
                          >
                            {race.isWon ? `🎯 Won +${race.payout} PTS` : `❌ Bet -${race.betAmount} PTS`}
                          </span>
                        ) : (
                          <span style={{ color: '#9ca3af', opacity: 0.8 }}>
                            👁️ Spectated Match
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Snapshot Thumbnail Button */}
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
                          background: 'rgba(255, 211, 61, 0.18)',
                          border: '1px solid rgba(255, 211, 61, 0.45)',
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

                    {/* Match 10x Payout Tag */}
                    <div style={{ textAlign: 'right', minWidth: '75px' }}>
                      <span
                        style={{
                          fontSize: '13px',
                          fontWeight: 900,
                          color: '#ffd33d',
                          display: 'block',
                        }}
                      >
                        10X WIN
                      </span>
                      <span
                        style={{
                          fontSize: '9.5px',
                          fontWeight: 700,
                          color: '#9ca3af',
                          letterSpacing: '0.04em',
                        }}
                      >
                        TURF 1000M
                      </span>
                    </div>
                  </div>
                ))
              )}
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
            Showing {activeTab === 'bets' ? displayedBetRaces.length : displayedMatchRaces.length} recorded items
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
