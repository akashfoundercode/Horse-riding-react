/**
 * Wallet & Transaction Service
 * Manages player coin balance, bet deductions, 10X payouts, deposits, and transaction ledgers.
 */

import { apiClient } from '../api/apiClient.js'
import { ENDPOINTS } from '../api/endpoints.js'
import { mockBackendAdapter } from '../api/mockAdapter.js'
import API_CONFIG from '../config/apiConfig.js'
import { storageService } from './storageService.js'

class WalletService {
  async getBalance() {
    if (API_CONFIG.USE_MOCK_API) {
      const response = await mockBackendAdapter.getBalance()
      return response.data
    }

    try {
      const response = await apiClient.get(ENDPOINTS.WALLET.GET_BALANCE)
      return response.data
    } catch (err) {
      const response = await mockBackendAdapter.getBalance()
      return response.data
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
    if (API_CONFIG.USE_MOCK_API) {
      const response = await mockBackendAdapter.debitBet({ betsByHorse, totalAmount, roundId })
      return response.data
    }

    try {
      const response = await apiClient.post(ENDPOINTS.GAME.PLACE_BET, {
        bets: betsByHorse,
        totalAmount,
        roundId,
      })
      return response.data
    } catch (err) {
      const response = await mockBackendAdapter.debitBet({ betsByHorse, totalAmount, roundId })
      return response.data
    }
  }

  async creditPayout({ winningHorse, winningBetAmount, payoutMultiplier = 10, roundId }) {
    if (API_CONFIG.USE_MOCK_API) {
      const response = await mockBackendAdapter.creditPayout({
        winningHorse,
        winningBetAmount,
        payoutMultiplier,
        roundId,
      })
      return response.data
    }

    try {
      const response = await apiClient.post(ENDPOINTS.GAME.SETTLE_ROUND, {
        winningHorseNumber: winningHorse.number,
        winningHorseName: winningHorse.name,
        winningBetAmount,
        payoutMultiplier,
        roundId,
      })
      return response.data
    } catch (err) {
      const response = await mockBackendAdapter.creditPayout({
        winningHorse,
        winningBetAmount,
        payoutMultiplier,
        roundId,
      })
      return response.data
    }
  }

  async getTransactions(limit = 50) {
    if (API_CONFIG.USE_MOCK_API) {
      const response = await mockBackendAdapter.getTransactions(limit)
      return response.data.transactions
    }

    try {
      const response = await apiClient.get(ENDPOINTS.WALLET.TRANSACTIONS, { limit })
      return response.data.transactions
    } catch (err) {
      const response = await mockBackendAdapter.getTransactions(limit)
      return response.data.transactions
    }
  }
}

export const walletService = new WalletService()
export default walletService

