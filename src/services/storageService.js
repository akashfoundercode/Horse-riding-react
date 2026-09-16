/**
 * Storage Service
 * Handles persistence for auth tokens, user credentials, preferences, and offline fallback data.
 */

const STORAGE_KEYS = {
  AUTH_TOKEN: 'derby_auth_token',
  REFRESH_TOKEN: 'derby_refresh_token',
  USER_DATA: 'derby_user_data',
  WALLET_STATE: 'derby_wallet_state',
  BET_HISTORY: 'derby_bet_history',
  GAME_SETTINGS: 'horse_race_audio_settings',
}

class StorageService {
  getToken() {
    try {
      return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) || sessionStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
    } catch (_) {
      return null
    }
  }

  setToken(token, persist = true) {
    try {
      if (persist) {
        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token)
      } else {
        sessionStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token)
      }
    } catch (_) { }
  }

  removeToken() {
    try {
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
      sessionStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
    } catch (_) { }
  }

  getUser() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USER_DATA) || sessionStorage.getItem(STORAGE_KEYS.USER_DATA)
      return data ? JSON.parse(data) : null
    } catch (_) {
      return null
    }
  }

  setUser(user, persist = true) {
    try {
      const data = JSON.stringify(user)
      if (persist) {
        localStorage.setItem(STORAGE_KEYS.USER_DATA, data)
      } else {
        sessionStorage.setItem(STORAGE_KEYS.USER_DATA, data)
      }
    } catch (_) { }
  }

  removeUser() {
    try {
      localStorage.removeItem(STORAGE_KEYS.USER_DATA)
      sessionStorage.removeItem(STORAGE_KEYS.USER_DATA)
    } catch (_) { }
  }

  getWallet() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.WALLET_STATE)
      return data ? JSON.parse(data) : null
    } catch (_) {
      return null
    }
  }

  setWallet(wallet) {
    try {
      localStorage.setItem(STORAGE_KEYS.WALLET_STATE, JSON.stringify(wallet))
    } catch (_) { }
  }

  clearSession() {
    this.removeToken()
    this.removeUser()
  }
}

export const storageService = new StorageService()
export default storageService

