import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase 환경 변수 누락:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
  })
  throw new Error(
    'Missing Supabase environment variables. Please check your .env.local file.'
  )
}

// 싱글톤 패턴으로 Supabase 클라이언트 생성 (중복 인스턴스 방지)
let supabaseInstance: ReturnType<typeof createClient> | null = null

function getSupabaseClient() {
  if (!supabaseInstance) {
    console.log('🔧 Supabase 클라이언트 생성:', {
      url: supabaseUrl?.substring(0, 30) + '...',
      hasKey: !!supabaseAnonKey,
    })
    
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      realtime: {
        // Realtime 기능을 사용하지 않으면 연결 시도하지 않음
        params: {
          eventsPerSecond: 10,
        },
      },
      global: {
        headers: {
          'x-client-info': 'certiq-web',
        },
      },
    })
    
    // 에러 리스너 추가 (디버깅용)
    supabaseInstance.auth.onAuthStateChange((event, session) => {
      console.log('🔐 인증 상태 변경:', { event, hasSession: !!session })
    })
  }
  return supabaseInstance
}

export const supabase = getSupabaseClient()


