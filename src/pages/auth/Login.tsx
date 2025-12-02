import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context'
import { Button } from '@/components/ui/button'
import { Mail, Lock, Chrome, Apple } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signIn, signInWithGoogle, signInWithApple, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  // 로그인 전에 접근하려던 페이지 (ProtectedRoute에서 전달됨)
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/'

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const { error: authError } = await signIn({ email, password })

    if (authError) {
      setError(authError.message)
      return
    }

    // 원래 목적지로 리다이렉트
    navigate(from, { replace: true })
  }

  const handleGoogleLogin = async () => {
    setError(null)

    try {
      const { error: authError } = await signInWithGoogle()

      if (authError) {
        let errorMessage = authError.message
        
        // 에러 메시지 한글화 및 구체화
        if (errorMessage.includes('popup') || errorMessage.includes('blocked')) {
          errorMessage = '팝업이 차단되었습니다. 브라우저 설정에서 팝업을 허용해주세요.'
        } else if (errorMessage.includes('not enabled') || errorMessage.includes('Unsupported provider')) {
          errorMessage = 'Google 로그인이 현재 활성화되지 않았습니다. 이메일로 로그인을 진행해주세요.'
        } else if (errorMessage.includes('활성화되지 않았습니다')) {
          errorMessage = 'Google 로그인이 현재 활성화되지 않았습니다. 이메일로 로그인을 진행해주세요.'
        }
        
        setError(errorMessage)
      }
      // 에러가 없으면 OAuth 리다이렉트가 시작됨 (성공)
    } catch (err) {
      console.error('Google login error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Google 로그인 중 오류가 발생했습니다.'
      
      if (errorMessage.includes('not enabled') || errorMessage.includes('Unsupported provider')) {
        setError('Google 로그인이 현재 활성화되지 않았습니다. 이메일로 로그인을 진행해주세요.')
      } else {
        setError('Google 로그인 중 오류가 발생했습니다. 다시 시도해주세요.')
      }
    }
  }

  const handleAppleLogin = async () => {
    setError(null)

    try {
      const { error: authError } = await signInWithApple()

      if (authError) {
        let errorMessage = authError.message
        
        // 에러 메시지 한글화 및 구체화
        if (errorMessage.includes('popup') || errorMessage.includes('blocked')) {
          errorMessage = '팝업이 차단되었습니다. 브라우저 설정에서 팝업을 허용해주세요.'
        } else if (errorMessage.includes('not enabled') || errorMessage.includes('Unsupported provider')) {
          errorMessage = 'Apple 로그인이 현재 활성화되지 않았습니다. 이메일로 로그인을 진행해주세요.'
        } else if (errorMessage.includes('활성화되지 않았습니다')) {
          errorMessage = 'Apple 로그인이 현재 활성화되지 않았습니다. 이메일로 로그인을 진행해주세요.'
        }
        
        setError(errorMessage)
      }
      // 에러가 없으면 OAuth 리다이렉트가 시작됨 (성공)
    } catch (err) {
      console.error('Apple login error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Apple 로그인 중 오류가 발생했습니다.'
      
      if (errorMessage.includes('not enabled') || errorMessage.includes('Unsupported provider')) {
        setError('Apple 로그인이 현재 활성화되지 않았습니다. 이메일로 로그인을 진행해주세요.')
      } else {
        setError('Apple 로그인 중 오류가 발생했습니다. 다시 시도해주세요.')
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">로그인</h1>
          <p className="text-muted-foreground mt-2">
            Certiq 계정으로 로그인하세요
          </p>
        </div>

        <div className="space-y-4">
          {/* 소셜 로그인 버튼 */}
          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              <Chrome className="mr-2 h-4 w-4" />
              Google로 로그인
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleAppleLogin}
              disabled={loading}
            >
              <Apple className="mr-2 h-4 w-4" />
              Apple로 로그인
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

          {/* 이메일 로그인 폼 */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                {error}
              </div>
            )}

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
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
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
    </div>
  )
}

