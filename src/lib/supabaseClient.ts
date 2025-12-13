import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// 플레이스홀더 값 체크
const isPlaceholder = (value: string | undefined): boolean => {
  if (!value) return true
  const placeholderPatterns = [
    'your-project-url-here',
    'your-anon-key-here',
    'your-supabase-project-url',
    'your-supabase-anon-key',
  ]
  return placeholderPatterns.some(pattern => 
    value.toLowerCase().includes(pattern.toLowerCase())
  )
}

// 최종 URL과 Key 결정
let finalUrl = supabaseUrl || ''
let finalKey = supabaseAnonKey || ''
const usingDummy = isPlaceholder(supabaseUrl) || isPlaceholder(supabaseAnonKey)

if (usingDummy) {
  if (import.meta.env.DEV) {
    // 개발 모드: 더미 값 사용 (화면은 나오도록)
    finalUrl = 'https://placeholder.supabase.co'
    finalKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
    console.warn('⚠️ 개발 모드: Supabase 환경 변수가 설정되지 않아 더미 클라이언트를 사용합니다.')
    console.warn('💡 실제 기능을 사용하려면 .env.local 파일에 Supabase 프로젝트 정보를 입력하세요.')
  } else {
    // 프로덕션 모드: 에러 발생
    throw new Error(
      'Supabase 환경 변수가 플레이스홀더 값으로 설정되어 있습니다. .env.local 파일에 실제 Supabase 프로젝트 정보를 입력하세요.'
    )
  }
}

if (!finalUrl || !finalKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
}

// 싱글톤 패턴으로 Supabase 클라이언트 생성 (중복 인스턴스 방지)
let supabaseInstance: ReturnType<typeof createClient> | null = null

function getSupabaseClient() {
  if (!supabaseInstance) {
    console.log('🔧 Supabase 클라이언트 생성:', {
      url: finalUrl?.substring(0, 30) + '...',
      hasKey: !!finalKey,
      isDummy: usingDummy,
    })
    
    supabaseInstance = createClient(finalUrl, finalKey, {
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
