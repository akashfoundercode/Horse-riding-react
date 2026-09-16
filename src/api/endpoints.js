/**
 * API Endpoints Catalog
 * Defines all standard REST endpoint routes for enterprise backend integration.
 */

export const ENDPOINTS = {
  // Authentication & Session
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    GUEST_LOGIN: '/auth/guest',
    LOGOUT: '/auth/logout',
    REFRESH_TOKEN: '/auth/refresh-token',
    VALIDATE_SESSION: '/auth/validate',
  },

  // User Profile & Preferences
  USER: {
    PROFILE: '/user/profile',
    UPDATE_PROFILE: '/user/update',
    STATS: '/user/stats',
    VIP_STATUS: '/user/vip',
  },

  // Wallet & Financial Transactions
  WALLET: {
    GET_BALANCE: '/wallet/balance',
    DEPOSIT: '/wallet/deposit',
    WITHDRAW: '/wallet/withdraw',
    TRANSACTIONS: '/wallet/transactions',
    CLAIM_REWARD: '/wallet/claim-reward',
  },

  // Horse Racing Game Engine & Betting
  GAME: {
    ROUND_STATUS: '/game/derby/round-status',
    PLACE_BET: '/game/derby/bet/place',
    CANCEL_BET: '/game/derby/bet/cancel',
    SETTLE_ROUND: '/game/derby/round/settle',
    HISTORY: '/game/derby/history',
    LEADERBOARD: '/game/derby/leaderboard',
    STATS: '/game/derby/stats',
  },

  // System & Health
  SYSTEM: {
    PING: '/system/ping',
    CONFIG: '/system/config',
  }
}

