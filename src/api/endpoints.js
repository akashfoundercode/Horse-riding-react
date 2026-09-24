/**
 * API Endpoints Catalog
 * Defines all standard REST endpoint routes for enterprise backend integration.
 */

export const ENDPOINTS = {
  // Authentication & Session
  AUTH: {
    ME: '/api/auth/me',
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    GUEST_LOGIN: '/api/auth/guest',
    LOGOUT: '/api/auth/logout',
    REFRESH_TOKEN: '/api/auth/refresh-token',
    VALIDATE_SESSION: '/api/auth/validate',
  },

  // User Profile & Preferences
  USER: {
    COINS: '/api/user/coins',
    PROFILE: '/api/user/profile',
    UPDATE_PROFILE: '/api/user/update',
    STATS: '/api/user/stats',
    VIP_STATUS: '/api/user/vip',
  },

  // Wallet & Financial Transactions
  WALLET: {
    ME: '/api/wallet/me',
    GET_BALANCE: '/api/wallet/me',
    BALANCE: '/api/wallet',
    DEPOSIT: '/api/wallet/deposit',
    WITHDRAW: '/api/wallet/withdraw',
    TRANSACTIONS: '/api/wallet/transactions',
    CLAIM_REWARD: '/api/wallet/claim-reward',
  },

  // Horse Racing Game Engine & Betting
  GAME: {
    HORSES: '/api/horses',
    RACES: '/api/races',
    CURRENT_RACE: '/api/races/current',
    POOL: '/api/races/current/pool',
    RESULT_SCREEN: '/api/races/result-screen',
    PLACE_BET: '/api/bets',
    MY_BETS: '/api/races/my-bets',
    BET_HISTORY: '/api/bets/history',
    BETS: '/api/bets',
    CANCEL_BET: '/api/bets/cancel',
    SETTLE_ROUND: '/api/races/settle',
    HISTORY: '/api/races/history',
    PREVIOUS_RESULTS: '/api/races/previous-results',
    PREVIOUS_RESULTS_ALT: '/api/game/previous-results',
    MATCHES_RESULTS: '/api/races/matches-results',
    LEADERBOARD: '/api/races/leaderboard',
    STATS: '/api/races/stats',
  },
  BETS: {
    HISTORY: '/api/bets/history',
    PLACE: '/api/bets',
    PLACE_ALT: '/api/races/bet',
    MINUS: '/api/bets/minus',
    CANCEL: '/api/bets/cancel',
    REMOVE: '/api/bets/remove',
    CLEAR: '/api/bets/clear',
    MY_BETS: '/api/races/my-bets',
  },

  // Admin & Management
  ADMIN: {
    JACKPOT_FORCE: '/api/admin/jackpot/force',
    JACKPOT_CANCEL: '/api/admin/jackpot/cancel',
    JACKPOT_QUEUE: '/api/admin/jackpot/queue',
    SET_JACKPOT: '/api/admin/races/set-jackpot',
  },

  // System & Health
  SYSTEM: {
    PING: '/api/ping',
    CONFIG: '/api/config',
  },
}

