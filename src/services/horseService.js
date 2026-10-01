/**
 * Horse Service
 * Manages fetching dynamic horse profiles, names, serial numbers, and betting card images from /api/horses.
 */

import { apiClient } from '../api/apiClient.js'
import { ENDPOINTS } from '../api/endpoints.js'
import { mockBackendAdapter } from '../api/mockAdapter.js'
import API_CONFIG from '../config/apiConfig.js'

export const DEFAULT_HORSES = [
  { number: 1, name: 'TOOFAN', img: '/HORSES/horse_no1_1mb.gif', portraitImg: '/Bet_horses/horses1.png', hue: 0, saturate: 1.0, brightness: 1.0, speedRating: '9.8' },
  { number: 2, name: 'RANGEELA', img: '/HORSES/horse_number_2_1MB.gif', portraitImg: '/Bet_horses/horses2.png', hue: 0, saturate: 1.0, brightness: 1.0, speedRating: '9.6' },
  { number: 3, name: 'ARJUN', img: '/HORSES/horse_no3_1mb.gif', portraitImg: '/Bet_horses/horses3.png', hue: 0, saturate: 1.0, brightness: 1.0, speedRating: '9.7' },
  { number: 4, name: 'ROYAL', img: '/HORSES/horse_4mb_hd.gif', portraitImg: '/Bet_horses/horses4.png', hue: 0, saturate: 1.0, brightness: 1.0, speedRating: '9.5' },
  { number: 5, name: 'TARZAN', img: '/HORSES/horse5_1mb.gif', portraitImg: '/Bet_horses/horses5.png', hue: 0, saturate: 1.0, brightness: 1.0, speedRating: '9.6' },
  { number: 6, name: 'CHETAK', img: '/HORSES/horse_jockey_6mb.gif', portraitImg: '/Bet_horses/horses6.png', hue: 0, saturate: 1.0, brightness: 1.0, speedRating: '9.6' },
  { number: 7, name: 'LUCKY', img: '/HORSES/horse_no7_1mb.gif', portraitImg: '/Bet_horses/horses7.png', hue: 0, saturate: 1.0, brightness: 1.0, speedRating: '9.7' },
  { number: 8, name: 'BAAZIGAR', img: '/HORSES/horse_no8_1mb.gif', portraitImg: '/Bet_horses/horses8.png', hue: 0, saturate: 1.0, brightness: 1.0, speedRating: '9.5' },
  { number: 9, name: 'JEET', img: '/HORSES/horse_no_9_1MB.gif', portraitImg: '/Bet_horses/horses9.png', hue: 0, saturate: 1.0, brightness: 1.0, speedRating: '9.7' },
  { number: 10, name: 'TIGER', img: '/HORSES/horse_number_10_1_1MB.gif', portraitImg: '/Bet_horses/horses10.png', hue: 0, saturate: 1.0, brightness: 1.0, speedRating: '9.8' },
  { number: 11, name: 'BADAL', img: '/HORSES/horse_number_11_1MB.gif', portraitImg: '/Bet_horses/horses11.png', hue: 0, saturate: 1.0, brightness: 1.0, speedRating: '9.6' },
  { number: 12, name: 'VICTOR', img: '/HORSES/horse_number_12_1_1MB.gif', portraitImg: '/Bet_horses/horses12.png', hue: 0, saturate: 1.0, brightness: 1.0, speedRating: '9.9' },
]

export const DEFAULT_NAMES = DEFAULT_HORSES.map((h) => h.name)

/**
 * Universal helper to extract an array of horses from various API response shapes
 */
export function extractHorsesArray(response) {
  if (!response) return null
  const data = response.data !== undefined ? response.data : response

  if (Array.isArray(data)) return data
  if (Array.isArray(data?.horses)) return data.horses
  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data?.runners)) return data.runners
  if (Array.isArray(data?.data?.horses)) return data.data.horses
  if (Array.isArray(data?.data?.runners)) return data.data.runners
  if (Array.isArray(data?.race?.horses)) return data.race.horses
  if (Array.isArray(data?.race?.runners)) return data.race.runners
  if (Array.isArray(data?.results)) return data.results
  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.list)) return data.list

  if (Array.isArray(response?.horses)) return response.horses
  if (Array.isArray(response?.data?.horses)) return response.data.horses
  return null
}

export function mapApiHorses(apiHorses) {
  if (!Array.isArray(apiHorses) || apiHorses.length === 0) return DEFAULT_HORSES

  const getHorseNum = (h, fallbackIdx) => {
    const raw =
      h?.number ??
      h?.serialNumber ??
      h?.serial_number ??
      h?.horseNumber ??
      h?.horse_number ??
      h?.horseSerial ??
      h?.horse_serial ??
      h?.horse_id ??
      h?.horseId ??
      h?.id ??
      h?.stall ??
      h?.lane ??
      (fallbackIdx + 1)
    const n = Number(raw)
    return !isNaN(n) && n >= 1 && n <= 12 ? n : (fallbackIdx + 1)
  }

  // Sort by serial/number ascending
  const sorted = [...apiHorses].sort((a, b) => getHorseNum(a, 0) - getHorseNum(b, 0))

  return sorted.map((h, i) => {
    const num = getHorseNum(h, i)
    const defaultHorse = DEFAULT_HORSES.find((dh) => dh.number === num) || DEFAULT_HORSES[i] || DEFAULT_HORSES[0]

    // Robust name extraction from any backend schema
    const rawName =
      h?.name ??
      h?.horse_name ??
      h?.horseName ??
      h?.winnerHorseName ??
      h?.winner_horse_name ??
      h?.winnerName ??
      h?.winner_name ??
      h?.title ??
      h?.label
    const cleanName = rawName && typeof rawName === 'string' && rawName.trim().length > 0
      ? rawName.trim().toUpperCase()
      : defaultHorse.name

    // Robust image URL extraction
    const rawImg =
      h?.imageUrl ??
      h?.image_url ??
      h?.image ??
      h?.img ??
      h?.photo ??
      h?.photoUrl ??
      h?.photo_url ??
      h?.avatar ??
      h?.horseImage ??
      h?.horse_image ??
      h?.picture ??
      h?.portrait ??
      h?.portraitImg

    let portraitImg = defaultHorse.portraitImg
    if (rawImg && typeof rawImg === 'string' && rawImg.trim().length > 0) {
      let trimmed = rawImg.trim()
      if (trimmed.startsWith('uploads/')) {
        trimmed = '/' + trimmed
      }
      portraitImg = trimmed
    }

    return {
      ...defaultHorse,
      id: h?.id || num,
      number: num,
      serialNumber: num,
      name: cleanName,
      portraitImg,
      img: defaultHorse.img, // Animation gif stays identical for deterministic 3D race
      status: h?.status || 'active',
      speedRating: h?.speedRating || h?.speed_rating || defaultHorse.speedRating || '9.8',
    }
  })
}

class HorseService {
  async getHorses() {
    if (API_CONFIG.USE_MOCK_API) {
      const response = await mockBackendAdapter.getHorses()
      const raw = extractHorsesArray(response)
      return mapApiHorses(raw || [])
    }

    let rawHorses = null

    // 1. Try primary endpoint: /api/horses
    try {
      const response = await apiClient.get(ENDPOINTS.GAME.HORSES)
      rawHorses = extractHorsesArray(response)
    } catch (err) {
      console.warn('[Horse Service] Notice fetching /api/horses:', err?.message || err)
    }

    // 2. Try secondary endpoint if empty: /api/races/current
    if (!rawHorses || rawHorses.length === 0) {
      try {
        const response = await apiClient.get(ENDPOINTS.GAME.CURRENT_RACE)
        rawHorses = extractHorsesArray(response)
      } catch (_) { }
    }

    // 3. Try tertiary endpoint if empty: /api/races
    if (!rawHorses || rawHorses.length === 0) {
      try {
        const response = await apiClient.get(ENDPOINTS.GAME.RACES)
        rawHorses = extractHorsesArray(response)
      } catch (_) { }
    }

    if (Array.isArray(rawHorses) && rawHorses.length > 0) {
      return mapApiHorses(rawHorses)
    }

    // 4. Fallback to mock adapter if real backend has no horses table
    try {
      const mockRes = await mockBackendAdapter.getHorses()
      const mockRaw = extractHorsesArray(mockRes)
      if (Array.isArray(mockRaw) && mockRaw.length > 0) {
        return mapApiHorses(mockRaw)
      }
    } catch (_) { }

    return DEFAULT_HORSES
  }
}

export const horseService = new HorseService()
export default horseService
