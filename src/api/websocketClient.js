/**
 * Real-time WebSocket Client
 * Ready for live multiplayer rooms, synchronized round timers, live odds, and broadcast results.
 */

import API_CONFIG from '../config/apiConfig.js'
import { storageService } from '../services/storageService.js'

class WebSocketClient {
  constructor() {
    this.ws = null
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectInterval = 3000
    this.listeners = new Map()
    this.isConnected = false
  }

  connect() {
    if (API_CONFIG.USE_MOCK_API) {
      // In Mock mode, no need for active socket connection
      this.isConnected = false
      return
    }

    try {
      const token = storageService.getToken()
      const url = `${API_CONFIG.WS_URL}?token=${token || ''}&operator=${API_CONFIG.OPERATOR_ID}`
      this.ws = new WebSocket(url)

      this.ws.onopen = () => {
        this.isConnected = true
        this.reconnectAttempts = 0
        this.emit('connected', { timestamp: Date.now() })
      }

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          if (message && message.type) {
            this.emit(message.type, message.payload)
          }
        } catch (_) { }
      }

      this.onclose = () => {
        this.isConnected = false
        this.attemptReconnect()
      }

      this.onerror = (err) => {
        this.isConnected = false
      }
    } catch (_) {
      this.isConnected = false
    }
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      setTimeout(() => this.connect(), this.reconnectInterval)
    }
  }

  send(type, payload = {}) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload, timestamp: Date.now() }))
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event).add(callback)
    return () => this.off(event, callback)
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback)
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach((cb) => {
        try {
          cb(data)
        } catch (_) { }
      })
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
      this.isConnected = false
    }
  }
}

export const webSocketClient = new WebSocketClient()
export default webSocketClient

