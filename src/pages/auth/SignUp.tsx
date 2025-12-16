import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context'
import { Button } from '@/components/ui/button'
import { Mail, Lock, User } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

export default function SignUp() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signUp } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)


  // 회원가입 전에 접근하려던 페이지
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard'


  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 이미 로딩 중이면 중복 제출 방지
    if (loading) {
      return
    }
    
    setLoading(true)
    setError(null)

    // 입력값 검증
    if (!name.trim()) {
      setError('이름을 입력해주세요.')
      setLoading(false)
      return
    }

    if (!email.trim()) {
      setError('이메일을 입력해주세요.')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.')
      setLoading(false)
      return
    }

    try {
      const { error: authError, user } = await signUp({
        email: email.trim(),
        password,
        metadata: {
          name: name.trim(),
        },
      })

      if (authError) {
        setLoading(false)
        setError(`회원가입 오류: ${authError.message}`)
        return
      }

      if (!user) {
        setLoading(false)
        setError('회원가입에 실패했습니다. 다시 시도해주세요.')
        return
      }

      // identities 배열 체크 (중복 계정 확인)
      const identitiesCount = user.identities?.length ?? 0
      
      if (identitiesCount === 0) {
        // 중복 계정 - 로그인 페이지로 이동
        const emailToSend = email.trim()
        
        navigate('/login', { 
          replace: true,
          state: { 
            errorMessage: `이미 가입된 이메일입니다.\n\n${emailToSend}로 로그인해주세요.`,
            email: emailToSend
          }
        })
        
        return
      }

      // 세션이 있으면 users 테이블에 사용자 정보 저장
      // 세션이 없으면 (이메일 인증 필요) AuthCallback이나 로그인 시 저장됨
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        try {
          await supabase
            .from('users')
            .upsert({
              id: user.id,
              email: user.email,
              name: name.trim(),
            }, {
              onConflict: 'id'
            })
        } catch (userSaveError) {
          // users 테이블 저장 실패해도 회원가입은 성공한 것으로 처리
          // (이메일 인증 후 로그인 시 저장됨)
          console.error('users 테이블 저장 실패:', userSaveError)
        }
      }

      // 로그인 페이지로 이동 (성공 메시지 포함)
      navigate('/login', { 
        replace: true,
        state: { 
          successMessage: `회원가입이 완료되었습니다!\n\n📧 ${email.trim()}로 인증 이메일을 보냈습니다.\n이메일을 확인하고 링크를 클릭한 후 로그인해주세요.`,
          email: email.trim()
        }
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '회원가입 중 오류가 발생했습니다.'
      setLoading(false)
      setError(`오류: ${errorMessage}`)
    }
  }


  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-blue-50 to-white">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-lg shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold">회원가입</h1>
        </div>

        <div className="space-y-4">
          <form onSubmit={handleEmailSignUp} className="space-y-4">
            {/* 에러 메시지 - 매우 눈에 띄게 */}
            {error && (
              <div className="p-6 text-base text-red-700 bg-red-100 border-2 border-red-500 rounded-lg shadow-lg">
                <div className="font-bold text-lg mb-2">❌ 오류</div>
                <div className="whitespace-pre-wrap font-medium">{error}</div>
              </div>
            )}

            <div className="flex items-center gap-4">
              <label htmlFor="name" className="text-sm font-medium w-24 flex-shrink-0">
                이름
              </label>
              <div className="relative flex-1">
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
                  minLength={6}
                  className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label htmlFor="confirmPassword" className="text-sm font-medium w-24 flex-shrink-0">
                비밀번호 확인
              </label>
              <div className="relative flex-1">
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

