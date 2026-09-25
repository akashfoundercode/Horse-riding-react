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
  { number: 3, name: 'ARJUN', img: '/HORSES/horse_no3_1mb.gif', portraitImg: '/Bet_horses/horses3.png.png', hue: 0, saturate: 1.0, brightness: 1.0, speedRating: '9.7' },
  { number: 4, name: 'ROYAL', img: '/HORSES/horse_4mb_hd.gif', portraitImg: '/Bet_horses/horses4.png.png', hue: 0, saturate: 1.0, brightness: 1.0, speedRating: '9.5' },
  { number: 5, name: 'TARZAN', img: '/HORSES/horse5_1mb.gif', portraitImg: '/Bet_horses/horses5.png', hue: 0, saturate: 1.0, brightness: 1.0, speedRating: '9.6' },
  { number: 6, name: 'CHETAK', img: '/HORSES/horse_jockey_6mb.gif', portraitImg: '/Bet_horses/horses6.png', hue: 0, saturate: 1.0, brightness: 1.0, speedRating: '9.6' },
  { number: 7, name: 'LUCKY', img: '/HORSES/horse_no7_1mb.gif', portraitImg: '/Bet_horses/horses7.png', hue: 0, saturate: 1.0, brightness: 1.0, speedRating: '9.7' },
  { number: 8, name: 'BAAZIGAR', img: '/HORSES/horse_no8_1mb.gif', portraitImg: '/Bet_horses/horses8.png', hue: 0, saturate: 1.0, brightness: 1.0, speedRating: '9.5' },
  { number: 9, name: 'JEET', img: '/HORSES/horse_no_9_1MB.gif', portraitImg: '/Bet_horses/horses9.png', hue: 0, saturate: 1.0, brightness: 1.0, speedRating: '9.7' },
  { number: 10, name: 'TIGER', img: '/HORSES/horse_number_10_1_1MB.gif', portraitImg: '/Bet_horses/horses10.png', hue: 0, saturate: 1.0, brightness: 1.0, speedRating: '9.8' },
  { number: 11, name: 'BADAL', img: '/HORSES/horse_number_11_1MB.gif', portraitImg: '/Bet_horses/horses11.png', hue: 0, saturate: 1.0, brightness: 1.0, speedRating: '9.6' },
  { number: 12, name: 'VICTOR', img: '/HORSES/horse_number_12_1_1MB.gif', portraitImg: '/Bet_horses/horses12.png', hue: 0, saturate: 1.0, brightness: 1.0, speedRating: '9.9' },
]

export function mapApiHorses(apiHorses) {
  if (!Array.isArray(apiHorses) || apiHorses.length === 0) return DEFAULT_HORSES

  // Sort by serialNumber or id ascending
  const sorted = [...apiHorses].sort((a, b) => (Number(a.serialNumber || a.id || a.number || 0)) - (Number(b.serialNumber || b.id || b.number || 0)))

  return sorted.map((h, i) => {
    const num = Number(h.serialNumber || h.id || h.number || i + 1)
    const defaultHorse = DEFAULT_HORSES.find((dh) => dh.number === num) || DEFAULT_HORSES[i] || DEFAULT_HORSES[0]

    // Normalize image URL from backend API (support /uploads/..., full URL, etc.)
    let portraitImg = h.imageUrl || h.image_url || h.image || h.portraitImg || defaultHorse.portraitImg
    if (typeof portraitImg === 'string') {
      if (portraitImg.startsWith('/uploads')) {
        portraitImg = `https://horseracing.siberiancrane.tech${portraitImg}`
      } else if (portraitImg.includes('localhost:3000')) {
        portraitImg = portraitImg.replace('http://localhost:3000', 'https://horseracing.siberiancrane.tech')
      }
    } else {
      portraitImg = defaultHorse.portraitImg
    }

    const horseName = (h.name || h.horseName || h.horse_name || defaultHorse.name || `HORSE ${num}`).toString().toUpperCase()

    return {
      id: h.id || num,
      number: num,
      serialNumber: num,
      name: horseName,
      portraitImg: portraitImg, // Dynamic image from API for bet screen
      img: defaultHorse.img, // Animation gif stays identical for deterministic 3D race
      status: h.status || 'active',
      hue: defaultHorse.hue || 0,
      saturate: defaultHorse.saturate || 1.0,
      brightness: defaultHorse.brightness || 1.0,
      speedRating: h.speedRating || defaultHorse.speedRating || '9.8',
    }
  })
}

class HorseService {
  async getHorses() {
    if (API_CONFIG.USE_MOCK_API) {
      const response = await mockBackendAdapter.getHorses()
      return mapApiHorses(response.horses || response.data?.horses || response.data)
    }

    try {
      const response = await apiClient.get(ENDPOINTS.GAME.HORSES)
      const data = response.data || response
      const rawHorses = data.horses || (Array.isArray(data) ? data : data.data?.horses)
      if (Array.isArray(rawHorses) && rawHorses.length > 0) {
        return mapApiHorses(rawHorses)
      }
      return DEFAULT_HORSES
    } catch (err) {
      console.warn('Backend /api/horses unavailable, falling back to simulation:', err.message)
      const response = await mockBackendAdapter.getHorses()
      return mapApiHorses(response.horses || response.data?.horses || response.data)
    }
  }
}

export const horseService = new HorseService()
export default horseService

