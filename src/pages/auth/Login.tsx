import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context'
import { Button } from '@/components/ui/button'
import { Mail, Lock, CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signIn, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // 로그인 전에 접근하려던 페이지 (ProtectedRoute에서 전달됨)
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/'

  // 회원가입 성공 메시지 표시 (한 번만)
  useEffect(() => {
    const state = location.state as { successMessage?: string, email?: string } | null
    if (state?.successMessage) {
      setSuccessMessage(state.successMessage)
      // 이메일이 있으면 자동으로 입력
      if (state.email) {
        setEmail(state.email)
      }
      // state 초기화 (뒤로가기 시 다시 표시되지 않도록)
      window.history.replaceState({}, document.title)
    }
  }, [])

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)

    if (loading) {
      return
    }

    // 입력값 검증
    if (!email.trim()) {
      setError('이메일을 입력해주세요.')
      return
    }

    if (!password) {
      setError('비밀번호를 입력해주세요.')
      return
    }

    try {
      const { error: authError } = await signIn({ email: email.trim(), password })

      if (authError) {
        let errorMessage = authError.message
        
        // 에러 메시지 한글화
        if (errorMessage.includes('Invalid login credentials')) {
          errorMessage = '이메일 또는 비밀번호가 올바르지 않습니다.'
        } else if (errorMessage.includes('Email not confirmed')) {
          errorMessage = '이메일 인증이 완료되지 않았습니다. 이메일을 확인해주세요.'
        } else if (errorMessage.includes('not registered')) {
          errorMessage = '등록되지 않은 이메일입니다.'
        }
        
        setError(errorMessage)
        return
      }

      // 로그인 성공 후 users 테이블에 사용자 정보 저장
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          const { error: userError } = await supabase
            .from('users')
            .upsert({
              id: user.id,
              email: user.email || '',
              name: user.user_metadata?.name || user.email?.split('@')[0] || '',
            }, {
              onConflict: 'id'
            })

          if (userError) {
            console.error('❌ users 테이블 저장 실패:', userError)
          }
        }
      } catch (userSaveError) {
        console.error('❌ users 테이블 저장 중 예외:', userSaveError)
      }

      // 진단 완료 여부 확인하여 리다이렉트
      const diagnosticCompleted = localStorage.getItem('diagnostic_completed')
      
      if (diagnosticCompleted === 'true') {
        // 진단을 완료한 경우
        localStorage.removeItem('diagnostic_completed') // 사용 후 삭제
        navigate('/dashboard', { replace: true })
      } else if (from === '/') {
        // 홈에서 로그인한 경우 대시보드로
        navigate('/dashboard', { replace: true })
      } else {
        // 그 외의 경우 원래 목적지로
        navigate(from, { replace: true })
      }
    } catch (err) {
      console.error('❌ 로그인 에러:', err)
      setError('로그인 중 오류가 발생했습니다. 다시 시도해주세요.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">로그인</h1>
        </div>

        {/* 회원가입 성공 메시지 */}
        {successMessage && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-green-800 dark:text-green-200 whitespace-pre-line">
                {successMessage}
              </p>
            </div>
          </div>
        )}

        {/* 이메일 로그인 폼 */}
        <form onSubmit={handleEmailLogin} className="space-y-4">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          <div className="flex items-center gap-4">
            <label htmlFor="email" className="text-sm font-medium w-24 flex-shrink-0">
              이메일
            </label>
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                disabled={loading}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label htmlFor="password" className="text-sm font-medium w-24 flex-shrink-0">
              비밀번호
            </label>
            <div className="relative flex-1">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="최소 6자 이상"
                required
                className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                disabled={loading}
              />
            </div>
          </div>

          <div className="flex items-center justify-end">
            <Link
              to="/forgot-password"
              className="text-sm text-primary hover:underline"
            >
              비밀번호를 잊으셨나요?
            </Link>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '로그인 중...' : '로그인'}
          </Button>
        </form>

        <div className="text-center text-sm">
          <span className="text-muted-foreground">계정이 없으신가요? </span>
          <Link to="/signup" className="text-primary hover:underline">
            회원가입
          </Link>
        </div>
      </div>
    </div>
  )
}

