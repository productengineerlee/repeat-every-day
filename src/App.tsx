import { Routes, Route, Link } from 'react-router-dom'
import { useAuth } from '@/context'
import ProtectedRoute from './components/ProtectedRoute'
import OnboardingRoute from './components/OnboardingRoute'
import Home from './pages/Home'
import TestLibraries from './pages/TestLibraries'
import SupabaseTest from './pages/SupabaseTest'
import Dashboard from './pages/Dashboard'
import Learning from './pages/Learning'
import Camera from './pages/Camera'
import WrongAnswers from './pages/WrongAnswers'
import ReviewMode from './pages/ReviewMode'
import Profile from './pages/Profile'
import Login from './pages/auth/Login'
import SignUp from './pages/auth/SignUp'
import ForgotPassword from './pages/auth/ForgotPassword'
import AuthCallback from './pages/auth/AuthCallback'
import OnboardingFlow from './pages/onboarding/OnboardingFlow'
import AdminQuestionInput from './pages/admin/AdminQuestionInput'
import AdminQuestionList from './pages/admin/AdminQuestionList'
import AdminQuestionEdit from './pages/admin/AdminQuestionEdit'
import AdminProtectedRoute from './components/AdminProtectedRoute'
import { Button } from '@/components/ui/button'
import { useNotificationScheduler } from './hooks/useNotificationScheduler'
import { Settings } from 'lucide-react'
import './App.css'

function App() {
  const { user, loading } = useAuth()
  
  // 알림 스케줄러는 user가 있을 때만 초기화
  useNotificationScheduler()

  // 관리자 이메일 목록 (추가 가능)
  const adminEmails = ['gtsu0707@gmail.com']
  const isAdmin = user?.email && adminEmails.includes(user.email)

  return (
    <div className="min-h-screen">
      {/* 데스크톱 네비게이션 (로그인하지 않은 사용자용) */}
      {!user && (
        <nav className="border-b p-4">
          <div className="container mx-auto flex gap-4 items-center justify-between">
            <div className="flex gap-4">
              <Link to="/">
                <Button variant="ghost">홈</Button>
              </Link>
              <Link to="/test">
                <Button variant="ghost">라이브러리 테스트</Button>
              </Link>
              <Link to="/supabase-test">
                <Button variant="ghost">Supabase 테스트</Button>
              </Link>
            </div>
            <div className="flex gap-4">
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="ghost">로그인</Button>
                  </Link>
                  <Link to="/signup">
                    <Button variant="ghost">회원가입</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </nav>
      )}

      {/* 로그인한 사용자용 상단 네비게이션 */}
      {user && (
        <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <Link to="/dashboard">
                <h1 className="text-xl font-bold">Certiq</h1>
              </Link>
              <div className="flex items-center gap-4">
                {isAdmin && (
                  <Link to="/admin/question-input">
                    <Button variant="outline" size="sm" className="gap-2">
                      <Settings className="h-4 w-4" />
                      Admin
                    </Button>
                  </Link>
                )}
                <Link to="/profile">
                  <Button variant="ghost" size="sm">
                    {user.email}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </nav>
      )}

      <Routes>
        {/* 공개 라우트 */}
        <Route path="/" element={<Home />} />
        <Route path="/test" element={<TestLibraries />} />
        <Route path="/supabase-test" element={<SupabaseTest />} />
        
        {/* 인증이 필요 없는 라우트 (로그인한 사용자는 리다이렉트) */}
        <Route
          path="/login"
          element={
            <ProtectedRoute requireAuth={false}>
              <Login />
            </ProtectedRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <ProtectedRoute requireAuth={false}>
              <SignUp />
            </ProtectedRoute>
          }
        />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        
        {/* 온보딩 라우트 (인증 필요, 온보딩 미완료 시 자동 리다이렉트) */}
        <Route
          path="/onboarding"
          element={
            <OnboardingRoute>
              <OnboardingFlow />
            </OnboardingRoute>
          }
        />
        
        {/* 인증이 필요한 라우트 (온보딩 완료 필요) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <OnboardingRoute>
                <Dashboard />
              </OnboardingRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/learning"
          element={
            <ProtectedRoute>
              <OnboardingRoute>
                <Learning />
              </OnboardingRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/camera"
          element={
            <ProtectedRoute>
              <OnboardingRoute>
                <Camera />
              </OnboardingRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/wrong-answers"
          element={
            <ProtectedRoute>
              <OnboardingRoute>
                <WrongAnswers />
              </OnboardingRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/review"
          element={
            <ProtectedRoute>
              <OnboardingRoute>
                <ReviewMode />
              </OnboardingRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <OnboardingRoute>
                <Profile />
              </OnboardingRoute>
            </ProtectedRoute>
          }
        />
        
        {/* 관리자 라우트 */}
        <Route
          path="/admin/question-input"
          element={
            <AdminProtectedRoute>
              <AdminQuestionInput />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/questions"
          element={
            <AdminProtectedRoute>
              <AdminQuestionList />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/questions/:id/edit"
          element={
            <AdminProtectedRoute>
              <AdminQuestionEdit />
            </AdminProtectedRoute>
          }
        />
      </Routes>

    </div>
  )
}

export default App
