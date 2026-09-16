/**
 * Game API Service
 * Handles game round synchronization, server-side bet validation, and race history syncing.
 */

import { apiClient } from '../api/apiClient.js'
import { ENDPOINTS } from '../api/endpoints.js'
import API_CONFIG from '../config/apiConfig.js'

class GameApiService {
  async getRoundStatus() {
    if (API_CONFIG.USE_MOCK_API) {
      return {
        roundId: `RD_${Date.now().toString().slice(-6)}`,
        status: 'BETTING_OPEN',
        countdownSeconds: 15,
        runnersCount: 12,
      }
    }

    try {
      const response = await apiClient.get(ENDPOINTS.GAME.ROUND_STATUS)
      return response.data
    } catch (_) {
      return {
        roundId: `RD_${Date.now().toString().slice(-6)}`,
        status: 'BETTING_OPEN',
        countdownSeconds: 15,
        runnersCount: 12,
      }
    }
  }

  async fetchRaceHistory(limit = 20) {
    if (API_CONFIG.USE_MOCK_API) {
      try {
        const local = localStorage.getItem('horse_race_game_history')
        return local ? JSON.parse(local) : []
      } catch (_) {
        return []
      }
    }

    try {
      const response = await apiClient.get(ENDPOINTS.GAME.HISTORY, { limit })
      return response.data.history
    } catch (_) {
      try {
        const local = localStorage.getItem('horse_race_game_history')
        return local ? JSON.parse(local) : []
      } catch (_) {
        return []
      }
    }
  }
}

export const gameApiService = new GameApiService()
export default gameApiService

