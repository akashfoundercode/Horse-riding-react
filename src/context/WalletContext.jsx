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
    return saved && typeof saved.balance === 'number' ? saved.balance : 0
  })
  const [totalWon, setTotalWon] = useState(() => {
    const saved = storageService.getWallet()
    return typeof saved?.totalWon === 'number' ? saved.totalWon : 0
  })
  const [totalInvested, setTotalInvested] = useState(() => {
    const saved = storageService.getWallet()
    return typeof saved?.totalInvested === 'number' ? saved.totalInvested : 0
  })
  const [netProfitLoss, setNetProfitLoss] = useState(() => {
    const saved = storageService.getWallet()
    return typeof saved?.netProfitLoss === 'number' ? saved.netProfitLoss : 0
  })
  const [totalWins, setTotalWins] = useState(() => {
    const saved = storageService.getWallet()
    return typeof saved?.totalWins === 'number' ? saved.totalWins : 0
  })
  const [totalBets, setTotalBets] = useState(() => {
    const saved = storageService.getWallet()
    return typeof saved?.totalBets === 'number' ? saved.totalBets : 0
  })
  const [currency, setCurrency] = useState('INR')
  const [transactions, setTransactions] = useState(() => {
    const saved = storageService.getWallet()
    return saved?.transactions || []
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false)

  // Fetch / Sync balance from backend on mount
  useEffect(() => {
    walletService.getBalance().then((data) => {
      if (data) {
        if (typeof data.balance === 'number') setBalance(data.balance)
        else if (typeof data.coins === 'number') setBalance(data.coins)
        if (typeof data.totalWon === 'number') setTotalWon(data.totalWon)
        if (typeof data.totalInvested === 'number') setTotalInvested(data.totalInvested)
        if (typeof data.netProfitLoss === 'number') setNetProfitLoss(data.netProfitLoss)
        if (typeof data.totalWins === 'number') setTotalWins(data.totalWins)
        if (typeof data.totalBets === 'number') setTotalBets(data.totalBets)
        if (data.currency) setCurrency(data.currency)
        if (Array.isArray(data.transactions)) setTransactions(data.transactions)
      }
    }).catch(() => { })

    const handleAuthChanged = (e) => {
      const authData = e.detail
      if (authData?.user?.coins !== undefined && typeof authData.user.coins === 'number') {
        setBalance(authData.user.coins)
      } else if (authData?.user?.balance !== undefined && typeof authData.user.balance === 'number') {
        setBalance(authData.user.balance)
      } else if (authData?.wallet?.balance !== undefined && typeof authData.wallet.balance === 'number') {
        setBalance(authData.wallet.balance)
      } else if (authData?.wallet?.coins !== undefined && typeof authData.wallet.coins === 'number') {
        setBalance(authData.wallet.coins)
      }
    }

    const handleCoinsUpdated = (e) => {
      const detail = e.detail
      if (typeof detail === 'number') {
        setBalance(detail)
      } else if (typeof detail?.coins === 'number') {
        setBalance(detail.coins)
      } else if (typeof detail?.balance === 'number') {
        setBalance(detail.balance)
      } else if (typeof detail?.newBalance === 'number') {
        setBalance(detail.newBalance)
      } else if (typeof detail?.currentBalance === 'number') {
        setBalance(detail.currentBalance)
      }

      if (typeof detail?.totalWon === 'number') setTotalWon(detail.totalWon)
      if (typeof detail?.wallet?.totalWon === 'number') setTotalWon(detail.wallet.totalWon)
      if (typeof detail?.wallet?.totalInvested === 'number') setTotalInvested(detail.wallet.totalInvested)
      if (typeof detail?.wallet?.netProfitLoss === 'number') setNetProfitLoss(detail.wallet.netProfitLoss)
      if (typeof detail?.wallet?.totalWins === 'number') setTotalWins(detail.wallet.totalWins)
      if (typeof detail?.wallet?.totalBets === 'number') setTotalBets(detail.wallet.totalBets)
    }

    window.addEventListener('derby:auth_changed', handleAuthChanged)
    window.addEventListener('derby:coins_updated', handleCoinsUpdated)
    window.addEventListener('derby:wallet_balance', handleCoinsUpdated)
    return () => {
      window.removeEventListener('derby:auth_changed', handleAuthChanged)
      window.removeEventListener('derby:coins_updated', handleCoinsUpdated)
      window.removeEventListener('derby:wallet_balance', handleCoinsUpdated)
    }
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
      if (typeof data.totalInvested === 'number') setTotalInvested(data.totalInvested)
      if (typeof data.totalBets === 'number') setTotalBets(data.totalBets)
      if (data.transaction) {
        setTransactions((prev) => [data.transaction, ...prev])
      }
      return { success: true, data }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  // Credit 10X winning payout
  const creditPayout = async ({ winningHorse, winningBetAmount, payoutMultiplier = 10, roundId, totalBetAmount = 0 }) => {
    try {
      const data = await walletService.creditPayout({ winningHorse, winningBetAmount, payoutMultiplier, roundId, totalBetAmount })
      setBalance(data.balance)
      if (typeof data.totalWon === 'number') setTotalWon(data.totalWon)
      if (typeof data.totalWins === 'number') setTotalWins(data.totalWins)
      if (typeof data.netProfitLoss === 'number') setNetProfitLoss(data.netProfitLoss)
      if (data.transaction) {
        setTransactions((prev) => [data.transaction, ...prev])
      }
      return { success: true, data }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  // Refund cancelled / removed bet
  const refundBet = async ({ horseNumber, amount, roundId }) => {
    try {
      const data = await walletService.refundBet({ horseNumber, amount, roundId })
      if (data && typeof data.balance === 'number') {
        setBalance(data.balance)
      }
      if (typeof data?.totalInvested === 'number') setTotalInvested(data.totalInvested)
      if (data?.transaction) {
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
        if (typeof data.totalWon === 'number') setTotalWon(data.totalWon)
      }
    } catch (_) { }
  }

  const value = {
    balance,
    setBalance,
    totalWon,
    displayTotalWon: `₹${totalWon.toFixed(2)}`,
    totalInvested,
    displayTotalInvested: `₹${totalInvested.toFixed(2)}`,
    netProfitLoss,
    displayNetProfitLoss: (netProfitLoss >= 0 ? '+' : '') + `₹${netProfitLoss.toFixed(2)}`,
    totalWins,
    totalBets,
    currency,
    transactions,
    isLoading,
    isWalletModalOpen,
    setIsWalletModalOpen,
    depositCoins,
    debitBet,
    refundBet,
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

