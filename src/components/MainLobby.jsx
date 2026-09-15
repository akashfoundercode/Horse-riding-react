import React from 'react'
import {
  Trophy,
  Plane,
  Disc,
  Sparkles,
  User,
  Star,
  Coins,
  HelpCircle,
  History,
  Flame,
  Zap,
  Crown,
  Gamepad2,
  Lock,
  Play,
} from 'lucide-react'

const CASINO_GAMES = [
  {
    id: 'horse_derby',
    title: 'HORSE DERBY 3D',
    subtitle: '12 Live Runners • 10x Payout',
    tagText: 'HOT & POPULAR',
    tagIcon: Flame,
    icon: Trophy,
    bannerImg: '/sprites/GATE.png',
    status: 'PLAY NOW',
    featured: true,
  },
  {
    id: 'aviator_crash',
    title: 'AVIATOR CRASH',
    subtitle: 'High Multiplier Plane Ride',
    tagText: '97% RTP',
    tagIcon: Zap,
    icon: Plane,
    status: 'COMING SOON',
    featured: false,
  },
  {
    id: 'roulette_vip',
    title: 'ROYAL ROULETTE 3D',
    subtitle: 'European Wheel & Spin',
    tagText: 'VIP TABLE',
    tagIcon: Crown,
    icon: Disc,
    status: 'COMING SOON',
    featured: false,
  },
  {
    id: 'slots_jackpot',
    title: 'GOLDEN SLOTS 777',
    subtitle: 'Mega Jackpot & Free Spins',
    tagText: '50,000x',
    tagIcon: Coins,
    icon: Sparkles,
    status: 'COMING SOON',
    featured: false,
  },
]

export default function MainLobby({
  balance,
  onOpenAddCoins,
  onLaunchHorseGame,
  onOpenTutorial,
  onOpenHistory,
}) {
  return (
    <div className="main-lobby-screen">
      {/* TOP USER PROFILE & WALLET HEADER */}
      <header className="lobby-top-bar">
        {/* User Info */}
        <div className="lobby-user-profile">
          <div className="user-avatar-wrap">
            <User className="w-5 h-5 text-amber-400" size={20} />
            <span className="user-vip-tag">VIP 1</span>
          </div>
          <div className="user-details">
            <div className="user-name">Player #7890</div>
            <div className="user-rank" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Star size={13} className="text-amber-400 fill-amber-400" /> Master Jockey • Level 4
            </div>
          </div>
        </div>

        {/* Center Logo */}
        <div className="lobby-brand-center">
          <Trophy size={20} className="text-amber-400 brand-logo-icon" />
          <span className="brand-title">DERBY CASINO ARENA</span>
        </div>

        {/* Right Wallet & Actions */}
        <div className="lobby-wallet-section">
          {/* Coins Balance Pill */}
          <div className="lobby-coins-pill" onClick={onOpenAddCoins}>
            <Coins size={18} className="text-emerald-400 coin-glow-icon" />
            <div className="coins-text-group">
              <span className="coins-label">COINS</span>
              <span className="coins-amount">{balance}</span>
            </div>
            <button className="add-coins-mini-btn" title="Add More Coins">+</button>
          </div>

          {/* History Button */}
          {onOpenHistory && (
            <button className="lobby-guide-btn" onClick={onOpenHistory} title="View Race Betting History">
              <History size={15} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
              <span>History</span>
            </button>
          )}

          {/* Help / Guide Button */}
          <button className="lobby-guide-btn" onClick={onOpenTutorial} title="View Betting Guide">
            <HelpCircle size={15} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
            <span>How to Bet</span>
          </button>
        </div>
      </header>

      {/* HERO PROMO BANNER */}
      <div className="lobby-hero-banner">
        <div className="hero-banner-content">
          <span className="hero-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <Sparkles size={14} className="text-amber-400" /> LIVE EVENT SPECIAL
          </span>
          <h1 className="hero-title">12-RUNNER DERBY CHAMPIONSHIP</h1>
          <p className="hero-desc">
            Place your bets on 12 elite horses with authentic realistic speeds, live finish-line photo snapshots, and a massive <strong>10x Payout Multiplier</strong>!
          </p>
          <div className="hero-cta-group">
            <button className="hero-play-btn" onClick={onLaunchHorseGame} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Play size={16} className="fill-current" />
              <span>DOWNLOAD & PLAY NOW</span>
            </button>
            <button className="hero-recharge-btn" onClick={onOpenAddCoins}>
              <span>+ ADD 500 COINS</span>
            </button>
          </div>
        </div>
        <div className="hero-banner-visual">
          <img src="/HORSES/horse5_1mb.gif" alt="Hero Horse" className="hero-horse-gif" />
        </div>
      </div>

      {/* GAMES CATALOG SECTION */}
      <section className="lobby-games-section">
        <div className="games-section-header">
          <div className="section-title-wrap">
            <Gamepad2 size={20} className="section-icon text-amber-400" />
            <h2 className="section-title">ALL CASINO & RACING GAMES</h2>
          </div>
          <span className="games-count">1 Live Game Available</span>
        </div>

        <div className="games-cards-grid">
          {CASINO_GAMES.map((game) => {
            const GameIcon = game.icon
            const TagIcon = game.tagIcon
            return (
              <div
                key={game.id}
                className={`game-card ${game.featured ? 'game-card--featured' : 'game-card--disabled'}`}
                onClick={() => {
                  if (game.id === 'horse_derby') {
                    onLaunchHorseGame()
                  }
                }}
              >
                <div className="game-card-top">
                  <span className="game-card-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <TagIcon size={12} /> {game.tagText}
                  </span>
                  <span className="game-card-icon">
                    <GameIcon size={18} />
                  </span>
                </div>

                <div className="game-card-visual">
                  {game.id === 'horse_derby' ? (
                    <img src="/HORSES/horse_no1_1mb.gif" alt="Derby" className="gcard-horse-img" />
                  ) : (
                    <div className="gcard-placeholder-icon">
                      <GameIcon size={36} style={{ opacity: 0.7 }} />
                    </div>
                  )}
                </div>

                <div className="game-card-bottom">
                  <div>
                    <h3 className="game-card-title">{game.title}</h3>
                    <p className="game-card-subtitle">{game.subtitle}</p>
                  </div>

                  <button
                    className={`game-launch-btn ${game.featured ? 'game-launch-btn--active' : 'game-launch-btn--locked'}`}
                    style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                  >
                    {game.featured ? (
                      <>
                        <Play size={13} className="fill-current" /> PLAY (DOWNLOAD)
                      </>
                    ) : (
                      <>
                        <Lock size={13} /> SOON
                      </>
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* BOTTOM TICKER STATS */}
      <footer className="lobby-bottom-ticker">
        <div className="ticker-item" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <span className="ticker-dot" />
          <Trophy size={14} className="text-amber-400" />
          <span>Recent Winner: <strong>Player #9122 won +1,000 Coins on #5 LUNA</strong></span>
        </div>
        <div className="ticker-item" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <Zap size={14} className="text-amber-400" />
          <span>Fair Odds Guaranteed (Instant Photo Finish Verification)</span>
        </div>
      </footer>
    </div>
  )
}

