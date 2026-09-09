import React, { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = sessionStorage.getItem('csr_token')
    if (!token) {
      setLoading(false)
      return
    }
    api
      .me()
      .then(({ user }) => setUser(user))
      .catch(() => {
        sessionStorage.removeItem('csr_token')
      })
      .finally(() => setLoading(false))
  }, [])

  function persist(token, user) {
    sessionStorage.setItem('csr_token', token)
    setUser(user)
  }

  async function studentSignup(payload) {
    try {
      const { token, user } = await api.studentSignup(payload)
      persist(token, user)
      return { ok: true }
    } catch (e) {
      return { ok: false, message: e.message }
    }
  }

  async function studentLogin(email, password) {
    try {
      const { token, user } = await api.studentLogin({ email, password })
      persist(token, user)
      return { ok: true }
    } catch (e) {
      return { ok: false, message: e.message }
    }
  }

  async function driverSignup(payload) {
    try {
      const { token, user } = await api.driverSignup(payload)
      persist(token, user)
      return { ok: true }
    } catch (e) {
      return { ok: false, message: e.message }
    }
  }

  async function driverLogin(identifier, password) {
    try {
      const { token, user } = await api.driverLogin({ identifier, password })
      persist(token, user)
      return { ok: true }
    } catch (e) {
      return { ok: false, message: e.message }
    }
  }

  function logout() {
    sessionStorage.removeItem('csr_token')
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, studentSignup, studentLogin, driverSignup, driverLogin, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
