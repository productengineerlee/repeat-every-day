import { supabase } from './supabaseClient'
import type { AuthError, User, Session } from '@supabase/supabase-js'

export interface SignUpCredentials {
  email: string
  password: string
  metadata?: Record<string, unknown>
}

export interface SignInCredentials {
  email: string
  password: string
}

export interface AuthResponse {
  user: User | null
  session: Session | null
  error: AuthError | null
}

/**
 * Email과 Password로 회원가입
 */
export async function signUp({
  email,
  password,
  metadata,
}: SignUpCredentials): Promise<AuthResponse> {
  try {
    console.log('🔐 회원가입 시도:', { email, hasPassword: !!password, metadata })
    
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: metadata,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      console.error('❌ 회원가입 에러:', {
        message: error.message,
        status: error.status,
        name: error.name,
      })
    } else {
      console.log('✅ 회원가입 성공:', {
        userId: data.user?.id,
        hasSession: !!data.session,
        emailConfirmed: data.user?.email_confirmed_at,
      })
    }

    return {
      user: data.user,
      session: data.session,
      error,
    }
  } catch (error) {
    console.error('❌ 회원가입 예외 발생:', error)
    return {
      user: null,
      session: null,
      error: error as AuthError,
    }
  }
}

/**
 * Email과 Password로 로그인
 */
export async function signIn({
  email,
  password,
}: SignInCredentials): Promise<AuthResponse> {
  try {
    console.log('🔑 로그인 시도:', { email })
    
    // 더미 클라이언트 사용 중인지 확인
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
    const isDummy = supabaseUrl.includes('placeholder') || 
                    supabaseUrl.includes('your-project-url') ||
                    !supabaseUrl || 
                    supabaseUrl.trim() === ''
    
    if (isDummy) {
      const errorMessage = 'Supabase가 설정되지 않았습니다. .env.local 파일에 실제 Supabase 프로젝트 정보를 입력하세요.'
      console.error('❌ 더미 Supabase 클라이언트 사용 중:', errorMessage)
      return {
        user: null,
        session: null,
        error: {
          name: 'ConfigurationError',
          message: errorMessage,
          status: 500,
        } as AuthError,
      }
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (error) {
      console.error('❌ 로그인 에러:', {
        message: error.message,
        status: error.status,
        name: error.name,
      })
      
      // 에러 메시지 한글화
      let userFriendlyMessage = error.message
      if (error.message.includes('Invalid login credentials')) {
        userFriendlyMessage = '이메일 또는 비밀번호가 올바르지 않습니다.'
      } else if (error.message.includes('Email not confirmed')) {
        userFriendlyMessage = '이메일 인증이 필요합니다. 받은 이메일의 인증 링크를 클릭해주세요.'
      } else if (error.message.includes('Too many requests')) {
        userFriendlyMessage = '너무 많은 로그인 시도가 있었습니다. 잠시 후 다시 시도해주세요.'
      }
      
      return {
        user: data?.user || null,
        session: data?.session || null,
        error: {
          ...error,
          message: userFriendlyMessage,
        },
      }
    } else {
      console.log('✅ 로그인 성공:', {
        userId: data.user?.id,
        hasSession: !!data.session,
      })
    }

    return {
      user: data.user,
      session: data.session,
      error,
    }
  } catch (error) {
    console.error('❌ 로그인 예외 발생:', error)
    return {
      user: null,
      session: null,
      error: error as AuthError,
    }
  }
}

/**
 * 로그아웃
 */
export async function signOut(): Promise<{ error: AuthError | null }> {
  try {
    const { error } = await supabase.auth.signOut()
    return { error }
  } catch (error) {
    return { error: error as AuthError }
  }
}

/**
 * 비밀번호 재설정 이메일 전송
 */
export async function resetPassword(
  email: string
): Promise<{ error: AuthError | null }> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    return { error }
  } catch (error) {
    return { error: error as AuthError }
  }
}

/**
 * 새 비밀번호로 업데이트
 */
export async function updatePassword(
  newPassword: string
): Promise<{ error: AuthError | null }> {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })
    return { error }
  } catch (error) {
    return { error: error as AuthError }
  }
}

/**
 * Google 소셜 로그인
 */
export async function signInWithGoogle(): Promise<{ error: AuthError | null }> {
  try {
    console.log('🔐 Google OAuth 시작:', {
      redirectTo: `${window.location.origin}/auth/callback`,
      origin: window.location.origin,
    })
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })
    
    console.log('📡 Google OAuth 응답:', { 
      hasData: !!data, 
      hasUrl: !!data?.url,
      error: error ? {
        message: error.message,
        status: error.status,
        name: error.name,
      } : null,
    })
    
    // OAuth는 리다이렉트되므로 에러가 없으면 성공으로 간주
    // 하지만 프로바이더가 활성화되지 않은 경우 에러가 발생할 수 있음
    if (error) {
      console.error('❌ Google OAuth 에러:', error)
      return { error }
    }
    
    // data.url이 없으면 에러로 간주 (프로바이더 미활성화 등)
    if (!data?.url) {
      console.warn('⚠️ Google OAuth URL이 없습니다. 프로바이더가 활성화되지 않았을 수 있습니다.')
      return {
        error: {
          name: 'OAuthError',
          message: 'Google 로그인이 활성화되지 않았습니다. Supabase 대시보드에서 Google OAuth를 활성화해주세요.',
          status: 400,
        } as AuthError,
      }
    }
    
    console.log('✅ Google OAuth 리다이렉트 URL 생성됨:', data.url.substring(0, 100) + '...')
    
    // OAuth는 리다이렉트되므로 여기서는 에러 없음
    // 실제 인증은 리다이렉트 후 처리됨
    return { error: null }
  } catch (error) {
    console.error('❌ Google OAuth 예외 발생:', error)
    const errorMessage = error instanceof Error ? error.message : 'Google 로그인 중 오류가 발생했습니다.'
    
    // 400 에러인 경우 구체적인 메시지 제공
    if (errorMessage.includes('400') || errorMessage.includes('Bad Request')) {
      return {
        error: {
          name: 'OAuthError',
          message: 'Google 로그인이 활성화되지 않았습니다. Supabase 대시보드에서 Google OAuth를 설정해주세요.',
          status: 400,
        } as AuthError,
      }
    }
    
    return { 
      error: {
        name: 'OAuthError',
        message: errorMessage,
      } as AuthError 
    }
  }
}

/**
 * Apple 소셜 로그인
 */
export async function signInWithApple(): Promise<{ error: AuthError | null }> {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    
    // OAuth는 리다이렉트되므로 에러가 없으면 성공으로 간주
    if (error) {
      return { error }
    }
    
    // data.url이 없으면 에러로 간주 (프로바이더 미활성화 등)
    if (!data?.url) {
      return {
        error: {
          name: 'OAuthError',
          message: 'Apple 로그인이 활성화되지 않았습니다. 관리자에게 문의하세요.',
        } as AuthError,
      }
    }
    
    return { error: null }
  } catch (error) {
    console.error('Apple OAuth error:', error)
    return { 
      error: {
        name: 'OAuthError',
        message: error instanceof Error ? error.message : 'Apple 로그인 중 오류가 발생했습니다.',
      } as AuthError 
    }
  }
}

/**
 * 현재 세션 가져오기
 */
export async function getSession(): Promise<Session | null> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    return session
  } catch {
    return null
  }
}

/**
 * 현재 사용자 가져오기
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    return user
  } catch {
    return null
  }
}



