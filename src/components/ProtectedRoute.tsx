import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAuth?: boolean
}

/**
 * 인증이 필요한 라우트를 보호하는 컴포넌트
 * @param children - 보호할 컴포넌트
 * @param requireAuth - 인증 필요 여부 (기본값: true)
 */
export default function ProtectedRoute({
  children,
  requireAuth = true,
}: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const location = useLocation()

  // 로딩 중일 때는 로딩 UI 표시
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    )
  }

  // 인증이 필요한데 사용자가 로그인하지 않은 경우
  if (requireAuth && !user) {
    // 원래 목적지 URL을 저장하고 로그인 페이지로 리다이렉트
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // 인증이 필요 없는데 사용자가 로그인한 경우 (예: 로그인/회원가입 페이지)
  if (!requireAuth && user) {
    // 원래 목적지가 있으면 그곳으로, 없으면 홈으로 리다이렉트
    const from = location.state?.from?.pathname || '/'
    return <Navigate to={from} replace />
  }

  return <>{children}</>
}








