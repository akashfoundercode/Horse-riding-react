/**
 * API & Environment Configuration
 * Centralized configuration for REST API and WebSocket connections.
 */

const API_CONFIG = {
  // Base URL for backend REST API (Overridable via .env)
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'https://api.derbyarena.game/v1',

  // WebSocket Server URL for live multiplayer / round events TESTING
  WS_URL: import.meta.env.VITE_WS_URL || 'wss://api.derbyarena.game/ws',

  // Flag to enable client-side mock adapter if backend is not reachable or in standalone demo mode
  USE_MOCK_API: import.meta.env.VITE_USE_MOCK_API !== 'false',

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

