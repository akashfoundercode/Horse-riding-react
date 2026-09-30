/**
 * Game API Service
 * Handles game round synchronization, server-side bet validation, and race history syncing.
 */

import { apiClient } from '../api/apiClient.js'
import { ENDPOINTS } from '../api/endpoints.js'
import API_CONFIG from '../config/apiConfig.js'
import { storageService } from './storageService.js'

class GameApiService {
  async getRoundStatus() {
    if (API_CONFIG.USE_MOCK_API) {
      return {
        roundId: `RD_${Date.now().toString().slice(-6)}`,
        status: 'BETTING_OPEN',
        countdownSeconds: 15,
        runnersCount: 12,
      }
    }

    try {
      const response = await apiClient.get(ENDPOINTS.GAME.ROUND_STATUS)
      return response.data
    } catch (_) {
      return {
        roundId: `RD_${Date.now().toString().slice(-6)}`,
        status: 'BETTING_OPEN',
        countdownSeconds: 15,
        runnersCount: 12,
      }
    }
  }

  /**
   * 2. Live Race & 12 Horses List
   * GET /api/races/current
   */
  async getCurrentRace() {
    try {
      const response = await apiClient.get(ENDPOINTS.GAME.CURRENT_RACE)
      const data = response?.data !== undefined ? response.data : response
      return data
    } catch (err) {
      console.warn('[Game API] Notice fetching /api/races/current:', err?.message || err)
      return null
    }
  }

  /**
   * 3. Place Live Bets on a Race
   * POST /api/bets (fallback to /api/races/bet)
   * Body: { bets: [{ horse_serial: 1, amount: 10 }] }
   */
  async placeBet(gameSerial, betsArray = []) {
    try {
      const user = storageService.getUser()
      const userId = user?.id || user?._id || user?.userId || storageService.getUserId() || 1
      const normalizedBets = (Array.isArray(betsArray) ? betsArray : [betsArray]).map((b) => {
        const horseNum = Number(b?.horse_serial ?? b?.horseNumber ?? b?.horseId ?? b?.horse ?? 1)
        const amt = Number(b?.amount ?? b?.betAmount ?? b?.coins ?? 0)
        return {
          horse_serial: horseNum,
          horseSerial: horseNum,
          horseNumber: horseNum,
          horseId: horseNum,
          horse: horseNum,
          amount: amt,
          betAmount: amt,
          coins: amt,
        }
      })
      const primaryBet = normalizedBets[0] || { horse_serial: 1, amount: 0 }
      const cleanBets = normalizedBets.map((b) => ({ horse_serial: b.horse_serial, amount: b.amount }))

      const payload = {
        bets: cleanBets,
        game_serial: String(gameSerial || ''),
        gameSerial: String(gameSerial || ''),
        gameId: String(gameSerial || ''),
        roundId: String(gameSerial || ''),
        userId,
        user_id: userId,
        // Single-bet root fields fallback
        horse_serial: primaryBet.horse_serial,
        horseSerial: primaryBet.horse_serial,
        horseNumber: primaryBet.horse_serial,
        horseId: primaryBet.horse_serial,
        horse: primaryBet.horse_serial,
        amount: primaryBet.amount,
        betAmount: primaryBet.amount,
        coins: primaryBet.amount,
      }

      let response = null
      try {
        response = await apiClient.post(ENDPOINTS.BETS.PLACE, payload)
      } catch (err) {
        try {
          response = await apiClient.post(ENDPOINTS.BETS.PLACE_ALT, payload)
        } catch (innerErr) {
          throw innerErr
        }
      }

      const data = response?.data !== undefined ? response.data : response
      if (data && typeof data === 'object') {
        const walletData = data.wallet || {}
        const userStats = data.userStats || {}
        const newBalance = typeof walletData.currentBalance === 'number'
          ? walletData.currentBalance
          : (typeof data.balance === 'number' ? data.balance : null)
        const totalWon = typeof userStats.totalWon === 'number'
          ? userStats.totalWon
          : (typeof walletData.totalWon === 'number' ? walletData.totalWon : undefined)
        const totalWins = typeof userStats.totalWins === 'number'
          ? userStats.totalWins
          : (typeof walletData.totalWins === 'number' ? walletData.totalWins : undefined)
        const totalBets = typeof userStats.totalBets === 'number'
          ? userStats.totalBets
          : (typeof walletData.totalBets === 'number' ? walletData.totalBets : undefined)
        const totalInvested = typeof userStats.totalInvested === 'number'
          ? userStats.totalInvested
          : (typeof walletData.totalInvested === 'number' ? walletData.totalInvested : undefined)
        const netProfitLoss = typeof userStats.netProfitLoss === 'number'
          ? userStats.netProfitLoss
          : (typeof walletData.netProfitLoss === 'number' ? walletData.netProfitLoss : undefined)

        const currentWallet = storageService.getWallet() || {}
        const updatedWallet = {
          ...currentWallet,
          ...(newBalance !== null && { balance: newBalance, coins: newBalance }),
          ...(totalWon !== undefined && { totalWon, displayTotalWon: userStats.displayTotalWon || walletData.displayTotalWon || `₹${Number(totalWon).toFixed(2)}` }),
          ...(totalWins !== undefined && { totalWins }),
          ...(totalBets !== undefined && { totalBets }),
          ...(totalInvested !== undefined && { totalInvested, displayTotalInvested: userStats.displayTotalInvested || walletData.displayTotalInvested || `₹${Number(totalInvested).toFixed(2)}` }),
          ...(netProfitLoss !== undefined && { netProfitLoss, displayNetProfitLoss: userStats.displayNetProfitLoss || walletData.displayNetProfitLoss || `${netProfitLoss >= 0 ? '+' : ''}₹${Number(netProfitLoss).toFixed(2)}` }),
        }
        storageService.setWallet(updatedWallet)
        window.dispatchEvent(
          new CustomEvent('derby:coins_updated', {
            detail: {
              ...(newBalance !== null && { coins: newBalance, balance: newBalance }),
              totalWon,
              totalWins,
              totalBets,
              totalInvested,
              netProfitLoss,
              wallet: updatedWallet,
            },
          })
        )
      }
      return data
    } catch (err) {
      console.warn('[Bet API] Notice for /api/bets:', err?.message || err)
      return { success: false, error: err?.message || 'Server error', fallback: true }
    }
  }

  /**
   * 3b. Minus / Cancel / Remove Bet (REST API)
   * POST /api/bets/minus (fallbacks: /api/bets/cancel, /api/bets/remove, /api/bets/clear)
   */
  async minusBet({ horseSerial, amount, clearAll = false, gameSerial }) {
    try {
      const user = storageService.getUser()
      const userId = user?.id || user?._id || user?.userId || storageService.getUserId() || 1
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
        ...(gameSerial && { game_serial: String(gameSerial), gameSerial: String(gameSerial), gameId: String(gameSerial) }),
      }

      let response = null
      try {
        response = await apiClient.post(ENDPOINTS.BETS.MINUS, payload)
      } catch (err1) {
        try {
          response = await apiClient.post(ENDPOINTS.BETS.CANCEL, payload)
        } catch (err2) {
          try {
            response = await apiClient.post(ENDPOINTS.BETS.REMOVE, payload)
          } catch (err3) {
            if (clearAll) {
              try {
                response = await apiClient.post(ENDPOINTS.BETS.CLEAR, payload)
              } catch (_) {
                throw err3
              }
            } else {
              throw err3
            }
          }
        }
      }

      const data = response?.data !== undefined ? response.data : response
      if (data && typeof data === 'object') {
        const walletData = data.wallet || {}
        const newBalance = typeof walletData.currentBalance === 'number'
          ? walletData.currentBalance
          : (typeof data.newBalance === 'number' ? data.newBalance : (typeof data.balance === 'number' ? data.balance : null))

        if (newBalance !== null) {
          const currentWallet = storageService.getWallet() || {}
          const updatedWallet = {
            ...currentWallet,
            balance: newBalance,
            coins: newBalance,
          }
          storageService.setWallet(updatedWallet)
          window.dispatchEvent(
            new CustomEvent('derby:coins_updated', {
              detail: { coins: newBalance, balance: newBalance, wallet: updatedWallet },
            })
          )
        }
      }
      return data
    } catch (err) {
      console.warn('[Bet API] Notice for minus/cancel:', err?.message || err)
      return { success: false, error: err?.message || 'Server error', fallback: true }
    }
  }

  /**
   * 4. Har Ghode par Lage Total Bets (Live Chip Counters & Pool)
   * GET /api/races/current/pool
   */
  async getCurrentPool(gameSerial) {
    try {
      const user = storageService.getUser()
      const userId = user?.id || user?._id || user?.userId || storageService.getUserId() || 1
      const params = {}
      if (gameSerial) {
        params.game_serial = String(gameSerial)
        params.gameSerial = String(gameSerial)
        params.gameId = String(gameSerial)
      }
      if (userId) {
        params.userId = userId
        params.user_id = userId
      }

      const response = await apiClient.get(ENDPOINTS.GAME.POOL, params)
      const data = response?.data !== undefined ? response.data : response
      return data
    } catch (err) {
      console.warn('[Game API] Notice fetching /api/races/current/pool:', err?.message || err)
      return null
    }
  }

  /**
   * 5. Race Finish Result Screen / Popup Data
   * GET /api/races/result-screen (with fallback to /api/bets/finish-screen and /api/bets/match-result)
   */
  async getResultScreen(gameSerial) {
    try {
      const user = storageService.getUser()
      const userId = user?.id || user?._id || user?.userId || storageService.getUserId() || 1
      const params = {}
      if (gameSerial) {
        params.game_serial = String(gameSerial)
        params.gameSerial = String(gameSerial)
        params.gameId = String(gameSerial)
      }
      if (userId) {
        params.userId = userId
        params.user_id = userId
      }

      let response = null
      try {
        response = await apiClient.get(ENDPOINTS.GAME.RESULT_SCREEN, params)
      } catch (e1) {
        try {
          response = await apiClient.get('/api/bets/finish-screen', params)
        } catch (e2) {
          try {
            response = await apiClient.get('/api/bets/match-result', params)
          } catch (e3) {
            response = null
          }
        }
      }

      const data = response?.data !== undefined ? response.data : response

      if (data && typeof data === 'object') {
        const rawBets = Array.isArray(data.bets) ? data.bets : (Array.isArray(data.myBets) ? data.myBets : [])
        const rawTotalBet = Number(data.totalBetAmount || data.totalBet || data.currentRoundBetAmount || 0)
        const rawWon = Number(data.wonAmount || data.winAmount || data.currentRoundWonAmount || data.payout || 0)
        const hasBet = Boolean(data.hasBet !== undefined ? data.hasBet : (rawBets.length > 0 || rawTotalBet > 0))
        const isWon = hasBet && Boolean(data.isWon || rawWon > rawTotalBet || data.betOutcome === 'YOU_WON')

        return {
          ...data,
          hasBet,
          betOutcome: hasBet ? (isWon ? 'YOU_WON' : 'YOU_LOSE') : 'NO_BET',
          statusMessage: hasBet ? (isWon ? 'YOU WON!' : 'YOU LOST!') : 'NO BET PLACED',
          yourBet: hasBet ? (data.yourBet || `${rawTotalBet} PTS`) : 'NONE',
          coins: hasBet ? (data.coins || rawBets) : [],
          wonAmount: hasBet && isWon ? rawWon : 0,
          displayWonAmount: hasBet && isWon ? (data.displayWonAmount || `+₹${rawWon.toFixed(2)}`) : '₹0.00',
          currentRoundWonAmount: hasBet && isWon ? rawWon : 0,
          displayCurrentRoundWon: hasBet && isWon ? (data.displayCurrentRoundWon || `+₹${rawWon.toFixed(2)}`) : '₹0.00',
          totalBetAmount: hasBet ? rawTotalBet : 0,
          currentRoundBetAmount: hasBet ? rawTotalBet : 0,
          bets: rawBets,
        }
      }

      return data
    } catch (err) {
      console.warn('[Game API] Notice fetching /api/races/result-screen:', err?.message || err)
      return null
    }
  }

  /**
   * Fetch Active User's Bets for Current Race
   * GET /api/races/my-bets (with fallback to /api/bets/current)
   * Returns: { bets: [...], betsByHorse: {}, totalBetAmount: 0, wonAmount: 0, netProfit: 0 }
   */
  async getMyBets(gameSerial) {
    try {
      const user = storageService.getUser()
      const userId = user?.id || user?._id || user?.userId || storageService.getUserId() || 1
      const params = {}
      if (gameSerial) {
        params.game_serial = String(gameSerial)
        params.gameSerial = String(gameSerial)
        params.gameId = String(gameSerial)
      }
      if (userId) {
        params.userId = userId
        params.user_id = userId
      }

      let response = null
      try {
        response = await apiClient.get(ENDPOINTS.GAME.MY_BETS, params)
      } catch (e1) {
        try {
          response = await apiClient.get('/api/bets/current', params)
        } catch (e2) {
          try {
            response = await apiClient.get('/api/bets/my-bets', params)
          } catch (e3) {
            response = null
          }
        }
      }

      const data = response?.data !== undefined ? response.data : response

      let rawList = []
      if (Array.isArray(data)) {
        rawList = data
      } else if (Array.isArray(data?.bets)) {
        rawList = data.bets
      } else if (Array.isArray(data?.myBets)) {
        rawList = data.myBets
      } else if (Array.isArray(data?.data)) {
        rawList = data.data
      }

      const betsByHorse = {}
      let totalBetAmount = 0
      let totalWonAmount = 0

      const bets = rawList.map((b, idx) => {
        const horseNum = Number(b?.horseSerial ?? b?.horse_serial ?? b?.horseNumber ?? b?.horseId ?? b?.horse ?? 1)
        const amt = Number(b?.amount ?? b?.coins ?? b?.betAmount ?? b?.bet_amount ?? 0)
        const won = Number(b?.payoutAmount ?? b?.payout ?? b?.wonAmount ?? b?.win_amount ?? b?.potentialPayout ?? 0)
        const isWon = Boolean(b?.isWinner || b?.status === 'WON' || won > amt)

        betsByHorse[horseNum] = (betsByHorse[horseNum] || 0) + amt
        totalBetAmount += amt
        if (isWon || b?.status === 'WON') {
          totalWonAmount += won
        }

        return {
          id: b?.id || `BET_${data?.gameSerial || data?.game_serial || 'ROUND'}_${horseNum}_${idx}`,
          horseSerial: horseNum,
          horse_serial: horseNum,
          horseNumber: horseNum,
          horseName: b?.horseName || b?.horse_name || `Horse #${horseNum}`,
          amount: amt,
          displayAmount: b?.displayAmount || `₹${amt.toFixed(2)}`,
          coins: amt,
          odds: b?.odds || 10,
          multiplier: b?.multiplier || '10X',
          potentialPayout: Number(b?.potentialPayout || amt * 10),
          displayPotentialPayout: b?.displayPotentialPayout || `₹${(amt * 10).toFixed(2)}`,
          status: b?.status || (isWon ? 'WON' : 'PENDING'),
          isWinner: isWon,
          payoutAmount: isWon ? won : 0,
          displayPayoutAmount: b?.displayPayoutAmount || (isWon ? `+₹${won.toFixed(2)}` : '₹0.00'),
          winCalculation: b?.winCalculation || `₹${amt} × 10X = ₹${amt * 10}`,
          netProfit: Number(b?.netProfit !== undefined ? b.netProfit : (isWon ? won - amt : -amt)),
          displayNetProfit: b?.displayNetProfit || (isWon ? `+₹${(won - amt).toFixed(2)}` : `-₹${amt.toFixed(2)}`),
          createdAt: b?.createdAt || new Date().toISOString(),
          updatedAt: b?.updatedAt || new Date().toISOString(),
        }
      })

      const summary = data?.summary || {}
      const finalTotalBet = typeof data?.totalBetAmount === 'number'
        ? data.totalBetAmount
        : (typeof summary.totalInvested === 'number' ? summary.totalInvested : totalBetAmount)

      const finalWonAmount = typeof data?.totalWonAmount === 'number'
        ? data.totalWonAmount
        : (typeof summary.totalWon === 'number' ? summary.totalWon : totalWonAmount)

      const finalNetProfit = typeof summary.netProfitLoss === 'number'
        ? summary.netProfitLoss
        : (finalWonAmount - finalTotalBet)

      const hasAnyBets = rawList.length > 0 && finalTotalBet > 0
      const isWon = hasAnyBets && finalWonAmount > 0

      return {
        success: true,
        raceActive: data?.raceActive ?? false,
        raceId: data?.raceId || null,
        gameSerial: data?.gameSerial || data?.game_serial || String(gameSerial || ''),
        game_serial: data?.gameSerial || data?.game_serial || String(gameSerial || ''),
        raceStatus: data?.raceStatus || 'FINISHED',
        hasBet: hasAnyBets,
        betOutcome: hasAnyBets ? (isWon ? 'YOU_WON' : 'YOU_LOSE') : 'NO_BET',
        statusMessage: hasAnyBets ? (isWon ? 'YOU WON!' : 'YOU LOST!') : 'NO BET PLACED',
        yourBet: hasAnyBets ? String(finalTotalBet) : 'NONE',
        coins: hasAnyBets ? (data?.coins || bets) : [],
        wonAmount: hasAnyBets ? finalWonAmount : 0,
        displayWonAmount: hasAnyBets && finalWonAmount > 0 ? (summary.displayTotalWon || `+₹${finalWonAmount.toFixed(2)}`) : '₹0.00',
        currentRoundWonAmount: hasAnyBets ? finalWonAmount : 0,
        displayCurrentRoundWon: hasAnyBets && finalWonAmount > 0 ? (summary.displayTotalWon || `+₹${finalWonAmount.toFixed(2)}`) : '₹0.00',
        totalBetAmount: hasAnyBets ? finalTotalBet : 0,
        currentRoundBetAmount: hasAnyBets ? finalTotalBet : 0,
        totalBet: hasAnyBets ? finalTotalBet : 0,
        totalWonAmount: hasAnyBets ? finalWonAmount : 0,
        totalWon: hasAnyBets ? finalWonAmount : 0,
        totalBetsCount: hasAnyBets ? (data?.totalBetsCount || summary.totalBetsCount || bets.length) : 0,
        netProfit: hasAnyBets ? finalNetProfit : 0,
        bets: hasAnyBets ? bets : [],
        betsByHorse: hasAnyBets ? betsByHorse : {},
        summary: {
          totalInvested: hasAnyBets ? finalTotalBet : 0,
          displayTotalInvested: hasAnyBets ? (summary.displayTotalInvested || `₹${finalTotalBet.toFixed(2)}`) : '₹0.00',
          totalWon: hasAnyBets ? finalWonAmount : 0,
          displayTotalWon: hasAnyBets && finalWonAmount > 0 ? (summary.displayTotalWon || `₹${finalWonAmount.toFixed(2)}`) : '₹0.00',
          netProfitLoss: hasAnyBets ? finalNetProfit : 0,
          displayNetProfitLoss: hasAnyBets ? (summary.displayNetProfitLoss || ((finalNetProfit >= 0 ? '+' : '') + `₹${finalNetProfit.toFixed(2)}`)) : '₹0.00',
          totalBetsCount: hasAnyBets ? (data?.totalBetsCount || summary.totalBetsCount || bets.length) : 0,
          payoutMultiplier: summary.payoutMultiplier || 10,
        },
        raw: data,
      }
    } catch (err) {
      console.warn('[Bet API] Notice fetching /api/races/my-bets:', err?.message || err)
      return null
    }
  }

  /**
   * Fetch Bet History
   * GET /api/bets/history?page=1&limit=20
   */
  async fetchBetHistory(page = 1, limit = 20) {
    try {
      const response = await apiClient.get(ENDPOINTS.GAME.BET_HISTORY, { page, limit })
      const data = response?.data !== undefined ? response.data : response
      return data?.bets || data?.history || data?.data || (Array.isArray(data) ? data : [])
    } catch (err) {
      try {
        const response = await apiClient.get('/api/bets', { page, limit })
        const data = response?.data !== undefined ? response.data : response
        return data?.bets || data?.history || data?.data || (Array.isArray(data) ? data : [])
      } catch (_) {
        console.warn('[Bet API] Error fetching bet history:', err.message)
        return []
      }
    }
  }

  /**
   * Fetch Current Active Race State
   * GET /api/races/current
   */
  async getCurrentRace() {
    try {
      const response = await apiClient.get(ENDPOINTS.GAME.CURRENT_RACE)
      return response?.data !== undefined ? response.data : response
    } catch (err) {
      return null
    }
  }

  async fetchRaceHistory(limit = 20) {
    try {
      const response = await apiClient.get(ENDPOINTS.GAME.BET_HISTORY, { limit })
      const data = response?.data !== undefined ? response.data : response
      return data?.history || data?.bets || (Array.isArray(data) ? data : [])
    } catch (_) {
      try {
        const local = localStorage.getItem('horse_race_game_history')
        return local ? JSON.parse(local) : []
      } catch (_) {
        return []
      }
    }
  }

  /**
   * Fetch Previous Game Results
   * GET /api/game/previous-results
   * Returns: [{ number: 4, name: 'ROYAL', multiplier: 1, gameNumber: '20260922238', time: '14:20:00' }, ...]
   */
  async fetchPreviousResults(limit = 20) {
    try {
      let response = null
      try {
        response = await apiClient.get(ENDPOINTS.GAME.PREVIOUS_RESULTS, { limit })
      } catch (e) {
        try {
          response = await apiClient.get('/api/game/previous-results', { limit })
        } catch (_) {
          try {
            response = await apiClient.get(ENDPOINTS.GAME.MATCHES_RESULTS, { page: 1, limit })
          } catch (__) {
            response = null
          }
        }
      }

      const data = response?.data !== undefined ? response.data : response
      let rawList = []

      if (Array.isArray(data)) {
        rawList = data
      } else if (Array.isArray(data?.results)) {
        rawList = data.results
      } else if (Array.isArray(data?.previousResults)) {
        rawList = data.previousResults
      } else if (Array.isArray(data?.matches)) {
        rawList = data.matches
      } else if (Array.isArray(data?.history)) {
        rawList = data.history
      } else if (Array.isArray(data?.data)) {
        rawList = data.data
      }

      if (rawList.length > 0) {
        const normalized = rawList.map((r, idx) => {
          const horseNum = Number(
            r?.winnerHorseSerial ??
            r?.winner_horse_serial ??
            r?.winnerNumber ??
            r?.winner_horse_id ??
            r?.winner_horse ??
            r?.winner_number ??
            r?.horseSerial ??
            r?.horse_serial ??
            r?.horseId ??
            r?.horse_id ??
            r?.number ??
            1
          )

          const horseName = String(
            r?.winnerHorseName ??
            r?.winner_horse_name ??
            r?.winnerName ??
            r?.winner_name ??
            r?.name ??
            r?.horseName ??
            r?.horse_name ??
            `Horse #${horseNum}`
          ).toUpperCase()

          let mult = 1
          if (typeof r?.jackpotMultiplier === 'number') mult = r.jackpotMultiplier
          else if (typeof r?.jackpot_multiplier === 'number') mult = r.jackpot_multiplier
          else if (typeof r?.multiplier === 'number') mult = r.multiplier
          else if (typeof r?.multiplier === 'string') mult = parseFloat(r.multiplier) || 1
          else if (typeof r?.jackpot === 'string' && r.jackpot !== 'N') mult = parseFloat(r.jackpot) || 1
          else if (typeof r?.odds === 'number') mult = r.odds

          const serial = String(
            r?.gameSerial ??
            r?.game_serial ??
            r?.gameNumber ??
            r?.raceId ??
            r?.race_id ??
            r?.roundId ??
            r?.round_id ??
            r?.id ??
            (100 + idx)
          )

          const timeVal = r?.finishedAt || r?.finished_at || r?.createdAt || r?.created_at
          const timeStr = timeVal
            ? new Date(timeVal).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
            : (r?.time || new Date().toLocaleTimeString())

          return {
            number: horseNum,
            name: horseName,
            multiplier: mult,
            jackpot: r?.jackpot || (mult > 1 ? `${mult}X` : 'N'),
            isJackpot: Boolean(r?.isJackpot || mult > 1),
            gameNumber: serial,
            raceId: r?.raceId || null,
            time: timeStr,
            finishedAt: timeVal || new Date().toISOString(),
            screenshot: r?.screenshot || r?.screenshotUrl || r?.screenshot_url || null,
          }
        })

        try {
          localStorage.setItem('horse_race_previous_results', JSON.stringify(normalized))
        } catch (_) { }

        return normalized
      }

      // Fallback to local storage cached results
      try {
        const cached = localStorage.getItem('horse_race_previous_results')
        if (cached) return JSON.parse(cached)
      } catch (_) { }

      return []
    } catch (err) {
      console.warn('[Game API] Notice fetching /api/game/previous-results:', err?.message || err)
      try {
        const cached = localStorage.getItem('horse_race_previous_results')
        if (cached) return JSON.parse(cached)
      } catch (_) { }
      return []
    }
  }

  /**
   * Fetch Live Game Matches Results (Commented out)
   * GET /api/races/matches-results?page=1&limit=20
   */
  /*
  async fetchMatchesResults(page = 1, limit = 20) {
    try {
      const response = await apiClient.get(ENDPOINTS.GAME.MATCHES_RESULTS, { page, limit })
      const data = response?.data !== undefined ? response.data : response
      return {
        matches: data?.matches || (Array.isArray(data) ? data : []),
        total: data?.total || (data?.matches ? data.matches.length : 0),
        totalPages: data?.totalPages || data?.total_pages || 1,
        page: data?.page || page,
        hasMore: Boolean(data?.hasMore),
        ...data,
      }
    } catch (err) {
      try {
        const response = await apiClient.get('/api/races/matches-results', { page, limit })
        const data = response?.data !== undefined ? response.data : response
        return {
          matches: data?.matches || (Array.isArray(data) ? data : []),
          total: data?.total || 0,
          totalPages: data?.totalPages || 1,
          page: data?.page || page,
          hasMore: Boolean(data?.hasMore),
          ...data,
        }
      } catch (innerErr) {
        console.warn('[Matches Results] Error fetching /api/races/matches-results:', innerErr.message)
        return {
          matches: [],
          total: 0,
          totalPages: 1,
          page: 1,
          hasMore: false,
        }
      }
    }
  }
  */

  /**
   * 15. Admin Force / Schedule Jackpot Trigger
   * POST /api/admin/jackpot/force
   */
  async forceJackpot(payload) {
    try {
      const response = await apiClient.post(ENDPOINTS.ADMIN.JACKPOT_FORCE, payload)
      return response?.data !== undefined ? response.data : response
    } catch (err) {
      console.warn('[Jackpot API] Notice for /api/admin/jackpot/force:', err.message)
      return { success: false, error: err.message }
    }
  }

  /**
   * 16. Admin Cancel Scheduled Jackpot Queue
   * POST /api/admin/jackpot/cancel
   */
  async cancelJackpotQueue() {
    try {
      const response = await apiClient.post(ENDPOINTS.ADMIN.JACKPOT_CANCEL, {})
      return response?.data !== undefined ? response.data : response
    } catch (err) {
      console.warn('[Jackpot API] Notice for /api/admin/jackpot/cancel:', err.message)
      return { success: false, error: err.message }
    }
  }
}

export const gameApiService = new GameApiService()
export default gameApiService

