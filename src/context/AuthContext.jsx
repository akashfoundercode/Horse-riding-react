/**
 * Auth Context & Provider
 * Global authentication state for logged in users, guest players, and session events.
 */

import React, { createContext, useContext, useEffect, useState } from 'react'
import { authService } from '../services/authService.js'
import { storageService } from '../services/storageService.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => storageService.getUser())
  const [token, setToken] = useState(() => storageService.getToken())
  const [isLoading, setIsLoading] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)

  const isAuthenticated = Boolean(user && token)
  const isGuest = Boolean(user?.isGuest)

  useEffect(() => {
    const urlParams = storageService.getUrlParams()
    if (urlParams.userId !== undefined && urlParams.userId !== null) {
      const activeUser = storageService.getUser()
      setUser(activeUser)
    }

    // On page reload/mount, sync fresh profile and balance from backend GET /api/auth/me
    authService
      .getProfile()
      .then((refreshedUser) => {
        if (refreshedUser && Object.keys(refreshedUser).length > 0) {
          setUser(refreshedUser)
        }
      })
      .catch(() => { })

    // Listen for unauthorized 401 events to auto logout
    const handleUnauthorized = () => {
      setUser(null)
      setToken(null)
      setIsAuthModalOpen(true)
    }

    window.addEventListener('derby:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('derby:unauthorized', handleUnauthorized)
  }, [])

  const login = async (credentials) => {
    setIsLoading(true)
    try {
      const data = await authService.login(credentials)
      setUser(data.user)
      setToken(data.token)
      setIsAuthModalOpen(false)
      window.dispatchEvent(new CustomEvent('derby:auth_changed', { detail: data }))
      return { success: true, data }
    } catch (err) {
      return { success: false, error: err.message }
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (userData) => {
    setIsLoading(true)
    try {
      const data = await authService.register(userData)
      setUser(data.user)
      setToken(data.token)
      setIsAuthModalOpen(false)
      window.dispatchEvent(new CustomEvent('derby:auth_changed', { detail: data }))
      return { success: true, data }
    } catch (err) {
      return { success: false, error: err.message }
    } finally {
      setIsLoading(false)
    }
  }

  const guestLogin = async () => {
    setIsLoading(true)
    try {
      const data = await authService.guestLogin()
      setUser(data.user)
      setToken(data.token)
      setIsAuthModalOpen(false)
      return { success: true, data }
    } catch (err) {
      return { success: false, error: err.message }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    setIsLoading(true)
    try {
      await authService.logout()
      setUser(null)
      setToken(null)
      setIsProfileModalOpen(false)
      setIsAuthModalOpen(true)
    } finally {
      setIsLoading(false)
    }
  }

  const value = {
    user,
    token,
    isAuthenticated,
    isGuest,
    isLoading,
    isAuthModalOpen,
    setIsAuthModalOpen,
    isProfileModalOpen,
    setIsProfileModalOpen,
    login,
    register,
    guestLogin,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext

