import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context'
import { Button } from '@/components/ui/button'
import { Mail, Lock, User, Chrome, Apple, CheckCircle2 } from 'lucide-react'

export default function SignUp() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signUp, signInWithGoogle, signInWithApple, loading } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // 회원가입 전에 접근하려던 페이지
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard'

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    // 입력값 검증
    if (!name.trim()) {
      setError('이름을 입력해주세요.')
      return
    }

    if (!email.trim()) {
      setError('이메일을 입력해주세요.')
      return
    }

    // 비밀번호 확인
    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }

    // 비밀번호 길이 확인
    if (password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.')
      return
    }

    try {
      console.log('📝 회원가입 폼 제출:', { email: email.trim(), hasName: !!name.trim() })
      
      const { error: authError, user } = await signUp({
        email: email.trim(),
        password,
        metadata: {
          name: name.trim(),
        },
      })

      if (authError) {
        console.error('❌ 회원가입 에러 발생:', authError)
        // 에러 메시지 한글화
        let errorMessage = authError.message
        if (errorMessage.includes('already registered') || errorMessage.includes('already exists')) {
          errorMessage = '이미 가입된 이메일입니다.'
        } else if (errorMessage.includes('invalid email')) {
          errorMessage = '유효한 이메일 주소를 입력해주세요.'
        } else if (errorMessage.includes('password')) {
          errorMessage = '비밀번호가 너무 짧거나 약합니다.'
        } else if (errorMessage.includes('rate limit') || errorMessage.includes('too many')) {
          errorMessage = '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.'
        }
        setError(errorMessage)
        return
      }

      if (!user) {
        console.error('❌ 사용자 정보가 없습니다')
        setError('회원가입에 실패했습니다. 다시 시도해주세요.')
        return
      }

      console.log('✅ 회원가입 성공:', { userId: user.id, email: user.email })

      // 회원가입 성공
      setSuccess(true)
      
      // 이메일 인증이 필요한 경우 안내 메시지 표시
      // 세션이 없으면 이메일 인증이 필요한 경우이므로 홈으로 리다이렉트
      setTimeout(() => {
        navigate('/', { replace: true })
      }, 3000)
    } catch (err) {
      console.error('❌ 회원가입 예외 발생:', err)
      const errorMessage = err instanceof Error ? err.message : '회원가입 중 오류가 발생했습니다.'
      setError(`회원가입 중 오류가 발생했습니다: ${errorMessage}`)
    }
  }

  const handleGoogleSignUp = async () => {
    setError(null)
    setSuccess(false)

    try {
      console.log('🔄 Google 회원가입 시작...')
      const { error: authError } = await signInWithGoogle()

      if (authError) {
        console.error('❌ Google 회원가입 에러:', authError)
        let errorMessage = authError.message
        
        // 에러 메시지 한글화 및 구체화
        if (errorMessage.includes('popup') || errorMessage.includes('blocked')) {
          errorMessage = '팝업이 차단되었습니다. 브라우저 설정에서 팝업을 허용해주세요.'
        } else if (
          errorMessage.includes('not enabled') || 
          errorMessage.includes('Unsupported provider') ||
          errorMessage.includes('활성화되지 않았습니다') ||
          authError.status === 400
        ) {
          errorMessage = 'Google 로그인이 현재 활성화되지 않았습니다.\n\nSupabase 대시보드에서 Google OAuth를 활성화해야 합니다:\n1. Authentication → Providers\n2. Google 활성화\n3. Client ID와 Secret 입력\n\n현재는 이메일로 회원가입을 진행해주세요.'
        }
        
        setError(errorMessage)
        return
      }
      
      // 에러가 없으면 OAuth 리다이렉트가 시작됨 (성공)
      console.log('✅ Google OAuth 리다이렉트 시작...')
    } catch (err) {
      console.error('❌ Google 회원가입 예외:', err)
      const errorMessage = err instanceof Error ? err.message : 'Google 로그인 중 오류가 발생했습니다.'
      
      if (
        errorMessage.includes('not enabled') || 
        errorMessage.includes('Unsupported provider') ||
        errorMessage.includes('400')
      ) {
        setError('Google 로그인이 현재 활성화되지 않았습니다. 이메일로 회원가입을 진행해주세요.')
      } else {
        setError(`Google 로그인 중 오류가 발생했습니다: ${errorMessage}`)
      }
    }
  }

  const handleAppleSignUp = async () => {
    setError(null)
    setSuccess(false)

    try {
      const { error: authError } = await signInWithApple()

      if (authError) {
        let errorMessage = authError.message
        
        // 에러 메시지 한글화 및 구체화
        if (errorMessage.includes('popup') || errorMessage.includes('blocked')) {
          errorMessage = '팝업이 차단되었습니다. 브라우저 설정에서 팝업을 허용해주세요.'
        } else if (errorMessage.includes('not enabled') || errorMessage.includes('Unsupported provider')) {
          errorMessage = 'Apple 로그인이 현재 활성화되지 않았습니다. 이메일로 회원가입을 진행해주세요.'
        } else if (errorMessage.includes('활성화되지 않았습니다')) {
          errorMessage = 'Apple 로그인이 현재 활성화되지 않았습니다. 이메일로 회원가입을 진행해주세요.'
        }
        
        setError(errorMessage)
      }
      // 에러가 없으면 OAuth 리다이렉트가 시작됨 (성공)
    } catch (err) {
      console.error('Apple sign up error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Apple 로그인 중 오류가 발생했습니다.'
      
      if (errorMessage.includes('not enabled') || errorMessage.includes('Unsupported provider')) {
        setError('Apple 로그인이 현재 활성화되지 않았습니다. 이메일로 회원가입을 진행해주세요.')
      } else {
        setError('Apple 로그인 중 오류가 발생했습니다. 다시 시도해주세요.')
      }
    }
  }

  // 성공 화면
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-blue-50 to-white">
        <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-lg text-center space-y-6">
          <div className="flex justify-center">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">회원가입 완료!</h1>
            <p className="text-muted-foreground">
              회원가입이 완료되었습니다.
            </p>
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800 font-medium mb-2">
                📧 이메일 인증이 필요합니다
              </p>
              <p className="text-sm text-blue-700">
                {email}로 인증 이메일을 보냈습니다.<br />
                이메일을 확인하고 링크를 클릭해주세요.
              </p>
            </div>
          </div>
          <div className="pt-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              잠시 후 홈으로 이동합니다...
            </p>
            <Link to="/login">
              <Button variant="outline" className="w-full">
                로그인 페이지로 이동
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-blue-50 to-white">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-lg shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold">회원가입</h1>
          <p className="text-muted-foreground mt-2">
            Certiq 계정을 만들어 시작하세요
          </p>
        </div>

        <div className="space-y-4">
          {/* 소셜 로그인 버튼 */}
          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignUp}
              disabled={loading}
            >
              <Chrome className="mr-2 h-4 w-4" />
              Google로 가입
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleAppleSignUp}
              disabled={loading}
            >
              <Apple className="mr-2 h-4 w-4" />
              Apple로 가입
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                또는
              </span>
            </div>
          </div>

          {/* 이메일 회원가입 폼 */}
          <form onSubmit={handleEmailSignUp} className="space-y-4">
            {error && (
              <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                <div className="font-semibold mb-1">오류가 발생했습니다</div>
                <div>{error}</div>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                이름
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="홍길동"
                  required
                  className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                이메일
              </label>
              <div className="relative">
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

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                비밀번호
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="최소 6자 이상"
                  required
                  minLength={6}
                  className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium">
                비밀번호 확인
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="비밀번호를 다시 입력하세요"
                  required
                  minLength={6}
                  className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  disabled={loading}
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '가입 중...' : '회원가입'}
            </Button>
          </form>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">이미 계정이 있으신가요? </span>
            <Link to="/login" className="text-primary hover:underline">
              로그인
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

