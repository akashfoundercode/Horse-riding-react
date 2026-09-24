/**
 * User Service
 * Manages user profile fetching, statistics, and profile updates.
 */

import { authService } from './authService.js'

export const userService = {
  getProfile: () => authService.getProfile(),
}

export default userService

