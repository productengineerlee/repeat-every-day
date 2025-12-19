import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { CheckCircle, ArrowRight } from 'lucide-react'

export default function AuthCallback() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // URL 파라미터에서 에러 확인
        const urlParams = new URLSearchParams(window.location.search)
        const errorParam = urlParams.get('error')
        const errorDescription = urlParams.get('error_description')
        
        if (errorParam) {
          console.error('❌ OAuth 에러 파라미터:', { errorParam, errorDescription })
          
          // Google 프로바이더 미활성화 에러 처리
          if (
            errorParam.includes('validation_failed') ||
            errorDescription?.includes('not enabled') ||
            errorDescription?.includes('Unsupported provider')
          ) {
            setError('Google 로그인이 활성화되지 않았습니다. 이메일로 로그인해주세요.')
            setLoading(false)
            return
          }
          
          setError(errorDescription || errorParam || '인증 오류가 발생했습니다.')
          setLoading(false)
          return
        }
        
        // URL 해시에서 세션 정보 가져오기
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          console.error('❌ 세션 에러:', sessionError)
          throw sessionError
        }

        if (session) {
          console.log('✅ 인증 성공:', { userId: session.user.id })
          
          // users 테이블에 사용자 정보 저장 (회원가입 직후 세션이 없었던 경우 대비)
          try {
            const { error: userError } = await supabase
              .from('users')
              .upsert({
                id: session.user.id,
                email: session.user.email || '',
                name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || '',
              }, {
                onConflict: 'id'
              })

            if (userError) {
              console.error('❌ users 테이블 저장 실패:', userError)
              // users 테이블 저장 실패해도 로그인은 계속 진행
            } else {
              console.log('✅ users 테이블 저장 성공')
            }
          } catch (userSaveError) {
            console.error('❌ users 테이블 저장 중 예외:', userSaveError)
            // 에러가 발생해도 로그인은 계속 진행
          }
          
          // 로그인 성공 - 성공 상태로 변경
          console.log('✅ 이메일 인증 완료')
          setSuccess(true)
          setLoading(false)
        } else {
          console.warn('⚠️ 세션이 없습니다. 로그인 페이지로 이동합니다.')
          // 세션이 없음 - 로그인 페이지로 리다이렉트
          navigate('/login', { replace: true })
        }
      } catch (err) {
        console.error('❌ 인증 콜백 예외:', err)
        const errorMessage = err instanceof Error ? err.message : '인증 오류가 발생했습니다.'
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    handleAuthCallback()
  }, [navigate])

  // 성공 상태 표시
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-green-50 to-white">
        <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-lg text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-green-600">이메일 인증 완료!</h1>
          <p className="text-muted-foreground">
            회원가입이 완료되었습니다!
            <br />
            지금 바로 사전 테스트를 시작해보세요.
          </p>
          <Button
            onClick={() => {
              console.log('→ 온보딩(사전 테스트)으로 이동')
              navigate('/onboarding', { replace: true })
            }}
            className="w-full gap-2"
            size="lg"
          >
            학습 시작하기
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-blue-50 to-white">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">인증 처리 중...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-blue-50 to-white">
        <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-lg text-center space-y-4">
          <h1 className="text-2xl font-bold text-red-600">인증 오류</h1>
          <p className="text-muted-foreground">{error}</p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => navigate('/login')} variant="outline">
              로그인 페이지로 돌아가기
            </Button>
            <Button onClick={() => navigate('/')}>
              홈으로 가기
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return null
}

