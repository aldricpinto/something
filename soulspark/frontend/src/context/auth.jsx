import React, { createContext, useContext, useEffect, useState } from 'react'

const AuthCtx = createContext(null)

export function AuthProvider({ children }){
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('manna_user')
    return raw ? JSON.parse(raw) : null
  })
  const [token, setToken] = useState(() => localStorage.getItem('manna_token') || '')

  function save(auth){
    setUser(auth.user)
    setToken(auth.access_token)
    localStorage.setItem('manna_user', JSON.stringify(auth.user))
    localStorage.setItem('manna_token', auth.access_token)
  }

  function logout(){
    setUser(null)
    setToken('')
    localStorage.removeItem('manna_user')
    localStorage.removeItem('manna_token')
  }

  const value = { user, token, save, logout }
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

export function useAuth(){
  return useContext(AuthCtx)
}

