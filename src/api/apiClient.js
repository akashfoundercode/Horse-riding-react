/**
 * Production API Client
 * Enterprise Fetch Client wrapper with:
 * - Automatic JWT Bearer Authorization header injection
 * - Request/Response Interceptors
 * - Timeout handling
 * - Graceful fallback to Mock Adapter when backend is offline or VITE_USE_MOCK_API=true
 */

import API_CONFIG from '../config/apiConfig.js'
import { storageService } from '../services/storageService.js'

class ApiClient {
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL
    this.timeout = API_CONFIG.REQUEST_TIMEOUT_MS
  }

  getHeaders(customHeaders = {}) {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Operator-Id': API_CONFIG.OPERATOR_ID,
      'X-Game-Id': API_CONFIG.GAME_ID,
      'X-Client-Version': API_CONFIG.CLIENT_VERSION,
      ...customHeaders,
    }

    const token = storageService.getToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const userId = storageService.getUserId()
    if (userId !== undefined && userId !== null) {
      headers['X-User-Id'] = String(userId)
      headers['User-Id'] = String(userId)
    }

    return headers
  }

  async request(endpoint, options = {}) {
    let url = endpoint
    if (!endpoint.startsWith('http://') && !endpoint.startsWith('https://')) {
      url = `${this.baseURL}${endpoint}`
    }
    const config = {
      ...options,
      headers: this.getHeaders(options.headers),
    }

    // Abort controller for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)
    config.signal = controller.signal

    try {
      let response
      try {
        response = await fetch(url, config)
      } catch (networkErr) {
        // If relative URL failed, retry directly with configured BASE_URL
        if (!url.startsWith('http') && this.baseURL) {
          const directUrl = `${this.baseURL}${endpoint}`
          response = await fetch(directUrl, config)
        } else {
          throw networkErr
        }
      }
      clearTimeout(timeoutId)

      // Handle 401 Unauthorized (Expired Session)
      if (response.status === 401) {
        storageService.clearSession()
        window.dispatchEvent(new CustomEvent('derby:unauthorized'))
      }

      let data = {}
      try {
        data = await response.json()
      } catch (_) {
        data = {}
      }

      if (!response.ok) {
        const errorMsg =
          data.message ||
          data.error ||
          data.msg ||
          data.err ||
          (typeof data === 'string' ? data : `API Error: ${response.status} ${response.statusText}`)
        throw new Error(errorMsg)
      }

      return data
    } catch (err) {
      clearTimeout(timeoutId)
      if (err.name === 'AbortError') {
        throw new Error('Request timed out. Please check your network connection.')
      }
      throw err
    }
  }

  // HTTP Helper Methods
  get(endpoint, params = {}, headers = {}) {
    const queryString = new URLSearchParams(params).toString()
    const url = queryString ? `${endpoint}?${queryString}` : endpoint
    return this.request(url, { method: 'GET', headers })
  }

  post(endpoint, body = {}, headers = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
      headers,
    })
  }

  put(endpoint, body = {}, headers = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
      headers,
    })
  }

  delete(endpoint, headers = {}) {
    return this.request(endpoint, { method: 'DELETE', headers })
  }
}

export const apiClient = new ApiClient()
export default apiClient

