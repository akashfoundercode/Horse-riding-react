import React, { useState } from 'react'
import {
  Coins,
  Target,
  Timer,
  Zap,
  Flame,
  Trophy,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle2,
  TrendingUp,
  Plus,
  Minus,
  Crown,
  ShieldCheck,
} from 'lucide-react'

const GUIDE_STEPS = [
  {
    stepNumber: 1,
    shortName: 'Coins',
    badge: 'STEP 1 • COINS & STAKE',
    title: 'Select Chip Stake & Wallet Recharge',
    hindiTitle: '1. सिक्का (Coin) चुनें और वॉलेट रिचार्ज करें',
    icon: Coins,
    desc: 'Choose your desired coin value (2, 5, 10, 100, 500, 1000) from the bottom wooden plank to set your bet denomination. If your balance runs out, tap "+ Coins" anytime to claim instant free recharge!',
    hindiDesc: 'नीचे लकड़ी के तख्ते से अपना पसंदीदा कॉइन (2, 5, 10, 100, 500, 1000) चुनें। अगर आपके कॉइन्स कम पड़ें तो ऊपर "Coins +" पर टैप करके कभी भी फ्री रीचार्ज कर सकते हैं।',
    highlight: 'Coin Denominations: 2, 5, 10, 100, 500, 1000 • Instant Top-up',
    type: 'chips',
  },
  {
    stepNumber: 2,
    shortName: 'Horses',
    badge: 'STEP 2 • HORSE BETTING',
    title: 'Pick Champions & Use Bet Steppers',
    hindiTitle: '2. घोड़े पर दांव लगाएं (+ / - Steppers)',
    icon: Target,
    desc: 'Tap on any of the 12 horses (#1 TOOFAN to #12 CHETAK) to place your bet. Use the interactive [+] and [-] buttons on the horse card to increase or decrease your coins on that horse.',
    hindiDesc: '12 घोड़ों में से किसी भी घोड़े पर टैप करें। घोड़े के कार्ड पर दिए [+] और [-] बटन से दांव के कॉइन्स बढ़ाएं या घटाएं। एक से ज्यादा घोड़ों पर भी दांव लगा सकते हैं।',
    highlight: 'Clear (सारे दांव हटाएं) • Double (दांव दोगुना करें) buttons available',
    type: 'horses',
  },
  {
    stepNumber: 3,
    shortName: 'Timer',
    badge: 'STEP 3 • 40s TIMER & LOCK',
    title: '40s Round Timer & 5s Bet Lock',
    hindiTitle: '3. 40 सेकंड टाइमर और 5 सेकंड लॉक',
    icon: Timer,
    desc: 'Each round provides a 40-second betting countdown. When 5 seconds remain, the betting automatically LOCKS with an audio alert. Get all your bets placed before the lock buzzer!',
    hindiDesc: 'हर राउंड में 40 सेकंड का समय मिलता है। आखिरी 5 सेकंड में अलार्म के साथ बेट्स लॉक (BETS CLOSED) हो जाती हैं और रेस की तैयारी शुरू होती है।',
    highlight: 'Last 5 Seconds: Warning Alarm & Locked Betting Gate',
    type: 'timer',
  },
  {
    stepNumber: 4,
    shortName: 'Race',
    badge: 'STEP 4 • LIVE 1000M TURF RACE',
    title: 'Live Racetrack & Real-Time Tracking',
    hindiTitle: '4. लाइव 1000m रेस और रियल-टाइम ट्रैकर',
    icon: Zap,
    desc: 'Once the gate opens, all 12 horses sprint across the 1000-meter turf track with dynamic galloping physics. Follow real-time positions on the live leaderboard on the left side of the track!',
    hindiDesc: 'गेट खुलते ही सभी 12 घोड़े 1000 मीटर के ट्रैक पर लाइव दौड़ते हैं। बायीं तरफ बने लाइव बोर्ड से हर घोड़े की रियल-टाइम पोजीशन ट्रैक करें।',
    highlight: 'Real-time Distance Progress • Dynamic Speed Ratings',
    type: 'race',
  },
  {
    stepNumber: 5,
    shortName: 'Jackpot',
    badge: 'STEP 5 • JACKPOT MULTIPLIERS',
    title: 'Golden Jackpot Multiplier (1X to 4X Boost)',
    hindiTitle: '5. गोल्डन जैकपॉट मल्टीप्लायर (2X, 3X, 4X बूस्ट)',
    icon: Flame,
    desc: 'Every round features an active hanging Golden Jackpot sign! If the reel hits 2X, 3X, or 4X, all winning payouts for that race are instantly multiplied up to 40X of your bet!',
    hindiDesc: 'हर रेस में हैंगिंग गोल्डन जैकपॉट रील्स घूमती हैं। अगर जैकपॉट 2X, 3X या 4X पर रुकता है, तो आपकी जीत का पे-आउट 20x से 40x गुना तक बढ़ जाता है!',
    highlight: 'Multipliers: Normal (N), 2X Boost, 3X Boost, 4X Super Jackpot',
    type: 'jackpot',
  },
  {
    stepNumber: 6,
    shortName: 'Payout',
    badge: 'STEP 6 • PHOTO FINISH & PAYOUT',
    title: 'High-Speed Photo Finish & 10X+ Payout',
    hindiTitle: '6. ऑटोमेटेड फोटो फिनिश और 10X जीत पे-आउट',
    icon: Trophy,
    desc: 'At the finish line, automated high-speed camera sensors freeze the exact nose-finish millisecond. If your horse wins, a 10X Fixed Payout (multiplied by Jackpot) is instantly credited to your wallet!',
    hindiDesc: 'फिनिश लाइन पर हाई-स्पीड कैमरा मिलीसेकंड में विजेता तय करता है। आपका घोड़ा 1st आने पर दांव का 10X (और जैकपॉट के साथ 40X तक) तुरंत आपके बैलेंस में जुड़ जाता है!',
    highlight: 'Instant Wallet Credit • Screenshot Saved to Game History',
    type: 'payout',
  },
]

export default function BettingTutorial({ isOpen, onComplete }) {
  const [currentStep, setCurrentStep] = useState(0)

  if (!isOpen) return null

  const step = GUIDE_STEPS[currentStep]
  const isLast = currentStep === GUIDE_STEPS.length - 1
  const StepIcon = step.icon

  const handleNext = () => {
    if (isLast) {
      onComplete()
    } else {
      setCurrentStep((s) => s + 1)
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1)
    }
  }

  return (
    <div className="modal-backdrop-generic" onClick={onComplete}>
      <div
        className="tutorial-modal-card modern-guide-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="tutorial-admin-header">
          <div className="admin-badge-wrap">
            <span className="admin-avatar guide-icon-gold">
              <Crown size={22} className="text-amber-400" />
            </span>
            <div>
              <div className="admin-name">TEZ RAFTER • OFFICIAL GAME GUIDE</div>
              <div className="admin-tagline">Complete Step-by-Step Rules & Flow (गेम गाइड और नियम)</div>
            </div>
          </div>
          <button className="tutorial-skip-btn" onClick={onComplete}>
            CLOSE <X size={14} />
          </button>
        </div>

        {/* 6-Step Stepper Bar (Clean 6-column grid inside bounds) */}
        <div className="guide-stepper-bar">
          {GUIDE_STEPS.map((s, idx) => (
            <button
              key={s.stepNumber}
              type="button"
              className={`guide-step-btn ${idx === currentStep ? 'guide-step-btn--active' : ''} ${idx < currentStep ? 'guide-step-btn--done' : ''
                }`}
              onClick={() => setCurrentStep(idx)}
              title={s.title}
            >
              <span className="guide-step-badge-num">{s.stepNumber}</span>
              <span className="guide-step-short-name">{s.shortName}</span>
            </button>
          ))}
        </div>

        {/* Step Content Body */}
        <div className="tutorial-step-body guide-step-content">
          <div className="guide-badge-row">
            <span className="guide-step-badge">{step.badge}</span>
          </div>

          <h3 className="tutorial-step-title">{step.title}</h3>
          <h4 className="guide-hindi-title">{step.hindiTitle}</h4>

          <p className="tutorial-step-desc">{step.desc}</p>
          <p className="guide-hindi-desc">{step.hindiDesc}</p>

          <div className="tutorial-step-highlight">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={14} className="text-amber-400" /> {step.highlight}
            </span>
          </div>

          {/* Interactive Visual Realistic Game Flow Preview */}
          <div className="tutorial-visual-preview guide-visual-box">
            {step.type === 'chips' && (
              <div className="gpreview-chips-row">
                {[
                  { val: '2', img: '/bet_coins/betcoin2.png' },
                  { val: '5', img: '/bet_coins/betcoin5.png' },
                  { val: '10', img: '/bet_coins/betcoin10.png', active: true },
                  { val: '100', img: '/bet_coins/betcoin100.png' },
                  { val: '500', img: '/bet_coins/betcoin500.png' },
                  { val: '1000', img: '/bet_coins/betcoin1000.png' },
                ].map((c) => (
                  <div key={c.val} className={`gpreview-chip-item ${c.active ? 'gpreview-chip-item--active' : ''}`}>
                    <img src={c.img} alt={`Coin ${c.val}`} className="gpreview-chip-img" />
                    <span className="gpreview-chip-val">{c.val}</span>
                  </div>
                ))}
              </div>
            )}

            {step.type === 'horses' && (
              <div className="gpreview-horse-card">
                <div className="gpreview-hcard-top">
                  <span className="gpreview-hbadge">#1</span>
                  <span className="gpreview-hname">TOOFAN</span>
                  <span className="gpreview-hodds">10X</span>
                </div>
                <div className="gpreview-hcard-body">
                  <img src="/Bet_horses/horses1.png" alt="Horse #1" className="gpreview-himg" />
                </div>
                <div className="gpreview-hcard-stepper">
                  <span className="gpreview-sbtn"><Minus size={11} /></span>
                  <span className="gpreview-sval">🪙 50</span>
                  <span className="gpreview-sbtn"><Plus size={11} /></span>
                </div>
              </div>
            )}

            {step.type === 'timer' && (
              <div className="gpreview-timer-box">
                <div className="gpreview-timer-clock">
                  <span className="gpreview-tlabel">TIME LEFT</span>
                  <span className="gpreview-tval">05s</span>
                </div>
                <div className="gpreview-lock-notice">
                  ⚠️ BETS CLOSED • RACE STARTING IN 5s
                </div>
              </div>
            )}

            {step.type === 'race' && (
              <div className="gpreview-race-box">
                <div className="gpreview-track-live">
                  <span className="gpreview-live-dot" /> LIVE 1000M TURF SPRINT
                </div>
                <div className="gpreview-runners-demo">
                  <span className="gpreview-rank-tag">🥇 #1 TOOFAN (950m)</span>
                  <span className="gpreview-rank-tag">🥈 #5 LUNA (920m)</span>
                  <span className="gpreview-rank-tag">🥉 #8 BAAZIGAR (890m)</span>
                </div>
              </div>
            )}

            {step.type === 'jackpot' && (
              <div className="gpreview-jackpot-box">
                <div className="gpreview-jackpot-sign">
                  <img src="/sprites/jackpot (2).png" alt="Jackpot" className="gpreview-jsign-img" />
                  <span className="gpreview-jmult-val">3X BOOST</span>
                </div>
                <div className="gpreview-jbadge-list">
                  <span className="gjbadge">1X (N)</span>
                  <span className="gjbadge">2X (20X Win)</span>
                  <span className="gjbadge gjbadge--gold">3X (30X Win)</span>
                  <span className="gjbadge gjbadge--fire">4X (40X Win)</span>
                </div>
              </div>
            )}

            {step.type === 'payout' && (
              <div className="gpreview-payout-box">
                <div className="gpreview-payout-header">
                  <Trophy size={18} className="text-amber-400" />
                  <span>WINNER: #1 TOOFAN</span>
                </div>
                <div className="gpreview-payout-amount">
                  +500 COINS WON (10X PAYOUT)
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="tutorial-footer-actions guide-footer">
          {currentStep > 0 ? (
            <button className="tutorial-prev-btn" onClick={handlePrev}>
              <ChevronLeft size={16} /> PREVIOUS
            </button>
          ) : (
            <div />
          )}

          <div className="guide-step-counter">
            {currentStep + 1} of {GUIDE_STEPS.length}
          </div>

          <button className="tutorial-next-btn" onClick={handleNext}>
            {isLast ? (
              <>
                START PLAYING <CheckCircle2 size={16} />
              </>
            ) : (
              <>
                NEXT STEP <ChevronRight size={16} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
