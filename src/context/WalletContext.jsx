/**
 * Wallet Context & Provider
 * Centralized state for player balance, bet ledger, deposits, and real-time syncing.
 */

import React, { createContext, useContext, useEffect, useState } from 'react'
import { walletService } from '../services/walletService.js'
import { storageService } from '../services/storageService.js'

const WalletContext = createContext(null)

export function WalletProvider({ children }) {
  const [balance, setBalance] = useState(() => {
    const saved = storageService.getWallet()
    return saved ? saved.balance : 10000
  })
  const [currency, setCurrency] = useState('COINS')
  const [transactions, setTransactions] = useState(() => {
    const saved = storageService.getWallet()
    return saved?.transactions || []
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false)

  // Fetch / Sync balance from backend or mock on mount
  useEffect(() => {
    walletService.getBalance().then((data) => {
      if (data) {
        if (typeof data.balance === 'number') setBalance(data.balance)
        if (data.currency) setCurrency(data.currency)
        if (Array.isArray(data.transactions)) setTransactions(data.transactions)
      }
    }).catch(() => { })
  }, [])

  // Deposit / Recharge coins
  const depositCoins = async (amount, method = 'UPI / Card') => {
    setIsLoading(true)
    try {
      const data = await walletService.deposit(amount, method)
      setBalance(data.balance)
      if (data.transaction) {
        setTransactions((prev) => [data.transaction, ...prev])
      }
      return { success: true, data }
    } catch (err) {
      return { success: false, error: err.message }
    } finally {
      setIsLoading(false)
    }
  }

  // Debit placed bet amount
  const debitBet = async ({ betsByHorse, totalAmount, roundId }) => {
    try {
      const data = await walletService.debitBet({ betsByHorse, totalAmount, roundId })
      setBalance(data.balance)
      if (data.transaction) {
        setTransactions((prev) => [data.transaction, ...prev])
      }
      return { success: true, data }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  // Credit 10X winning payout
  const creditPayout = async ({ winningHorse, winningBetAmount, payoutMultiplier = 10, roundId }) => {
    try {
      const data = await walletService.creditPayout({ winningHorse, winningBetAmount, payoutMultiplier, roundId })
      setBalance(data.balance)
      if (data.transaction) {
        setTransactions((prev) => [data.transaction, ...prev])
      }
      return { success: true, data }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  const syncBalance = async () => {
    try {
      const data = await walletService.getBalance()
      if (data && typeof data.balance === 'number') {
        setBalance(data.balance)
      }
    } catch (_) { }
  }

  const value = {
    balance,
    setBalance,
    currency,
    transactions,
    isLoading,
    isWalletModalOpen,
    setIsWalletModalOpen,
    depositCoins,
    debitBet,
    creditPayout,
    syncBalance,
  }

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider')
  }
  return context
}

export default WalletContext

