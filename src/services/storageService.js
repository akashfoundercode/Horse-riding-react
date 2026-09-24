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
  /**
   * Helper to extract URL Query Parameters (e.g. ?userId=1&token=xyz)
   */
  getUrlParams() {
    if (typeof window === 'undefined') return {}
    try {
      const search = new URLSearchParams(window.location.search)
      const params = {}
      const userId = search.get('userId') || search.get('user_id') || search.get('uid') || search.get('id')
      const token = search.get('token') || search.get('jwt') || search.get('auth_token')
      const name = search.get('name') || search.get('username')
      if (userId) params.userId = isNaN(Number(userId)) ? userId : Number(userId)
      if (token) params.token = token
      if (name) params.name = name
      return params
    } catch (_) {
      return {}
    }
  }

  getToken() {
    try {
      const urlParams = this.getUrlParams()
      if (urlParams.token) {
        this.setToken(urlParams.token)
        return urlParams.token
      }
      return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) || sessionStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
    } catch (_) {
      return null
    }
  }

  getUserId() {
    try {
      const urlParams = this.getUrlParams()
      if (urlParams.userId !== undefined && urlParams.userId !== null) {
        return urlParams.userId
      }
      const user = this.getUser()
      if (user?.id !== undefined && user?.id !== null) return user.id
      if (user?.userId !== undefined && user?.userId !== null) return user.userId
      if (user?._id !== undefined && user?._id !== null) return user._id
      const savedUid = localStorage.getItem('derby_user_id')
      if (savedUid) return isNaN(Number(savedUid)) ? savedUid : Number(savedUid)
      return 1
    } catch (_) {
      return 1
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
      const urlParams = this.getUrlParams()
      const data = localStorage.getItem(STORAGE_KEYS.USER_DATA) || sessionStorage.getItem(STORAGE_KEYS.USER_DATA)
      let user = data ? JSON.parse(data) : null

      // If userId is in URL, ensure stored user matches this userId
      if (urlParams.userId !== undefined && urlParams.userId !== null) {
        const uId = urlParams.userId
        if (!user || (user.id !== uId && user.userId !== uId)) {
          user = {
            id: uId,
            userId: uId,
            username: urlParams.name || `User #${uId}`,
            name: urlParams.name || `User #${uId}`,
            isGuest: false,
            role: 'user',
          }
          this.setUser(user, true)
          localStorage.setItem('derby_user_id', String(uId))
        }
      }

      return user
    } catch (_) {
      return null
    }
  }

  setUser(user, persist = true) {
    try {
      const data = JSON.stringify(user)
      if (user?.id || user?.userId) {
        localStorage.setItem('derby_user_id', String(user.id || user.userId))
      }
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

