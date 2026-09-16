import React, { useCallback, useEffect, useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import {
  Home,
  HelpCircle,
  Trophy,
  Medal,
  Flag,
  Zap,
  RotateCcw,
  RotateCw,
  Smartphone,
  Check,
  Play,
  Share2,
  MessageCircle,
  History,
  Settings,
  User,
  Crown,
  Coins,
} from 'lucide-react'
import Horse from './components/Horse.jsx'
import TezRafterBettingBoard from './components/TezRafterBettingBoard.jsx'
import ObstacleField from './components/ObstacleField.jsx'
import BettingTutorial from './components/BettingTutorial.jsx'
import AddCoinsModal from './components/AddCoinsModal.jsx'
import GameHistoryModal from './components/GameHistoryModal.jsx'
import AudioSettingsModal, { DEFAULT_AUDIO_SETTINGS } from './components/AudioSettingsModal.jsx'
import WalletModal from './components/WalletModal.jsx'
import AuthModal from './components/auth/AuthModal.jsx'
import UserProfileModal from './components/auth/UserProfileModal.jsx'
import DerbyAssetLoader from './components/DerbyAssetLoader.jsx'
import LiveLeaderboard from './components/LiveLeaderboard.jsx'
import { useAuth } from './context/AuthContext.jsx'
import { useWallet } from './context/WalletContext.jsx'
import { getSafeAudioContext } from './utils/audioContextHelper.js'

const HORSES = [
  { number: 1, name: 'TOOFAN', img: '/HORSES/horse_no1_1mb.gif', portraitImg: '/Bet_horses/horses1.png', hue: 0, saturate: 1.0, brightness: 1.0, speedRating: '9.8' },
  { number: 2, name: 'RANGEELA', img: '/HORSES/horse_number_2_1MB.gif', portraitImg: '/Bet_horses/horses2.png', hue: 0, saturate: 1.0, brightness: 1.0, speedRating: '9.6' },
  { number: 3, name: 'ARJUN', img: '/HORSES/horse_no3_1mb.gif', portraitImg: '/Bet_horses/horses3.png.png', hue: 0, saturate: 1.0, brightness: 1.0, speedRating: '9.7' },
  { number: 4, name: 'ROYAL', img: '/HORSES/horse_4mb_hd.gif', portraitImg: '/Bet_horses/horses4.png.png', hue: 0, saturate: 1.0, brightness: 1.0, speedRating: '9.5' },
  { number: 5, name: 'TARZAN', img: '/HORSES/horse5_1mb.gif', portraitImg: '/Bet_horses/horses5.png', hue: 0, saturate: 1.0, brightness: 1.0, speedRating: '9.6' },
  { number: 6, name: 'CHETAK', img: '/HORSES/horse_jockey_6mb.gif', portraitImg: '/Bet_horses/horses6.png', hue: 0, saturate: 1.0, brightness: 1.0, speedRating: '9.6' },
  { number: 7, name: 'LUCKY', img: '/HORSES/horse_no7_1mb.gif', portraitImg: '/Bet_horses/horses7.png', hue: 0, saturate: 1.0, brightness: 1.0, speedRating: '9.7' },
  { number: 8, name: 'BAAZIGAR', img: '/HORSES/horse_no8_1mb.gif', portraitImg: '/Bet_horses/horses8.png', hue: 0, saturate: 1.0, brightness: 1.0, speedRating: '9.5' },
  { number: 9, name: 'JEET', img: '/HORSES/horse_no_9_1MB.gif', portraitImg: '/Bet_horses/horses9.png', hue: 0, saturate: 1.0, brightness: 1.0, speedRating: '9.7' },
  { number: 10, name: 'TIGER', img: '/HORSES/horse_number_10_1_1MB.gif', portraitImg: '/Bet_horses/horses10.png', hue: 0, saturate: 1.0, brightness: 1.0, speedRating: '9.8' },
  { number: 11, name: 'BADAL', img: '/HORSES/horse_number_11_1MB.gif', portraitImg: '/Bet_horses/horses11.png', hue: 0, saturate: 1.0, brightness: 1.0, speedRating: '9.6' },
  { number: 12, name: 'VICTOR', img: '/HORSES/horse_number_12_1_1MB.gif', portraitImg: '/Bet_horses/horses12.png', hue: 0, saturate: 1.0, brightness: 1.0, speedRating: '9.9' },
]

const HORSE_SILK_COLORS = {
  1: '#d32f2f', // Red (Toofan)
  2: '#1976d2', // Blue (Rangeela)
  3: '#2e7d32', // Green (Arjun)
  4: '#7b1fa2', // Purple (Royal)
  5: '#f57c00', // Orange (Tarzan)
  6: '#0097a7', // Cyan (Chetak)
  7: '#fbc02d', // Yellow (Lucky)
  8: '#c2185b', // Pink/Magenta (Baazigar)
  9: '#303f9f', // Indigo (Jeet)
  10: '#00796b', // Teal (Tiger)
  11: '#5d4037', // Brown (Badal)
  12: '#e64a19', // Deep Orange (Victor)
}

const STAKE = 10
const PAYOUT_MULTIPLIER = 10
const BET_OPTIONS = [10, 25, 50, 100, 250, 500]
const TOTAL_RACE_TIME = 20.0 // Exactly 20.0s deterministic race duration on all rounds
const FINISH_X = 68.0
const SCREENSHOT_X = 70.2
const FINISH_CAPTURE_TIMEOUT_MS = 1500
const RACE_DEBUG = import.meta.env.DEV

function makeRunners(forcedWinnerNumber = null) {
  let forcedIdx = -1
  if (forcedWinnerNumber !== null && forcedWinnerNumber !== undefined) {
    forcedIdx = HORSES.findIndex((h) => h.number === Number(forcedWinnerNumber))
  }

  // Determine final ranks for 12 horses
  let rankMap = new Array(12)
  if (forcedIdx >= 0) {
    // Guaranteed winner at rank 0
    rankMap[forcedIdx] = 0
    const otherIndices = Array.from({ length: 12 }, (_, i) => i).filter((i) => i !== forcedIdx)
    const shuffledOthers = otherIndices.sort(() => Math.random() - 0.5)
    shuffledOthers.forEach((origIdx, rIdx) => {
      rankMap[origIdx] = rIdx + 1
    })
  } else {
    // Fair random shuffle
    const shuffled = Array.from({ length: 12 }, (_, i) => i).sort(() => Math.random() - 0.5)
    rankMap = Array.from({ length: 12 }, (_, i) => shuffled.indexOf(i))
  }

  return HORSES.map((h, i) => {
    const finalRank = rankMap[i] // 0 = 1st (Winner), 1 = 2nd, 2 = 3rd ...
    const isWinner = finalRank === 0

    const laneT = i / 11
    const startX = 4.2 + laneT * 7.5
    const depthScale = 1.10 - laneT * 0.25
    const horseVisualWidth = 14.5 * depthScale

    // Exact winner screen X target when crossing the finish line at 78.2vw
    const winnerScreenTarget = 78.2 - horseVisualWidth * 0.35

    // Clear separation: 2nd place is 9.0vw behind winner, 3rd is 14.0vw behind, etc.
    let screenTarget = winnerScreenTarget
    if (finalRank === 1) screenTarget = winnerScreenTarget - 9.0
    else if (finalRank === 2) screenTarget = winnerScreenTarget - 14.0
    else if (finalRank <= 5) screenTarget = winnerScreenTarget - 18.0 - (finalRank - 3) * 3.0
    else screenTarget = winnerScreenTarget - 27.0 - (finalRank - 6) * 2.5 - Math.random() * 1.5

    const targetEndPosition = (screenTarget - startX) / 0.74

    return {
      ...h,
      stall: i,
      position: 0,
      finalRank,
      targetEndPosition,
      isWinner,
      phaseOffset: Math.random() * Math.PI * 2,
      shiftOffset: Math.random() * Math.PI * 2,
      shiftPower: (Math.random() - 0.48) * 4.2,
      shiftSpeed: 1.4 + Math.random() * 0.8,
      gallopFreq: 2.6 + Math.random() * 0.6,
      gallopAmp: 1.0 + Math.random() * 0.4,
      finished: false,
    }
  })
}

export default function App() {
  const [isCheatEnabled, setIsCheatEnabled] = useState(() => {
    try {
      const saved = localStorage.getItem('tez_god_mode')
      return saved !== 'false' // Enabled by default
    } catch (_) {
      return true
    }
  })
  const [isAssetLoading, setIsAssetLoading] = useState(true)
  const [showGateLoader, setShowGateLoader] = useState(true)
  const [hasSeenTutorial, setHasSeenTutorial] = useState(true)
  const [isAddCoinsOpen, setIsAddCoinsOpen] = useState(false)
  const [isTutorialOpen, setIsTutorialOpen] = useState(false)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [raceHistory, setRaceHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('horse_race_history')
      return saved ? JSON.parse(saved) : []
    } catch (_) {
      return []
    }
  })

  const [phase, setPhase] = useState('idle') // 40-second automated betting & race cycle
  const [runners, setRunners] = useState(makeRunners)
  const [selectedHorseId, setSelectedHorseId] = useState(1)
  const [betAmount, setBetAmount] = useState(10)
  const [isWalletOpen, setIsWalletOpen] = useState(false)

  // Enterprise Auth & Wallet Providers
  const { user, isGuest, isAuthModalOpen, setIsAuthModalOpen, isProfileModalOpen, setIsProfileModalOpen } = useAuth()
  const {
    balance,
    setBalance,
    transactions: walletTransactions,
    depositCoins,
    debitBet,
    creditPayout,
  } = useWallet()

  const wallet = {
    balance,
    transactions: walletTransactions || [],
  }

  const [lastWin, setLastWin] = useState(null)
  const [winner, setWinner] = useState(null)
  const [countdown, setCountdown] = useState(3)
  const [finishScreenshot, setFinishScreenshot] = useState(null)
  const gameCanvasRef = useRef(null)

  const postWalletTransaction = useCallback((type, amount, note) => {
    if (type === 'deposit') {
      depositCoins(amount, note)
    } else {
      setBalance((b) => Math.max(0, Number((b + amount).toFixed(2))))
    }
  }, [depositCoins, setBalance])

  // Multi-betting & 40-second automated cycle state
  const [betsByHorse, setBetsByHorse] = useState({})
  const [betCoinsByHorse, setBetCoinsByHorse] = useState({})
  const [selectedChip, setSelectedChip] = useState(10)
  const [timerSeconds, setTimerSeconds] = useState(40)
  const [previousResults, setPreviousResults] = useState([
    { number: 4, name: 'ROYAL', multiplier: 1 },
    { number: 5, name: 'TARZAN', multiplier: 2 },
    { number: 3, name: 'ARJUN', multiplier: 1 },
    { number: 7, name: 'LUCKY', multiplier: 2 },
    { number: 3, name: 'ARJUN', multiplier: 1 },
    { number: 8, name: 'BAAZIGAR', multiplier: 3 },
  ])

  const totalBet = Object.values(betsByHorse).reduce((sum, v) => sum + v, 0)
  const isBettingLocked = phase === 'idle' && timerSeconds <= 5

  const handlePlaceBet = useCallback((horseNumber, chipAmount) => {
    if (isBettingLocked || phase !== 'idle') return
    if (balance < chipAmount) {
      setIsAddCoinsOpen(true)
      return
    }
    debitBet({
      betsByHorse: { [horseNumber]: chipAmount },
      totalAmount: chipAmount,
      roundId: 'DERBY_' + Date.now(),
    })
    setBetsByHorse((prev) => ({
      ...prev,
      [horseNumber]: (prev[horseNumber] || 0) + chipAmount,
    }))
    setBetCoinsByHorse((prev) => ({
      ...prev,
      [horseNumber]: chipAmount,
    }))
  }, [balance, isBettingLocked, phase, debitBet])

  const handleRemoveBet = useCallback((horseNumber, chipAmount) => {
    if (isBettingLocked || phase !== 'idle') return
    const currentBet = betsByHorse[horseNumber] || 0
    if (currentBet <= 0) return
    const removeAmt = Math.min(currentBet, chipAmount || selectedChip)
    postWalletTransaction('refund', removeAmt, `Horse #${horseNumber}`)
    setBetsByHorse((prev) => {
      const nextVal = (prev[horseNumber] || 0) - removeAmt
      if (nextVal <= 0) {
        const copy = { ...prev }
        delete copy[horseNumber]
        return copy
      }
      return {
        ...prev,
        [horseNumber]: nextVal,
      }
    })
    setBetCoinsByHorse((prev) => {
      const nextVal = (betsByHorse[horseNumber] || 0) - removeAmt
      if (nextVal <= 0) {
        const copy = { ...prev }
        delete copy[horseNumber]
        return copy
      }
      return prev
    })
  }, [betsByHorse, isBettingLocked, phase, selectedChip, postWalletTransaction])

  const handleClearBets = useCallback(() => {
    if (isBettingLocked || phase !== 'idle' || totalBet === 0) return
    postWalletTransaction('refund', totalBet, 'All open bets cancelled')
    setBetsByHorse({})
    setBetCoinsByHorse({})
  }, [isBettingLocked, phase, totalBet, postWalletTransaction])

  const handleDoubleBets = useCallback(() => {
    if (isBettingLocked || phase !== 'idle' || totalBet === 0) return
    if (balance < totalBet) {
      setIsAddCoinsOpen(true)
      return
    }
    debitBet({
      betsByHorse,
      totalAmount: totalBet,
      roundId: 'DERBY_' + Date.now(),
    })
    setBetsByHorse((prev) => {
      const doubled = {}
      for (const [k, v] of Object.entries(prev)) {
        doubled[k] = v * 2
      }
      return doubled
    })
  }, [balance, isBettingLocked, phase, totalBet, debitBet])

  const [isFreeze, setIsFreeze] = useState(false)
  const isFrozenRef = useRef(false)
  const frozenElapsedRef = useRef(0)
  const [showFinishFrame, setShowFinishFrame] = useState(false)
  const [isNearFinish, setIsNearFinish] = useState(false)
  const [finishLineX, setFinishLineX] = useState(78.2)
  const finishTriggeredRef = useRef(false)
  const raceFinishedRef = useRef(false)
  const resultProcessedRef = useRef(false)
  const lockedWinnerRef = useRef(null)
  const finishPhaseRef = useRef('running')
  const screenshotInProgressRef = useRef(false)
  const finishSafetyTimeoutRef = useRef(null)
  const lastRaceFrameRef = useRef(null)
  const rafRef = useRef(null)
  const startTimeRef = useRef(null)

  const activeHorse = HORSES.find((h) => h.number === selectedHorseId) || HORSES[0]

  // Audio Refs for Sound Effects
  const neighAudioRef = useRef(null)
  const gallopAudioRef = useRef(null)
  const shutterAudioRef = useRef(null)

  // Camera shutter sound playback with instant trigger and fallback
  const playCameraShutterSound = useCallback(() => {
    try {
      if (shutterAudioRef.current) {
        shutterAudioRef.current.currentTime = 0
        const p = shutterAudioRef.current.play()
        if (p) {
          p.catch(() => {
            playSynthShutter()
          })
        }
      } else {
        playSynthShutter()
      }
    } catch (_) {
      playSynthShutter()
    }
  }, [])

  const playSynthShutter = () => {
    try {
      const ctx = getSafeAudioContext()
      if (!ctx) return
      // Mechanical mirror flip
      const osc1 = ctx.createOscillator()
      const gain1 = ctx.createGain()
      osc1.type = 'triangle'
      osc1.frequency.setValueAtTime(750, ctx.currentTime)
      osc1.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.08)
      gain1.gain.setValueAtTime(0.85, ctx.currentTime)
      gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08)
      osc1.connect(gain1)
      gain1.connect(ctx.destination)
      osc1.start(ctx.currentTime)
      osc1.stop(ctx.currentTime + 0.08)

      // Crisp shutter snap
      const osc2 = ctx.createOscillator()
      const gain2 = ctx.createGain()
      osc2.type = 'sawtooth'
      osc2.frequency.setValueAtTime(1300, ctx.currentTime + 0.04)
      osc2.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.16)
      gain2.gain.setValueAtTime(0.75, ctx.currentTime + 0.04)
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.16)
      osc2.connect(gain2)
      gain2.connect(ctx.destination)
      osc2.start(ctx.currentTime + 0.04)
      osc2.stop(ctx.currentTime + 0.16)
    } catch (_) { }
  }

  // Audio Settings & Multi-Channel Volume Control
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [audioSettings, setAudioSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('horse_race_audio_settings')
      if (saved) return JSON.parse(saved)
    } catch (_) { }
    return DEFAULT_AUDIO_SETTINGS
  })

  const getEffectiveVolume = useCallback((category) => {
    if (audioSettings.masterMute) return 0
    const cat = audioSettings[category]
    if (!cat || cat.muted) return 0
    return Math.max(0, Math.min(1, cat.volume))
  }, [audioSettings])

  const handleTestSound = useCallback((type) => {
    if (type === 'game') {
      const vol = getEffectiveVolume('gameVoice')
      if (vol <= 0) return
      playCameraShutterSound()
    } else if (type === 'horse') {
      const vol = getEffectiveVolume('horseVoice')
      if (vol <= 0) return
      if (neighAudioRef.current) {
        neighAudioRef.current.currentTime = 0
        neighAudioRef.current.volume = vol * 0.95
        neighAudioRef.current.play().catch(() => { })
      }
    } else if (type === 'coin') {
      const vol = getEffectiveVolume('coinVoice')
      if (vol <= 0) return
      try {
        const ctx = getSafeAudioContext()
        if (!ctx) return
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(1400, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(700, ctx.currentTime + 0.05)
        gain.gain.setValueAtTime(vol * 0.45, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(ctx.currentTime)
        osc.stop(ctx.currentTime + 0.06)
      } catch (_) { }
    }
  }, [getEffectiveVolume])

  useEffect(() => {
    neighAudioRef.current = new Audio('/SOUND/dragon-studio-horse-neigh-390297.mp3')
    gallopAudioRef.current = new Audio('/SOUND/pwlpl-horses-galloping-sound-effect-359257.mp3')
    shutterAudioRef.current = new Audio('/SOUND/SCREESHOTCAPTURE.mp3')
    gallopAudioRef.current.loop = true

    const horseVol = getEffectiveVolume('horseVoice')
    const gameVol = getEffectiveVolume('gameVoice')
    gallopAudioRef.current.volume = horseVol * 0.85
    neighAudioRef.current.volume = horseVol * 0.95
    if (shutterAudioRef.current) {
      shutterAudioRef.current.volume = gameVol * 1.0
      shutterAudioRef.current.load()
    }

    return () => {
      if (gallopAudioRef.current) {
        gallopAudioRef.current.pause()
      }
      if (neighAudioRef.current) {
        neighAudioRef.current.pause()
      }
      if (shutterAudioRef.current) {
        shutterAudioRef.current.pause()
      }
    }
  }, [])

  // Live dynamic volume update on settings slider change
  useEffect(() => {
    const horseVol = getEffectiveVolume('horseVoice')
    const gameVol = getEffectiveVolume('gameVoice')
    if (gallopAudioRef.current) {
      gallopAudioRef.current.volume = horseVol * 0.85
    }
    if (neighAudioRef.current) {
      neighAudioRef.current.volume = horseVol * 0.95
    }
    if (shutterAudioRef.current) {
      shutterAudioRef.current.volume = gameVol * 1.0
    }
  }, [audioSettings, getEffectiveVolume])

  // Sound Playback: Neigh at start, Galloping during race loop, Stop on finish/result
  useEffect(() => {
    if (phase === 'racing') {
      if (neighAudioRef.current) {
        neighAudioRef.current.currentTime = 0
        neighAudioRef.current.play().catch(() => { })
      }
      if (gallopAudioRef.current) {
        gallopAudioRef.current.currentTime = 0
        gallopAudioRef.current.play().catch(() => { })
      }
    } else {
      if (gallopAudioRef.current) {
        gallopAudioRef.current.pause()
        gallopAudioRef.current.currentTime = 0
      }
      if (neighAudioRef.current && phase !== 'racing') {
        neighAudioRef.current.pause()
        neighAudioRef.current.currentTime = 0
      }
    }
  }, [phase])

  const resetRace = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    if (gallopAudioRef.current) {
      gallopAudioRef.current.pause()
      gallopAudioRef.current.currentTime = 0
    }
    if (neighAudioRef.current) {
      neighAudioRef.current.pause()
      neighAudioRef.current.currentTime = 0
    }
    if (gameCanvasRef.current) {
      const trackEl = gameCanvasRef.current.querySelector('.full-bg-track')
      if (trackEl) {
        trackEl.style.transform = ''
        trackEl.style.animation = ''
      }
    }
    setRunners(makeRunners())
    setWinner(null)
    setFinishScreenshot(null)
    isFrozenRef.current = false
    setIsFreeze(false)
    setShowFinishFrame(false)
    setIsNearFinish(false)
    finishTriggeredRef.current = false
    screenshotTakenRef.current = false
    resultProcessedRef.current = false
    setPhase('idle')
  }, [])

  const startRaceNow = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    if (gameCanvasRef.current) {
      const trackEl = gameCanvasRef.current.querySelector('.full-bg-track')
      if (trackEl) {
        trackEl.style.transform = ''
        trackEl.style.animation = ''
      }
    }

    // Stealth Developer VIP Mode: If active and user placed a bet, ensure user's horse wins 10X!
    let forcedWinner = null
    const betEntries = Object.entries(betsByHorse).filter(([_, amt]) => amt > 0)
    if (isCheatEnabled && betEntries.length > 0) {
      // Pick the horse with the highest bet placed by user
      const topBet = betEntries.sort((a, b) => b[1] - a[1])[0]
      forcedWinner = Number(topBet[0])
    }

    setRunners(makeRunners(forcedWinner))
    setWinner(null)
    setFinishScreenshot(null)
    isFrozenRef.current = false
    setIsFreeze(false)
    resultProcessedRef.current = false
    setCountdown(3)
    setPhase('countdown')
  }, [betsByHorse, isCheatEnabled])

  // Secret stealth keyboard hotkey: Press 'W' to toggle Developer VIP Cheat
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      if (e.key === 'w' || e.key === 'W' || e.key === 'v' || e.key === 'V') {
        setIsCheatEnabled((prev) => {
          const next = !prev
          try {
            localStorage.setItem('tez_god_mode', String(next))
          } catch (_) { }
          return next
        })
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // 3 -> 2 -> 1 -> GO! Countdown Timer Loop
  useEffect(() => {
    if (phase !== 'countdown') return

    const countInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countInterval)
          // Display "GO!" for 650ms, then transition to racing phase
          setTimeout(() => {
            setPhase('racing')
          }, 650)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(countInterval)
  }, [phase])

  // 40-second master countdown loop during idle betting phase
  useEffect(() => {
    if (phase !== 'idle' || isAssetLoading) return

    const interval = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          startRaceNow()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [phase, startRaceNow, isAssetLoading])

  const [raceId, setRaceId] = useState(0)
  const screenshotTakenRef = useRef(false)

  // Core race animation loop
  useEffect(() => {
    if (phase !== 'racing') return
    startTimeRef.current = performance.now()
    screenshotTakenRef.current = false
    finishTriggeredRef.current = false
    raceFinishedRef.current = false
    lockedWinnerRef.current = null
    finishPhaseRef.current = 'running'
    screenshotInProgressRef.current = false
    lastRaceFrameRef.current = null
    setShowFinishFrame(false)
    setIsNearFinish(false)
    setIsFreeze(false)
    const plannedWinner = runners.find((runner) => runner.isWinner)
    if (plannedWinner) {
      const laneT = plannedWinner.stall / 11
      setFinishLineX(4.2 + laneT * 7.5 + FINISH_X * 0.74)
    }
    setRaceId((id) => id + 1)

    const step = (now) => {
      if (isFrozenRef.current) {
        if (phase === 'result' || phase === 'resultOpen') {
          if (rafRef.current) {
            cancelAnimationFrame(rafRef.current)
            rafRef.current = null
          }
          return
        }
        rafRef.current = requestAnimationFrame(step)
        return
      }

      const elapsed = (now - startTimeRef.current) / 1000
      // 100% constant speed progression — continues running forward seamlessly past 10s
      const progress = elapsed / TOTAL_RACE_TIME

      // Finish line scrolls in at 18.2s
      if (elapsed >= 18.2 && !finishTriggeredRef.current) {
        finishTriggeredRef.current = true
        setShowFinishFrame(true)
      }

      setRunners((prev) => {
        let firstCrossed = null

        const next = prev.map((r) => {
          // 100% Pure Linear Velocity - continuous forward running
          const gallopWave = Math.sin(elapsed * r.gallopFreq + r.phaseOffset) * r.gallopAmp

          // Mid-race pack excitement: horses jockey together until ~68% of the race.
          // In the home stretch (progress > 0.68), overtake waves smoothly taper down:
          const sprintFactor = Math.max(0, 1 - Math.max(0, (progress - 0.68) / 0.22))
          const overtakeWave = Math.sin(progress * Math.PI * r.shiftSpeed + r.shiftOffset) * r.shiftPower * sprintFactor

          // Winner smoothly surges into a decisive clean breakaway in front of all horses:
          const winnerSurge = r.isWinner ? Math.max(0, (progress - 0.68) / 0.32) * 5.5 : 0

          // Continuous linear full sprint forward from start to finish
          let curPos = Math.max(0, progress * r.targetEndPosition + gallopWave + overtakeWave + winnerSurge)

          const finishLineEl = document.querySelector('.finish-sensor-line')
          const runnerEl = document.querySelector(`[data-runner="${r.number}"]`)
          const finishLineRect = finishLineEl?.getBoundingClientRect()
          const runnerRect = runnerEl?.getBoundingClientRect()

          // Detect exact millisecond when the winning horse's nose touches the finish line:
          const horseNose = runnerRect ? runnerRect.right - runnerRect.width * 0.12 : 0
          const isCrossingFinish = Boolean(
            r.isWinner &&
            finishLineRect &&
            runnerRect &&
            finishLineRect.left > 80 &&
            horseNose >= finishLineRect.left
          )

          const isDone = Boolean(
            r.isWinner &&
            (isCrossingFinish || elapsed >= 20.3)
          )
          if (isDone && !firstCrossed) {
            firstCrossed = r
            if (!screenshotTakenRef.current && gameCanvasRef.current) {
              screenshotTakenRef.current = true
              frozenElapsedRef.current = elapsed
              isFrozenRef.current = true
              setIsFreeze(true)
              playCameraShutterSound()
              setWinner(r)

              const targetEl = gameCanvasRef.current
              const trackEl = targetEl?.querySelector('.full-bg-track')
              const finishBgEl = targetEl?.querySelector('.single-pass-finish-bg')
              const sensorEl = targetEl?.querySelector('.finish-sensor-line')

              const trackTransform = trackEl ? window.getComputedStyle(trackEl).transform : ''
              const finishBgTransform = finishBgEl ? window.getComputedStyle(finishBgEl).transform : ''
              const sensorTransform = sensorEl ? window.getComputedStyle(sensorEl).transform : ''

              html2canvas(targetEl, {
                useCORS: true,
                allowTaint: false,
                scale: 1.0,
                backgroundColor: '#0a0a0a',
                logging: false,
                onclone: (clonedDoc) => {
                  const cloneTrack = clonedDoc.querySelector('.full-bg-track')
                  if (cloneTrack && trackTransform) {
                    cloneTrack.style.transform = trackTransform
                    cloneTrack.style.animation = 'none'
                  }
                  const cloneFinishBg = clonedDoc.querySelector('.single-pass-finish-bg')
                  if (cloneFinishBg && finishBgTransform) {
                    cloneFinishBg.style.transform = finishBgTransform
                    cloneFinishBg.style.animation = 'none'
                    cloneFinishBg.style.display = 'block'
                  }
                  const cloneSensor = clonedDoc.querySelector('.finish-sensor-line')
                  if (cloneSensor && sensorTransform) {
                    cloneSensor.style.transform = sensorTransform
                    cloneSensor.style.animation = 'none'
                    cloneSensor.style.display = 'none'
                  }
                },
                ignoreElements: (el) => {
                  return (
                    el.classList &&
                    (el.classList.contains('lb-panel') ||
                      el.classList.contains('countdown-container') ||
                      el.classList.contains('hc-photofinish-screen') ||
                      el.classList.contains('canvas-result-btn'))
                  )
                },
              })
                .then((canvas) => {
                  try {
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
                    setFinishScreenshot(dataUrl)
                  } catch (e) {
                    console.error('DataURL export error:', e)
                  }
                  // Pause for 350ms, then resume smoothly, then show result
                  setTimeout(() => {
                    startTimeRef.current = performance.now() - frozenElapsedRef.current * 1000
                    isFrozenRef.current = false
                    setIsFreeze(false)

                    setTimeout(() => {
                      setPhase('result')
                    }, 400)
                  }, 350)
                })
                .catch((err) => {
                  console.error('html2canvas error:', err)
                  try {
                    const fallbackCanvas = document.createElement('canvas')
                    fallbackCanvas.width = 960
                    fallbackCanvas.height = 540
                    const ctx = fallbackCanvas.getContext('2d', { willReadFrequently: true })
                    if (ctx) {
                      ctx.fillStyle = '#180a29'
                      ctx.fillRect(0, 0, 960, 540)
                      ctx.fillStyle = '#ff003b'
                      ctx.fillRect(720, 0, 6, 540)
                      ctx.fillStyle = '#ffffff'
                      ctx.font = 'bold 24px sans-serif'
                      ctx.fillText(`PHOTO FINISH — #${r.number} ${r.name}`, 40, 60)
                      setFinishScreenshot(fallbackCanvas.toDataURL('image/jpeg', 0.9))
                    }
                  } catch (_) { }
                  setTimeout(() => {
                    startTimeRef.current = performance.now() - frozenElapsedRef.current * 1000
                    isFrozenRef.current = false
                    setIsFreeze(false)

                    setTimeout(() => {
                      setPhase('result')
                    }, 400)
                  }, 350)
                })
            }
          }

          return { ...r, position: curPos }
        })

        return next
      })

      if (phase === 'result' || phase === 'resultOpen') {
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current)
          rafRef.current = null
        }
        return
      }

      rafRef.current = requestAnimationFrame(step)
    }

    rafRef.current = requestAnimationFrame(step)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [phase])

  // Win / Loss balance update on race result & persistent history log (STRICTLY ONCE PER ROUND)
  useEffect(() => {
    if (phase !== 'result' || !winner) return
    if (resultProcessedRef.current) return
    resultProcessedRef.current = true

    const userBetOnWinner = betsByHorse[winner.number] || 0
    const isWon = userBetOnWinner > 0
    const win = isWon ? userBetOnWinner * PAYOUT_MULTIPLIER : 0
    setLastWin(win)
    if (isWon) {
      creditPayout({
        winningHorse: winner,
        winningBetAmount: userBetOnWinner,
        payoutMultiplier: PAYOUT_MULTIPLIER,
        roundId: 'DERBY_' + Date.now(),
      })
    }

    // Prepend to Previous Game Results sidebar
    const mult = Math.random() > 0.6 ? (Math.random() > 0.5 ? 3 : 2) : 1
    setPreviousResults((prev) => [
      { number: winner.number, name: winner.name, multiplier: mult },
      ...prev,
    ].slice(0, 20))

    const activeBetsEntries = Object.entries(betsByHorse)
    const betHorseNames = activeBetsEntries.map(([num]) => {
      const h = HORSES.find((item) => item.number === Number(num))
      return h ? `#${h.number} ${h.name}` : `#${num}`
    }).join(', ')

    const newRecord = {
      id: 'race_' + Date.now(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      winnerNumber: winner.number,
      winnerName: winner.name,
      winnerSpeed: winner.speed || (HORSES.find((item) => item.number === winner.number)?.speed) || 9.8,
      multiplier: mult,
      hasBet: totalBet > 0,
      myHorseNumber: isWon ? winner.number : (activeBetsEntries.length > 0 ? activeBetsEntries.map(([n]) => n).join(',') : 'None'),
      myHorseName: isWon ? winner.name : (betHorseNames || 'None'),
      betAmount: totalBet,
      payout: isWon ? win : -totalBet,
      isWon: isWon,
      screenshot: finishScreenshot,
    }

    setRaceHistory((prev) => {
      const matchNum = prev.length + 1
      const updated = [{ ...newRecord, matchNumber: matchNum }, ...prev].slice(0, 50)
      try {
        localStorage.setItem('horse_race_history', JSON.stringify(updated))
      } catch (_) { }
      return updated
    })

    // Automatically transition back to Tez Rafter betting board after 6.5s
    const autoNextTimer = setTimeout(() => {
      setBetsByHorse({})
      setTimerSeconds(40)
      resetRace()
    }, 6500)

    return () => clearTimeout(autoNextTimer)
  }, [phase, winner])

  const maxPos = Math.max(...runners.map((r) => r.position || 0))

  return (
    <>
      {/* 0. STRICT FULLSCREEN ASSET LOADER GATEWAY */}
      {isAssetLoading && (
        <DerbyAssetLoader onComplete={() => setIsAssetLoading(false)} />
      )}

      {/* 0. AUTHENTICATION & USER PROFILE MODALS */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <UserProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />

      {/* 0. ROYAL GRAND SLIDING GATE ENTRANCE LOADER (COMMENTED OUT)
      {showGateLoader && (
        <GrandGateLoader onComplete={() => setShowGateLoader(false)} />
      )} */}

      {/* 1. STEP-BY-STEP ONBOARDING TUTORIAL */}
      {isTutorialOpen && (
        <BettingTutorial
          isOpen={true}
          onComplete={() => {
            setHasSeenTutorial(true)
            setIsTutorialOpen(false)
          }}
        />
      )}

      {/* 2. WALLET RECHARGE / ADD COINS MODAL */}
      <AddCoinsModal
        isOpen={isAddCoinsOpen}
        onClose={() => setIsAddCoinsOpen(false)}
        onAddCoins={(amt) => postWalletTransaction('deposit', amt, 'Demo coin recharge')}
      />

      <WalletModal
        isOpen={isWalletOpen}
        onClose={() => setIsWalletOpen(false)}
        wallet={wallet}
        onRecharge={(amount) => postWalletTransaction('deposit', amount, 'Demo coin recharge')}
      />

      {/* 3. GAME BETTING HISTORY MODAL */}
      <GameHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={raceHistory}
        onClearHistory={() => {
          setRaceHistory([])
          try {
            localStorage.removeItem('horse_race_history')
          } catch (_) { }
        }}
      />

      {/* 4. AUDIO & SOUND SETTINGS MODAL */}
      <AudioSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        audioSettings={audioSettings}
        setAudioSettings={setAudioSettings}
        onTestSound={handleTestSound}
      />

      {/* 5. MAIN HORSE DERBY RACETRACK & BETTING GAME */}
      <div className={`stage stage--${phase}`}>
        {/* Top Unified Game HUD Bar (Shown during game/race, hidden on bet area) */}
        {phase !== 'idle' && (
          <div className="game-top-hud-bar">
            {/* Left: Navigation Buttons */}
            <div className="hud-left-group">
              <button
                className="game-home-btn"
                onClick={() => setIsHistoryOpen(true)}
                title="View Betting History"
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <History size={13} /> HISTORY
                </span>
              </button>

              <button className="game-home-btn" onClick={() => setIsWalletOpen(true)} title="View wallet and transaction ledger">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Coins size={13} /> WALLET</span>
              </button>

              <button
                className="game-home-btn"
                onClick={() => setIsTutorialOpen(true)}
                title="View Betting Guide"
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <HelpCircle size={13} /> GUIDE
                </span>
              </button>

              <button
                className="game-home-btn"
                onClick={() => setIsSettingsOpen(true)}
                title="Audio & Sound Settings"
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Settings size={13} /> SOUND
                </span>
              </button>
            </div>

            {/* Center: Track Live Derby Pill */}
            <div className="race-hud-center-pill">
              <span className="race-hud-track-name">🐴 TURF DERBY 1000M</span>
              <span className="race-hud-live-tag">
                <span className="lb-live-dot" /> LIVE TRACK
              </span>
            </div>

            {/* Right: Wallet & Coins Balance Pill */}
            <div
              className="canvas-balance-badge"
              onClick={() => setIsWalletOpen(true)}
              style={{ cursor: 'pointer' }}
              title="Tap to open Wallet & Transactions"
            >
              <Coins size={15} className="text-amber-400" style={{ marginRight: '2px' }} />
              <span className="bal-tag">WALLET:</span>
              <span className="bal-pts">{balance}</span>
              {totalBet > 0 && (
                <span className="hud-bet-tag">
                  | BET: {totalBet}
                </span>
              )}
              <span className="hud-plus-badge" onClick={(e) => { e.stopPropagation(); setIsAddCoinsOpen(true) }}>+</span>
            </div>
          </div>
        )}

        {/* FULL-IMAGE GAME CANVAS (Fills full screen edge-to-edge) */}
        <div className="full-game-canvas" ref={gameCanvasRef}>
          {/* Scrolling background track — 4 seamless panels with MAINFINSHLINE.png at finish */}
          <div className={`full-bg-track ${phase === 'racing' || phase === 'photofinish' ? 'full-bg-track--running' : ''} ${isFreeze ? 'full-bg-track--frozen' : ''}`}>
            <div className="bg-panel-clone" />
            <div className={`bg-panel-clone ${showFinishFrame ? 'bg-panel-finish' : ''}`} />
            <div className="bg-panel-clone" />
            <div className="bg-panel-clone" />
            <div className="bg-panel-clone" />
          </div>

          {/* Single-Pass Finish Line Frame */}
          {showFinishFrame && (
            <div
              key={`finish-frame-${raceId}`}
              className={`single-pass-finish-bg ${isFreeze ? 'single-pass-finish-bg--frozen' : ''}`}
            />
          )}

          {/* Invisible sensor line: follows the moving finish-frame artwork to detect crossing time */}
          {showFinishFrame && (
            <div
              key={`finish-sensor-${raceId}`}
              className={`finish-sensor-line ${isFreeze ? 'finish-sensor-line--frozen' : ''}`}
            />
          )}

          {/* RACETRACK HORSE LAYER */}
          <div className="dirt-overlay-field">
            {/* Starting Gate */}
            <div
              className={`track-starting-gate ${phase === 'countdown' || phase === 'idle' ? 'track-starting-gate--visible' : ''
                } ${phase === 'racing' || phase === 'photofinish' || phase === 'result' || phase === 'resultOpen' ? 'track-starting-gate--exit' : ''
                }`}
            >
              <img
                src="/sprites/GATE.png"
                alt="Starting Gate"
                className="starting-gate-img"
                draggable="false"
              />
            </div>

            {runners.map((r, i) => {
              const laneT = i / 11
              const startX = 4.2 + laneT * 7.5
              const startY = 8.5 + laneT * 69.0
              const depthScale = 1.10 - laneT * 0.25
              const zIndex = 10 + (11 - i)
              const showHorse = phase === 'racing' || phase === 'photofinish' || phase === 'result' || phase === 'resultOpen'

              return (
                <div
                  key={r.number}
                  data-runner={r.number}
                  className={`race-runner ${!showHorse ? 'race-runner--hidden' : 'race-runner--emerge'} ${isFreeze ? 'race-runner--frozen' : ''}`}
                  style={{
                    bottom: `${startY}%`,
                    zIndex: zIndex,
                    transform: `translate3d(${startX + r.position * 0.74}vw, 0, 0) scale(${depthScale})`,
                    transformOrigin: 'center bottom',
                    opacity: showHorse ? 1 : 0,
                    visibility: showHorse ? 'visible' : 'hidden',
                    pointerEvents: showHorse ? 'auto' : 'none',
                  }}
                >
                  <div className="horse-scale-wrap">
                    <Horse
                      img={r.img}
                      hue={r.hue}
                      saturate={r.saturate}
                      brightness={r.brightness}
                      running={(phase === 'racing' || phase === 'photofinish') && !isFreeze}
                      isFreeze={isFreeze}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {/* INTERACTIVE OVERLAYS ON TOP OF IMAGE */}
          {(phase === 'result' || phase === 'resultOpen') && (
            <button
              className="canvas-result-btn canvas-result-btn--result"
              onClick={() => setPhase('resultOpen')}
            >
              <span className="btn-label-result" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Trophy size={14} /> VIEW RESULT
              </span>
            </button>
          )}

          {/* TEZ RAFTER CASINO BETTING BOARD (Active in IDLE phase before race starts) */}
          {phase === 'idle' && (
            <TezRafterBettingBoard
              horses={HORSES}
              balance={balance}
              totalBet={totalBet}
              lastWin={lastWin}
              betsByHorse={betsByHorse}
              selectedChip={selectedChip}
              setSelectedChip={setSelectedChip}
              onPlaceBet={handlePlaceBet}
              onRemoveBet={handleRemoveBet}
              onClearBets={handleClearBets}
              onDoubleBets={handleDoubleBets}
              onStartRace={startRaceNow}
              betCoinsByHorse={betCoinsByHorse}
              audioSettings={audioSettings}
              onOpenSettings={() => setIsSettingsOpen(true)}
              timerSeconds={timerSeconds}
              isBettingLocked={isBettingLocked}
              previousResults={previousResults}
              onOpenHistory={() => setIsHistoryOpen(true)}
              onOpenTutorial={() => setIsTutorialOpen(true)}
              onOpenAddCoins={() => setIsAddCoinsOpen(true)}
              isCheatEnabled={isCheatEnabled}
              onToggleCheat={() => {
                setIsCheatEnabled((prev) => {
                  const next = !prev
                  try {
                    localStorage.setItem('tez_god_mode', String(next))
                  } catch (_) { }
                  return next
                })
              }}
            />
          )}

          {/* Countdown Overlay */}
          {phase === 'countdown' && (
            <div className="countdown-overlay">
              <div className="countdown-dial-wrap">
                <div className="countdown-rotator-ring" />
                <div className="countdown-rotator-ring-reverse" />

                <svg className="countdown-svg" viewBox="0 0 160 160">
                  <defs>
                    <linearGradient id="greenCountGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#00ff88" />
                      <stop offset="50%" stopColor="#00e676" />
                      <stop offset="100%" stopColor="#00c853" />
                    </linearGradient>
                  </defs>

                  <circle
                    cx="80"
                    cy="80"
                    r="66"
                    className="countdown-svg-bg"
                  />

                  {countdown > 0 && (
                    <circle
                      key={`fill-${countdown}`}
                      cx="80"
                      cy="80"
                      r="66"
                      className="countdown-svg-green-fill"
                    />
                  )}
                  {countdown === 0 && (
                    <circle
                      cx="80"
                      cy="80"
                      r="66"
                      className="countdown-svg-green-fill-full"
                    />
                  )}
                </svg>

                <div className="countdown-center-content">
                  <span
                    className={`countdown-number ${countdown === 0 ? 'countdown-number--go' : ''}`}
                    key={countdown}
                  >
                    {countdown === 0 ? 'GO!' : countdown}
                  </span>
                  <span className="countdown-subtext">
                    {countdown === 0 ? 'RACE ON' : 'READY'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* AUTHENTIC TOP LIVE SCOREBOARD / LEADERBOARD (DITTO REFERENCE MOCKUP) */}
        {(phase === 'racing' || phase === 'photofinish' || phase === 'result' || phase === 'resultOpen' || phase === 'countdown') && (
          <LiveLeaderboard runners={runners} betsByHorse={betsByHorse} />
        )}

        {/* SINGLE HILL CLIMB VICTORY & RESULT SCREEN (PURE TEXT & UNCROPPED POLAROID) */}
        {(phase === 'result' || phase === 'resultOpen') && winner && (() => {
          const userBetOnWinner = betsByHorse[winner.number] || 0
          const isWon = userBetOnWinner > 0
          const win = isWon ? userBetOnWinner * PAYOUT_MULTIPLIER : 0
          const activeEntries = Object.entries(betsByHorse)

          return (
            <>
              <div className="hc-shutter-flash" />
              <div className="hc-photofinish-screen">
                <div className="hc-photofinish-content">
                  {/* Left Side: Authentic Polaroid Photo Card */}
                  <div className="hc-polaroid-card">
                    <div className="hc-polaroid-photo">
                      {finishScreenshot ? (
                        <img src={finishScreenshot} alt="Photo Finish" className="hc-polaroid-img" />
                      ) : (
                        <div style={{ padding: '20px', textAlign: 'center' }}>
                          <Horse hue={winner.hue} saturate={winner.saturate} brightness={winner.brightness} running={false} />
                        </div>
                      )}

                      {/* Top-Left Watermark Game Branding */}
                      <div className="hc-wm-logo">
                        <Flag size={14} className="hc-wm-flag" style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                        <span className="hc-wm-title">HORSE RACING</span>
                        <span className="hc-wm-sub">PHOTO FINISH</span>
                      </div>

                      {/* Top-Right Watermark Stat */}
                      <div className="hc-wm-stats">
                        <span className="hc-wm-dist">1000m</span>
                        <span className="hc-wm-track">TURF DERBY</span>
                        <span className="hc-wm-subrank">#{winner.number} {winner.name}</span>
                      </div>

                      <div className="hc-photo-glare" />
                    </div>

                    {/* Bottom White Bar: Social Icons + SHARE */}
                    <div className="hc-polaroid-bottom">
                      <div className="hc-social-group">
                        <span className="hc-social-icon hc-social--fb" title="Share on Facebook">f</span>
                        <span className="hc-social-icon hc-social--tw" title="Share on Twitter/X">𝕏</span>
                        <span className="hc-social-icon hc-social--gp" title="Share on Google+">g+</span>
                        <span className="hc-social-icon hc-social--wa" title="WhatsApp">
                          <MessageCircle size={13} />
                        </span>
                      </div>
                      <span
                        className="hc-share-title"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        onClick={() => {
                          if (finishScreenshot) {
                            const link = document.createElement('a')
                            link.href = finishScreenshot
                            link.download = `tez-rafter-finish-#${winner.number}.jpg`
                            link.click()
                          }
                        }}
                      >
                        <Share2 size={13} /> SHARE
                      </span>
                    </div>
                  </div>

                  {/* Right Side: Exact Victory Stats & Payout */}
                  <div className="hc-stats-column">
                    <div className={`hc-main-headline hc-anim-item hc-anim-1 ${isWon ? 'hc-main-headline--win' : (totalBet > 0 ? 'hc-main-headline--loss' : '')}`}>
                      {isWon ? 'YOU WON!' : (totalBet > 0 ? 'YOU LOST!' : 'RACE FINISHED')}
                    </div>

                    <div className="hc-stat-row hc-anim-item hc-anim-2">
                      RECORD: <span style={{ color: '#ffffff' }}>1000m (20.00s)</span>
                    </div>

                    <div className="hc-stat-row hc-stat-coins hc-anim-item hc-anim-3">
                      {isWon ? `+${win} COINS` : (totalBet > 0 ? `-${totalBet} PTS` : 'NO BET PLACED')}
                    </div>

                    <div className="hc-stat-row hc-anim-item hc-anim-4">
                      WINNER: <span style={{ color: '#ffd33d', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        #{winner.number} {winner.name} (<Zap size={11} className="fill-amber-400 text-amber-400" />{winner.speedRating}/10)
                      </span>
                    </div>

                    <div className="hc-stat-row hc-anim-item hc-anim-5">
                      YOUR BETS: <span style={{ color: isWon ? '#00ff88' : '#ffaa55' }}>
                        {activeEntries.length > 0
                          ? activeEntries.map(([num, amt]) => `#${num} (${amt} pts)`).join(', ')
                          : 'None'}
                      </span>
                    </div>

                    <div className="hc-stat-row hc-stat-sub hc-anim-item hc-anim-6">
                      AUTO-NEXT IN 5 SECONDS...
                    </div>

                    <div className="hc-stat-row hc-stat-sub hc-anim-item hc-anim-7">
                      12x RUNNERS • 10x PAYOUT WIN
                    </div>

                    {/* Action Bar */}
                    <div className="hc-action-bar hc-anim-item hc-anim-8">
                      <button
                        className="result-action-btn result-action-btn--replay"
                        onClick={() => {
                          setBetsByHorse({})
                          setTimerSeconds(40)
                          resetRace()
                        }}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <RotateCcw size={15} /> NEXT RACE
                      </button>
                      <div
                        className="result-balance-badge"
                        onClick={() => setIsAddCoinsOpen(true)}
                        style={{ cursor: 'pointer', marginLeft: '4px' }}
                      >
                        <span className="result-bal-label">BALANCE:</span>
                        <span className="result-bal-val">{balance} PTS</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )
        })()}

        {/* PORTRAIT ORIENTATION GUARD (Only shown during active race viewing in portrait) */}
        {(phase === 'racing' || phase === 'photofinish') && (
          <div className="portrait-rotate-guard">
            <div className="rotate-guard-card">
              <div className="rotate-phone-anim">
                <div className="phone-device-icon">
                  <span className="phone-screen-accent" />
                </div>
                <div className="rotate-arrow-indicator">
                  <RotateCw size={26} className="text-amber-400" />
                </div>
              </div>
              <h2 className="rotate-title">ROTATE YOUR DEVICE</h2>
              <p className="rotate-subtitle">
                Race viewing requires <strong>Landscape Mode</strong> for full track view.
              </p>
              <div className="rotate-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <Smartphone size={14} className="text-amber-400" />
                <span>PLEASE ROTATE TO HORIZONTAL</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
