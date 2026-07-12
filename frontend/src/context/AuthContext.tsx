import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { api } from '@/lib/axios'
import { clearToken, getToken, setToken } from '@/lib/auth'

interface AuthUser {
  id: string
  shopName: string
  contactNumber: string
  role: string
}

interface LoginInput {
  contactNumber: string
  password: string
}

interface RegisterInput {
  shopName: string
  contactNumber: string
  password: string
}

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  login: (input: LoginInput) => Promise<void>
  register: (input: RegisterInput) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!getToken()) {
      setLoading(false)
      return
    }
    api
      .get('/auth/me')
      .then((res) => setUser(res.data))
      .catch(() => {
        clearToken()
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (input: LoginInput) => {
    const res = await api.post('/auth/login', input)
    setToken(res.data.accessToken)
    setUser(res.data.user)
  }, [])

  const register = useCallback(async (input: RegisterInput) => {
    const res = await api.post('/auth/register', input)
    setToken(res.data.accessToken)
    setUser(res.data.user)
  }, [])

  const logout = useCallback(() => {
    clearToken()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
