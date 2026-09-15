import React, { useState } from 'react'
import {
  Coins,
  Target,
  Camera,
  UserCheck,
  Sparkles,
  Star,
  Zap,
  ChevronLeft,
  ChevronRight,
  Play,
  X,
} from 'lucide-react'

const TUTORIAL_STEPS = [
  {
    stepNumber: 1,
    title: 'Step 1: Select Your Chip Stake',
    icon: Coins,
    description:
      'Choose how many coins you want to bet on this race (10, 25, 50, 100, 250, 500). If your balance runs low, tap "+ ADD COINS" anytime to claim free coins!',
    highlight: 'Stake range: 10 to 500 Coins',
    visualImg: 'chips',
  },
  {
    stepNumber: 2,
    title: 'Step 2: Pick Your Champion Horse',
    icon: Target,
    description:
      'Browse the 12 horses (#1 to #12). Inspect their Speed Ratings (e.g. 9.8/10) and live animations. Tap on any horse to mark it with the gold PICK badge!',
    highlight: '12 Competitors • 10x Fixed Payout',
    visualImg: 'horse',
  },
  {
    stepNumber: 3,
    title: 'Step 3: Race & Instant Photo Finish',
    icon: Camera,
    description:
      'Tap "START RACE"! Listen to realistic galloping sounds, watch live position tracking, and see the automated high-speed camera freeze the exact millisecond finish!',
    highlight: 'Winning pays 10x your bet directly into your wallet!',
    visualImg: 'finish',
  },
]

export default function BettingTutorial({ isOpen, onComplete }) {
  const [currentStep, setCurrentStep] = useState(0)

  if (!isOpen) return null

  const step = TUTORIAL_STEPS[currentStep]
  const isLast = currentStep === TUTORIAL_STEPS.length - 1
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
    <div className="modal-backdrop-generic">
      <div className="tutorial-modal-card">
        {/* Admin Header */}
        <div className="tutorial-admin-header">
          <div className="admin-badge-wrap">
            <span className="admin-avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserCheck size={20} className="text-amber-400" />
            </span>
            <div>
              <div className="admin-name">RACE DIRECTOR • TUTORIAL GUIDE</div>
              <div className="admin-tagline">Learn how to place bets & win big payouts</div>
            </div>
          </div>
          <button className="tutorial-skip-btn" onClick={onComplete} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            SKIP TUTORIAL <X size={14} />
          </button>
        </div>

        {/* Step Indicator Dots */}
        <div className="tutorial-dots-bar">
          {TUTORIAL_STEPS.map((s, idx) => (
            <div
              key={s.stepNumber}
              className={`tutorial-dot ${idx === currentStep ? 'tutorial-dot--active' : ''} ${idx < currentStep ? 'tutorial-dot--completed' : ''}`}
            >
              <span className="dot-number">{s.stepNumber}</span>
            </div>
          ))}
        </div>

        {/* Step Body Content */}
        <div className="tutorial-step-body">
          <div className="tutorial-step-icon-badge" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <StepIcon size={26} className="text-amber-400" />
          </div>
          <h3 className="tutorial-step-title">{step.title}</h3>
          <p className="tutorial-step-desc">{step.description}</p>
          <div className="tutorial-step-highlight">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <Sparkles size={14} className="text-amber-400" /> {step.highlight}
            </span>
          </div>

          {/* Step Visual Preview Card */}
          <div className="tutorial-visual-preview">
            {step.visualImg === 'chips' && (
              <div className="tpreview-chips">
                <span className="tchip">10</span>
                <span className="tchip">25</span>
                <span className="tchip tchip--active" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  50 <Star size={11} className="fill-amber-400 text-amber-400" />
                </span>
                <span className="tchip">100</span>
                <span className="tchip">500</span>
              </div>
            )}
            {step.visualImg === 'horse' && (
              <div className="tpreview-horse">
                <img src="/HORSES/horse5_1mb.gif" alt="Horse Preview" className="tpreview-horse-gif" />
                <span className="tpreview-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  #5 LUNA • <Zap size={11} className="text-amber-400 fill-amber-400" /> 9.6 Speed • 10x Win
                </span>
              </div>
            )}
            {step.visualImg === 'finish' && (
              <div className="tpreview-finish">
                <span className="tfinish-title" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <Camera size={14} className="text-amber-400" /> AUTOMATED PHOTO FINISH SYSTEM
                </span>
                <span className="tfinish-sub">Real-time camera captures the precise winning nose!</span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Navigation Buttons */}
        <div className="tutorial-footer-actions">
          {currentStep > 0 ? (
            <button className="tutorial-prev-btn" onClick={handlePrev} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <ChevronLeft size={14} /> PREVIOUS
            </button>
          ) : (
            <div />
          )}

          <button className="tutorial-next-btn" onClick={handleNext} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            {isLast ? (
              <>
                <Play size={14} className="fill-current" /> START BETTING NOW
              </>
            ) : (
              <>
                NEXT STEP <ChevronRight size={14} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

