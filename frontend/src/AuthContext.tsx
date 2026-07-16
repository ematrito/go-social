import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import * as api from './api'

interface AuthState {
  token: string | null
  user: api.User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string) => Promise<api.UserWithToken>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(api.getToken)
  const [user, setUser] = useState<api.User | null>(null)

  const refreshUser = useCallback(async () => {
    const currentToken = api.getToken()
    if (!currentToken) return
    const userId = api.userIdFromToken()
    if (!userId) return
    try {
      const u = await api.getUser(userId)
      setUser(u)
      setToken(currentToken)
    } catch {
      api.clearToken()
      setToken(null)
      setUser(null)
    }
  }, [])

  useEffect(() => {
    if (token) {
      refreshUser()
    } else {
      setUser(null)
    }
  }, [token, refreshUser])

  const login = async (email: string, password: string) => {
    const t = await api.login(email, password)
    api.setToken(t)
    setToken(t)
    const userId = api.userIdFromToken()
    if (userId) {
      const u = await api.getUser(userId)
      setUser(u)
    }
  }

  const register = (username: string, email: string, password: string) => {
    return api.register(username, email, password)
  }

  const logout = () => {
    api.clearToken()
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{
      token,
      user,
      isAuthenticated: !!token && !!user,
      login,
      register,
      logout,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
