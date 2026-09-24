/**
 * Socket.IO Real-Time Client Service
 * Manages WebSocket/Socket.IO connections, authentication, and live racing event streaming.
 * Listens to all standard race:* and wallet:* events broadcast by the backend game engine.
 */

import { io } from 'socket.io-client'
import API_CONFIG from '../config/apiConfig.js'
import { storageService } from './storageService.js'

class SocketService {
  constructor() {
    this.socket = null
    this.connected = false
    this.listeners = new Map()
    this.hasServerActivity = false
    this.lastActivityTime = 0

    // Auto-reconnect with new token when player logs in or registers
    if (typeof window !== 'undefined') {
      window.addEventListener('derby:auth_changed', () => {
        this.reconnect()
      })
    }
  }

  /**
   * Connect to Socket.IO server with JWT token and userId auth
   */
  connect() {
    if (this.socket && (this.connected || this.socket.connected)) {
      return this.socket
    }

    const token = storageService.getToken()
    const user = storageService.getUser()
    const userId = storageService.getUserId()

    const serverUrl =
      API_CONFIG.SOCKET_URL ||
      'https://horseracing.siberiancrane.tech'

    try {
      this.socket = io(serverUrl, {
        auth: {
          token: token ? (token.startsWith('Bearer ') ? token : `Bearer ${token}`) : '',
          rawToken: token || '',
          userId: userId,
          user_id: userId,
        },
        query: {
          userId: userId,
          user_id: userId,
          token: token || '',
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 10000,
        autoConnect: true,
      })

      this.setupEventListeners()
    } catch (err) {
      console.warn('[Socket.IO] Connection initialization error:', err.message)
    }

    return this.socket
  }

  /**
   * Setup incoming server event listeners
   */
  setupEventListeners() {
    if (!this.socket) return

    this.socket.on('connect', () => {
      this.connected = true
      this.hasServerActivity = true
      this.lastActivityTime = Date.now()
      console.log(`[Socket.IO] Connected to game server (${this.socket.id}) for user ${storageService.getUserId()}`)
      this.emitInternal('connect', { id: this.socket.id })
      window.dispatchEvent(new CustomEvent('derby:socket_connect', { detail: { id: this.socket.id } }))

      // 1. Auto-request current wallet balance and join user room on connect
      const userId = storageService.getUserId()
      this.socket.emit('wallet:get', { userId })
      this.socket.emit('subscribe:user', { userId })
      this.socket.emit('subscribe:user', userId)
      this.socket.emit('join:user', { userId })
      this.socket.emit('join:user', userId)
      this.socket.emit('join', `user_${userId}`)
      this.socket.emit('join_room', `user_${userId}`)
      this.socket.emit('join', `user:${userId}`)
    })

    this.socket.on('disconnect', (reason) => {
      this.connected = false
      console.log('[Socket.IO] Disconnected from game server:', reason)
      this.emitInternal('disconnect', { reason })
      window.dispatchEvent(new CustomEvent('derby:socket_disconnect', { detail: { reason } }))
    })

    this.socket.on('connect_error', (error) => {
      this.connected = false
      console.warn('[Socket.IO] Connect error (will retry):', error.message)
    })

    // ─────────────────────────────────────────────────────────────
    // 11 CORE SOCKET EVENTS SPECIFIED FOR HORSE RACING
    // ─────────────────────────────────────────────────────────────

    // 1. race:current_state — Connect hote hi complete current race state
    this.socket.on('race:current_state', (data) => {
      this.markActivity()
      this.emitInternal('race:current_state', data)
      window.dispatchEvent(new CustomEvent('derby:race_current_state', { detail: data }))
    })

    // 2. race:created — Nayi race bani
    this.socket.on('race:created', (data) => {
      this.markActivity()
      this.emitInternal('race:created', data)
      window.dispatchEvent(new CustomEvent('derby:race_created', { detail: data }))
    })

    // 3. race:betting_open — Betting shuru
    this.socket.on('race:betting_open', (data) => {
      this.markActivity()
      this.emitInternal('race:betting_open', data)
      window.dispatchEvent(new CustomEvent('derby:race_betting_open', { detail: data }))
    })

    // 4. race:countdown_tick — Race start countdown
    this.socket.on('race:countdown_tick', (data) => {
      this.markActivity()
      this.emitInternal('race:countdown_tick', data)
      window.dispatchEvent(new CustomEvent('derby:race_countdown_tick', { detail: data }))
    })

    // 5. race:betting_closed_tick & race:betting_closed — Betting close timer/update
    const onBettingClosedTick = (data) => {
      this.markActivity()
      this.emitInternal('race:betting_closed_tick', data)
      this.emitInternal('race:betting_closed', data)
      this.emitInternal('betting_closed', data)
      window.dispatchEvent(new CustomEvent('derby:race_betting_closed_tick', { detail: data }))
    }

    this.socket.on('race:betting_closed_tick', onBettingClosedTick)
    this.socket.on('race:betting_closed', onBettingClosedTick)
    this.socket.on('betting_closed', onBettingClosedTick)
    this.socket.on('bettingClosed', onBettingClosedTick)

    // 6. race:state_changed — Race phase change
    this.socket.on('race:state_changed', (data) => {
      this.markActivity()
      this.emitInternal('race:state_changed', data)
      window.dispatchEvent(new CustomEvent('derby:race_state_changed', { detail: data }))
    })

    // 7. race:running_track & race:track_update — Running horses live position (every 200ms)
    this.socket.on('race:running_track', (data) => {
      this.markActivity()
      this.emitInternal('race:running_track', data)
      this.emitInternal('race:tick', data)
      window.dispatchEvent(new CustomEvent('derby:race_running_track', { detail: data }))
    })
    this.socket.on('race:tick', (data) => {
      this.markActivity()
      this.emitInternal('race:running_track', data)
      this.emitInternal('race:tick', data)
      window.dispatchEvent(new CustomEvent('derby:race_running_track', { detail: data }))
    })
    this.socket.on('race:track_update', (data) => {
      this.markActivity()
      this.emitInternal('race:running_track', data)
      this.emitInternal('race:tick', data)
      this.emitInternal('race:track_update', data)
      window.dispatchEvent(new CustomEvent('derby:race_running_track', { detail: data }))
    })

    // Forced winner triggers (support all admin & engine event variations)
    const triggerForcedWinner = (data) => {
      console.log('[Socket.IO] Forced winner event received:', data)
      this.markActivity()
      this.emitInternal('race:winner', data)
      this.emitInternal('admin:set_forced_winner', data)
      this.emitInternal('race:set_forced_winner', data)
      this.emitInternal('admin:force_winner', data)
      this.emitInternal('race:force_winner', data)
      this.emitInternal('race:forced_winner', data)
      this.emitInternal('force_winner', data)
      this.emitInternal('forced_winner', data)
      this.emitInternal('admin_force_winner', data)
      window.dispatchEvent(new CustomEvent('derby:admin_forced_winner', { detail: data }))
    }

    this.socket.on('admin:set_forced_winner', triggerForcedWinner)
    this.socket.on('race:set_forced_winner', triggerForcedWinner)
    this.socket.on('admin:force_winner', triggerForcedWinner)
    this.socket.on('race:force_winner', triggerForcedWinner)
    this.socket.on('race:forced_winner', triggerForcedWinner)
    this.socket.on('force_winner', triggerForcedWinner)
    this.socket.on('forced_winner', triggerForcedWinner)
    this.socket.on('admin_force_winner', triggerForcedWinner)
    this.socket.on('race:winner', triggerForcedWinner)
    this.socket.on('admin:winner', triggerForcedWinner)

    if (typeof this.socket.onAny === 'function') {
      this.socket.onAny((eventName, ...args) => {
        if (typeof eventName === 'string') {
          const lower = eventName.toLowerCase()
          if ((lower.includes('force') || (lower.includes('winner') && !lower.includes('result'))) && args && args[0]) {
            triggerForcedWinner(args[0])
          }
        }
      })
    }

    // 8. race:result — Final winner/result
    this.socket.on('race:result', (data) => {
      this.markActivity()
      this.emitInternal('race:result', data)
      window.dispatchEvent(new CustomEvent('derby:race_result', { detail: data }))
    })

    // 9. bet:live — Live bet ticker
    this.socket.on('bet:live', (data) => {
      this.markActivity()
      this.emitInternal('bet:live', data)
      window.dispatchEvent(new CustomEvent('derby:bet_live', { detail: data }))
    })

    // 10. wallet:balance & coins update — User ka balance update
    const extractCoins = (data) => {
      if (data === null || data === undefined) return null
      if (typeof data === 'number') return data
      if (typeof data?.coins === 'number') return data.coins
      if (typeof data?.balance === 'number') return data.balance
      if (typeof data?.currentBalance === 'number') return data.currentBalance
      if (typeof data?.newBalance === 'number') return data.newBalance
      if (typeof data?.wallet?.balance === 'number') return data.wallet.balance
      if (typeof data?.wallet?.coins === 'number') return data.wallet.coins
      if (typeof data?.user?.coins === 'number') return data.user.coins
      if (typeof data?.user?.balance === 'number') return data.user.balance
      if (typeof data?.data?.coins === 'number') return data.data.coins
      if (typeof data?.data?.balance === 'number') return data.data.balance
      return null
    }

    const onBalanceUpdate = (data) => {
      this.markActivity()
      this.emitInternal('wallet:balance', data)
      window.dispatchEvent(new CustomEvent('derby:wallet_balance', { detail: data }))
      const coins = extractCoins(data)
      const currentWallet = storageService.getWallet() || {}
      const wObj = data?.wallet || data?.data || data || {}
      const updatedWallet = {
        ...currentWallet,
        balance: coins !== null ? coins : currentWallet.balance,
        coins: coins !== null ? coins : currentWallet.coins,
        displayBalance: data?.displayBalance || wObj.displayBalance || (coins !== null ? `₹${coins.toFixed(2)}` : currentWallet.displayBalance),
        totalWon: typeof data?.totalWon === 'number' ? data.totalWon : (typeof wObj.totalWon === 'number' ? wObj.totalWon : currentWallet.totalWon),
        displayTotalWon: data?.displayTotalWon || wObj.displayTotalWon || currentWallet.displayTotalWon,
        totalInvested: typeof data?.totalInvested === 'number' ? data.totalInvested : (typeof wObj.totalInvested === 'number' ? wObj.totalInvested : currentWallet.totalInvested),
        displayTotalInvested: data?.displayTotalInvested || wObj.displayTotalInvested || currentWallet.displayTotalInvested,
        netProfitLoss: typeof data?.netProfitLoss === 'number' ? data.netProfitLoss : (typeof wObj.netProfitLoss === 'number' ? wObj.netProfitLoss : currentWallet.netProfitLoss),
        displayNetProfitLoss: data?.displayNetProfitLoss || wObj.displayNetProfitLoss || currentWallet.displayNetProfitLoss,
        totalBets: typeof data?.totalBets === 'number' ? data.totalBets : (typeof wObj.totalBets === 'number' ? wObj.totalBets : currentWallet.totalBets),
        totalWins: typeof data?.totalWins === 'number' ? data.totalWins : (typeof wObj.totalWins === 'number' ? wObj.totalWins : currentWallet.totalWins),
      }
      storageService.setWallet(updatedWallet)
      if (coins !== null) {
        window.dispatchEvent(new CustomEvent('derby:coins_updated', { detail: { coins, balance: coins, wallet: updatedWallet } }))
      }
    }

    this.socket.on('wallet:balance', onBalanceUpdate)
    this.socket.on('wallet:update', onBalanceUpdate)
    this.socket.on('wallet', onBalanceUpdate)
    this.socket.on('balance:update', onBalanceUpdate)
    this.socket.on('coins:update', onBalanceUpdate)
    this.socket.on('coinsUpdated', onBalanceUpdate)
    this.socket.on('user:balance', onBalanceUpdate)

    // user:race_result — Personalized Win/Loss Result Event
    const onUserRaceResult = (data) => {
      this.markActivity()
      this.emitInternal('user:race_result', data)
      window.dispatchEvent(new CustomEvent('derby:user_race_result', { detail: data }))
      if (data) {
        const currentWallet = storageService.getWallet() || {}
        const coins = typeof data.balance === 'number' ? data.balance : (typeof data.coins === 'number' ? data.coins : null)
        const updatedWallet = {
          ...currentWallet,
          balance: coins !== null ? coins : currentWallet.balance,
          coins: coins !== null ? coins : currentWallet.coins,
          totalWon: typeof data.totalWon === 'number' ? data.totalWon : currentWallet.totalWon,
          displayTotalWon: data.displayTotalWon || currentWallet.displayTotalWon,
        }
        storageService.setWallet(updatedWallet)
        if (coins !== null) {
          window.dispatchEvent(new CustomEvent('derby:coins_updated', { detail: { coins, balance: coins, wallet: updatedWallet } }))
        }
      }
    }

    this.socket.on('user:race_result', onUserRaceResult)
    this.socket.on('race:user_result', onUserRaceResult)

    const uId = storageService.getUserId()
    if (uId) {
      this.socket.on(`user_${uId}:balance`, onBalanceUpdate)
      this.socket.on(`user_${uId}:wallet`, onBalanceUpdate)
      this.socket.on(`user:${uId}:balance`, onBalanceUpdate)
      this.socket.on(`user:${uId}:wallet`, onBalanceUpdate)
      this.socket.on(`wallet:${uId}`, onBalanceUpdate)
      this.socket.on(`balance:${uId}`, onBalanceUpdate)
      this.socket.on(`user_${uId}:race_result`, onUserRaceResult)
      this.socket.on(`user:${uId}:race_result`, onUserRaceResult)
    }

    // 11. ledger:transaction — User ki bet/win transaction update
    this.socket.on('ledger:transaction', (data) => {
      this.markActivity()
      this.emitInternal('ledger:transaction', data)
      window.dispatchEvent(new CustomEvent('derby:ledger_transaction', { detail: data }))
      const coins = extractCoins(data)
      if (coins !== null) {
        window.dispatchEvent(new CustomEvent('derby:coins_updated', { detail: { coins } }))
      }
    })

    // ─────────────────────────────────────────────────────────────
    // OPTIONAL & UTILITY EVENTS
    // ─────────────────────────────────────────────────────────────

    // active_players:update — Online players count
    this.socket.on('active_players:update', (data) => {
      this.emitInternal('active_players:update', data)
      window.dispatchEvent(new CustomEvent('derby:active_players', { detail: data }))
    })

    // race:jackpot / admin jackpot triggers
    const onJackpotUpdate = (data) => {
      this.markActivity()
      this.emitInternal('race:jackpot', data)
      this.emitInternal('admin:set_jackpot', data)
      this.emitInternal('admin:jackpot', data)
      this.emitInternal('admin:force_jackpot', data)
      this.emitInternal('jackpot:update', data)
      window.dispatchEvent(new CustomEvent('derby:race_jackpot', { detail: data }))
    }

    this.socket.on('race:jackpot', onJackpotUpdate)
    this.socket.on('admin:set_jackpot', onJackpotUpdate)
    this.socket.on('admin:jackpot', onJackpotUpdate)
    this.socket.on('admin:force_jackpot', onJackpotUpdate)
    this.socket.on('jackpot:update', onJackpotUpdate)
    this.socket.on('jackpot:force', onJackpotUpdate)
    this.socket.on('jackpot', onJackpotUpdate)

    // Admin Jackpot Queue status (countdown per round completed)
    const onJackpotQueueStatus = (data) => {
      this.markActivity()
      this.emitInternal('admin:jackpot_queue_status', data)
      this.emitInternal('race:jackpot_queue', data)
      this.emitInternal('jackpot:queue_status', data)
      window.dispatchEvent(new CustomEvent('derby:jackpot_queue_status', { detail: data }))
    }

    this.socket.on('admin:jackpot_queue_status', onJackpotQueueStatus)
    this.socket.on('race:jackpot_queue', onJackpotQueueStatus)
    this.socket.on('jackpot:queue_status', onJackpotQueueStatus)
    this.socket.on('jackpot:queue', onJackpotQueueStatus)

    // race:time_extended — Race time extended
    this.socket.on('race:time_extended', (data) => {
      this.emitInternal('race:time_extended', data)
      window.dispatchEvent(new CustomEvent('derby:race_time_extended', { detail: data }))
    })

    // Generic fallbacks for alternative naming compatibility
    this.socket.on('gameState', (data) => this.emitInternal('race:current_state', data))
    this.socket.on('countdown', (data) => this.emitInternal('race:countdown_tick', data))
    this.socket.on('bettingClosed', (data) => this.emitInternal('race:betting_closed_tick', data))
    this.socket.on('raceStart', (data) => this.emitInternal('race:state_changed', { state: 'RACING', ...data }))
    this.socket.on('racePositions', (data) => this.emitInternal('race:running_track', data))
    this.socket.on('raceResult', (data) => this.emitInternal('race:result', data))
    this.socket.on('coinsUpdated', (data) => this.emitInternal('wallet:balance', data))
    this.socket.on('race:winner', (data) => this.emitInternal('race:winner', data))
    this.socket.on('race:winner_set', (data) => this.emitInternal('race:winner', data))
    this.socket.on('admin:winner', (data) => this.emitInternal('race:winner', data))
    this.socket.on('admin:set_winner', (data) => this.emitInternal('race:winner', data))

    this.socket.on('error', (data) => {
      console.warn('[Socket.IO] Server error:', data)
      this.emitInternal('error', data)
    })
  }

  markActivity() {
    this.hasServerActivity = true
    this.lastActivityTime = Date.now()
  }

  /**
   * Reconnect socket (e.g. after login/register with new JWT token)
   */
  reconnect() {
    if (this.socket) {
      try {
        this.socket.disconnect()
      } catch (_) { }
      this.socket = null
      this.connected = false
    }
    return this.connect()
  }

  /**
   * Client -> Server: joinGame
   */
  joinGame(gameId) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('joinGame', { gameId: gameId || 'current' })
    }
  }

  /**
   * Client -> Server: placeBet
   */
  placeBet({ horseNumber, amount, gameId, game_serial, bets, callback }) {
    if (this.socket && this.socket.connected) {
      const serial = game_serial || gameId
      const betsList = Array.isArray(bets)
        ? bets
        : [{ horse_serial: Number(horseNumber), amount: Number(amount), horseNumber: Number(horseNumber) }]
      const payload = {
        userId: storageService.getUserId(),
        user_id: storageService.getUserId(),
        game_serial: serial,
        gameSerial: serial,
        gameId: serial,
        horseNumber: Number(horseNumber),
        horseSerial: Number(horseNumber),
        amount: Number(amount),
        bets: betsList,
      }
      this.socket.emit('bet:place', payload, callback)
    }
  }

  /**
   * Client -> Server: minusBet / cancelBet / clearBets
   */
  minusBet({ horseSerial, amount, clearAll = false, game_serial, gameId, callback }) {
    if (this.socket && this.socket.connected) {
      const user = storageService.getUser()
      const userId = user?.id || user?._id || user?.userId || storageService.getUserId() || 1
      const serial = game_serial || gameId

      const payload = {
        userId,
        user_id: userId,
        ...(clearAll
          ? { clearAll: true, clear_all: true }
          : {
            horseSerial: Number(horseSerial),
            horse_serial: Number(horseSerial),
            ...(amount !== undefined && { amount: Number(amount), coins: Number(amount) }),
          }),
        ...(serial && { game_serial: String(serial), gameSerial: String(serial), gameId: String(serial) }),
      }

      const ackHandler = (response) => {
        if (response && typeof response === 'object') {
          const newBal = typeof response?.newBalance === 'number'
            ? response.newBalance
            : (typeof response?.balance === 'number' ? response.balance : (typeof response?.wallet?.balance === 'number' ? response.wallet.balance : null))
          if (newBal !== null) {
            const currentWallet = storageService.getWallet() || {}
            const updatedWallet = { ...currentWallet, balance: newBal, coins: newBal }
            storageService.setWallet(updatedWallet)
            window.dispatchEvent(
              new CustomEvent('derby:coins_updated', {
                detail: { coins: newBal, balance: newBal, wallet: updatedWallet },
              })
            )
          }
        }
        if (typeof callback === 'function') callback(response)
      }

      if (clearAll) {
        this.socket.emit('bet:clear', payload, ackHandler)
      } else {
        this.socket.emit('bet:minus', payload, ackHandler)
      }
    }
  }

  /**
   * Client -> Server: fetchWallet (Manually fetch wallet balance)
   */
  fetchWallet() {
    if (this.socket && this.socket.connected) {
      const user = storageService.getUser()
      const userId = user?.id || user?._id || user?.userId || 1
      this.socket.emit('wallet:get')
      this.socket.emit('subscribe:user', { userId })
    }
  }

  /**
   * Register an event listener
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event).add(callback)
    return () => this.off(event, callback)
  }

  /**
   * Remove an event listener
   */
  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback)
    }
  }

  /**
   * Internal emitter for registered callbacks
   */
  emitInternal(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach((cb) => {
        try {
          cb(data)
        } catch (err) {
          console.error(`[Socket.IO] Error in handler for ${event}:`, err)
        }
      })
    }
  }

  isConnected() {
    return Boolean(this.socket && (this.connected || this.socket.connected))
  }

  hasActiveServerStream() {
    return this.isConnected() && this.hasServerActivity && (Date.now() - this.lastActivityTime < 6000)
  }
}

export const socketService = new SocketService()
export default socketService
