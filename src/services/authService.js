/**
 * Authentication Service
 * Manages user logins, registration, guest session generation, and token management.
 */

import { apiClient } from '../api/apiClient.js'
import { ENDPOINTS } from '../api/endpoints.js'
import { mockBackendAdapter } from '../api/mockAdapter.js'
import API_CONFIG from '../config/apiConfig.js'
import { storageService } from './storageService.js'

class AuthService {
  async login({ email, password, phone, rememberMe = true }) {
    try {
      const payload = {
        email: email || phone,
        password,
      }
      if (email) payload.email = email
      if (phone) payload.phone = phone

      const response = await apiClient.post(ENDPOINTS.AUTH.LOGIN, payload)
      const data = response?.data !== undefined ? response.data : response
      this.handleAuthSuccess(data, rememberMe)
      return data
    } catch (err) {
      console.warn('Backend login error:', err.message)
      throw err
    }
  }

  async register({ password, name, email, phone, role = 'user', rememberMe = true }) {
    try {
      const payload = {
        password,
        name,
        role: role || 'user',
      }
      if (email) payload.email = email
      if (phone) payload.phone = phone

      const response = await apiClient.post(ENDPOINTS.AUTH.REGISTER, payload)
      const data = response?.data !== undefined ? response.data : response
      this.handleAuthSuccess(data, rememberMe)
      return data
    } catch (err) {
      console.warn('Backend register error:', err.message)
      throw err
    }
  }

  async guestLogin() {
    try {
      const response = await apiClient.post(ENDPOINTS.AUTH.GUEST_LOGIN, {})
      const data = response?.data !== undefined ? response.data : response
      this.handleAuthSuccess(data, false)
      return data
    } catch (err) {
      throw err
    }
  }

  handleAuthSuccess(authData, rememberMe = true) {
    if (!authData) return
    const token = authData.token || authData.jwt || authData.accessToken || authData.data?.token
    const user = authData.user || authData.data?.user || (authData.id || authData.userId ? authData : null)

    if (token) {
      storageService.setToken(token, rememberMe)
    }
    if (user) {
      storageService.setUser(user, rememberMe)
      const userId = user.id || user.userId || user._id
      if (userId) {
        localStorage.setItem('derby_user_id', String(userId))
      }
      const coins =
        typeof user.coins === 'number'
          ? user.coins
          : typeof user.balance === 'number'
            ? user.balance
            : typeof authData.coins === 'number'
              ? authData.coins
              : typeof authData.balance === 'number'
                ? authData.balance
                : 0

      storageService.setWallet({
        balance: coins,
        displayBalance: `₹${coins}`,
        currency: 'COINS',
        transactions: [],
      })
      window.dispatchEvent(new CustomEvent('derby:coins_updated', { detail: { coins, balance: coins } }))
    }
    if (authData.wallet) {
      storageService.setWallet(authData.wallet)
      if (typeof authData.wallet.balance === 'number') {
        window.dispatchEvent(new CustomEvent('derby:coins_updated', { detail: { coins: authData.wallet.balance } }))
      }
    }

    window.dispatchEvent(new CustomEvent('derby:auth_changed', { detail: { token, user, ...authData } }))
  }

  async logout() {
    try {
      const token = storageService.getToken()
      const userId = storageService.getUserId()
      if (token) {
        try {
          await apiClient.post(ENDPOINTS.AUTH.LOGOUT, { userId })
        } catch (_) {
          try {
            await apiClient.post('/api/logout', { userId })
          } catch (_) {
            try {
              await apiClient.get(ENDPOINTS.AUTH.LOGOUT)
            } catch (_) { }
          }
        }
      }
    } finally {
      storageService.clearSession()
      window.dispatchEvent(new CustomEvent('derby:auth_changed', { detail: null }))
      window.dispatchEvent(new CustomEvent('derby:coins_updated', { detail: { coins: 0, balance: 0 } }))
    }
  }

  async getProfile() {
    try {
      const response = await apiClient.get(ENDPOINTS.AUTH.ME)
      const data = response?.data !== undefined ? response.data : response
      if (data) {
        const user = data.user || data.data?.user || (data.id || data.userId ? data : null)
        if (user) {
          storageService.setUser(user)
          const userId = user.id || user.userId || user._id
          if (userId) {
            localStorage.setItem('derby_user_id', String(userId))
          }
        }

        const rawCoins =
          typeof data?.balance === 'number'
            ? data.balance
            : typeof data?.coins === 'number'
              ? data.coins
              : typeof data?.user?.balance === 'number'
                ? data.user.balance
                : typeof data?.user?.coins === 'number'
                  ? data.user.coins
                  : typeof data?.wallet?.balance === 'number'
                    ? data.wallet.balance
                    : typeof data?.wallet?.coins === 'number'
                      ? data.wallet.coins
                      : null

        if (rawCoins !== null) {
          const currentWallet = storageService.getWallet() || {}
          const updatedWallet = {
            ...currentWallet,
            balance: rawCoins,
            coins: rawCoins,
            displayBalance: `₹${rawCoins.toFixed(2)}`,
            totalWon:
              typeof data?.totalWon === 'number'
                ? data.totalWon
                : typeof data?.user?.totalWon === 'number'
                  ? data.user.totalWon
                  : typeof data?.wallet?.totalWon === 'number'
                    ? data.wallet.totalWon
                    : (currentWallet.totalWon || 0),
          }
          storageService.setWallet(updatedWallet)
          window.dispatchEvent(
            new CustomEvent('derby:coins_updated', {
              detail: { coins: rawCoins, balance: rawCoins, wallet: updatedWallet },
            })
          )
        }

        return user || storageService.getUser() || {}
      }
      return storageService.getUser() || {}
    } catch (err) {
      console.warn('[Auth] Notice fetching /api/auth/me:', err.message)
      return storageService.getUser() || {}
    }
  }

  getCurrentUser() {
    return storageService.getUser()
  }

  getAuthToken() {
    return storageService.getToken()
  }

  isAuthenticated() {
    return Boolean(storageService.getToken() && storageService.getUser())
  }
}

export const authService = new AuthService()
export default authService

