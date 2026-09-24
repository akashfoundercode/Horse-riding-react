/**
 * Wallet & Transaction Service
 * Manages player coin balance, bet deductions, 10X payouts, deposits, and transaction ledgers.
 */

import { apiClient } from '../api/apiClient.js'
import { ENDPOINTS } from '../api/endpoints.js'
import { mockBackendAdapter } from '../api/mockAdapter.js'
import API_CONFIG from '../config/apiConfig.js'
import { storageService } from './storageService.js'

/**
 * Deduplicates transaction lists by unique ID and content fingerprint
 */
export function deduplicateTransactions(list) {
  if (!Array.isArray(list)) return []
  const seenIds = new Set()
  const seenFingerprints = new Set()
  const result = []

  for (const item of list) {
    if (!item) continue

    const amt = Number(item.amount || item.coins || 0)
    const type = (item.type || item.category || '').toLowerCase()
    const desc = (item.description || item.note || '').trim()

    // 1. Check unique ID if available
    const rawId = item.id || item._id || item.transactionId || item.transaction_id || item.tx_id || item.referenceId
    if (rawId) {
      const idKey = String(rawId)
      if (seenIds.has(idKey)) continue
      seenIds.add(idKey)
    }

    // 2. Check fingerprint (type + amount + timestamp rounded to second + description)
    const timeKey = item.createdAt || item.created_at || item.timestamp || item.date || ''
    const timeSec = timeKey ? Math.floor(new Date(timeKey).getTime() / 1000) : ''

    const fingerprint = `${type}_${amt.toFixed(2)}_${timeSec}_${desc}`
    if (timeSec && seenFingerprints.has(fingerprint)) {
      continue
    }
    if (timeSec) {
      seenFingerprints.add(fingerprint)
    }

    result.push(item)
  }

  return result
}

class WalletService {
  /**
   * Initial Load: Fetch live user balance via REST API
   * GET /api/wallet/me (fallback to /api/wallets or /api/user/coins)
   */
  async getBalance() {
    if (API_CONFIG.USE_MOCK_API) {
      const response = await mockBackendAdapter.getBalance()
      return response.data
    }

    try {
      const userId = storageService.getUserId()
      const queryParams = userId !== undefined && userId !== null ? { userId, user_id: userId } : {}
      let response = null
      try {
        response = await apiClient.get(ENDPOINTS.WALLET.ME, queryParams)
      } catch (e) {
        try {
          response = await apiClient.get(ENDPOINTS.AUTH.ME)
        } catch (_) {
          try {
            response = await apiClient.get(ENDPOINTS.WALLET.BALANCE, queryParams)
          } catch (__) {
            response = null
          }
        }
      }

      const data = response?.data !== undefined ? response.data : (response || {})
      const wObj = data?.wallet || data?.data?.wallet || data?.data || data || {}
      let coins = null

      if (typeof data?.balance === 'number') coins = data.balance
      else if (typeof data?.coins === 'number') coins = data.coins
      else if (typeof wObj?.balance === 'number') coins = wObj.balance
      else if (typeof wObj?.coins === 'number') coins = wObj.coins
      else if (typeof wObj?.rawBalance === 'number') coins = wObj.rawBalance
      else if (typeof wObj?.currentBalance === 'number') coins = wObj.currentBalance
      else if (typeof data?.user?.balance === 'number') coins = data.user.balance
      else if (typeof data?.user?.coins === 'number') coins = data.user.coins
      else if (typeof wObj === 'number') coins = wObj

      const finalCoins = coins !== null ? coins : (storageService.getWallet()?.balance || 0)
      const currentWallet = storageService.getWallet() || {}
      const updatedWallet = {
        ...currentWallet,
        walletId: wObj.walletId || currentWallet.walletId || 1,
        userId: wObj.userId || userId || currentWallet.userId || 1,
        balance: finalCoins,
        coins: finalCoins,
        displayBalance: wObj.displayBalance || data.displayBalance || `₹${finalCoins.toFixed(2)}`,
        currency: wObj.currency || data.currency || currentWallet.currency || 'INR',
        totalWon: typeof wObj.totalWon === 'number' ? wObj.totalWon : (typeof data.totalWon === 'number' ? data.totalWon : (currentWallet.totalWon || 0)),
        displayTotalWon: wObj.displayTotalWon || data.displayTotalWon || currentWallet.displayTotalWon || `₹${(currentWallet.totalWon || 0).toFixed(2)}`,
        totalInvested: typeof wObj.totalInvested === 'number' ? wObj.totalInvested : (typeof data.totalInvested === 'number' ? data.totalInvested : (currentWallet.totalInvested || 0)),
        displayTotalInvested: wObj.displayTotalInvested || data.displayTotalInvested || currentWallet.displayTotalInvested || `₹${(currentWallet.totalInvested || 0).toFixed(2)}`,
        netProfitLoss: typeof wObj.netProfitLoss === 'number' ? wObj.netProfitLoss : (typeof data.netProfitLoss === 'number' ? data.netProfitLoss : (currentWallet.netProfitLoss || 0)),
        displayNetProfitLoss: wObj.displayNetProfitLoss || data.displayNetProfitLoss || currentWallet.displayNetProfitLoss || `₹${(currentWallet.netProfitLoss || 0).toFixed(2)}`,
        totalBets: typeof wObj.totalBets === 'number' ? wObj.totalBets : (typeof data.totalBets === 'number' ? data.totalBets : (currentWallet.totalBets || 0)),
        totalWins: typeof wObj.totalWins === 'number' ? wObj.totalWins : (typeof data.totalWins === 'number' ? data.totalWins : (currentWallet.totalWins || 0)),
        status: wObj.status || data.status || 'active',
        transactions: deduplicateTransactions(data.transactions || wObj.transactions || currentWallet.transactions || []),
      }

      storageService.setWallet(updatedWallet)
      window.dispatchEvent(new CustomEvent('derby:coins_updated', { detail: { coins: finalCoins, balance: finalCoins, wallet: updatedWallet } }))

      return updatedWallet
    } catch (err) {
      const saved = storageService.getWallet()
      const fallbackCoins = (saved && typeof saved.balance === 'number') ? saved.balance : 0
      return {
        coins: fallbackCoins,
        balance: fallbackCoins,
        displayBalance: `₹${fallbackCoins.toFixed(2)}`,
        currency: 'INR',
        totalWon: saved?.totalWon || 0,
        displayTotalWon: saved?.displayTotalWon || '₹0.00',
        totalInvested: saved?.totalInvested || 0,
        displayTotalInvested: saved?.displayTotalInvested || '₹0.00',
        netProfitLoss: saved?.netProfitLoss || 0,
        displayNetProfitLoss: saved?.displayNetProfitLoss || '₹0.00',
        totalBets: saved?.totalBets || 0,
        totalWins: saved?.totalWins || 0,
      }
    }
  }

  async deposit(amount, method = 'Instant UPI / Card') {
    if (API_CONFIG.USE_MOCK_API) {
      const response = await mockBackendAdapter.deposit({ amount, method })
      return response.data
    }

    try {
      const response = await apiClient.post(ENDPOINTS.WALLET.DEPOSIT, { amount, method })
      return response.data
    } catch (err) {
      const response = await mockBackendAdapter.deposit({ amount, method })
      return response.data
    }
  }

  async debitBet({ betsByHorse, totalAmount, roundId }) {
    const currentWallet = storageService.getWallet() || {}
    const curBal = typeof currentWallet.balance === 'number' ? currentWallet.balance : 0
    const newBalance = Math.max(0, curBal - totalAmount)
    const prevInvested = typeof currentWallet.totalInvested === 'number' ? currentWallet.totalInvested : 0
    const newInvested = prevInvested + totalAmount
    const prevTotalBets = typeof currentWallet.totalBets === 'number' ? currentWallet.totalBets : 0

    const transaction = {
      id: `tx_bet_${Date.now()}`,
      transactionId: Date.now(),
      type: 'debit',
      category: 'bet',
      amount: totalAmount,
      balanceBefore: curBal,
      balanceAfter: newBalance,
      description: `Placed ₹${totalAmount.toFixed(2)} bet on Race ${roundId || ''}`,
      note: `Bet placed on Race ${roundId || ''}`,
      status: 'completed',
      timestamp: Date.now(),
      createdAt: new Date().toISOString(),
    }
    const updated = {
      ...currentWallet,
      balance: newBalance,
      coins: newBalance,
      displayBalance: `₹${newBalance.toFixed(2)}`,
      totalInvested: newInvested,
      displayTotalInvested: `₹${newInvested.toFixed(2)}`,
      totalBets: prevTotalBets + Object.values(betsByHorse || {}).filter((v) => v > 0).length,
      transactions: deduplicateTransactions([transaction, ...(currentWallet.transactions || [])]),
    }
    storageService.setWallet(updated)

    window.dispatchEvent(new CustomEvent('derby:coins_updated', { detail: { coins: newBalance, balance: newBalance, wallet: updated } }))
    window.dispatchEvent(new CustomEvent('derby:ledger_transaction', { detail: transaction }))

    return { balance: newBalance, transaction, ...updated }
  }

  async refundBet({ horseNumber, amount, roundId }) {
    const refundAmount = Number(amount) || 0
    if (refundAmount <= 0) return { success: false }

    const currentWallet = storageService.getWallet() || {}
    const curBal = typeof currentWallet.balance === 'number' ? currentWallet.balance : 0
    const newBalance = Number((curBal + refundAmount).toFixed(2))
    const prevInvested = typeof currentWallet.totalInvested === 'number' ? currentWallet.totalInvested : 0
    const newInvested = Math.max(0, prevInvested - refundAmount)

    const transaction = {
      id: `tx_refund_${Date.now()}`,
      transactionId: Date.now(),
      type: 'credit',
      category: 'refund',
      amount: refundAmount,
      balanceBefore: curBal,
      balanceAfter: newBalance,
      description: horseNumber === 'ALL' ? `Cancelled all open bets (+₹${refundAmount.toFixed(2)})` : `Removed ₹${refundAmount.toFixed(2)} bet on Horse #${horseNumber}`,
      note: `Bet refunded on Race ${roundId || ''}`,
      status: 'completed',
      timestamp: Date.now(),
      createdAt: new Date().toISOString(),
    }
    const updated = {
      ...currentWallet,
      balance: newBalance,
      coins: newBalance,
      displayBalance: `₹${newBalance.toFixed(2)}`,
      totalInvested: newInvested,
      displayTotalInvested: `₹${newInvested.toFixed(2)}`,
      transactions: deduplicateTransactions([transaction, ...(currentWallet.transactions || [])]),
    }
    storageService.setWallet(updated)

    window.dispatchEvent(new CustomEvent('derby:coins_updated', { detail: { coins: newBalance, balance: newBalance, wallet: updated } }))
    window.dispatchEvent(new CustomEvent('derby:ledger_transaction', { detail: transaction }))

    return { balance: newBalance, transaction, ...updated }
  }

  async creditPayout({ winningHorse, winningBetAmount, payoutMultiplier = 10, roundId, totalBetAmount = 0 }) {
    try {
      const betAmt = Number(winningBetAmount) || 0
      const mult = Number(payoutMultiplier) || 10
      // 10X payout on ONLY the winning 1st place horse bet
      const winAmount = betAmt * mult
      const totBet = Number(totalBetAmount) || betAmt
      const netProfit = winAmount - totBet

      const currentWallet = storageService.getWallet() || {}
      const curBal = typeof currentWallet.balance === 'number' ? currentWallet.balance : 0
      const newBalance = curBal + winAmount
      const prevTotalWon = typeof currentWallet.totalWon === 'number' ? currentWallet.totalWon : 0
      const newTotalWon = prevTotalWon + winAmount
      const prevTotalWins = typeof currentWallet.totalWins === 'number' ? currentWallet.totalWins : 0
      const newTotalWins = prevTotalWins + (winAmount > 0 ? 1 : 0)
      const prevInvested = typeof currentWallet.totalInvested === 'number' ? currentWallet.totalInvested : 0
      const newNetProfitLoss = newTotalWon - prevInvested

      const transaction = {
        id: `tx_win_${Date.now()}`,
        transactionId: Date.now(),
        type: 'credit',
        category: 'bet_win',
        amount: winAmount,
        balanceBefore: curBal,
        balanceAfter: newBalance,
        description: `Won ₹${winAmount.toFixed(2)} on Horse #${winningHorse?.number || ''} (${winningHorse?.name || ''}) [${mult}X Payout]`,
        note: `Won 10X payout on Horse #${winningHorse?.number || ''} (${winningHorse?.name || ''})`,
        status: 'completed',
        timestamp: Date.now(),
        createdAt: new Date().toISOString(),
      }

      const updated = {
        ...currentWallet,
        balance: newBalance,
        coins: newBalance,
        displayBalance: `₹${newBalance.toFixed(2)}`,
        totalWon: newTotalWon,
        displayTotalWon: `₹${newTotalWon.toFixed(2)}`,
        totalWins: newTotalWins,
        netProfitLoss: newNetProfitLoss,
        displayNetProfitLoss: (newNetProfitLoss >= 0 ? '+' : '') + `₹${newNetProfitLoss.toFixed(2)}`,
        lastWonAmount: winAmount,
        transactions: deduplicateTransactions([transaction, ...(currentWallet.transactions || [])]),
      }
      storageService.setWallet(updated)

      // Dispatch real-time wallet and coin update events
      window.dispatchEvent(new CustomEvent('derby:coins_updated', { detail: { coins: newBalance, balance: newBalance, totalWon: newTotalWon, wonAmount: winAmount, netProfit, wallet: updated } }))
      window.dispatchEvent(new CustomEvent('derby:ledger_transaction', { detail: transaction }))

      return { balance: newBalance, winnings: winAmount, wonAmount: winAmount, netProfit, transaction, ...updated }
    } catch (_) {
      const saved = storageService.getWallet() || {}
      return { balance: saved.balance || 0, coins: saved.balance || 0 }
    }
  }

  async getTransactions(page = 1, limit = 20) {
    try {
      const userId = storageService.getUserId()
      const queryParams = { page, limit }
      if (userId !== undefined && userId !== null) {
        queryParams.userId = userId
        queryParams.user_id = userId
      }

      let response
      try {
        response = await apiClient.get(ENDPOINTS.WALLET.TRANSACTIONS, queryParams)
      } catch (_) {
        response = await apiClient.get('/api/wallet/transactions', queryParams)
      }

      const data = response?.data !== undefined ? response.data : response
      const rawList = data?.transactions || data?.history || data?.data || (Array.isArray(data) ? data : [])
      const list = deduplicateTransactions(rawList)
      return {
        transactions: list,
        total: data?.total !== undefined ? Number(data.total) : list.length,
        totalPages: data?.totalPages || 1,
        page: data?.page || page,
        hasMore: Boolean(data?.hasMore),
        ...data,
      }
    } catch (err) {
      console.warn('[Wallet] Error fetching /api/wallet/transactions:', err.message)
      const saved = storageService.getWallet() || {}
      const list = deduplicateTransactions(saved.transactions || [])
      return {
        transactions: list,
        total: list.length,
        totalPages: 1,
        page: 1,
        hasMore: false,
      }
    }
  }
}

export const walletService = new WalletService()
export default walletService

