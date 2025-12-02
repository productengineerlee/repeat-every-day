import { useEffect, useState, useRef } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context'
import { checkOnboardingComplete } from '@/lib/api/onboarding'

interface OnboardingRouteProps {
  children: React.ReactNode
}

/**
 * 온보딩 완료 여부를 확인하고, 미완료 시 온보딩으로 리다이렉트하는 컴포넌트
 * ProtectedRoute와 함께 사용하여 인증된 사용자의 온보딩 완료 여부를 확인합니다.
 */
export default function OnboardingRoute({ children }: OnboardingRouteProps) {
  const { user, loading: authLoading } = useAuth()
  const location = useLocation()
  const [onboardingChecked, setOnboardingChecked] = useState(false)
  const [onboardingComplete, setOnboardingComplete] = useState(false)
  const [checking, setChecking] = useState(true)
  const checkInProgress = useRef(false)

  useEffect(() => {
    const checkOnboarding = async () => {
      if (!user || checkInProgress.current) {
        // 사용자가 없거나 이미 체크 중이면 스킵
        if (!user) {
          setChecking(false)
        }
        return
      }

      // 온보딩 페이지에서는 체크하지 않음 (무한 루프 방지)
      if (location.pathname === '/onboarding') {
        setChecking(false)
        setOnboardingChecked(true)
        setOnboardingComplete(false) // 온보딩 페이지에 있으면 완료되지 않은 것으로 간주
        return
      }

      try {
        checkInProgress.current = true
        setChecking(true)
        const { completed } = await checkOnboardingComplete(user.id)
        setOnboardingComplete(completed)
        setOnboardingChecked(true)
      } catch (error) {
        console.error('Error checking onboarding status:', error)
        // 에러 발생 시 온보딩으로 리다이렉트하지 않고 기본값으로 처리
        setOnboardingComplete(false)
        setOnboardingChecked(true)
      } finally {
        setChecking(false)
        checkInProgress.current = false
      }
    }

    if (!authLoading && user) {
      checkOnboarding()
    } else if (!authLoading && !user) {
      // 인증되지 않은 경우 체크하지 않음
      setChecking(false)
    }
  }, [user, authLoading, location.pathname])

  // 인증 로딩 중이거나 온보딩 체크 중일 때
  if (authLoading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    )
  }

  // 사용자가 없으면 체크하지 않음 (ProtectedRoute에서 처리)
  if (!user) {
    return <>{children}</>
  }

  // 온보딩 페이지에서는 리다이렉트하지 않음
  if (location.pathname === '/onboarding') {
    return <>{children}</>
  }

  // 온보딩이 완료되지 않았으면 온보딩으로 리다이렉트
  if (onboardingChecked && !onboardingComplete) {
    return <Navigate to="/onboarding" replace />
  }

  // 온보딩이 완료되었거나 체크가 완료되지 않은 경우 (에러 등) 자식 렌더링
  return <>{children}</>
}

