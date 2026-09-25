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
import DerbyAssetLoader from './components/DerbyAssetLoader.jsx'
import LiveLeaderboard from './components/LiveLeaderboard.jsx'
import HangingJackpotSign from './components/HangingJackpotSign.jsx'
import { DEFAULT_AUDIO_SETTINGS } from './config/audioConstants.js'
import {
  getSafeAudioContext,
  unlockAudio,
  playCameraShutter,
  startProceduralGallop,
  stopProceduralGallop,
  playProceduralHorseNeigh,
  playProceduralShutter,
  playRaceStartBell,
} from './utils/audioContextHelper.js'

// Code-split auxiliary modals to shrink initial JS payload
const BettingTutorial = React.lazy(() => import('./components/BettingTutorial.jsx'))
const AddCoinsModal = React.lazy(() => import('./components/AddCoinsModal.jsx'))
const GameHistoryModal = React.lazy(() => import('./components/GameHistoryModal.jsx'))
const AudioSettingsModal = React.lazy(() => import('./components/AudioSettingsModal.jsx'))
const WalletModal = React.lazy(() => import('./components/WalletModal.jsx'))
const AuthModal = React.lazy(() => import('./components/auth/AuthModal.jsx'))
const UserProfileModal = React.lazy(() => import('./components/auth/UserProfileModal.jsx'))

import { horseService, DEFAULT_HORSES } from './services/horseService.js'
import { socketService } from './services/socketService.js'
import { gameApiService } from './services/gameApiService.js'
import { storageService } from './services/storageService.js'

const HORSES = DEFAULT_HORSES

const HORSE_SILK_COLORS = {
  1: '#d32f2f', // Red
  2: '#1976d2', // Blue
  3: '#2e7d32', // Green
  4: '#7b1fa2', // Purple
  5: '#f57c00', // Orange
  6: '#0097a7', // Cyan
  7: '#fbc02d', // Yellow
  8: '#c2185b', // Pink/Magenta
  9: '#303f9f', // Indigo
  10: '#00796b', // Teal
  11: '#5d4037', // Brown
  12: '#e64a19', // Deep Orange
}

const STAKE = 10
const PAYOUT_MULTIPLIER = 10
const BET_OPTIONS = [10, 25, 50, 100, 250, 500]
const TOTAL_RACE_TIME = 20.0 // Exactly 20.0s deterministic race duration on all rounds
const FINISH_X = 68.0
const SCREENSHOT_X = 70.2
const FINISH_CAPTURE_TIMEOUT_MS = 1500
const RACE_DEBUG = import.meta.env.DEV

function makeRunners(forcedWinnerNumber = null, horsesList = DEFAULT_HORSES) {
  const currentList = horsesList && horsesList.length > 0 ? horsesList : DEFAULT_HORSES
  const totalRunners = currentList.length

  let forcedIdx = -1
  if (forcedWinnerNumber !== null && forcedWinnerNumber !== undefined) {
    forcedIdx = currentList.findIndex((h) => h.number === Number(forcedWinnerNumber))
  }

  // Determine final ranks for 12 horses
  let rankMap = new Array(totalRunners)
  if (forcedIdx >= 0) {
    // Guaranteed winner at rank 0
    rankMap[forcedIdx] = 0
    const otherIndices = Array.from({ length: totalRunners }, (_, i) => i).filter((i) => i !== forcedIdx)
    const shuffledOthers = otherIndices.sort(() => Math.random() - 0.5)
    shuffledOthers.forEach((origIdx, rIdx) => {
      rankMap[origIdx] = rIdx + 1
    })
  } else {
    // Fair random shuffle
    const shuffled = Array.from({ length: totalRunners }, (_, i) => i).sort(() => Math.random() - 0.5)
    rankMap = Array.from({ length: totalRunners }, (_, i) => shuffled.indexOf(i))
  }

  return currentList.map((h, i) => {
    const finalRank = rankMap[i] // 0 = 1st (Winner), 1 = 2nd, 2 = 3rd ...
    const isWinner = finalRank === 0

    const laneIdx = (Number(h.number) >= 1 && Number(h.number) <= 12) ? (Number(h.number) - 1) : i
    const laneT = totalRunners > 1 ? laneIdx / (totalRunners - 1) : 0
    const startX = 4.2 + laneT * 7.5
    const depthScale = 1.10 - laneT * 0.25
    const horseVisualWidth = 14.5 * depthScale

    // Exact winner screen X target when crossing the finish line at 78.2vw
    const winnerScreenTarget = 78.2 - horseVisualWidth * 0.35
    const targetEndPosition = (winnerScreenTarget - startX) / 0.74

    return {
      ...h,
      stall: laneIdx,
      position: 0,
      finalRank,
      targetEndPosition,
      isWinner,
      phaseOffset: Math.random() * Math.PI * 2,
      shiftOffset: Math.random() * Math.PI * 2,
      shiftPower: (Math.random() - 0.5) * 1.5,
      shiftSpeed: 0.6 + Math.random() * 0.4,
      gallopFreq: 2.2 + Math.random() * 0.4,
      gallopAmp: 0.30 + Math.random() * 0.15,
      finished: false,
    }
  })
}

function getPersistedGameSession() {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem('tez_game_active_session') || localStorage.getItem('tez_game_active_session')
    if (!raw) return null
    const session = JSON.parse(raw)
    const now = Date.now()
    const age = now - (session.savedAt || now)
    // A single full game round is ~70s. Active session valid within 90s.
    if (age < 90000 && session.phase) {
      return session
    }
  } catch (_) { }
  return null
}

function computeInitialRecovery() {
  const initialSession = getPersistedGameSession()
  if (!initialSession) {
    return {
      phase: 'idle',
      timerSeconds: 40,
      countdown: 3,
      raceElapsed: 0,
      isAssetLoading: true,
      betsByHorse: {},
      betCoinsByHorse: {},
      runners: null,
      winner: null,
      gameSerialNumber: null,
      jackpotMultiplier: 1,
      jackpotDisplay: 'N',
      initialSession: null,
    }
  }

  const now = Date.now()
  if (initialSession.phase === 'racing' && initialSession.raceStartTime) {
    const elapsed = (now - initialSession.raceStartTime) / 1000
    if (elapsed < 20.3) {
      return {
        phase: 'racing',
        timerSeconds: 0,
        countdown: 0,
        raceElapsed: elapsed,
        isAssetLoading: false,
        betsByHorse: initialSession.betsByHorse || {},
        betCoinsByHorse: initialSession.betCoinsByHorse || {},
        runners: initialSession.runners || null,
        winner: initialSession.winner || null,
        gameSerialNumber: initialSession.gameSerialNumber || null,
        jackpotMultiplier: initialSession.jackpotMultiplier || 1,
        jackpotDisplay: initialSession.jackpotDisplay || 'N',
        initialSession,
      }
    } else if (elapsed < 27.0) {
      return {
        phase: 'result',
        timerSeconds: 0,
        countdown: 0,
        raceElapsed: 20.3,
        isAssetLoading: false,
        betsByHorse: initialSession.betsByHorse || {},
        betCoinsByHorse: initialSession.betCoinsByHorse || {},
        runners: initialSession.runners || null,
        winner: initialSession.winner || (initialSession.runners ? initialSession.runners.find((r) => r.isWinner) : null),
        gameSerialNumber: initialSession.gameSerialNumber || null,
        jackpotMultiplier: initialSession.jackpotMultiplier || 1,
        jackpotDisplay: initialSession.jackpotDisplay || 'N',
        initialSession,
      }
    }
  } else if (initialSession.phase === 'countdown' && initialSession.countdownStartTime) {
    const elapsed = (now - initialSession.countdownStartTime) / 1000
    if (elapsed < 3.5) {
      return {
        phase: 'countdown',
        timerSeconds: 0,
        countdown: Math.max(0, 3 - Math.floor(elapsed)),
        raceElapsed: 0,
        isAssetLoading: false,
        betsByHorse: initialSession.betsByHorse || {},
        betCoinsByHorse: initialSession.betCoinsByHorse || {},
        runners: initialSession.runners || null,
        winner: null,
        gameSerialNumber: initialSession.gameSerialNumber || null,
        jackpotMultiplier: initialSession.jackpotMultiplier || 1,
        jackpotDisplay: initialSession.jackpotDisplay || 'N',
        initialSession,
      }
    } else if (elapsed < 24.0) {
      return {
        phase: 'racing',
        timerSeconds: 0,
        countdown: 0,
        raceElapsed: elapsed - 3.5,
        isAssetLoading: false,
        betsByHorse: initialSession.betsByHorse || {},
        betCoinsByHorse: initialSession.betCoinsByHorse || {},
        runners: initialSession.runners || null,
        winner: null,
        gameSerialNumber: initialSession.gameSerialNumber || null,
        jackpotMultiplier: initialSession.jackpotMultiplier || 1,
        jackpotDisplay: initialSession.jackpotDisplay || 'N',
        initialSession,
      }
    }
  } else if (initialSession.phase === 'result' && initialSession.resultStartTime) {
    const elapsed = (now - initialSession.resultStartTime) / 1000
    if (elapsed < 6.5) {
      return {
        phase: 'result',
        timerSeconds: 0,
        countdown: 0,
        raceElapsed: 20.3,
        isAssetLoading: false,
        betsByHorse: initialSession.betsByHorse || {},
        betCoinsByHorse: initialSession.betCoinsByHorse || {},
        runners: initialSession.runners || null,
        winner: initialSession.winner || null,
        gameSerialNumber: initialSession.gameSerialNumber || null,
        jackpotMultiplier: initialSession.jackpotMultiplier || 1,
        jackpotDisplay: initialSession.jackpotDisplay || 'N',
        initialSession,
      }
    }
  } else if (initialSession.phase === 'idle') {
    const elapsed = Math.floor((now - (initialSession.savedAt || now)) / 1000)
    const remaining = Math.max(0, (initialSession.timerSeconds ?? 40) - elapsed)
    return {
      phase: 'idle',
      timerSeconds: remaining > 0 ? remaining : 40,
      countdown: 3,
      raceElapsed: 0,
      isAssetLoading: true,
      betsByHorse: initialSession.betsByHorse || {},
      betCoinsByHorse: initialSession.betCoinsByHorse || {},
      runners: null,
      winner: null,
      gameSerialNumber: initialSession.gameSerialNumber || null,
      jackpotMultiplier: initialSession.jackpotMultiplier || 1,
      jackpotDisplay: initialSession.jackpotDisplay || 'N',
      initialSession,
    }
  }

  return {
    phase: 'idle',
    timerSeconds: 40,
    countdown: 3,
    raceElapsed: 0,
    isAssetLoading: true,
    betsByHorse: {},
    betCoinsByHorse: {},
    runners: null,
    winner: null,
    gameSerialNumber: null,
    jackpotMultiplier: 1,
    jackpotDisplay: 'N',
    initialSession: null,
  }
}

export default function App() {
  const recoveredSessionRef = useRef(computeInitialRecovery())
  const recovered = recoveredSessionRef.current

  const [isCheatEnabled, setIsCheatEnabled] = useState(() => {
    try {
      const saved = localStorage.getItem('tez_god_mode')
      return saved !== 'false' // Enabled by default
    } catch (_) {
      return true
    }
  })
  const [isAssetLoading, setIsAssetLoading] = useState(recovered.isAssetLoading)
  const handleLoaderComplete = useCallback(() => {
    setIsAssetLoading(false)
  }, [])
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

  const [horses, setHorses] = useState(DEFAULT_HORSES)
  const horsesRef = useRef(horses)
  useEffect(() => {
    horsesRef.current = horses
  }, [horses])

  const [phase, setPhase] = useState(recovered.phase) // 40-second automated betting & race cycle
  const [runners, setRunners] = useState(() => recovered.runners || makeRunners(null, DEFAULT_HORSES))
  const runnersRef = useRef(runners)
  const runnerDomMapRef = useRef({})
  // Maps horse number → { img: HTMLImageElement, canvas: HTMLCanvasElement }
  // Used to imperatively freeze GIF frame from inside the RAF loop (synchronous, no React re-render lag)
  const gifDomMapRef = useRef({})

  useEffect(() => {
    runnersRef.current = runners
  }, [runners])

  // 2. Fetch Live Race & 12 Horses List (GET /api/races/current)
  useEffect(() => {
    // 1. Fetch current race & horses
    gameApiService
      .getCurrentRace()
      .then((curr) => {
        if (curr) {
          if (curr.gameSerial || curr.serialNumber || curr.raceId) {
            const serial = String(curr.gameSerial || curr.serialNumber || curr.raceId)
            setGameSerialNumber(serial)
          }
          if (Array.isArray(curr.horses) && curr.horses.length > 0) {
            setHorses(curr.horses)
            setRunners((prev) => (recoveredSessionRef.current?.runners ? prev : makeRunners(null, curr.horses)))
          }
          if (typeof curr.timeLeft === 'number' && phase === 'idle') {
            setTimerSeconds(curr.timeLeft)
          }
          if (curr.jackpotMultiplier) {
            setJackpotMultiplier(curr.jackpotMultiplier)
          }
        } else {
          // Fallback to /api/horses
          horseService
            .getHorses()
            .then((fetched) => {
              if (Array.isArray(fetched) && fetched.length > 0) {
                setHorses(fetched)
                setRunners((prev) => (recoveredSessionRef.current?.runners ? prev : makeRunners(null, fetched)))
              }
            })
            .catch(() => { })
        }
      })
      .catch(() => {
        horseService.getHorses().then((fetched) => {
          if (Array.isArray(fetched) && fetched.length > 0) {
            setHorses(fetched)
            setRunners((prev) => (recoveredSessionRef.current?.runners ? prev : makeRunners(null, fetched)))
          }
        }).catch(() => { })
      })

    // 6. Fetch previous race winners from /api/races/previous-results
    gameApiService
      .fetchPreviousResults(20)
      .then((res) => {
        if (Array.isArray(res) && res.length > 0) {
          setPreviousResults(res)
        }
      })
      .catch(() => { })
  }, [])

  const [selectedHorseId, setSelectedHorseId] = useState(1)
  const [betAmount, setBetAmount] = useState(10)
  const [isWalletOpen, setIsWalletOpen] = useState(false)

  // Enterprise Auth & Wallet Providers
  const { user, isAuthenticated, isGuest, isAuthModalOpen, setIsAuthModalOpen, isProfileModalOpen, setIsProfileModalOpen } = useAuth()
  const {
    balance,
    setBalance,
    totalWon,
    totalWins,
    transactions: walletTransactions,
    depositCoins,
    debitBet,
    refundBet,
    creditPayout,
  } = useWallet()

  const wallet = {
    balance,
    totalWon,
    totalWins,
    transactions: walletTransactions || [],
  }

  const [lastWin, setLastWin] = useState(() => {
    try {
      const saved = storageService.getWallet()
      if (typeof saved?.lastWonAmount === 'number') {
        return saved.lastWonAmount
      }
    } catch (_) { }
    return 0
  })
  const [winner, setWinner] = useState(recovered.winner)
  const [countdown, setCountdown] = useState(recovered.countdown)
  const [finishScreenshot, setFinishScreenshot] = useState(null)
  const raceResumeOffsetRef = useRef(recovered.raceElapsed)
  const sessionTimestampsRef = useRef({
    countdownStartTime: recovered.initialSession?.countdownStartTime || null,
    raceStartTime: recovered.initialSession?.raceStartTime || null,
    resultStartTime: recovered.initialSession?.resultStartTime || null,
  })
  const gameCanvasRef = useRef(null)

  const postWalletTransaction = useCallback((type, amount, note) => {
    if (type === 'deposit') {
      depositCoins(amount, note)
    } else {
      setBalance((b) => Math.max(0, Number((b + amount).toFixed(2))))
    }
  }, [depositCoins, setBalance])

  // Multi-betting & 40-second automated cycle state
  const [betsByHorse, setBetsByHorse] = useState(recovered.betsByHorse)
  const [betCoinsByHorse, setBetCoinsByHorse] = useState(recovered.betCoinsByHorse)
  const [selectedChip, setSelectedChip] = useState(10)
  const [timerSeconds, setTimerSeconds] = useState(recovered.timerSeconds)
  const userModifiedBetsRef = useRef(false)

  // Dynamic Viewport sync for mobile/tablet browsers to eliminate address bar overlap
  useEffect(() => {
    const updateViewportMetrics = () => {
      if (typeof window === 'undefined') return
      const visualH = window.visualViewport ? window.visualViewport.height : window.innerHeight
      const visualW = window.visualViewport ? window.visualViewport.width : window.innerWidth
      document.documentElement.style.setProperty('--app-height', `${visualH}px`)
      document.documentElement.style.setProperty('--app-width', `${visualW}px`)
      document.documentElement.style.setProperty('--vh', `${visualH * 0.01}px`)
    }

    updateViewportMetrics()
    window.addEventListener('resize', updateViewportMetrics)
    window.addEventListener('orientationchange', updateViewportMetrics)

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateViewportMetrics)
      window.visualViewport.addEventListener('scroll', updateViewportMetrics)
    }

    return () => {
      window.removeEventListener('resize', updateViewportMetrics)
      window.removeEventListener('orientationchange', updateViewportMetrics)
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateViewportMetrics)
        window.visualViewport.removeEventListener('scroll', updateViewportMetrics)
      }
    }
  }, [])

  // Helper for Date-based Game ID (YYYYMMDD + Auto-Incrementing Serial: e.g. 20260919001)
  const getTodayDateKey = () => {
    const now = new Date()
    const yyyy = now.getFullYear()
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    const dd = String(now.getDate()).padStart(2, '0')
    return `${yyyy}${mm}${dd}`
  }

  // Dynamic Live Game Serial Number from Socket.IO (e.g. 247, 1001...)
  const [gameSerialNumber, setGameSerialNumber] = useState(() => {
    try {
      if (recovered.gameSerialNumber) return String(recovered.gameSerialNumber)
      const savedSerial = localStorage.getItem('horse_game_serial_no')
      return savedSerial ? String(savedSerial) : '101'
    } catch (_) {
      return '101'
    }
  })
  const lastGameSerialRef = useRef(gameSerialNumber)

  // Dynamic Jackpot Multiplier (1X/N, 2X, 3X, 4X) State
  const [jackpotMultiplier, setJackpotMultiplier] = useState(recovered.jackpotMultiplier || 1)
  const [jackpotDisplay, setJackpotDisplay] = useState(recovered.jackpotDisplay || 'N')
  const [isJackpotSpinning, setIsJackpotSpinning] = useState(false)
  const roundJackpotRef = useRef(recovered.jackpotMultiplier || 1)
  const serverWinnerRef = useRef(null)

  // Continuously persist active game session so refreshing page resumes seamlessly from exact state
  useEffect(() => {
    try {
      const now = Date.now()
      if (phase === 'countdown' && !sessionTimestampsRef.current.countdownStartTime) {
        sessionTimestampsRef.current.countdownStartTime = now
      } else if (phase !== 'countdown') {
        sessionTimestampsRef.current.countdownStartTime = null
      }

      if (phase === 'racing' && !sessionTimestampsRef.current.raceStartTime) {
        const offsetMs = (raceResumeOffsetRef.current || 0) * 1000
        sessionTimestampsRef.current.raceStartTime = now - offsetMs
      } else if (phase !== 'racing') {
        sessionTimestampsRef.current.raceStartTime = null
      }

      if (phase === 'result' && !sessionTimestampsRef.current.resultStartTime) {
        sessionTimestampsRef.current.resultStartTime = now
      } else if (phase !== 'result') {
        sessionTimestampsRef.current.resultStartTime = null
      }

      const sessionData = {
        phase,
        timerSeconds,
        countdown,
        betsByHorse,
        betCoinsByHorse,
        gameSerialNumber,
        jackpotMultiplier,
        jackpotDisplay,
        winner,
        runners,
        savedAt: now,
        countdownStartTime: sessionTimestampsRef.current.countdownStartTime,
        raceStartTime: sessionTimestampsRef.current.raceStartTime,
        resultStartTime: sessionTimestampsRef.current.resultStartTime,
      }
      sessionStorage.setItem('tez_game_active_session', JSON.stringify(sessionData))
      localStorage.setItem('tez_game_active_session', JSON.stringify(sessionData))
    } catch (_) { }
  }, [phase, timerSeconds, countdown, betsByHorse, betCoinsByHorse, gameSerialNumber, jackpotMultiplier, jackpotDisplay, winner, runners])

  const [previousResults, setPreviousResults] = useState(() => {
    try {
      const cached = localStorage.getItem('horse_race_previous_results')
      if (cached) {
        const parsed = JSON.parse(cached)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch (_) { }
    return [
      { number: 4, name: 'ROYAL', multiplier: 1, gameNumber: '101' },
      { number: 5, name: 'TARZAN', multiplier: 2, gameNumber: '102' },
      { number: 3, name: 'ARJUN', multiplier: 1, gameNumber: '103' },
      { number: 7, name: 'LUCKY', multiplier: 2, gameNumber: '104' },
      { number: 3, name: 'ARJUN', multiplier: 1, gameNumber: '105' },
      { number: 8, name: 'BAAZIGAR', multiplier: 3, gameNumber: '106' },
    ]
  })

  // Live fetch previous results from REST API /api/game/previous-results
  useEffect(() => {
    let isCancelled = false
    gameApiService.fetchPreviousResults(20).then((res) => {
      if (isCancelled || !res || !Array.isArray(res) || res.length === 0) return
      setPreviousResults(res)
    }).catch(() => { })

    return () => {
      isCancelled = true
    }
  }, [phase === 'result' ? phase : null])

  const totalBet = Object.values(betsByHorse).reduce((sum, v) => sum + v, 0)
  const [poolByHorse, setPoolByHorse] = useState({})
  const [serverResultScreen, setServerResultScreen] = useState(null)

  // 4. Live Pool & Total Bets on Horses (GET /api/races/current/pool)
  useEffect(() => {
    if (phase !== 'idle' || !gameSerialNumber) return
    let isCancelled = false

    const fetchPool = () => {
      gameApiService.getCurrentPool(gameSerialNumber).then((res) => {
        if (isCancelled || !res) return
        const pObj = res.poolByHorse || res.pool || res.totalBetsByHorse || res.horsesPool || {}
        if (Object.keys(pObj).length > 0) {
          setPoolByHorse(pObj)
        }
      }).catch(() => { })
    }

    fetchPool()
    const poolInterval = setInterval(fetchPool, 4000)
    return () => {
      isCancelled = true
      clearInterval(poolInterval)
    }
  }, [phase, gameSerialNumber])

  // 5. Race Finish Result Screen / Popup Data (GET /api/races/result-screen)
  useEffect(() => {
    if (phase !== 'result' && phase !== 'resultOpen') {
      setServerResultScreen(null)
      return
    }
    let isCancelled = false
    gameApiService.getResultScreen(gameSerialNumber).then((res) => {
      if (isCancelled || !res) return
      setServerResultScreen(res)
      if (res.winner) {
        const winNum = Number(res.winner.serialNumber || res.winner.horseSerial || res.winner.number || 1)
        const matchedRunner = runnersRef.current.find((r) => Number(r.number) === winNum)
        if (matchedRunner) setWinner(matchedRunner)
      }
      if (typeof res.balance === 'number') {
        setBalance(res.balance)
      }
    }).catch(() => { })

    return () => {
      isCancelled = true
    }
  }, [phase, gameSerialNumber])

  // Sync active placed bets from REST API /api/races/my-bets on round change or page load
  useEffect(() => {
    if (!gameSerialNumber || phase !== 'idle' || userModifiedBetsRef.current) return
    let isCancelled = false
    gameApiService.getMyBets(gameSerialNumber).then((res) => {
      if (isCancelled || !res || userModifiedBetsRef.current) return
      if (res && res.betsByHorse && typeof res.betsByHorse === 'object') {
        const active = {}
        for (const [k, v] of Object.entries(res.betsByHorse)) {
          if (Number(v) > 0) active[Number(k)] = Number(v)
        }
        if (Object.keys(active).length > 0) {
          setBetsByHorse(active)
          setBetCoinsByHorse(active)
        } else {
          setBetsByHorse({})
          setBetCoinsByHorse({})
        }
      } else if (res && (res.hasBet === false || res.totalBetAmount === 0)) {
        setBetsByHorse({})
        setBetCoinsByHorse({})
      }
    }).catch(() => { })

    return () => {
      isCancelled = true
    }
  }, [gameSerialNumber])
  const [isBettingLockedOverride, setIsBettingLocked] = useState(false)
  const isBettingLocked = isBettingLockedOverride || (phase === 'idle' && timerSeconds <= 5) || phase !== 'idle'

  const handlePlaceBet = useCallback((horseNumber, chipAmount) => {
    if (isBettingLocked || phase !== 'idle') return
    if (balance < chipAmount) {
      setIsAddCoinsOpen(true)
      return
    }
    userModifiedBetsRef.current = true
    const hNum = Number(horseNumber)
    const amt = Number(chipAmount)

    debitBet({
      betsByHorse: { [hNum]: amt },
      totalAmount: amt,
      roundId: `DERBY_${gameSerialNumber || Date.now()}`,
    })

    // HTTP vs Socket: Use Socket if connected, else fallback to REST API (never fire both)
    if (socketService.isConnected()) {
      socketService.placeBet({
        horseNumber: hNum,
        amount: amt,
        game_serial: gameSerialNumber,
        gameId: gameSerialNumber,
        bets: [{ horse_serial: hNum, amount: amt }],
      })
    } else {
      gameApiService
        .placeBet(gameSerialNumber, [{ horse_serial: hNum, amount: amt }])
        .catch((err) => {
          console.warn('[REST API] /api/races/bet:', err.message)
        })
    }

    setBetsByHorse((prev) => {
      const next = {
        ...prev,
        [hNum]: (prev[hNum] || 0) + amt,
      }
      try {
        const raw = sessionStorage.getItem('tez_game_active_session') || localStorage.getItem('tez_game_active_session')
        if (raw) {
          const s = JSON.parse(raw)
          s.betsByHorse = next
          sessionStorage.setItem('tez_game_active_session', JSON.stringify(s))
          localStorage.setItem('tez_game_active_session', JSON.stringify(s))
        }
      } catch (_) { }
      return next
    })
    setBetCoinsByHorse((prev) => ({
      ...prev,
      [hNum]: amt,
    }))
  }, [balance, isBettingLocked, phase, debitBet, gameSerialNumber])

  const handleRemoveBet = useCallback((horseNumber, chipAmount) => {
    if (isBettingLocked || phase !== 'idle') {
      console.warn('Cannot cancel or reduce bets once betting has closed')
      return
    }
    userModifiedBetsRef.current = true
    const hNum = Number(horseNumber)
    const currentBet = Number(betsByHorse[hNum] ?? betsByHorse[horseNumber] ?? 0)
    if (currentBet <= 0) return
    const removeAmt = Math.min(currentBet, Number(chipAmount) || Number(selectedChip) || 10)

    refundBet({
      horseNumber: hNum,
      amount: removeAmt,
      roundId: `DERBY_${gameSerialNumber || Date.now()}`,
    })

    // HTTP vs Socket: Use Socket if connected, else fallback to REST API (never fire both)
    if (socketService.isConnected()) {
      socketService.minusBet({
        horseSerial: hNum,
        amount: removeAmt,
        game_serial: gameSerialNumber,
      })
    } else {
      gameApiService
        .minusBet({
          horseSerial: hNum,
          amount: removeAmt,
          gameSerial: gameSerialNumber,
        })
        .catch((err) => {
          console.warn('[REST API] /api/bets/minus:', err?.message || err)
        })
    }

    setBetsByHorse((prev) => {
      const cur = Number(prev[hNum] ?? prev[horseNumber] ?? 0)
      const nextVal = cur - removeAmt
      const copy = { ...prev }
      delete copy[hNum]
      delete copy[horseNumber]
      delete copy[String(hNum)]
      if (nextVal > 0) {
        copy[hNum] = nextVal
      }
      try {
        const raw = sessionStorage.getItem('tez_game_active_session') || localStorage.getItem('tez_game_active_session')
        if (raw) {
          const s = JSON.parse(raw)
          s.betsByHorse = copy
          sessionStorage.setItem('tez_game_active_session', JSON.stringify(s))
          localStorage.setItem('tez_game_active_session', JSON.stringify(s))
        }
      } catch (_) { }
      return copy
    })

    setBetCoinsByHorse((prev) => {
      const cur = Number(prev[hNum] ?? prev[horseNumber] ?? 0)
      const nextVal = cur - removeAmt
      const copy = { ...prev }
      delete copy[hNum]
      delete copy[horseNumber]
      delete copy[String(hNum)]
      if (nextVal > 0) {
        copy[hNum] = nextVal
      }
      return copy
    })
  }, [betsByHorse, isBettingLocked, phase, selectedChip, refundBet, gameSerialNumber])

  const handleClearBets = useCallback(() => {
    if (isBettingLocked || phase !== 'idle' || totalBet === 0) {
      console.warn('Cannot cancel or reduce bets once betting has closed')
      return
    }
    userModifiedBetsRef.current = true

    refundBet({
      horseNumber: 'ALL',
      amount: totalBet,
      roundId: `DERBY_${gameSerialNumber || Date.now()}`,
    })

    // HTTP vs Socket: Use Socket if connected, else fallback to REST API (never fire both)
    if (socketService.isConnected()) {
      socketService.minusBet({
        clearAll: true,
        game_serial: gameSerialNumber,
      })
    } else {
      gameApiService
        .minusBet({
          clearAll: true,
          gameSerial: gameSerialNumber,
        })
        .catch((err) => {
          console.warn('[REST API] /api/bets/clear:', err?.message || err)
        })
    }

    setBetsByHorse({})
    setBetCoinsByHorse({})
    try {
      const raw = sessionStorage.getItem('tez_game_active_session') || localStorage.getItem('tez_game_active_session')
      if (raw) {
        const s = JSON.parse(raw)
        s.betsByHorse = {}
        s.betCoinsByHorse = {}
        sessionStorage.setItem('tez_game_active_session', JSON.stringify(s))
        localStorage.setItem('tez_game_active_session', JSON.stringify(s))
      }
    } catch (_) { }
  }, [isBettingLocked, phase, totalBet, refundBet, gameSerialNumber])

  const handleDoubleBets = useCallback(() => {
    if (isBettingLocked || phase !== 'idle' || totalBet === 0) return
    if (balance < totalBet) {
      setIsAddCoinsOpen(true)
      return
    }
    userModifiedBetsRef.current = true
    debitBet({
      betsByHorse,
      totalAmount: totalBet,
      roundId: `DERBY_${gameSerialNumber || Date.now()}`,
    })

    const additionalBets = Object.entries(betsByHorse)
      .filter(([_, amt]) => amt > 0)
      .map(([horseNum, amt]) => ({ horse_serial: Number(horseNum), amount: Number(amt) }))

    if (additionalBets.length > 0) {
      if (socketService.isConnected()) {
        socketService.placeBet({
          game_serial: gameSerialNumber,
          gameId: gameSerialNumber,
          bets: additionalBets,
        })
      } else {
        gameApiService.placeBet(gameSerialNumber, additionalBets).catch(() => { })
      }
    }

    setBetsByHorse((prev) => {
      const doubled = {}
      for (const [k, v] of Object.entries(prev)) {
        doubled[k] = v * 2
      }
      return doubled
    })
  }, [balance, isBettingLocked, phase, totalBet, debitBet, betsByHorse, gameSerialNumber])

  const [isFreeze, setIsFreeze] = useState(false)
  const isFrozenRef = useRef(false)
  const frozenElapsedRef = useRef(0)
  const [showFinishFrame, setShowFinishFrame] = useState(false)
  const [finishAnimDelay, setFinishAnimDelay] = useState(0)
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
  // Stores the exact pinned transform for the winner horse so re-renders keep it at the finish line
  const winnerPinnedTransformRef = useRef(null)
  const lastFrameTimeRef = useRef(null)

  const activeHorse = horses.find((h) => h.number === selectedHorseId) || horses[0]

  // Audio Refs for Sound Effects
  // Audio Refs for Sound Effects
  const neighAudioRef = useRef(null)
  const gallopAudioRef = useRef(null)
  const shutterAudioRef = useRef(null)
  const hasPlayedShutterThisRoundRef = useRef(false)

  // Camera shutter sound playback with guaranteed dual-trigger (MP3 + Procedural)
  const playCameraShutterSound = useCallback(() => {
    unlockAudio()
    const gameVol = getEffectiveVolume('gameVoice')
    playCameraShutter(gameVol)
  }, [getEffectiveVolume])

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
    return Math.max(0, Math.min(1, typeof cat.volume === 'number' ? cat.volume : 0.85))
  }, [audioSettings])

  // Play Horse Neigh with automatic procedural fallback
  const playHorseNeighSound = useCallback((vol) => {
    unlockAudio()
    const effectiveVol = vol !== undefined ? vol : getEffectiveVolume('horseVoice')
    if (effectiveVol <= 0) return

    if (neighAudioRef.current) {
      try {
        neighAudioRef.current.volume = Math.max(0.1, effectiveVol * 0.95)
        neighAudioRef.current.currentTime = 0
        const p = neighAudioRef.current.play()
        if (p) {
          p.catch(() => {
            playProceduralHorseNeigh(effectiveVol)
          })
        }
      } catch (_) {
        playProceduralHorseNeigh(effectiveVol)
      }
    } else {
      playProceduralHorseNeigh(effectiveVol)
    }
  }, [getEffectiveVolume])

  // Start continuous horse galloping sound with procedural fallback
  const startHorseGallopSound = useCallback((vol) => {
    unlockAudio()
    const effectiveVol = vol !== undefined ? vol : getEffectiveVolume('horseVoice')
    if (effectiveVol <= 0) return

    if (gallopAudioRef.current) {
      try {
        gallopAudioRef.current.loop = true
        gallopAudioRef.current.volume = Math.max(0.1, effectiveVol * 0.85)
        gallopAudioRef.current.currentTime = 0
        const p = gallopAudioRef.current.play()
        if (p) {
          p.catch(() => {
            startProceduralGallop(effectiveVol)
          })
        }
      } catch (_) {
        startProceduralGallop(effectiveVol)
      }
    } else {
      startProceduralGallop(effectiveVol)
    }
  }, [getEffectiveVolume])

  // Stop horse galloping sound
  const stopHorseGallopSound = useCallback(() => {
    if (gallopAudioRef.current) {
      try {
        gallopAudioRef.current.pause()
        gallopAudioRef.current.currentTime = 0
      } catch (_) { }
    }
    stopProceduralGallop()
  }, [])

  const handleTestSound = useCallback((type) => {
    unlockAudio()
    if (type === 'game') {
      playCameraShutterSound()
    } else if (type === 'horse') {
      const vol = getEffectiveVolume('horseVoice')
      if (vol <= 0) return
      playHorseNeighSound(vol)
      startHorseGallopSound(vol)
      setTimeout(() => {
        stopHorseGallopSound()
      }, 1800)
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
  }, [getEffectiveVolume, playCameraShutterSound, playHorseNeighSound, startHorseGallopSound, stopHorseGallopSound])

  useEffect(() => {
    try {
      neighAudioRef.current = new Audio('/SOUND/horse_neigh.mp3')
      gallopAudioRef.current = new Audio('/SOUND/horse_gallop.mp3')
      shutterAudioRef.current = new Audio('/SOUND/screenshot.mp3')
      gallopAudioRef.current.loop = true

      const horseVol = getEffectiveVolume('horseVoice')
      const gameVol = getEffectiveVolume('gameVoice')
      gallopAudioRef.current.volume = Math.max(0.1, horseVol * 0.85)
      neighAudioRef.current.volume = Math.max(0.1, horseVol * 0.95)
      if (shutterAudioRef.current) {
        shutterAudioRef.current.volume = Math.max(0.1, gameVol * 1.0)
        shutterAudioRef.current.load()
      }
    } catch (_) { }

    return () => {
      stopHorseGallopSound()
      if (neighAudioRef.current) {
        try { neighAudioRef.current.pause() } catch (_) { }
      }
      if (shutterAudioRef.current) {
        try { shutterAudioRef.current.pause() } catch (_) { }
      }
    }
  }, [getEffectiveVolume, stopHorseGallopSound])

  // Live dynamic volume update on settings slider change
  useEffect(() => {
    const horseVol = getEffectiveVolume('horseVoice')
    const gameVol = getEffectiveVolume('gameVoice')
    if (gallopAudioRef.current) {
      gallopAudioRef.current.volume = Math.max(0.1, horseVol * 0.85)
    }
    if (neighAudioRef.current) {
      neighAudioRef.current.volume = Math.max(0.1, horseVol * 0.95)
    }
    if (shutterAudioRef.current) {
      shutterAudioRef.current.volume = Math.max(0.1, gameVol * 1.0)
    }
  }, [audioSettings, getEffectiveVolume])

  // Sound Playback: Neigh & Gallop during race, Reliable Shutter on Photo Finish / Result
  useEffect(() => {
    if (phase === 'racing') {
      hasPlayedShutterThisRoundRef.current = false
      const horseVol = getEffectiveVolume('horseVoice')
      const gameVol = getEffectiveVolume('gameVoice')
      playRaceStartBell(gameVol)
      playHorseNeighSound(horseVol)
      startHorseGallopSound(horseVol)
    } else if (phase === 'photofinish' || phase === 'result' || phase === 'resultOpen') {
      stopHorseGallopSound()
      if (!hasPlayedShutterThisRoundRef.current) {
        hasPlayedShutterThisRoundRef.current = true
        playCameraShutterSound()
      }
      if (neighAudioRef.current) {
        try {
          neighAudioRef.current.pause()
          neighAudioRef.current.currentTime = 0
        } catch (_) { }
      }
    } else {
      stopHorseGallopSound()
      if (neighAudioRef.current) {
        try {
          neighAudioRef.current.pause()
          neighAudioRef.current.currentTime = 0
        } catch (_) { }
      }
    }
  }, [phase, getEffectiveVolume, playHorseNeighSound, startHorseGallopSound, stopHorseGallopSound, playCameraShutterSound])

  const resetRace = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    hasPlayedShutterThisRoundRef.current = false
    stopHorseGallopSound()
    if (neighAudioRef.current) {
      try {
        neighAudioRef.current.pause()
        neighAudioRef.current.currentTime = 0
      } catch (_) { }
    }
    if (gameCanvasRef.current) {
      const trackEl = gameCanvasRef.current.querySelector('.full-bg-track')
      const finishBgEl = gameCanvasRef.current.querySelector('.single-pass-finish-bg')
      const sensorEl = gameCanvasRef.current.querySelector('.finish-sensor-line')
      if (trackEl) {
        trackEl.style.animationPlayState = ''
        trackEl.style.transform = ''
        trackEl.style.animation = ''
        trackEl.classList.remove('full-bg-track--frozen')
      }
      if (finishBgEl) {
        finishBgEl.style.animationPlayState = ''
        finishBgEl.classList.remove('single-pass-finish-bg--frozen')
      }
      if (sensorEl) {
        sensorEl.style.animationPlayState = ''
        sensorEl.classList.remove('finish-sensor-line--frozen')
      }
    }
    setRunners(makeRunners(null, horsesRef.current))
    setWinner(null)
    setFinishScreenshot(null)
    isFrozenRef.current = false
    setIsFreeze(false)
    setShowFinishFrame(false)
    setIsNearFinish(false)
    finishTriggeredRef.current = false
    screenshotTakenRef.current = false
    resultProcessedRef.current = false
    userModifiedBetsRef.current = false
    setPhase('idle')
  }, [])

  // Prepare horses for countdown phase (3, 2, 1, GO)
  const prepareAndStartCountdown = useCallback((forcedWinnerId = null) => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    if (gameCanvasRef.current) {
      const trackEl = gameCanvasRef.current.querySelector('.full-bg-track')
      const finishBgEl = gameCanvasRef.current.querySelector('.single-pass-finish-bg')
      const sensorEl = gameCanvasRef.current.querySelector('.finish-sensor-line')
      if (trackEl) {
        trackEl.style.animationPlayState = ''
        trackEl.style.transform = ''
        trackEl.style.animation = ''
        trackEl.classList.remove('full-bg-track--frozen')
      }
      if (finishBgEl) {
        finishBgEl.style.animationPlayState = ''
        finishBgEl.classList.remove('single-pass-finish-bg--frozen')
      }
      if (sensorEl) {
        sensorEl.style.animationPlayState = ''
        sensorEl.classList.remove('finish-sensor-line--frozen')
      }
    }

    let winnerId = forcedWinnerId ?? serverWinnerRef.current
    const betEntries = Object.entries(betsByHorse).filter(([_, amt]) => amt > 0)
    if (isCheatEnabled && betEntries.length > 0) {
      // Pick the horse with the highest bet placed by user
      const topBet = betEntries.sort((a, b) => b[1] - a[1])[0]
      winnerId = Number(topBet[0])
    }

    setRunners(makeRunners(winnerId, horsesRef.current))
    setWinner(null)
    setFinishScreenshot(null)
    isFrozenRef.current = false
    setIsFreeze(false)
    resultProcessedRef.current = false
    setCountdown(3)
    setPhase('countdown')
  }, [betsByHorse, isCheatEnabled])

  // Immediately start the active running sprint (horse racing loop)
  const startRaceNow = useCallback((forcedWinnerId = null) => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    if (gameCanvasRef.current) {
      const trackEl = gameCanvasRef.current.querySelector('.full-bg-track')
      const finishBgEl = gameCanvasRef.current.querySelector('.single-pass-finish-bg')
      const sensorEl = gameCanvasRef.current.querySelector('.finish-sensor-line')
      if (trackEl) {
        trackEl.style.animationPlayState = ''
        trackEl.style.transform = ''
        trackEl.style.animation = ''
        trackEl.classList.remove('full-bg-track--frozen')
      }
      if (finishBgEl) {
        finishBgEl.style.animationPlayState = ''
        finishBgEl.classList.remove('single-pass-finish-bg--frozen')
      }
      if (sensorEl) {
        sensorEl.style.animationPlayState = ''
        sensorEl.classList.remove('finish-sensor-line--frozen')
      }
    }

    let winnerId = forcedWinnerId ?? serverWinnerRef.current
    const betEntries = Object.entries(betsByHorse).filter(([_, amt]) => amt > 0)
    if (isCheatEnabled && betEntries.length > 0) {
      const topBet = betEntries.sort((a, b) => b[1] - a[1])[0]
      winnerId = Number(topBet[0])
    }

    setRunners(makeRunners(winnerId, horsesRef.current))
    setWinner(null)
    setFinishScreenshot(null)
    isFrozenRef.current = false
    setIsFreeze(false)
    resultProcessedRef.current = false
    setPhase('racing')
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

  // Connect to Socket.IO and bind all real-time racing events
  useEffect(() => {
    socketService.connect()

    // Helper to normalize server race payload (handles { race: { game_serial, winner_horse_id, jackpot_multiplier, ... } })
    const parseRacePayload = (raw) => {
      if (!raw) return null
      const race = raw.race || raw.data?.race || raw.data || raw
      const serial = race.game_serial ?? race.gameSerial ?? race.serialNumber ?? race.serial_number ?? race.id ?? race.roundId
      const status = (race.status || race.state || '').toUpperCase()
      const winnerHorseId = race.winner_horse_id ?? race.winnerHorse ?? race.winner_number ?? race.winnerNumber ?? race.winnerId
      const jackpotMult = parseFloat(race.jackpot_multiplier || race.jackpotMultiplier || race.multiplier || 1) || 1
      const isJackpot = Boolean(race.is_jackpot)

      // Calculate live timeLeft from timestamps if available
      let computedTimeLeft = typeof race.timeLeft === 'number' ? race.timeLeft : (typeof race.timer === 'number' ? race.timer : null)
      if (computedTimeLeft === null) {
        if (status === 'BETTING_OPEN' && race.betting_close_at) {
          const ms = new Date(race.betting_close_at).getTime() - Date.now()
          computedTimeLeft = ms > 0 ? Math.round(ms / 1000) : 0
        } else if (status === 'BETTING_CLOSED' && race.countdown_at) {
          const ms = new Date(race.countdown_at).getTime() - Date.now()
          computedTimeLeft = ms > 0 ? Math.round(ms / 1000) : 0
        } else if (status === 'COUNTDOWN' && race.started_at) {
          const ms = new Date(race.started_at).getTime() - Date.now()
          computedTimeLeft = ms > 0 ? Math.max(1, Math.round(ms / 1000)) : 1
        }
      }

      return {
        ...race,
        serialNumber: serial !== undefined && serial !== null ? String(serial) : null,
        status,
        winnerHorseId: winnerHorseId !== undefined && winnerHorseId !== null ? Number(winnerHorseId) : null,
        jackpotMultiplier: jackpotMult,
        isJackpot,
        timeLeft: computedTimeLeft,
      }
    }

    // Helper to dynamically update runners whenever admin/server designates or changes the winner horse
    const handleWinnerUpdate = (winnerId) => {
      if (!winnerId) return
      const winNum = Number(winnerId)
      serverWinnerRef.current = winNum

      const currentRunners = (runnersRef.current && runnersRef.current.length > 0) ? runnersRef.current : runners
      const total = currentRunners.length
      const winIdx = currentRunners.findIndex((r) => Number(r.number) === winNum)
      if (winIdx < 0) return

      const otherIndices = Array.from({ length: total }, (_, i) => i).filter((i) => i !== winIdx)
      const shuffledOthers = otherIndices.sort(() => Math.random() - 0.5)
      const rankMap = new Array(total)
      rankMap[winIdx] = 0
      shuffledOthers.forEach((origIdx, rIdx) => {
        rankMap[origIdx] = rIdx + 1
      })

      const updated = currentRunners.map((r, i) => {
        const finalRank = rankMap[i]
        const isWinner = finalRank === 0
        const laneIdx = (Number(r.number) >= 1 && Number(r.number) <= 12) ? (Number(r.number) - 1) : i
        const laneT = total > 1 ? laneIdx / (total - 1) : 0
        const startX = 4.2 + laneT * 7.5
        const depthScale = 1.10 - laneT * 0.25
        const horseVisualWidth = 14.5 * depthScale

        const winnerScreenTarget = 78.2 - horseVisualWidth * 0.35
        const targetEndPosition = (winnerScreenTarget - startX) / 0.74

        return {
          ...r,
          finalRank,
          isWinner,
          targetEndPosition,
          currentRank: isWinner ? 1 : Math.max(2, finalRank + 1),
        }
      })

      runnersRef.current = updated
      setRunners(updated)
      const winHorse = updated.find((r) => Number(r.number) === winNum)
      if (winHorse) {
        setWinner(winHorse)
      }
    }

    // 1. race:current_state / gameState — Connect hote hi complete current race state
    const handleCurrentState = (data) => {
      const parsed = parseRacePayload(data)
      if (!parsed) return

      if (parsed.serialNumber) {
        setGameSerialNumber(parsed.serialNumber)
        try {
          localStorage.setItem('horse_game_serial_no', parsed.serialNumber)
        } catch (_) { }
      }
      if (parsed.timeLeft !== null) setTimerSeconds(parsed.timeLeft)
      if (parsed.winnerHorseId) {
        handleWinnerUpdate(parsed.winnerHorseId)
      }

      const rawStatus = parsed.status
      if (rawStatus === 'BETTING_OPEN' || rawStatus === 'OPEN' || rawStatus === 'IDLE' || parsed.bettingOpen === true) {
        setIsBettingLocked(false)
        if (phase !== 'idle') {
          setBetsByHorse({})
          setBetCoinsByHorse({})
          resetRace()
        }
      } else if (rawStatus === 'BETTING_CLOSED' || rawStatus === 'LOCKED' || rawStatus === 'BETTING_LOCKED' || parsed.bettingOpen === false) {
        const explicitTimeLeft = typeof parsed?.timeLeft === 'number'
          ? parsed.timeLeft
          : (typeof data?.timeLeft === 'number'
            ? data.timeLeft
            : (typeof data?.timer === 'number'
              ? data.timer
              : (typeof data === 'number' ? data : null)))
        if (explicitTimeLeft !== null) {
          setTimerSeconds(Math.max(0, explicitTimeLeft))
        } else {
          setTimerSeconds((prev) => (prev > 5 ? 5 : prev))
        }
        setIsBettingLocked(true)
      } else if (rawStatus === 'COUNTDOWN') {
        setIsBettingLocked(true)
        if (parsed.timeLeft !== null && parsed.timeLeft <= 3) setCountdown(parsed.timeLeft)
        if (phase !== 'countdown' && phase !== 'racing') {
          prepareAndStartCountdown(parsed.winnerHorseId)
        }
      } else if (rawStatus === 'RACING' || rawStatus === 'RUNNING') {
        setIsBettingLocked(true)
        if (phase !== 'racing') {
          startRaceNow(parsed.winnerHorseId)
        }
      } else if (rawStatus === 'RESULT' || rawStatus === 'FINISHED') {
        if (parsed.winnerHorseId) {
          const winHorse = runnersRef.current.find((h) => Number(h.number) === Number(parsed.winnerHorseId))
          if (winHorse) setWinner(winHorse)
        }
        if (parsed.jackpotMultiplier) {
          setJackpotMultiplier(parsed.jackpotMultiplier)
          roundJackpotRef.current = parsed.jackpotMultiplier
        }
        if (phase !== 'result' && phase !== 'resultOpen') setPhase('result')
      }
    }

    // 2. race:created & race:betting_open — Nayi race bani / Betting shuru
    const handleBettingOpen = (data) => {
      const parsed = parseRacePayload(data)
      if (!parsed) return

      if (parsed.serialNumber) {
        setGameSerialNumber(parsed.serialNumber)
        try {
          localStorage.setItem('horse_game_serial_no', parsed.serialNumber)
        } catch (_) { }
      }
      if (parsed.winnerHorseId) {
        handleWinnerUpdate(parsed.winnerHorseId)
      } else {
        serverWinnerRef.current = null
      }
      const tLeft = parsed.timeLeft !== null ? parsed.timeLeft : 40
      setTimerSeconds(tLeft)
      setIsBettingLocked(false)
      if (phase !== 'idle') {
        setBetsByHorse({})
        setBetCoinsByHorse({})
        resetRace()
      }
    }

    // 4. race:countdown_tick — Countdown tick (3, 2, 1)
    const handleCountdownTick = (data) => {
      const parsed = parseRacePayload(data)
      const count = typeof parsed?.timeLeft === 'number' ? parsed.timeLeft : (typeof data?.count === 'number' ? data.count : (typeof data === 'number' ? data : null))
      if (parsed?.winnerHorseId) {
        handleWinnerUpdate(parsed.winnerHorseId)
      }
      if (typeof count === 'number') {
        setCountdown(count)
        if (count > 0) {
          if (phase !== 'countdown' && phase !== 'racing') {
            prepareAndStartCountdown(parsed?.winnerHorseId)
          }
        } else if (count === 0) {
          if (phase !== 'racing') {
            startRaceNow(parsed?.winnerHorseId)
          }
        }
      }
    }

    // 5. race:betting_closed_tick & race:betting_closed — Betting close timer/update
    const handleBettingClosedTick = (data) => {
      const parsed = parseRacePayload(data)
      if (parsed?.serialNumber) {
        setGameSerialNumber(parsed.serialNumber)
        try {
          localStorage.setItem('horse_game_serial_no', parsed.serialNumber)
        } catch (_) { }
      }
      if (parsed?.winnerHorseId) {
        handleWinnerUpdate(parsed.winnerHorseId)
      }
      const explicitTimeLeft = typeof parsed?.timeLeft === 'number'
        ? parsed.timeLeft
        : (typeof data?.timeLeft === 'number'
          ? data.timeLeft
          : (typeof data?.timer === 'number'
            ? data.timer
            : (typeof data === 'number' ? data : null)))
      if (explicitTimeLeft !== null) {
        setTimerSeconds(Math.max(0, explicitTimeLeft))
      } else {
        setTimerSeconds((prev) => (prev > 5 ? 5 : prev))
      }
      setIsBettingLocked(true)
    }

    // 6. race:state_changed — Race phase change
    const handleStateChanged = (data) => {
      const parsed = parseRacePayload(data)
      if (!parsed) return

      if (parsed.winnerHorseId) {
        handleWinnerUpdate(parsed.winnerHorseId)
      }

      const st = parsed.status
      if (st === 'BETTING_OPEN' || st === 'OPEN') {
        handleBettingOpen(data)
      } else if (st === 'BETTING_CLOSED' || st === 'LOCKED' || st === 'BETTING_LOCKED' || st === 'CLOSED') {
        const explicitTimeLeft = typeof parsed?.timeLeft === 'number'
          ? parsed.timeLeft
          : (typeof data?.timeLeft === 'number'
            ? data.timeLeft
            : (typeof data?.timer === 'number'
              ? data.timer
              : (typeof data === 'number' ? data : null)))
        if (explicitTimeLeft !== null) {
          setTimerSeconds(Math.max(0, explicitTimeLeft))
        } else {
          setTimerSeconds((prev) => (prev > 5 ? 5 : prev))
        }
        setIsBettingLocked(true)
      } else if (st === 'COUNTDOWN') {
        setIsBettingLocked(true)
        if (parsed.timeLeft !== null && parsed.timeLeft <= 3) setCountdown(parsed.timeLeft)
        if (phase !== 'countdown' && phase !== 'racing') {
          prepareAndStartCountdown(parsed.winnerHorseId)
        }
      } else if (st === 'RACING' || st === 'RUNNING') {
        setIsBettingLocked(true)
        if (phase !== 'racing') {
          startRaceNow(parsed.winnerHorseId)
        }
      } else if (st === 'RESULT' || st === 'FINISHED') {
        if (parsed.winnerHorseId) {
          const winHorse = runnersRef.current.find((h) => Number(h.number) === Number(parsed.winnerHorseId))
          if (winHorse) setWinner(winHorse)
        }
        if (phase !== 'result' && phase !== 'resultOpen') setPhase('result')
      }
    }

    // 7. race:running_track & race:track_update — Running horses live position (200ms socket stream)
    const handleRunningTrack = (data) => {
      const parsed = parseRacePayload(data)
      const horseList = Array.isArray(data) ? data : (data?.horses || data?.runners || data?.race?.horses || [])
      const winnerFromHorses = horseList.find((h) => h.isWinner || h.is_winner)?.serialNumber ?? data?.leader?.serialNumber
      const forcedWinner = parsed?.winnerHorseId ?? data?.winnerHorseId ?? data?.forcedWinnerId ?? data?.forced_winner_id ?? data?.forcedWinner ?? data?.forced_winner ?? data?.winner_horse_id ?? data?.winner ?? winnerFromHorses
      if (forcedWinner && Number(forcedWinner) !== serverWinnerRef.current) {
        handleWinnerUpdate(forcedWinner)
      }

      if (data?.gameSerial && String(data.gameSerial) !== lastGameSerialRef.current) {
        lastGameSerialRef.current = String(data.gameSerial)
        setGameSerialNumber(String(data.gameSerial))
      }

      const now = performance.now()
      if (Array.isArray(horseList) && horseList.length > 0 && runnersRef.current && runnersRef.current.length > 0) {
        runnersRef.current.forEach((runner) => {
          const serverHorse = horseList.find(
            (h) => Number(h.number || h.horse_id || h.horseId || h.id || h.serialNumber || h.lane) === Number(runner.number)
          )
          if (serverHorse) {
            let targetRatio = null
            if (typeof serverHorse.currentDistanceM === 'number') {
              targetRatio = Math.max(0, Math.min(1, serverHorse.currentDistanceM / 1000))
            } else if (typeof serverHorse.progressPercent === 'number') {
              targetRatio = Math.max(0, Math.min(1, serverHorse.progressPercent / 100))
            } else if (typeof serverHorse.progressRatio === 'number') {
              targetRatio = Math.max(0, Math.min(1, serverHorse.progressRatio))
            } else if (typeof (serverHorse.position ?? serverHorse.pos) === 'number') {
              const p = serverHorse.position ?? serverHorse.pos
              targetRatio = p > 1 ? Math.max(0, Math.min(1, p / 100)) : Math.max(0, Math.min(1, p))
            }

            if (targetRatio !== null) {
              const prevArrival = runner.lastTickArrival || (now - 200)
              const measuredTickDuration = Math.min(350, Math.max(120, now - prevArrival))
              runner.tickDurationMs = measuredTickDuration
              runner.lastTickArrival = now
              runner.fromRatio = runner.visualRatio !== undefined ? runner.visualRatio : targetRatio
              runner.targetRatio = targetRatio
              runner.serverTargetRatio = targetRatio
            }

            const rank = serverHorse.currentRank ?? serverHorse.rank
            const spd = serverHorse.speedKmh ?? serverHorse.speed
            const dist = serverHorse.currentDistanceM ?? (typeof serverHorse.distanceCovered === 'string' ? parseFloat(serverHorse.distanceCovered) : undefined)
            const gap = serverHorse.gapToLeaderM
            const isWin = Boolean(serverHorse.isWinner || serverHorse.is_winner || (serverWinnerRef.current && Number(runner.number) === serverWinnerRef.current))

            if (typeof rank === 'number') runner.currentRank = isWin ? 1 : Math.max(2, rank)
            if (typeof spd === 'number') runner.speedKmh = spd
            if (dist !== undefined) runner.currentDistanceM = dist
            if (gap !== undefined) runner.gapToLeaderM = gap
            if (isWin) runner.isWinner = true
          }
        })
      }
    }

    // 8. race:result — Final winner/result
    const handleResult = (data) => {
      const parsed = parseRacePayload(data)
      if (!parsed) return

      const mult = parsed.jackpotMultiplier || 1
      setJackpotMultiplier(mult)
      roundJackpotRef.current = mult

      if (typeof data?.myPayout === 'number' && data.myPayout > 0) {
        setLastWin(data.myPayout)
      } else if (typeof data?.payout === 'number' && data.payout > 0) {
        setLastWin(data.payout)
      }

      const winnerNum = parsed.winnerHorseId
      if (winnerNum) {
        handleWinnerUpdate(winnerNum)
        const winHorse = runnersRef.current.find((h) => Number(h.number) === Number(winnerNum))
        if (winHorse) {
          setWinner(winHorse)
        }
      }
    }

    // 9. race:winner / admin:winner / admin:set_forced_winner — Direct winner event from admin/engine
    const handleDirectWinner = (data) => {
      console.log('[Socket.IO] Direct forced winner event received:', data)
      const parsed = parseRacePayload(data)
      const wId = parsed?.winnerHorseId ?? data?.winnerHorseId ?? data?.winner_horse_id ?? data?.horseSerial ?? data?.horse_serial ?? data?.horseId ?? data?.horse_id ?? data?.winner ?? data?.forcedWinner ?? data?.forced_winner ?? data?.horse
      if (wId) {
        handleWinnerUpdate(wId)
      }
    }

    // 10. wallet:balance — User ka balance update
    const handleWalletBalance = (data) => {
      if (data === null || data === undefined) return
      let coins = null
      if (typeof data === 'number') coins = data
      else if (typeof data?.coins === 'number') coins = data.coins
      else if (typeof data?.balance === 'number') coins = data.balance
      else if (typeof data?.currentBalance === 'number') coins = data.currentBalance
      else if (typeof data?.newBalance === 'number') coins = data.newBalance
      else if (typeof data?.wallet?.balance === 'number') coins = data.wallet.balance
      else if (typeof data?.wallet?.coins === 'number') coins = data.wallet.coins
      else if (typeof data?.user?.coins === 'number') coins = data.user.coins
      else if (typeof data?.user?.balance === 'number') coins = data.user.balance
      else if (typeof data?.data?.coins === 'number') coins = data.data.coins
      else if (typeof data?.data?.balance === 'number') coins = data.data.balance

      if (coins !== null) {
        const rounded = Number(Number(coins).toFixed(2))
        setBalance(rounded)
        const currentWallet = storageService.getWallet() || {}
        storageService.setWallet({ ...currentWallet, balance: rounded, coins: rounded })
      }
    }

    // 11. user:race_result — Individual user win/loss broadcast
    const handleUserRaceResult = (data) => {
      if (!data) return
      let newBal = null
      if (typeof data?.balance === 'number') newBal = data.balance
      else if (typeof data?.newBalance === 'number') newBal = data.newBalance
      else if (typeof data?.coins === 'number') newBal = data.coins
      else if (typeof data?.currentBalance === 'number') newBal = data.currentBalance

      const isNoBet = data?.betOutcome === 'NO_BET' || data?.hasBet === false || (data?.totalBetAmount === 0 && (!data?.wonAmount || data?.wonAmount === 0))
      const isUserWon = !isNoBet && (data?.betOutcome === 'YOU_WON' || Boolean(data?.isWon) || (typeof data?.wonAmount === 'number' && data.wonAmount > 0))
      const wonAmt = isUserWon ? (typeof data?.wonAmount === 'number' ? data.wonAmount : (typeof data?.payout === 'number' ? data.payout : 0)) : 0

      if (isUserWon && wonAmt > 0) {
        setLastWin(wonAmt)
        try {
          const w = storageService.getWallet() || {}
          storageService.setWallet({ ...w, lastWonAmount: wonAmt })
        } catch (_) { }
      } else {
        setLastWin(0)
        try {
          const w = storageService.getWallet() || {}
          storageService.setWallet({ ...w, lastWonAmount: 0 })
        } catch (_) { }
      }

      setServerResultScreen((prev) => ({
        ...prev,
        ...data,
        isWon: isUserWon,
        wonAmount: wonAmt,
        displayWonAmount: data?.displayWonAmount || (isUserWon ? `+₹${wonAmt.toFixed(2)}` : '₹0.00'),
        currentRoundWonAmount: wonAmt,
        displayCurrentRoundWon: data?.displayCurrentRoundWon || (isUserWon ? `+₹${wonAmt.toFixed(2)}` : '₹0.00'),
        hasBet: !isNoBet && (Boolean(data?.hasBet) || (data?.totalBetAmount && data?.totalBetAmount > 0)),
        betOutcome: data?.betOutcome || (isUserWon ? 'YOU_WON' : (isNoBet ? 'NO_BET' : 'YOU_LOSE')),
        statusMessage: data?.statusMessage || (isUserWon ? 'YOU WON!' : (isNoBet ? 'NO BET PLACED' : 'YOU LOST!')),
        yourBet: data?.yourBet || (isNoBet ? 'NONE' : 'BET_PLACED'),
      }))

      if (newBal !== null) {
        const rounded = Number(Number(newBal).toFixed(2))
        setBalance(rounded)
        const currentWallet = storageService.getWallet() || {}
        const updatedWallet = {
          ...currentWallet,
          balance: rounded,
          coins: rounded,
          totalWon: typeof data?.totalWon === 'number' ? data.totalWon : (currentWallet.totalWon || 0),
        }
        storageService.setWallet(updatedWallet)
        window.dispatchEvent(
          new CustomEvent('derby:coins_updated', {
            detail: { coins: rounded, balance: rounded, wallet: updatedWallet },
          })
        )
      }
    }

    // 13. race:jackpot / admin jackpot triggers
    const handleJackpot = (data) => {
      const parsed = parseRacePayload(data)
      const rawMult = parsed?.jackpotMultiplier ?? data?.multiplier ?? data?.jackpotMultiplier ?? data?.jackpot ?? data?.value ?? data?.mult
      const mult = parseFloat(rawMult) || (typeof rawMult === 'number' ? rawMult : 1)
      if (typeof mult === 'number' && mult >= 1) {
        setJackpotMultiplier(mult)
        setJackpotDisplay(mult === 1 ? 'N' : `${mult}X`)
        roundJackpotRef.current = mult
      }
    }

    // Register all socket listeners
    const unsubs = [
      socketService.on('race:current_state', handleCurrentState),
      socketService.on('race:created', handleBettingOpen),
      socketService.on('race:betting_open', handleBettingOpen),
      socketService.on('race:countdown_tick', handleCountdownTick),
      socketService.on('race:betting_closed_tick', handleBettingClosedTick),
      socketService.on('race:betting_closed', handleBettingClosedTick),
      socketService.on('betting_closed', handleBettingClosedTick),
      socketService.on('race:state_changed', handleStateChanged),
      socketService.on('race:running_track', handleRunningTrack),
      socketService.on('race:track_update', handleRunningTrack),
      socketService.on('race:result', handleResult),
      socketService.on('race:winner', handleDirectWinner),
      socketService.on('admin:set_forced_winner', handleDirectWinner),
      socketService.on('race:set_forced_winner', handleDirectWinner),
      socketService.on('admin:force_winner', handleDirectWinner),
      socketService.on('race:force_winner', handleDirectWinner),
      socketService.on('race:forced_winner', handleDirectWinner),
      socketService.on('force_winner', handleDirectWinner),
      socketService.on('forced_winner', handleDirectWinner),
      socketService.on('admin_force_winner', handleDirectWinner),
      socketService.on('admin:winner', handleDirectWinner),
      socketService.on('wallet:balance', handleWalletBalance),
      socketService.on('user:race_result', handleUserRaceResult),
      socketService.on('race:jackpot', handleJackpot),
      socketService.on('admin:set_jackpot', handleJackpot),
      socketService.on('admin:jackpot', handleJackpot),
      socketService.on('admin:force_jackpot', handleJackpot),
      socketService.on('jackpot:update', handleJackpot),
    ]

    return () => {
      unsubs.forEach((unsub) => unsub && unsub())
    }
  }, [phase, resetRace, startRaceNow, prepareAndStartCountdown, setBalance])

  // 3 -> 2 -> 1 -> GO! Countdown Timer Loop (always steps down 3, 2, 1, GO without stalling)
  useEffect(() => {
    if (phase !== 'countdown') return

    const countInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countInterval)
          // Display "GO!" for 500ms, then transition to racing phase
          setTimeout(() => {
            setPhase('racing')
          }, 500)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(countInterval)
  }, [phase])

  // Master countdown loop during idle betting phase (always counts down 1s at a time continuously)
  useEffect(() => {
    if (phase !== 'idle' || isAssetLoading) return

    const interval = setInterval(() => {
      setTimerSeconds((prev) => Math.max(0, prev - 1))
    }, 1000)

    return () => clearInterval(interval)
  }, [phase, isAssetLoading])

  // Automatically transition to 3-2-1 countdown when timer reaches 0
  useEffect(() => {
    if (phase === 'idle' && timerSeconds === 0 && !isAssetLoading) {
      if (!isAuthenticated || isGuest) {
        setIsAuthModalOpen(true)
        return
      }
      prepareAndStartCountdown()
    }
  }, [phase, timerSeconds, prepareAndStartCountdown, isAssetLoading, isAuthenticated, isGuest, setIsAuthModalOpen])

  useEffect(() => {
    if (!isAssetLoading && phase === 'idle' && (!isAuthenticated || isGuest)) {
      setIsAuthModalOpen(true)
    }
  }, [isAssetLoading, phase, isAuthenticated, isGuest, setIsAuthModalOpen])

  const [raceId, setRaceId] = useState(0)
  const screenshotTakenRef = useRef(false)

  // Core race animation loop
  useEffect(() => {
    if (phase !== 'racing') return
    const initialElapsedMs = raceResumeOffsetRef.current ? raceResumeOffsetRef.current * 1000 : 0
    startTimeRef.current = performance.now() - initialElapsedMs
    raceResumeOffsetRef.current = 0
    screenshotTakenRef.current = false
    finishTriggeredRef.current = initialElapsedMs >= 18.2 * 1000
    raceFinishedRef.current = false
    lockedWinnerRef.current = null
    finishPhaseRef.current = 'running'
    screenshotInProgressRef.current = false
    lastRaceFrameRef.current = null
    winnerPinnedTransformRef.current = null
    isFrozenRef.current = false
    setShowFinishFrame(initialElapsedMs >= 18.2 * 1000)
    if (initialElapsedMs > 18.2 * 1000) {
      setFinishAnimDelay(-((initialElapsedMs / 1000) - 18.2))
    } else {
      setFinishAnimDelay(0)
    }
    setIsNearFinish(false)
    setIsFreeze(false)

    // Target jackpot multiplier: Mostly 'N' (75%), rarely '2X' (15%), '3X' (7%), '4X' (3%)
    if (initialElapsedMs === 0) {
      const roll = Math.random()
      const targetMult = roll < 0.15 ? 2 : (roll < 0.22 ? 3 : (roll < 0.25 ? 4 : 1))
      roundJackpotRef.current = targetMult
      setIsJackpotSpinning(true)
      setJackpotMultiplier(1)
      setJackpotDisplay('N')
    } else {
      setIsJackpotSpinning(initialElapsedMs < 18.2 * 1000)
    }

    const plannedWinner = runners.find((runner) => runner.isWinner)
    if (plannedWinner) {
      const laneT = plannedWinner.stall / 11
      setFinishLineX(4.2 + laneT * 7.5 + FINISH_X * 0.74)
    }
    setRaceId((id) => id + 1)
    lastFrameTimeRef.current = performance.now()

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

      const lastNow = lastFrameTimeRef.current || now
      lastFrameTimeRef.current = now
      const dt = Math.min(0.05, Math.max(0.001, (now - lastNow) / 1000))

      const elapsed = (now - startTimeRef.current) / 1000
      // 100% constant speed progression — continues running forward seamlessly past 10s
      const progress = elapsed / TOTAL_RACE_TIME

      // Smooth casino reel cycling during the sprint (clear & readable), locks near finish line
      if (elapsed < 18.2) {
        const symbols = ['N', '2X', 'N', '3X', 'N', '4X', 'N', '2X']
        const spinIdx = Math.floor((elapsed * 6) % symbols.length)
        setJackpotDisplay(symbols[spinIdx])
      } else if (!raceFinishedRef.current) {
        setIsJackpotSpinning(false)
        const lockedMult = roundJackpotRef.current || 1
        setJackpotMultiplier(lockedMult)
        setJackpotDisplay(lockedMult === 1 ? 'N' : `${lockedMult}X`)
      }

      // Finish line scrolls in at 18.2s
      if (elapsed >= 18.2 && !finishTriggeredRef.current) {
        finishTriggeredRef.current = true
        setFinishAnimDelay(0)
        setShowFinishFrame(true)
      }

      // ─── FINISH LINE DETECTION: DOM rect sensor + current-frame physics horse ──
      // We read the VISIBLE red sensor line's exact pixel position via DOM rect (no lag —
      // we haven't moved any horses yet this frame). Then compare to CURRENT-FRAME physics
      // horse position. This matches the visual red line perfectly with zero lag.
      let sensorLeftPx = null
      if (elapsed >= 18.2 && !screenshotTakenRef.current) {
        const finishSensorEl = gameCanvasRef.current?.querySelector('.finish-sensor-line')
        if (finishSensorEl) {
          const rect = finishSensorEl.getBoundingClientRect()
          // Only use when the sensor is actually on screen (left > 0)
          if (rect.left > 10) sensorLeftPx = rect.left
        }
      }
      // ─────────────────────────────────────────────────────────────────────────

      const curRunners = runnersRef.current
      let firstCrossed = null

      for (let idx = 0; idx < curRunners.length; idx++) {
        const r = curRunners[idx]
        const laneIdx = (Number(r.number) >= 1 && Number(r.number) <= 12) ? (Number(r.number) - 1) : idx
        const laneT = laneIdx / 11
        const startX = 4.2 + laneT * 7.5
        const depthScale = 1.10 - laneT * 0.25

        // Natural stride / gallop oscillation
        const gallopWave = Math.sin(elapsed * r.gallopFreq + r.phaseOffset) * r.gallopAmp

        let curPos
        if (typeof r.targetRatio === 'number' || typeof r.serverTargetRatio === 'number') {
          // 📡 LIVE SOCKET DUAL-BUFFER CONTINUOUS INTERPOLATION:
          // Smooth Hermite cubic curve eliminates all 5Hz stuttering and accordion jerks
          const target = typeof r.targetRatio === 'number' ? r.targetRatio : r.serverTargetRatio
          const from = typeof r.fromRatio === 'number' ? r.fromRatio : target
          const duration = r.tickDurationMs || 200
          const elapsedSinceTick = now - (r.lastTickArrival || now)
          const normT = Math.min(1.0, Math.max(0, elapsedSinceTick / duration))
          // Hermite smoothstep curve: 3t^2 - 2t^3 (Continuous velocity, zero jerk)
          const smoothT = normT * normT * (3 - 2 * normT)

          let interpolatedRatio = from + (target - from) * smoothT

          // Extrapolate gently if tick is slightly delayed
          if (elapsedSinceTick > duration && target < 1.0) {
            const extraElapsed = (elapsedSinceTick - duration) / 1000
            const estimatedVelocity = (target - from) / (duration / 1000)
            interpolatedRatio = Math.min(1.0, target + estimatedVelocity * extraElapsed * 0.5)
          }

          r.visualRatio = interpolatedRatio
          const microStride = Math.sin(elapsed * r.gallopFreq + r.phaseOffset) * 0.08
          curPos = Math.max(0, r.visualRatio * r.targetEndPosition + microStride)
        } else {
          // 🏁 4-PHASE ORGANIC MOTION SIMULATION FLOW (20-SECOND RACE):
          // Phase 1 [0s - 2.0s]: 🚪 Starting Gate Open (Dense Pack, all 12 horses start together)
          // Phase 2 [2.0s - 14.0s]: 🌊 Organic Shuffling (smooth realistic lead changes, winner in top 2-4)
          // Phase 3 [14.0s - 17.5s]: ⚡ Turn & Charge (winner smoothly gathers acceleration into top 2)
          // Phase 4 [17.5s - 20.0s]: 🏁 Finish Line Surge (single winner accelerates across 1000M finish line)
          if (elapsed < 2.0) {
            const packTightness = elapsed / 2.0
            const packWave = Math.sin(progress * Math.PI * r.shiftSpeed + r.shiftOffset) * (r.shiftPower * 0.12 * packTightness)
            curPos = Math.max(0, progress * r.targetEndPosition + gallopWave * 0.35 + packWave)
          } else if (elapsed < 14.0) {
            const midProgress = (elapsed - 2.0) / 12.0
            const midWave = Math.sin(progress * Math.PI * r.shiftSpeed + r.shiftOffset) * (r.shiftPower * 0.6)
            // Soft, natural lead overtake: winner smoothly gathers acceleration
            const winnerLeadBoost = r.isWinner ? (midProgress * 2.2) : -(midProgress * 1.0)
            curPos = Math.max(0, progress * r.targetEndPosition + gallopWave + midWave + winnerLeadBoost)
          } else if (elapsed < 17.5) {
            const turnProgress = (elapsed - 14.0) / 3.5
            const turnWave = Math.sin(progress * Math.PI * r.shiftSpeed + r.shiftOffset) * (r.shiftPower * 0.6) * (1 - turnProgress * 0.5)
            // Winner softly glides into 1st place, all others smoothly settle behind
            const winnerTurnCharge = r.isWinner ? (2.2 + Math.pow(turnProgress, 1.3) * 2.8) : -(1.0 + turnProgress * 1.5)
            curPos = Math.max(0, progress * r.targetEndPosition + gallopWave + turnWave + winnerTurnCharge)
          } else {
            const stretchT = Math.min(1.0, (elapsed - 17.5) / 2.5)
            // Ultra-smooth momentum finish surge for single winner crossing
            const winnerSurge = r.isWinner ? (5.0 + Math.pow(stretchT, 1.6) * 3.0) : -(2.5 + Math.pow(stretchT, 1.3) * 2.0)
            const taperWave = Math.sin(progress * Math.PI * r.shiftSpeed + r.shiftOffset) * (r.shiftPower * 0.6) * (1 - stretchT)
            curPos = Math.max(0, progress * r.targetEndPosition + gallopWave + taperWave + winnerSurge)
          }
        }
        r.position = curPos

        // Crossing check: current-frame physics horse nose vs. current visual sensor position
        const domEl = runnerDomMapRef.current[r.number]
        let isCrossing = false
        let pinnedTranslateVw = null

        if (r.isWinner && sensorLeftPx !== null && !screenshotTakenRef.current && domEl) {
          const canvasRect = gameCanvasRef.current.getBoundingClientRect()
          const vwPx = window.innerWidth / 100
          const depthScaleW = 1.10 - (idx / 11) * 0.25
          const horseWidthPx = domEl.offsetWidth
          // Account for scale(depthScale) with transformOrigin:'center bottom':
          // Scaled element expands/shrinks symmetrically from center-x.
          // Visual nose = unscaled_left + horseWidthPx * (0.5 + 0.38 * depthScale)
          // where 0.5 is the center and 0.38*depthScale is the half-scaled-width toward nose
          const noseOffsetFactor = 0.5 + 0.38 * depthScaleW
          // Horse unscaled left in px from viewport (current frame physics)
          const horseUnscaledLeftPx = canvasRect.left + (startX + curPos * 0.74) * vwPx
          const horseNosePx = horseUnscaledLeftPx + horseWidthPx * noseOffsetFactor
          if (horseNosePx >= sensorLeftPx) {
            isCrossing = true
            // Pin: unscaled left = sensorLeftPx - horseWidthPx * noseOffsetFactor
            const pinnedUnscaledLeftPx = sensorLeftPx - horseWidthPx * noseOffsetFactor
            const pinnedTranslateFromCanvasVw = (pinnedUnscaledLeftPx - canvasRect.left) / vwPx
            // The transform is translate3d(pinnedTranslateFromCanvasVw vw, 0, 0)
            // which equals startX + pinnedCurPos*0.74
            const pinnedCurPos = (pinnedTranslateFromCanvasVw - startX) / 0.74
            pinnedTranslateVw = pinnedCurPos
            // CRITICAL: update r.position to pinned value so React re-render doesn't overwrite
            r.position = pinnedCurPos
          }
        }

        const isDone = Boolean(r.isWinner && (isCrossing || elapsed >= 20.3))

        // DIRECT DOM TRANSFORM: 60/120 FPS butter-smooth movement with zero dropped frames or React overhead
        // When winner's nose exactly reaches the visible red sensor line, pin it there — zero overshoot.
        if (domEl) {
          if (isDone && pinnedTranslateVw !== null) {
            const depthScale2 = 1.10 - (idx / 11) * 0.25
            const pinnedTransform = `translate3d(${(startX + pinnedTranslateVw * 0.74).toFixed(3)}vw, 0, 0) scale(${depthScale2})`
            domEl.style.transform = pinnedTransform
            // Save so React re-renders after freeze restore the exact pinned position
            if (r.isWinner) winnerPinnedTransformRef.current = { number: r.number, transform: pinnedTransform }
          } else {
            domEl.style.transform = `translate3d(${(startX + curPos * 0.74).toFixed(3)}vw, 0, 0) scale(${depthScale})`
          }
        }

        if (isDone && !firstCrossed) {
          firstCrossed = r
          if (!screenshotTakenRef.current && gameCanvasRef.current) {
            screenshotTakenRef.current = true
            frozenElapsedRef.current = elapsed
            isFrozenRef.current = true
            // Cancel RAF immediately — no more frames will run after this tick
            if (rafRef.current) {
              cancelAnimationFrame(rafRef.current)
              rafRef.current = null
            }

            // SYNCHRONOUS DOM FREEZE: Pause track and finish frame animations immediately on DOM
            const targetEl = gameCanvasRef.current
            const trackEl = targetEl?.querySelector('.full-bg-track')
            const finishBgEl = targetEl?.querySelector('.single-pass-finish-bg')
            const sensorEl = targetEl?.querySelector('.finish-sensor-line')
            if (trackEl) {
              trackEl.style.animationPlayState = 'paused'
              trackEl.classList.add('full-bg-track--frozen')
            }
            if (finishBgEl) {
              finishBgEl.style.animationPlayState = 'paused'
              finishBgEl.classList.add('single-pass-finish-bg--frozen')
            }
            if (sensorEl) {
              sensorEl.style.animationPlayState = 'paused'
              sensorEl.classList.add('finish-sensor-line--frozen')
            }

            // SYNCHRONOUS GIF FREEZE — capture current frame of every horse's GIF
            // into its canvas before React re-render so screenshot shows perfectly frozen horses
            Object.entries(gifDomMapRef.current).forEach(([, { img: gifImg, canvas: gifCanvas }]) => {
              try {
                if (!gifImg || !gifCanvas) return
                const w = gifImg.naturalWidth || gifImg.clientWidth || 400
                const h = gifImg.naturalHeight || gifImg.clientHeight || 300
                if (gifCanvas.width !== w) gifCanvas.width = w
                if (gifCanvas.height !== h) gifCanvas.height = h
                const gctx = gifCanvas.getContext('2d', { willReadFrequently: true })
                if (gctx) {
                  gctx.clearRect(0, 0, w, h)
                  gctx.drawImage(gifImg, 0, 0, w, h)
                }
                // Show canvas, hide GIF immediately via direct DOM — no React re-render needed
                gifImg.style.visibility = 'hidden'
                gifCanvas.style.visibility = 'visible'
              } catch (_) { }
            })

            setIsFreeze(true)
            playCameraShutterSound()
            setWinner(r)
            setRunners([...curRunners])

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
                if (cloneFinishBg) {
                  cloneFinishBg.style.opacity = '1'
                  cloneFinishBg.style.visibility = 'visible'
                  cloneFinishBg.style.display = 'block'
                  cloneFinishBg.style.backgroundImage = "url('/top/MAINFINSHLINE.png')"
                  if (finishBgTransform) {
                    cloneFinishBg.style.transform = finishBgTransform
                  } else {
                    cloneFinishBg.style.transform = 'translate3d(0, 0, 0)'
                  }
                  cloneFinishBg.style.animation = 'none'
                }
                const cloneSensor = clonedDoc.querySelector('.finish-sensor-line')
                if (cloneSensor) {
                  cloneSensor.style.display = 'none'
                }

                // Copy all canvas pixel bitmaps from targetEl to clonedDoc
                const origCanvases = targetEl.querySelectorAll('canvas')
                const cloneCanvases = clonedDoc.querySelectorAll('canvas')
                origCanvases.forEach((origCanvas, i) => {
                  const cloneCanvas = cloneCanvases[i]
                  if (cloneCanvas && origCanvas && origCanvas.width > 0 && origCanvas.height > 0) {
                    try {
                      cloneCanvas.width = origCanvas.width
                      cloneCanvas.height = origCanvas.height
                      const ctx = cloneCanvas.getContext('2d')
                      if (ctx) ctx.drawImage(origCanvas, 0, 0)
                    } catch (_) { }
                  }
                })
              },
              ignoreElements: (el) => {
                const tag = el.tagName ? el.tagName.toLowerCase() : ''
                if (
                  tag.includes('vite') ||
                  tag.includes('overlay') ||
                  el.id === 'vite-error-overlay' ||
                  (el.classList && el.classList.contains('vite-error-overlay'))
                ) {
                  return true
                }
                return (
                  el.classList &&
                  (el.classList.contains('lb-panel') ||
                    el.classList.contains('countdown-container') ||
                    el.classList.contains('hc-photofinish-screen') ||
                    el.classList.contains('canvas-result-btn') ||
                    el.classList.contains('game-top-hud-bar'))
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
                // Brief freeze at finish line (500ms) for shutter snapshot, then unfreeze and open result screen
                setTimeout(() => {
                  setIsFreeze(false)
                  Object.entries(gifDomMapRef.current).forEach(([, { img: gifImg, canvas: gifCanvas }]) => {
                    try {
                      if (gifImg) gifImg.style.visibility = 'visible'
                      if (gifCanvas) gifCanvas.style.visibility = 'hidden'
                    } catch (_) { }
                  })
                  setPhase('result')
                }, 500)
              })
              .catch((err) => {
                console.error('html2canvas error, rendering rich fallback snapshot:', err)
                try {
                  const fallbackCanvas = document.createElement('canvas')
                  fallbackCanvas.width = 960
                  fallbackCanvas.height = 540
                  const ctx = fallbackCanvas.getContext('2d', { willReadFrequently: true })
                  if (ctx) {
                    // 1. Draw racetrack background
                    const bgImg = assetCacheService.memoryCache?.get('/top/fullimage.jpg') || assetCacheService.memoryCache?.get('/top/fullimage.png')
                    if (bgImg && (bgImg.complete || bgImg.naturalWidth > 0)) {
                      ctx.drawImage(bgImg, 0, 0, 960, 540)
                    } else {
                      ctx.fillStyle = '#1e3a1e'
                      ctx.fillRect(0, 0, 960, 540)
                    }

                    // 2. Draw finish line overlay
                    const finishImg = assetCacheService.memoryCache?.get('/top/MAINFINSHLINE.png')
                    if (finishImg && (finishImg.complete || finishImg.naturalWidth > 0)) {
                      ctx.drawImage(finishImg, 0, 0, 960, 540)
                    } else {
                      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
                      ctx.fillRect(720, 0, 8, 540)
                    }

                    // 3. Draw winner horse sprite / canvas
                    const winnerGif = gifDomMapRef.current[r.number]?.img || assetCacheService.memoryCache?.get(r.gif)
                    if (winnerGif && (winnerGif.complete || winnerGif.naturalWidth > 0)) {
                      try {
                        ctx.drawImage(winnerGif, 580, 200, 260, 195)
                      } catch (_) { }
                    }

                    // 4. Header overlay banner
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)'
                    ctx.fillRect(20, 20, 480, 60)
                    ctx.fillStyle = '#f6c343'
                    ctx.font = 'bold 22px sans-serif'
                    ctx.fillText(`🏆 PHOTO FINISH — #${r.number} ${r.name}`, 35, 58)

                    setFinishScreenshot(fallbackCanvas.toDataURL('image/jpeg', 0.9))
                  }
                } catch (_) { }
                setTimeout(() => {
                  setIsFreeze(false)
                  Object.entries(gifDomMapRef.current).forEach(([, { img: gifImg, canvas: gifCanvas }]) => {
                    try {
                      if (gifImg) gifImg.style.visibility = 'visible'
                      if (gifCanvas) gifCanvas.style.visibility = 'hidden'
                    } catch (_) { }
                  })
                  setPhase('result')
                }, 500)
              })
          }
        }
      }

      if (phase === 'result' || phase === 'resultOpen') {
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current)
          rafRef.current = null
        }
        return
      }

      // Don't reschedule if the finish was triggered this frame (isFrozenRef already set)
      if (!isFrozenRef.current) {
        rafRef.current = requestAnimationFrame(step)
      }
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

    const mult = roundJackpotRef.current || 1
    const userBetOnWinner = betsByHorse[winner.number] || 0
    const isWon = userBetOnWinner > 0
    // Multi-Horse Betting Rule: ONLY the 1st position (Winner) horse receives 10X payout
    const wonAmount = isWon ? userBetOnWinner * PAYOUT_MULTIPLIER * mult : 0
    const totalBetAmount = Object.values(betsByHorse).reduce((sum, v) => sum + v, 0)
    const netProfit = wonAmount - totalBetAmount
    setLastWin(wonAmount)
    try {
      const w = storageService.getWallet() || {}
      storageService.setWallet({ ...w, lastWonAmount: wonAmount })
    } catch (_) { }

    if (isWon) {
      creditPayout({
        winningHorse: winner,
        winningBetAmount: userBetOnWinner,
        payoutMultiplier: PAYOUT_MULTIPLIER * mult,
        roundId: 'DERBY_' + Date.now(),
        totalBetAmount,
      })
    }

    // Prepend to Previous Game Results sidebar with gameNumber
    setPreviousResults((prev) => {
      const updated = [
        {
          number: winner.number,
          name: winner.name,
          multiplier: mult,
          gameNumber: gameSerialNumber,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        },
        ...prev,
      ].slice(0, 20)
      try {
        localStorage.setItem('horse_race_previous_results', JSON.stringify(updated))
      } catch (_) { }
      return updated
    })

    const activeBetsEntries = Object.entries(betsByHorse)
    const betHorseNames = activeBetsEntries.map(([num]) => {
      const h = horses.find((item) => item.number === Number(num))
      return h ? `#${h.number} ${h.name}` : `#${num}`
    }).join(', ')

    const newRecord = {
      id: `MATCH_${gameSerialNumber}_${Date.now()}`,
      gameNumber: gameSerialNumber,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      winnerNumber: winner.number,
      winnerName: winner.name,
      winnerSpeed: winner.speed || (horses.find((item) => item.number === winner.number)?.speed) || 9.8,
      multiplier: mult,
      hasBet: totalBet > 0,
      myHorseNumber: isWon ? winner.number : (activeBetsEntries.length > 0 ? activeBetsEntries.map(([n]) => n).join(',') : 'None'),
      betAmount: totalBet,
      wonAmount: wonAmount,
      netProfit: netProfit,
      payout: isWon ? wonAmount : -totalBet,
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
        <DerbyAssetLoader onComplete={handleLoaderComplete} />
      )}

      {/* 0. AUTHENTICATION & USER PROFILE MODALS (Suspense Code-Split) */}
      <React.Suspense fallback={null}>
        {isAuthModalOpen && (
          <AuthModal
            isOpen={isAuthModalOpen}
            required={!isAuthenticated || isGuest}
            onClose={() => setIsAuthModalOpen(false)}
          />
        )}
        {isProfileModalOpen && <UserProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />}

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
        {isAddCoinsOpen && (
          <AddCoinsModal
            isOpen={isAddCoinsOpen}
            onClose={() => setIsAddCoinsOpen(false)}
            onAddCoins={(amt) => postWalletTransaction('deposit', amt, 'Demo coin recharge')}
          />
        )}

        {isWalletOpen && (
          <WalletModal
            isOpen={isWalletOpen}
            onClose={() => setIsWalletOpen(false)}
            wallet={wallet}
            onRecharge={(amount) => postWalletTransaction('deposit', amount, 'Demo coin recharge')}
          />
        )}

        {/* 3. GAME BETTING HISTORY MODAL */}
        {isHistoryOpen && (
          <GameHistoryModal
            isOpen={isHistoryOpen}
            onClose={() => setIsHistoryOpen(false)}
            history={raceHistory}
          />
        )}

        {/* 4. AUDIO & SOUND SETTINGS MODAL */}
        {isSettingsOpen && (
          <AudioSettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            audioSettings={audioSettings}
            setAudioSettings={setAudioSettings}
            onTestSound={handleTestSound}
          />
        )}
      </React.Suspense>

      {/* 5. MAIN HORSE DERBY RACETRACK & BETTING GAME */}
      <div className={`stage stage--${phase}`}>
        {/* Top Unified Game HUD Bar (Shown during game/race, hidden on bet area) */}
        {phase !== 'idle' && (
          <div className="game-top-hud-bar">
            {/* Left: Navigation Buttons (Only Sound, Guide, Login during race - History & Wallet hidden inside race) */}
            <div className="hud-left-group">
              <button
                className="game-home-btn"
                onClick={() => {
                  if (user && !isGuest) {
                    setIsProfileModalOpen(true)
                  } else {
                    setIsAuthModalOpen(true)
                  }
                }}
                title={user && !isGuest ? `Account: ${user.name || user.username}` : 'Login or Register'}
                style={{
                  background: user && !isGuest ? 'linear-gradient(180deg, rgba(16, 185, 129, 0.3) 0%, rgba(5, 150, 105, 0.25) 100%)' : undefined,
                  borderColor: user && !isGuest ? '#10b981' : undefined,
                  color: user && !isGuest ? '#34d399' : undefined,
                }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <User size={13} /> {user && !isGuest ? (user.name?.split(' ')[0] || user.username) : 'LOGIN'}
                </span>
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

            {/* Center: Track Live Derby Pill with Game Serial Number */}
            <div className="race-hud-center-pill">
              <span className="race-hud-track-name">🐴 TURF DERBY 1000M</span>
              <span className="race-hud-game-no">GAME #{gameSerialNumber}</span>
              <span className="race-hud-live-tag">
                <span className="lb-live-dot" /> LIVE TRACK
              </span>
            </div>

            {/* Right: Coins Balance Pill (Display only during race, no modal trigger) */}
            <div
              className="canvas-balance-badge"
              title="Your Available Balance"
            >
              <Coins size={15} className="text-amber-400" style={{ marginRight: '2px' }} />
              <span className="bal-tag">BALANCE:</span>
              <span className="bal-pts">{balance}</span>
              {totalBet > 0 && (
                <span className="hud-bet-tag">
                  | BET: {totalBet}
                </span>
              )}
            </div>
          </div>
        )}

        {/* FULL-IMAGE GAME CANVAS (Fills full screen edge-to-edge) */}
        <div className="full-game-canvas" ref={gameCanvasRef}>
          {/* Top-Left Hanging Golden Jackpot Sign */}
          {(phase === 'racing' || phase === 'photofinish' || phase === 'result' || phase === 'resultOpen' || phase === 'countdown') && (
            <HangingJackpotSign
              jackpotDisplay={jackpotDisplay}
              jackpotMultiplier={jackpotMultiplier}
              isJackpotSpinning={isJackpotSpinning}
            />
          )}

          {/* Scrolling background track — 2 seamless panels with 100% mathematical zero-seam loop */}
          <div className={`full-bg-track ${phase === 'racing' || phase === 'photofinish' ? 'full-bg-track--running' : ''} ${isFreeze || phase === 'result' || phase === 'resultOpen' ? 'full-bg-track--frozen' : ''}`}>
            <div className="bg-panel-clone">
              <img src="/top/fullimage.jpg" className="track-bg-img" alt="Racetrack" draggable="false" />
            </div>
            <div className="bg-panel-clone">
              <img src="/top/fullimage.jpg" className="track-bg-img" alt="Racetrack" draggable="false" />
            </div>
          </div>

          {/* Single-Pass Finish Line Frame */}
          {showFinishFrame && (
            <div
              key={`finish-frame-${raceId}`}
              className={`single-pass-finish-bg ${isFreeze || phase === 'result' || phase === 'resultOpen' ? 'single-pass-finish-bg--frozen' : ''}`}
              style={{
                animationDelay: finishAnimDelay ? `${finishAnimDelay.toFixed(2)}s` : undefined,
              }}
            >
              <img src="/top/MAINFINSHLINE.png" className="finish-bg-img" alt="Finish Line" draggable="false" />
            </div>
          )}

          {/* Invisible sensor line: follows the moving finish-frame artwork to detect crossing time */}
          {showFinishFrame && (
            <div
              key={`finish-sensor-${raceId}`}
              className={`finish-sensor-line ${isFreeze || phase === 'result' || phase === 'resultOpen' ? 'finish-sensor-line--frozen' : ''}`}
              style={{
                animationDelay: finishAnimDelay ? `${finishAnimDelay.toFixed(2)}s` : undefined,
              }}
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
              const laneIdx = (Number(r.number) >= 1 && Number(r.number) <= 12) ? (Number(r.number) - 1) : i
              const laneT = laneIdx / 11
              const startX = 4.2 + laneT * 7.5
              const startY = 8.5 + laneT * 69.0
              const depthScale = 1.10 - laneT * 0.25
              const zIndex = 10 + (11 - laneIdx)
              const showHorse = phase === 'racing' || phase === 'photofinish' || phase === 'result' || phase === 'resultOpen'

              return (
                <div
                  key={r.number}
                  ref={(el) => {
                    if (el) runnerDomMapRef.current[r.number] = el
                    else delete runnerDomMapRef.current[r.number]
                  }}
                  data-runner={r.number}
                  className={`race-runner ${!showHorse ? 'race-runner--hidden' : 'race-runner--emerge'} ${isFreeze ? 'race-runner--frozen' : ''}`}
                  style={{
                    bottom: `${startY}%`,
                    zIndex: zIndex,
                    // During freeze: use pinned transform for winner (prevents React re-render overwriting the precise finish-line position)
                    transform: (isFreeze && winnerPinnedTransformRef.current?.number === r.number)
                      ? winnerPinnedTransformRef.current.transform
                      : `translate3d(${(startX + r.position * 0.74).toFixed(3)}vw, 0, 0) scale(${depthScale})`,
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
                      onDomReady={(gifImg, gifCanvas) => {
                        gifDomMapRef.current[r.number] = { img: gifImg, canvas: gifCanvas }
                      }}
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

          {/* TEZ RAFTER CASINO BETTING BOARD (Persistently mounted in DOM for instant 0ms display without reloading) */}
          <TezRafterBettingBoard
            isVisible={phase === 'idle'}
            horses={horses}
            balance={balance}
            totalBet={totalBet}
            lastWin={lastWin}
            betsByHorse={betsByHorse}
            betCoinsByHorse={betCoinsByHorse}
            poolByHorse={poolByHorse}
            selectedChip={selectedChip}
            setSelectedChip={setSelectedChip}
            onPlaceBet={handlePlaceBet}
            onRemoveBet={handleRemoveBet}
            onClearBets={handleClearBets}
            onDoubleBets={handleDoubleBets}
            audioSettings={audioSettings}
            onOpenSettings={() => setIsSettingsOpen(true)}
            timerSeconds={timerSeconds}
            gameSerialNumber={gameSerialNumber}
            isBettingLocked={isBettingLocked}
            previousResults={previousResults}
            onOpenHistory={() => setIsHistoryOpen(true)}
            onOpenTutorial={() => setIsTutorialOpen(true)}
            onOpenAddCoins={() => setIsAddCoinsOpen(true)}
            isCheatEnabled={isCheatEnabled}
            user={user}
            isGuest={isGuest}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onOpenProfile={() => setIsProfileModalOpen(true)}
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
          <LiveLeaderboard
            runners={runners}
            runnersRef={runnersRef}
            betsByHorse={betsByHorse}
            phase={phase}
            gameSerialNumber={gameSerialNumber}
            jackpotDisplay={jackpotDisplay}
            jackpotMultiplier={jackpotMultiplier}
            isJackpotSpinning={isJackpotSpinning}
          />
        )}

        {/* SINGLE HILL CLIMB VICTORY & RESULT SCREEN (PURE TEXT & UNCROPPED POLAROID) */}
        {(phase === 'result' || phase === 'resultOpen') && winner && (() => {
          const mult = roundJackpotRef.current || 1
          const userBetOnWinner = betsByHorse[winner.number] || 0
          const isWon = userBetOnWinner > 0
          const win = isWon ? userBetOnWinner * PAYOUT_MULTIPLIER * mult : 0
          const totalBetAmount = Object.values(betsByHorse).reduce((sum, v) => sum + v, 0)
          const netProfit = win - totalBetAmount
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
                    <div className={`hc-main-headline hc-anim-item hc-anim-1 ${isWon ? 'hc-main-headline--win' : (totalBetAmount > 0 ? 'hc-main-headline--loss' : '')}`}>
                      {isWon ? 'YOU WON!' : (totalBetAmount > 0 ? 'YOU LOST!' : 'RACE FINISHED')}
                      {isWon ? 'YOU WON!' : (totalBetAmount > 0 ? 'YOU LOST!' : 'NO BET PLACED')}
                    </div>

                    <div className="hc-stat-row hc-anim-item hc-anim-2">
                      RECORD: <span style={{ color: '#ffffff' }}>1000m (20.00s)</span>
                    </div>

                    <div className="hc-stat-row hc-stat-coins hc-anim-item hc-anim-3">
                      {isWon ? (
                        <>
                          +₹{win.toFixed(2)} ({win} COINS)
                          {mult > 1 && (
                            <span style={{ fontSize: '12px', color: '#ffd700', marginLeft: '6px', fontWeight: 900 }}>
                              (🔥 {mult}X JACKPOT BOOST!)
                            </span>
                          )}
                        </>
                      ) : (totalBetAmount > 0 ? `-₹${totalBetAmount.toFixed(2)} (${totalBetAmount} PTS)` : '₹0.00 (NO BET)')}
                    </div>

                    {totalBetAmount > 0 ? (
                      <div className="hc-stat-row hc-anim-item hc-anim-3" style={{ fontSize: '12px', color: isWon ? '#34d399' : '#f87171', fontWeight: 800 }}>
                        NET PROFIT: <span>{netProfit >= 0 ? `+₹${netProfit.toFixed(2)}` : `-₹${Math.abs(netProfit).toFixed(2)}`}</span>
                        {isWon && userBetOnWinner > 0 && (
                          <span style={{ color: '#ffd88a', marginLeft: '6px', fontSize: '11px' }}>
                            (10X on #{winner.number}: ₹{userBetOnWinner} × {PAYOUT_MULTIPLIER * mult} = ₹{win})
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="hc-stat-row hc-anim-item hc-anim-3" style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 700 }}>
                        STATUS: <span style={{ color: '#ffd33d' }}>NO BET PLACED THIS ROUND</span>
                      </div>
                    )}

                    <div className="hc-stat-row hc-anim-item hc-anim-4">
                      WINNER: <span style={{ color: '#ffd33d', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        #{winner.number} {winner.name} (<Zap size={11} className="fill-amber-400 text-amber-400" />{winner.speedRating}/10)
                      </span>
                    </div>

                    <div className="hc-stat-row hc-anim-item hc-anim-5">
                      YOUR BETS: <span style={{ color: isWon ? '#00ff88' : (totalBetAmount > 0 ? '#ffaa55' : '#9ca3af') }}>
                        {activeEntries.length > 0
                          ? activeEntries.map(([num, amt]) => `#${num} (₹${amt})`).join(', ')
                          : 'NONE'}
                      </span>
                    </div>

                    <div className="hc-stat-row hc-stat-sub hc-anim-item hc-anim-6">
                      AUTO-NEXT IN 5 SECONDS...
                    </div>

                    <div className="hc-stat-row hc-stat-sub hc-anim-item hc-anim-7">
                      12x RUNNERS • 10x PAYOUT WIN
                    </div>

                    {/* Action Bar */}
                    <div className="hc-action-bar hc-anim-item hc-anim-8" style={{ justifyContent: 'center' }}>
                      <div
                        className="result-balance-badge"
                        onClick={() => setIsAddCoinsOpen(true)}
                        style={{ cursor: 'pointer' }}
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
