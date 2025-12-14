import { useNavigate } from 'react-router-dom'
import { useOnboarding } from '@/context'
import { Button } from '@/components/ui/button'
import TopBar from '@/components/dashboard/TopBar'
import DailyQuestionCard from '@/components/dashboard/DailyQuestionCard'
import ExamQuestionCard from '@/components/dashboard/ExamQuestionCard'
// import WeakAreaAnalysis from '@/components/statistics/WeakAreaAnalysis' // 데이터 충분히 쌓이면 다시 추가 예정
import LearningStreakCalendar from '@/components/statistics/LearningStreakCalendar'
// import AchievementCards from '@/components/statistics/AchievementCards' // 나중에 추가 예정 (임시 제거)
import PerformanceCharts from '@/components/statistics/PerformanceCharts'
import InitialDiagnosticResults from '@/components/dashboard/InitialDiagnosticResults'
import { RotateCcw, Bell } from 'lucide-react'

// 자격증명 매핑 (나중에 필요할 수 있음)
// const CERTIFICATION_LABELS: Record<string, string> = {
//   '정보처리기사': '정보처리기사',
//   '컴퓨터활용능력': '컴퓨터활용능력',
//   '빅데이터분석기사': '빅데이터분석기사',
//   '경영정보시각화능력': '경영정보시각화능력',
//   'ADsP': 'ADsP',
//   'SQLD': 'SQLD',
//   '사회조사분석사': '사회조사분석사',
//   'TESAT': 'TESAT',
//   '공인중개사': '공인중개사',
// }

export default function Dashboard() {
  const { reset } = useOnboarding()
  const navigate = useNavigate()

  const handleLearningSettings = () => {
    navigate('/profile?tab=daily-settings')
  }

  const handleReviewMode = () => {
    navigate('/wrong-answers')
  }

  const handleRetakeDiagnostic = () => {
    // localStorage 플래그 초기화 (재진단 허용)
    localStorage.removeItem('diagnostic_completed')
    localStorage.removeItem('diagnostic_certification')
    
    reset() // 온보딩 상태 초기화
    navigate('/onboarding')
  }

  const handleNotificationSettings = () => {
    navigate('/profile?tab=notifications')
  }

  return (
    <div className="min-h-screen pb-24">
      <TopBar />
      <div className="container mx-auto p-4 md:p-8 space-y-8">
        <div>
          <h1 className="text-4xl font-bold">대시보드</h1>
        </div>

        {/* 빠른 시작 */}
        <div className="p-6 border rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-center">빠른 시작</h2>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button variant="outline" onClick={handleReviewMode}>오답 노트 보기</Button>
            <Button variant="outline" onClick={handleLearningSettings}>
              학습 설정 하기
            </Button>
            <Button variant="outline" onClick={handleNotificationSettings} className="gap-2">
              <Bell className="h-4 w-4" />
              알림 설정 하기
            </Button>
            <Button variant="outline" onClick={handleRetakeDiagnostic} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              진단 다시 보기
            </Button>
          </div>
        </div>

        {/* 일일 문제 카드 */}
        <DailyQuestionCard />

        {/* 기출문제 카드 */}
        <ExamQuestionCard />

        {/* 학습 캘린더 - 에러 발생 시에도 렌더링 */}
        <div className="relative flex justify-center">
          <div className="w-full max-w-5xl">
            <LearningStreakCalendar />
          </div>
        </div>

        {/* 성능 차트 - 에러 발생 시에도 렌더링 */}
        <div className="relative flex justify-center">
          <div className="w-full max-w-5xl">
            <PerformanceCharts />
          </div>
        </div>

        {/* 성취도 카드 - 나중에 추가 예정 (임시 제거) */}
        {/* <div className="relative">
          <AchievementCards />
        </div> */}

        {/* 상세 약점 분석 - 데이터 충분히 쌓이면 다시 추가 예정 (임시 제거) */}
        {/* <div className="relative">
          <WeakAreaAnalysis />
        </div> */}

        {/* 최초 진단 결과 */}
        <div className="relative flex justify-center">
          <div className="w-full max-w-5xl">
            <InitialDiagnosticResults />
          </div>
        </div>
      </div>
    </div>
  )
}

