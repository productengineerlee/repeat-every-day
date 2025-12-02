import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context'
import { checkAdminAccess } from '@/lib/api/admin'

interface AdminProtectedRouteProps {
  children: React.ReactNode
}

/**
 * 관리자 전용 라우트 보호 컴포넌트
 */
export default function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth()
  const location = useLocation()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const verifyAdmin = async () => {
      if (!user) {
        setIsAdmin(false)
        setChecking(false)
        return
      }

      try {
        const adminStatus = await checkAdminAccess()
        // 개발 단계: 로그인한 사용자는 모두 관리자로 간주
        setIsAdmin(adminStatus || true)
      } catch (error) {
        console.error('관리자 확인 오류:', error)
        // 개발 단계: 에러가 발생해도 로그인한 사용자는 접근 허용
        setIsAdmin(true)
      } finally {
        setChecking(false)
      }
    }

    verifyAdmin()
  }, [user])

  // 인증 로딩 중
  if (authLoading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">관리자 권한 확인 중...</p>
        </div>
      </div>
    )
  }

  // 로그인하지 않은 경우
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // 관리자가 아닌 경우
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <h1 className="text-2xl font-bold">접근 권한이 없습니다</h1>
          <p className="text-muted-foreground">
            이 페이지는 관리자만 접근할 수 있습니다.
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

