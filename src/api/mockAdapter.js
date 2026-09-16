/**
 * High-Fidelity Mock Backend API Adapter
 * Simulates an enterprise casino backend server when VITE_USE_MOCK_API=true or backend is offline.
 * Supports realistic network latency, validation, user accounts, wallet ledger, and bet settlements.
 */

import { storageService } from '../services/storageService.js'

// Realistic delay simulation
const delay = (ms = 180) => new Promise((resolve) => setTimeout(resolve, ms))

class MockBackendAdapter {
  constructor() {
    this.users = [
      {
        id: 'usr_demo_1001',
        username: 'VIP_Champion',
        email: 'player@derbycasino.com',
        phone: '+91 98765 43210',
        vipLevel: 3,
        avatar: '/Bet_horses/horses7.png',
        totalBets: 42,
        totalWon: 125000,
        createdAt: '2026-01-10T12:00:00Z',
      },
    ]

    // Initialize Mock Wallet
    const savedWallet = storageService.getWallet()
    this.wallet = savedWallet || {
      balance: 10000,
      currency: 'COINS',
      totalDeposited: 10000,
      totalWithdrawn: 0,
      transactions: [
        {
          id: 'tx_init_1',
          type: 'deposit',
          amount: 10000,
          balanceAfter: 10000,
          note: 'Welcome Bonus Credits',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestamp: Date.now(),
        },
      ],
    }
  }

  saveWalletState() {
    storageService.setWallet(this.wallet)
  }

  // --- AUTHENTICATION MOCK ---
  async login({ identifier, password }) {
    await delay(300)
    if (!identifier || !password) {
      throw new Error('Please provide email/phone and password')
    }

    const token = `jwt_mock_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    const user = {
      id: `usr_${Math.floor(1000 + Math.random() * 9000)}`,
      username: identifier.includes('@') ? identifier.split('@')[0] : `Player_${identifier.slice(-4)}`,
      email: identifier.includes('@') ? identifier : `${identifier}@derbyarena.game`,
      phone: !identifier.includes('@') ? identifier : '+91 98000 00000',
      vipLevel: 1,
      avatar: '/Bet_horses/horses1.png',
      createdAt: new Date().toISOString(),
    }

    return {
      success: true,
      data: {
        token,
        refreshToken: `ref_${token}`,
        user,
        wallet: this.wallet,
      },
      message: 'Login successful',
    }
  }

  async register({ username, identifier, password }) {
    await delay(350)
    const token = `jwt_mock_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    const user = {
      id: `usr_${Math.floor(1000 + Math.random() * 9000)}`,
      username: username || (identifier.includes('@') ? identifier.split('@')[0] : `Player_${identifier.slice(-4)}`),
      email: identifier.includes('@') ? identifier : `${identifier}@derbyarena.game`,
      phone: !identifier.includes('@') ? identifier : '',
      vipLevel: 1,
      avatar: '/Bet_horses/horses7.png',
      createdAt: new Date().toISOString(),
    }

    // Reset wallet with 10,000 welcome bonus for new user
    this.wallet = {
      balance: 10000,
      currency: 'COINS',
      totalDeposited: 10000,
      totalWithdrawn: 0,
      transactions: [
        {
          id: `tx_welcome_${Date.now()}`,
          type: 'deposit',
          amount: 10000,
          balanceAfter: 10000,
          note: 'New Player Welcome Grant',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestamp: Date.now(),
        },
      ],
    }
    this.saveWalletState()

    return {
      success: true,
      data: {
        token,
        refreshToken: `ref_${token}`,
        user,
        wallet: this.wallet,
      },
      message: 'Account registered successfully',
    }
  }

  async guestLogin() {
    await delay(150)
    const guestId = Math.floor(1000 + Math.random() * 9000)
    const token = `jwt_guest_${Date.now()}_${guestId}`
    const user = {
      id: `guest_${guestId}`,
      username: `Guest Jockey #${guestId}`,
      email: `guest_${guestId}@guest.derbyarena.game`,
      phone: '',
      isGuest: true,
      vipLevel: 1,
      avatar: '/Bet_horses/horses7.png',
      createdAt: new Date().toISOString(),
    }

    return {
      success: true,
      data: {
        token,
        refreshToken: `ref_${token}`,
        user,
        wallet: this.wallet,
      },
      message: 'Guest session created',
    }
  }

  // --- WALLET MOCK ---
  async getBalance() {
    await delay(80)
    return {
      success: true,
      data: {
        balance: this.wallet.balance,
        currency: this.wallet.currency,
        transactions: this.wallet.transactions,
      },
    }
  }

  async deposit({ amount, method = 'UPI / Card' }) {
    await delay(250)
    const depositAmt = Number(amount)
    if (isNaN(depositAmt) || depositAmt <= 0) {
      throw new Error('Invalid deposit amount')
    }

    this.wallet.balance += depositAmt
    this.wallet.totalDeposited += depositAmt
    const tx = {
      id: `tx_dep_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      type: 'deposit',
      amount: depositAmt,
      balanceAfter: this.wallet.balance,
      note: `Recharge via ${method}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(),
    }
    this.wallet.transactions.unshift(tx)
    this.saveWalletState()

    return {
      success: true,
      data: {
        balance: this.wallet.balance,
        transaction: tx,
      },
      message: `Successfully credited ${depositAmt} coins`,
    }
  }

  async debitBet({ betsByHorse, totalAmount, roundId }) {
    await delay(100)
    const debitAmt = Number(totalAmount)
    if (this.wallet.balance < debitAmt) {
      throw new Error('Insufficient wallet balance to place bet')
    }

    this.wallet.balance -= debitAmt
    const tx = {
      id: `tx_bet_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      type: 'bet',
      amount: -debitAmt,
      balanceAfter: this.wallet.balance,
      note: `Race Bet (Round #${roundId || 'DERBY'})`,
      details: betsByHorse,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(),
    }
    this.wallet.transactions.unshift(tx)
    this.saveWalletState()

    return {
      success: true,
      data: {
        balance: this.wallet.balance,
        transaction: tx,
      },
      message: 'Bet placed successfully',
    }
  }

  async creditPayout({ winningHorse, winningBetAmount, payoutMultiplier = 10, roundId }) {
    await delay(100)
    const betAmt = Number(winningBetAmount)
    const winAmt = betAmt * Number(payoutMultiplier)

    this.wallet.balance += winAmt
    const tx = {
      id: `tx_win_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      type: 'payout',
      amount: winAmt,
      balanceAfter: this.wallet.balance,
      note: `Won 10X on Horse #${winningHorse.number} ${winningHorse.name}`,
      details: { winningHorse, betAmt, payoutMultiplier, winAmt },
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(),
    }
    this.wallet.transactions.unshift(tx)
    this.saveWalletState()

    return {
      success: true,
      data: {
        balance: this.wallet.balance,
        winnings: winAmt,
        transaction: tx,
      },
      message: `Payout of ${winAmt} coins credited!`,
    }
  }

  async getTransactions(limit = 50) {
    await delay(100)
    return {
      success: true,
      data: {
        transactions: this.wallet.transactions.slice(0, limit),
        total: this.wallet.transactions.length,
      },
    }
  }
}

export const mockBackendAdapter = new MockBackendAdapter()
export default mockBackendAdapter

