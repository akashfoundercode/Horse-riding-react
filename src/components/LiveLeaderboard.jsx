import React from 'react'

// Theme configuration matching exact visual colors from the reference mockup
const HORSE_THEMES = {
  1: {
    bg: 'linear-gradient(180deg, #6e0e0e 0%, #3a0606 55%, #160202 100%)',
    border: '#d32f2f',
    numBg: '#c62828',
    glow: 'rgba(211, 47, 47, 0.4)',
  },
  2: {
    bg: 'linear-gradient(180deg, #0d4677 0%, #07243f 55%, #020f1b 100%)',
    border: '#1976d2',
    numBg: '#1565c0',
    glow: 'rgba(25, 118, 210, 0.4)',
  },
  3: {
    bg: 'linear-gradient(180deg, #0e5224 0%, #072a12 55%, #021207 100%)',
    border: '#2e7d32',
    numBg: '#2e7d32',
    glow: 'rgba(46, 125, 50, 0.4)',
  },
  4: {
    bg: 'linear-gradient(180deg, #784405 0%, #3e2003 55%, #150901 100%)',
    border: '#ffd700',
    numBg: '#c62828',
    glow: 'rgba(255, 215, 0, 0.6)',
  },
  5: {
    bg: 'linear-gradient(180deg, #134484 0%, #0c264d 55%, #040e1f 100%)',
    border: '#1976d2',
    numBg: '#1976d2',
    glow: 'rgba(25, 118, 210, 0.4)',
  },
  6: {
    bg: 'linear-gradient(180deg, #0d4b31 0%, #06271a 55%, #02100a 100%)',
    border: '#0097a7',
    numBg: '#00838f',
    glow: 'rgba(0, 151, 167, 0.4)',
  },
  7: {
    bg: 'linear-gradient(180deg, #7c3a0e 0%, #461f06 55%, #180a02 100%)',
    border: '#e67e22',
    numBg: '#ef6c00',
    glow: 'rgba(230, 126, 34, 0.4)',
  },
  8: {
    bg: 'linear-gradient(180deg, #6c0a4d 0%, #3b052a 55%, #170210 100%)',
    border: '#c2185b',
    numBg: '#ad1457',
    glow: 'rgba(194, 24, 91, 0.4)',
  },
  9: {
    bg: 'linear-gradient(180deg, #281464 0%, #150a36 55%, #080317 100%)',
    border: '#3f51b5',
    numBg: '#283593',
    glow: 'rgba(63, 81, 181, 0.4)',
  },
  10: {
    bg: 'linear-gradient(180deg, #0b4e4e 0%, #052a2a 55%, #021111 100%)',
    border: '#00897b',
    numBg: '#00695c',
    glow: 'rgba(0, 137, 123, 0.4)',
  },
  11: {
    bg: 'linear-gradient(180deg, #3a3f45 0%, #1e2226 55%, #0d0f11 100%)',
    border: '#78909c',
    numBg: '#455a64',
    glow: 'rgba(120, 144, 156, 0.4)',
  },
  12: {
    bg: 'linear-gradient(180deg, #6e3309 0%, #3a1904 55%, #170901 100%)',
    border: '#d84315',
    numBg: '#bf360c',
    glow: 'rgba(216, 67, 21, 0.4)',
  },
}

// Gold 3D Crown SVG for 1st Place
const CrownIcon = () => (
  <svg
    viewBox="0 0 36 24"
    className="rlb-crown-svg"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="crownGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fff6b3" />
        <stop offset="35%" stopColor="#ffd700" />
        <stop offset="70%" stopColor="#ffb300" />
        <stop offset="100%" stopColor="#c78000" />
      </linearGradient>
      <filter id="crownGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#ffe066" floodOpacity="0.8" />
      </filter>
    </defs>
    <path
      d="M3 21H33V18H3V21ZM5 16H31L33 6L24 12L18 2L12 12L3 6L5 16Z"
      fill="url(#crownGrad)"
      filter="url(#crownGlow)"
    />
    <circle cx="3" cy="5" r="2" fill="#fff9d6" />
    <circle cx="18" cy="1.5" r="2.2" fill="#fff9d6" />
    <circle cx="33" cy="5" r="2" fill="#fff9d6" />
    <circle cx="12" cy="11.5" r="1.5" fill="#ffd700" />
    <circle cx="24" cy="11.5" r="1.5" fill="#ffd700" />
  </svg>
)

// Laurel Wreath SVG for Top 3
const LaurelWreath = ({ color = '#ffd700', type = 'gold' }) => {
  const gradId = `wreathGrad-${type}`
  const strokeColor = type === 'gold' ? '#ffd700' : type === 'silver' ? '#e0e6ed' : '#e58244'
  const leafFill = type === 'gold' ? '#ffdf00' : type === 'silver' ? '#ffffff' : '#f59e0b'

  return (
    <svg
      viewBox="0 0 76 60"
      className="rlb-laurel-svg"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={leafFill} stopOpacity="0.95" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0.85" />
        </linearGradient>
      </defs>
      {/* Left branch */}
      <path
        d="M10 52 C 4 36, 6 20, 16 8"
        stroke={strokeColor}
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
      <ellipse cx="6" cy="42" rx="4" ry="2.2" transform="rotate(-30 6 42)" fill={`url(#${gradId})`} />
      <ellipse cx="4.5" cy="30" rx="4.2" ry="2.2" transform="rotate(-15 4.5 30)" fill={`url(#${gradId})`} />
      <ellipse cx="7" cy="19" rx="4" ry="2.2" transform="rotate(10 7 19)" fill={`url(#${gradId})`} />
      <ellipse cx="13" cy="10" rx="3.8" ry="2.2" transform="rotate(35 13 10)" fill={`url(#${gradId})`} />

      {/* Right branch */}
      <path
        d="M66 52 C 72 36, 70 20, 60 8"
        stroke={strokeColor}
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
      <ellipse cx="70" cy="42" rx="4" ry="2.2" transform="rotate(30 70 42)" fill={`url(#${gradId})`} />
      <ellipse cx="71.5" cy="30" rx="4.2" ry="2.2" transform="rotate(15 71.5 30)" fill={`url(#${gradId})`} />
      <ellipse cx="69" cy="19" rx="4" ry="2.2" transform="rotate(-10 69 19)" fill={`url(#${gradId})`} />
      <ellipse cx="63" cy="10" rx="3.8" ry="2.2" transform="rotate(-35 63 10)" fill={`url(#${gradId})`} />
    </svg>
  )
}

// Crossed Checkered Racing Flags for Turf Derby Box
const CheckeredFlagsIcon = () => (
  <svg
    viewBox="0 0 28 20"
    className="rlb-turf-flags-svg"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Left Flag Pole */}
    <line x1="4" y1="18" x2="22" y2="3" stroke="#ffd700" strokeWidth="1.5" strokeLinecap="round" />
    {/* Right Flag Pole */}
    <line x1="24" y1="18" x2="6" y2="3" stroke="#ffd700" strokeWidth="1.5" strokeLinecap="round" />
    {/* Left Flag Banner */}
    <path d="M6 3 C 9 2, 13 4, 16 3 L 15 11 C 12 12, 9 10, 5 11 Z" fill="#ffffff" stroke="#e0e0e0" strokeWidth="0.5" />
    <rect x="7" y="3.5" width="3" height="3" fill="#111" />
    <rect x="12.5" y="4.2" width="3" height="3" fill="#111" />
    <rect x="6" y="7.5" width="3" height="3" fill="#111" />
    <rect x="11.5" y="8" width="3" height="3" fill="#111" />
    {/* Right Flag Banner */}
    <path d="M22 3 C 19 2, 15 4, 12 3 L 13 11 C 16 12, 19 10, 23 11 Z" fill="#ffffff" stroke="#e0e0e0" strokeWidth="0.5" />
    <rect x="18" y="3.5" width="3" height="3" fill="#111" />
    <rect x="13.5" y="4.2" width="3" height="3" fill="#111" />
    <rect x="19" y="7.5" width="3" height="3" fill="#111" />
    <rect x="14.5" y="8" width="3" height="3" fill="#111" />
  </svg>
)

// Wi-Fi / Live Broadcast Waves
const LiveWaveIcon = () => (
  <svg
    viewBox="0 0 16 14"
    className="rlb-live-wave-svg"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="8" cy="11" r="1.5" fill="#ff3333" />
    <path
      d="M5 8 C 6 6.8, 10 6.8, 11 8"
      stroke="#ff4d4d"
      strokeWidth="1.4"
      strokeLinecap="round"
    />
    <path
      d="M2.5 5 C 4.5 3, 11.5 3, 13.5 5"
      stroke="#ff6666"
      strokeWidth="1.4"
      strokeLinecap="round"
    />
    <path
      d="M0.5 2 C 3.5 -0.5, 12.5 -0.5, 15.5 2"
      stroke="#ff9999"
      strokeWidth="1.4"
      strokeLinecap="round"
    />
  </svg>
)

function LiveLeaderboard({ runners = [], betsByHorse = {} }) {
  const [displayRunners, setDisplayRunners] = React.useState(runners)
  const lastUpdateRef = React.useRef(0)

  React.useEffect(() => {
    const now = performance.now()
    if (now - lastUpdateRef.current > 120) {
      lastUpdateRef.current = now
      setDisplayRunners(runners)
    }
  }, [runners])

  // Sort runners by real-time position (descending: highest position = 1st place)
  const sortedRunners = React.useMemo(() => {
    return [...displayRunners].sort((a, b) => (b.position || 0) - (a.position || 0))
  }, [displayRunners])

  return (
    <aside className="race-live-leaderboard-bar">
      {/* 1. Left Controls Area: LIVE 1000M & TURF DERBY */}
      <div className="rlb-left-panel">
        {/* Top LIVE + 1000M Card */}
        <div className="rlb-live-card">
          <div className="rlb-live-top-row">
            <LiveWaveIcon />
            <span className="rlb-live-title">LIVE</span>
          </div>
          <div className="rlb-live-divider" />
          <span className="rlb-live-dist">1000M</span>
        </div>

        {/* Bottom TURF DERBY Card */}
        <div className="rlb-turf-card">
          <CheckeredFlagsIcon />
          <div className="rlb-turf-text">
            <span>TURF</span>
            <span>DERBY</span>
          </div>
        </div>
      </div>

      {/* 2. Dynamic 12 Horse Ranking Strip */}
      <div className="rlb-cards-grid">
        {sortedRunners.map((runner, rankIdx) => {
          const rankNumber = rankIdx + 1
          const rankSuffix =
            rankNumber === 1
              ? '1st'
              : rankNumber === 2
                ? '2nd'
                : rankNumber === 3
                  ? '3rd'
                  : `${rankNumber}th`

          const isFirst = rankIdx === 0
          const isSecond = rankIdx === 1
          const isThird = rankIdx === 2
          const isPodium = rankIdx < 3

          const theme = HORSE_THEMES[runner.number] || {
            bg: 'linear-gradient(180deg, #333 0%, #111 100%)',
            border: '#c57835',
            numBg: '#c57835',
            glow: 'rgba(197, 120, 53, 0.3)',
          }

          const userBet = betsByHorse[runner.number] || 0
          const isMyBet = userBet > 0

          // Number of lit stamina segments (out of 4) based on position
          const litBars =
            isFirst ? 4 : isSecond || isThird ? 3 : rankIdx < 7 ? 3 : rankIdx < 10 ? 2 : 1

          // Background styling
          let cardBg = theme.bg
          if (isFirst) {
            cardBg = 'linear-gradient(180deg, #7a4605 0%, #442203 55%, #180a01 100%)'
          } else if (isSecond) {
            cardBg = 'linear-gradient(180deg, #134685 0%, #0c274e 55%, #040e1f 100%)'
          } else if (isThird) {
            cardBg = 'linear-gradient(180deg, #7c3a0e 0%, #461f06 55%, #180a02 100%)'
          }

          const portraitSrc =
            runner.portraitImg || `/Bet_horses/horses${runner.number}.png`

          return (
            <div
              key={runner.number}
              className={`rlb-card ${isFirst ? 'rlb-card--1st' : ''} ${isSecond ? 'rlb-card--2nd' : ''
                } ${isThird ? 'rlb-card--3rd' : ''} ${isMyBet ? 'rlb-card--my-bet' : ''}`}
              style={{
                background: cardBg,
                borderColor: isFirst
                  ? '#ffd700'
                  : isSecond
                    ? '#c5d5e8'
                    : isThird
                      ? '#e58244'
                      : theme.border,
              }}
            >
              {/* Crown for 1st Place */}
              {isFirst && (
                <div className="rlb-crown-wrap">
                  <CrownIcon />
                </div>
              )}

              {/* Laurel Wreath for Top 3 */}
              {isFirst && <LaurelWreath type="gold" />}
              {isSecond && <LaurelWreath type="silver" />}
              {isThird && <LaurelWreath type="bronze" />}

              {/* Top Row: Rank Pill + Horse # Tag */}
              <div className="rlb-card-header">
                <div
                  className={`rlb-rank-pill ${isFirst
                    ? 'rlb-rank-pill--gold'
                    : isSecond
                      ? 'rlb-rank-pill--silver'
                      : isThird
                        ? 'rlb-rank-pill--bronze'
                        : 'rlb-rank-pill--normal'
                    }`}
                >
                  {rankSuffix}
                </div>

                <div
                  className="rlb-num-tag"
                  style={{ background: theme.numBg }}
                >
                  #{runner.number}
                </div>
              </div>

              {/* Horse Portrait Center */}
              <div className="rlb-portrait-wrap">
                <img
                  src={portraitSrc}
                  alt={runner.name}
                  className="rlb-portrait-img"
                  draggable="false"
                  onError={(e) => {
                    // Fallback if double extension or format difference
                    if (!e.currentTarget.src.includes('.png.png')) {
                      e.currentTarget.src = `/Bet_horses/horses${runner.number}.png.png`
                    }
                  }}
                />
              </div>

              {/* Horse Name */}
              <div className="rlb-horse-name" title={runner.name}>
                {runner.name}
              </div>

              {/* Stamina / Speed 4 Segments */}
              <div className="rlb-stamina-gauge">
                {[0, 1, 2, 3].map((segIdx) => {
                  const isLit = segIdx < litBars
                  return (
                    <span
                      key={segIdx}
                      className={`rlb-stamina-bar ${isLit
                        ? isFirst
                          ? 'rlb-stamina-bar--gold'
                          : isSecond
                            ? 'rlb-stamina-bar--blue'
                            : isThird
                              ? 'rlb-stamina-bar--bronze'
                              : 'rlb-stamina-bar--lit'
                        : 'rlb-stamina-bar--dim'
                        }`}
                    />
                  )
                })}
              </div>

              {/* User Bet Indicator Glow Tag */}
              {isMyBet && (
                <div className="rlb-my-bet-pill" title={`Your Bet: 🪙${userBet}`}>
                  🪙 {userBet}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </aside>
  )
}

export default React.memo(LiveLeaderboard)

