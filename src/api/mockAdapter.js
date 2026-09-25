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
      balance: 0,
      currency: 'COINS',
      totalDeposited: 0,
      totalWithdrawn: 0,
      transactions: [],
    }
  }

  saveWalletState() {
    storageService.setWallet(this.wallet)
  }

  // --- AUTHENTICATION MOCK ---
  async login({ email, password }) {
    await delay(250)
    if (!email || !password) {
      throw new Error('Invalid email or password')
    }

    const token = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify({ email, time: Date.now() }))}.signature`
    const user = {
      id: `usr_${Math.floor(100000 + Math.random() * 900000)}`,
      email,
      name: email,
      role: 'user',
      coins: 1000,
    }

    return {
      success: true,
      data: {
        token,
        user,
      },
      message: 'Login successful',
    }
  }

  async register({ email, password, name, role = 'user' }) {
    await delay(300)
    if (!email || !email.includes('@')) {
      throw new Error('A valid email is required')
    }
    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters')
    }
    if (!name) {
      throw new Error('Name is required')
    }

    const token = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify({ email, time: Date.now() }))}.signature`
    const user = {
      id: `usr_${Date.now().toString(16)}`,
      email,
      name,
      role: role || 'user',
      coins: 0,
    }

    return {
      success: true,
      data: {
        token,
        user,
      },
      message: 'Account created successfully',
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

  // --- HORSES MOCK ---
  async getHorses() {
    await delay(120)
    return {
      success: true,
      total: 12,
      horses: [
        {
          id: 1,
          serialNumber: 1,
          name: "Thunder Bolt",
          imageUrl: "/uploads/horses/horse-1789992757920-304993474.png",
          status: "active",
          createdAt: "2026-09-21T05:12:54.000Z",
          updatedAt: "2026-09-21T12:12:37.000Z",
        },
        {
          id: 2,
          serialNumber: 2,
          name: "Storm Runner",
          imageUrl: "/uploads/horses/horse-1789992775113-883806446.png",
          status: "active",
          createdAt: "2026-09-21T05:12:54.000Z",
          updatedAt: "2026-09-21T12:12:55.000Z",
        },
        {
          id: 3,
          serialNumber: 3,
          name: "Golden Arrow",
          imageUrl: "/uploads/horses/horse-1789992784249-448629018.png",
          status: "active",
          createdAt: "2026-09-21T05:12:54.000Z",
          updatedAt: "2026-09-21T12:13:04.000Z",
        },
        {
          id: 4,
          serialNumber: 4,
          name: "Shadow Blaze",
          imageUrl: "/uploads/horses/horse-1789992790732-424217818.png",
          status: "active",
          createdAt: "2026-09-21T05:12:54.000Z",
          updatedAt: "2026-09-21T12:13:10.000Z",
        },
        {
          id: 5,
          serialNumber: 5,
          name: "Midnight Star",
          imageUrl: "/uploads/horses/horse-1789992798522-532481144.png",
          status: "active",
          createdAt: "2026-09-21T05:12:54.000Z",
          updatedAt: "2026-09-21T12:13:18.000Z",
        },
        {
          id: 6,
          serialNumber: 6,
          name: "Royal Knight",
          imageUrl: "/uploads/horses/horse-1789992807133-984511268.png",
          status: "active",
          createdAt: "2026-09-21T05:12:54.000Z",
          updatedAt: "2026-09-21T12:13:27.000Z",
        },
        {
          id: 7,
          serialNumber: 7,
          name: "Silver Bullet",
          imageUrl: "/uploads/horses/horse-1789992815581-307958118.png",
          status: "active",
          createdAt: "2026-09-21T05:12:54.000Z",
          updatedAt: "2026-09-21T12:13:35.000Z",
        },
        {
          id: 8,
          serialNumber: 8,
          name: "Fire Steed",
          imageUrl: "/uploads/horses/horse-1789992824631-61547573.png",
          status: "active",
          createdAt: "2026-09-21T05:12:54.000Z",
          updatedAt: "2026-09-21T12:13:44.000Z",
        },
        {
          id: 9,
          serialNumber: 9,
          name: "Wild Pegasus",
          imageUrl: "/uploads/horses/horse-1789992834298-874173119.png",
          status: "active",
          createdAt: "2026-09-21T05:12:54.000Z",
          updatedAt: "2026-09-21T12:13:54.000Z",
        },
        {
          id: 10,
          serialNumber: 10,
          name: "Iron Gallop",
          imageUrl: "/uploads/horses/horse-1789992843551-626375333.png",
          status: "active",
          createdAt: "2026-09-21T05:12:54.000Z",
          updatedAt: "2026-09-21T12:14:03.000Z",
        },
        {
          id: 11,
          serialNumber: 11,
          name: "Desert Comet",
          imageUrl: "/uploads/horses/horse-1789992851346-282039429.png",
          status: "active",
          createdAt: "2026-09-21T05:12:54.000Z",
          updatedAt: "2026-09-21T12:14:11.000Z",
        },
        {
          id: 12,
          serialNumber: 12,
          name: "Victory Spirit",
          imageUrl: "/uploads/horses/horse-1789992859019-987469921.png",
          status: "active",
          createdAt: "2026-09-21T05:12:54.000Z",
          updatedAt: "2026-09-21T12:14:19.000Z",
        },
      ],
    }
  }

  // --- USER PROFILE MOCK ---
  async getProfile() {
    await delay(100)
    const currentUser = storageService.getUser()
    return {
      success: true,
      data: {
        username: currentUser?.username || 'player_01',
        name: currentUser?.name || 'Akash Rai',
        coins: this.wallet.balance,
        totalBets: currentUser?.totalBets ?? 34,
        totalWon: currentUser?.totalWon ?? 12,
        totalLost: currentUser?.totalLost ?? 22,
      },
    }
  }

  // --- WALLET MOCK ---
  async getBalance() {
    await delay(80)
    return {
      success: true,
      data: {
        coins: this.wallet.balance,
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

