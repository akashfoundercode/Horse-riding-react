/**
 * API & Environment Configuration
 * Centralized configuration for REST API and WebSocket connections.
 */

const LIVE_URL = 'https://horseracing.siberiancrane.tech'
const LIVE_WS_URL = 'wss://horseracing.siberiancrane.tech'

const API_CONFIG = {
  // Base URL for backend REST API
  BASE_URL: import.meta.env.VITE_API_BASE_URL || LIVE_URL,

  // Socket.IO Server URL for live multiplayer / round events
  SOCKET_URL: import.meta.env.VITE_SOCKET_URL || LIVE_URL,

  // WebSocket Server URL for live multiplayer / round events
  WS_URL: import.meta.env.VITE_WS_URL || LIVE_WS_URL,

  // Mock API fallback switch - Strictly disabled for real backend API
  USE_MOCK_API: false,

  // Request Timeout in milliseconds
  REQUEST_TIMEOUT_MS: 15000,

  // Default currency & operator identification
  CURRENCY: import.meta.env.VITE_CURRENCY || 'COINS',
  OPERATOR_ID: import.meta.env.VITE_OPERATOR_ID || 'operator_tez_rafter',
  GAME_ID: 'HORSE_DERBY_3D_12',

  // Versioning
  API_VERSION: 'v1',
  CLIENT_VERSION: '1.0.0',
}

export default API_CONFIG
