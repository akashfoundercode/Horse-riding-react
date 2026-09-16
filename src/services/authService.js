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
  async login({ identifier, password, rememberMe = true }) {
    if (API_CONFIG.USE_MOCK_API) {
      const response = await mockBackendAdapter.login({ identifier, password })
      this.handleAuthSuccess(response.data, rememberMe)
      return response.data
    }

    try {
      const response = await apiClient.post(ENDPOINTS.AUTH.LOGIN, { identifier, password })
      this.handleAuthSuccess(response.data, rememberMe)
      return response.data
    } catch (err) {
      // Graceful fallback to mock if backend not reachable
      console.warn('Backend login unavailable, falling back to local simulation:', err.message)
      const response = await mockBackendAdapter.login({ identifier, password })
      this.handleAuthSuccess(response.data, rememberMe)
      return response.data
    }
  }

  async register({ username, identifier, password, rememberMe = true }) {
    if (API_CONFIG.USE_MOCK_API) {
      const response = await mockBackendAdapter.register({ username, identifier, password })
      this.handleAuthSuccess(response.data, rememberMe)
      return response.data
    }

    try {
      const response = await apiClient.post(ENDPOINTS.AUTH.REGISTER, { username, identifier, password })
      this.handleAuthSuccess(response.data, rememberMe)
      return response.data
    } catch (err) {
      console.warn('Backend register unavailable, falling back to local simulation:', err.message)
      const response = await mockBackendAdapter.register({ username, identifier, password })
      this.handleAuthSuccess(response.data, rememberMe)
      return response.data
    }
  }

  async guestLogin() {
    if (API_CONFIG.USE_MOCK_API) {
      const response = await mockBackendAdapter.guestLogin()
      this.handleAuthSuccess(response.data, false)
      return response.data
    }

    try {
      const response = await apiClient.post(ENDPOINTS.AUTH.GUEST_LOGIN, {})
      this.handleAuthSuccess(response.data, false)
      return response.data
    } catch (err) {
      const response = await mockBackendAdapter.guestLogin()
      this.handleAuthSuccess(response.data, false)
      return response.data
    }
  }

  handleAuthSuccess(authData, rememberMe = true) {
    if (authData.token) {
      storageService.setToken(authData.token, rememberMe)
    }
    if (authData.user) {
      storageService.setUser(authData.user, rememberMe)
    }
    if (authData.wallet) {
      storageService.setWallet(authData.wallet)
    }
  }

  async logout() {
    try {
      if (!API_CONFIG.USE_MOCK_API && storageService.getToken()) {
        await apiClient.post(ENDPOINTS.AUTH.LOGOUT, {}).catch(() => { })
      }
    } finally {
      storageService.clearSession()
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

