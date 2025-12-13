/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { User, Session, AuthError } from '@supabase/supabase-js'
import { signIn, signUp, signOut, signInWithGoogle, signInWithApple } from '@/lib/auth'
import type { SignInCredentials, SignUpCredentials } from '@/lib/auth'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (credentials: SignInCredentials) => Promise<{ error: AuthError | null }>
  signUp: (credentials: SignUpCredentials) => Promise<{ error: AuthError | null; user: User | null }>
  signOut: () => Promise<{ error: AuthError | null }>
  signInWithGoogle: () => Promise<{ error: AuthError | null }>
  signInWithApple: () => Promise<{ error: AuthError | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 초기 세션 가져오기
    const getInitialSession = async () => {
      try {
        const {
          data: { session: initialSession },
        } = await supabase.auth.getSession()
        setSession(initialSession)
        setUser(initialSession?.user ?? null)
      } catch (error) {
        console.error('Error getting initial session:', error)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // 인증 상태 변경 리스너 설정
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      setSession(currentSession)
      setUser(currentSession?.user ?? null)

      // 세션이 변경될 때 로딩 상태 업데이트
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        setLoading(false)
      }
    })

    // 클린업
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handleSignIn = async (credentials: SignInCredentials) => {
    setLoading(true)
    try {
      const { error } = await signIn(credentials)
      return { error }
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (credentials: SignUpCredentials) => {
    setLoading(true)
    try {
      const result = await signUp(credentials)
      return { error: result.error, user: result.user }
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    setLoading(true)
    try {
      const { error } = await signOut()
      return { error }
    } finally {
      setLoading(false)
    }
  }

  const handleSignInWithGoogle = async () => {
    setLoading(true)
    try {
      const { error } = await signInWithGoogle()
      return { error }
    } finally {
      // OAuth는 리다이렉트되므로 여기서는 로딩 상태만 설정
      // 실제 로딩 해제는 onAuthStateChange에서 처리됨
    }
  }

  const handleSignInWithApple = async () => {
    setLoading(true)
    try {
      const { error } = await signInWithApple()
      return { error }
    } finally {
      // OAuth는 리다이렉트되므로 여기서는 로딩 상태만 설정
      // 실제 로딩 해제는 onAuthStateChange에서 처리됨
    }
  }

  const value: AuthContextType = {
    user,
    session,
    loading,
    signIn: handleSignIn,
    signUp: handleSignUp,
    signOut: handleSignOut,
    signInWithGoogle: handleSignInWithGoogle,
    signInWithApple: handleSignInWithApple,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

