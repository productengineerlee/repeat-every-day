import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context'
import { useOnboarding } from '@/context'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import TopBar from '@/components/dashboard/TopBar'
import DailyQuestionCard from '@/components/dashboard/DailyQuestionCard'
import ExamQuestionCard from '@/components/dashboard/ExamQuestionCard'
import WeaknessAnalysis from '@/components/dashboard/WeaknessAnalysis'
import WeakAreaAnalysis from '@/components/statistics/WeakAreaAnalysis'
import LearningStreakCalendar from '@/components/statistics/LearningStreakCalendar'
// import AchievementCards from '@/components/statistics/AchievementCards' // 나중에 추가 예정 (임시 제거)
import PerformanceCharts from '@/components/statistics/PerformanceCharts'
import ExportStatistics from '@/components/statistics/ExportStatistics'
import { BookOpen, TrendingUp, Award, RotateCcw } from 'lucide-react'

// 자격증명 매핑 (모든 지원 자격증)
const CERTIFICATION_LABELS: Record<string, string> = {
  '정보처리기사': '정보처리기사',
  '컴퓨터활용능력': '컴퓨터활용능력',
  '빅데이터분석기사': '빅데이터분석기사',
  '경영정보시각화능력': '경영정보시각화능력',
  'ADsP': 'ADsP',
  'SQLD': 'SQLD',
  '사회조사분석사': '사회조사분석사',
  'TESAT': 'TESAT',
  '공인중개사': '공인중개사',
}

interface SelectedCertification {
  name: string
  count: number
}

export default function Dashboard() {
  const { user } = useAuth()
  const { reset } = useOnboarding()
  const navigate = useNavigate()
  const [selectedCertifications, setSelectedCertifications] = useState<SelectedCertification[]>([])
  const [userName, setUserName] = useState<string>('')
  const [loading, setLoading] = useState(true)

  const handleStartDiagnostic = () => {
    navigate('/onboarding')
  }

  const handleRetakeDiagnostic = () => {
    // localStorage 플래그 초기화 (재진단 허용)
    localStorage.removeItem('diagnostic_completed')
    localStorage.removeItem('diagnostic_certification')
    
    reset() // 온보딩 상태 초기화
    navigate('/onboarding')
  }

  useEffect(() => {
    const loadSelectedCertifications = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('users')
          .select('daily_question_count, name')
          .eq('id', user.id)
          .maybeSingle<{
            daily_question_count: Record<string, number | null> | null
            name: string | null
          }>()

        if (error) {
          console.error('Error loading certifications:', error)
          setSelectedCertifications([])
        } else if (data) {
          // 사용자 이름 설정 (users 테이블의 name 또는 user_metadata의 name)
          const name = data.name || user.user_metadata?.name || user.email?.split('@')[0] || ''
          setUserName(name)

          const counts = data.daily_question_count
          if (typeof counts === 'object' && counts !== null) {
            // null이 아닌 값들을 찾아서 자격증명과 문제 수 추출
            const selected: SelectedCertification[] = []
            Object.keys(counts).forEach((key) => {
              const count = counts[key]
              if (count !== null && count !== undefined && typeof count === 'number' && count > 0) {
                // CERTIFICATION_LABELS에 있으면 사용, 없으면 키 그대로 사용
                selected.push({
                  name: CERTIFICATION_LABELS[key] || key,
                  count: count
                })
              }
            })
            setSelectedCertifications(selected)
          } else {
            setSelectedCertifications([])
          }
        }
      } catch (err) {
        console.error('Error loading certifications:', err)
        setSelectedCertifications([])
      } finally {
        setLoading(false)
      }
    }

    loadSelectedCertifications()
  }, [user])

  return (
    <div className="min-h-screen pb-24">
      <TopBar />
      <div className="container mx-auto p-4 md:p-8 space-y-8">
        <div>
          <h1 className="text-4xl font-bold">대시보드</h1>
          <p className="text-muted-foreground mt-2">
            {loading ? (
              '로딩 중...'
            ) : selectedCertifications.length > 0 ? (
              <>
                {userName || user?.email || '회원'}님{' '}
                {selectedCertifications.map((cert, index) => (
                  <span key={cert.name}>
                    <span className="text-primary font-semibold">{cert.name}</span> 과정 매일{' '}
                    <span className="text-primary font-semibold">{cert.count}문제</span>
                    {index < selectedCertifications.length - 1 ? ', ' : ' '}
                  </span>
                ))}
                배달 선택하셨어요~
              </>
            ) : (
              `${userName || user?.email || '회원'}님, 환영합니다!`
            )}
          </p>
        </div>

        {/* 통계 요약 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 학습 통계 카드 */}
          <div className="p-6 border rounded-lg space-y-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">오늘의 학습</h2>
            </div>
            <div className="space-y-2">
              <p className="text-3xl font-bold">0</p>
              <p className="text-sm text-muted-foreground">문제 풀이</p>
            </div>
          </div>

          {/* 연속 학습일 카드 */}
          <div className="p-6 border rounded-lg space-y-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">연속 학습일</h2>
            </div>
            <div className="space-y-2">
              <p className="text-3xl font-bold">0</p>
              <p className="text-sm text-muted-foreground">일째</p>
            </div>
          </div>

          {/* 성취도 카드 */}
          <div className="p-6 border rounded-lg space-y-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">정답률</h2>
            </div>
            <div className="space-y-2">
              <p className="text-3xl font-bold">-</p>
              <p className="text-sm text-muted-foreground">아직 데이터 없음</p>
            </div>
          </div>
        </div>

        {/* 빠른 시작 */}
        <div className="p-6 border rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-center">빠른 시작</h2>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button>오늘의 문제 풀기</Button>
            <Button variant="outline">오답 노트 보기</Button>
            <Button variant="outline" onClick={handleStartDiagnostic}>
              진단 테스트 시작
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
        <div className="relative">
          <LearningStreakCalendar />
        </div>

        {/* 성능 차트 - 에러 발생 시에도 렌더링 */}
        <div className="relative">
          <PerformanceCharts />
        </div>

        {/* 성취도 카드 - 나중에 추가 예정 (임시 제거) */}
        {/* <div className="relative">
          <AchievementCards />
        </div> */}

        {/* 취약 영역 분석 (기본) - 에러 발생 시에도 렌더링 */}
        <div className="relative">
          <WeaknessAnalysis />
        </div>

        {/* 상세 약점 분석 - 에러 발생 시에도 렌더링 */}
        <div className="relative">
          <WeakAreaAnalysis />
        </div>

        {/* 통계 내보내기 - 에러 발생 시에도 렌더링 */}
        <div className="relative">
          <ExportStatistics />
        </div>
      </div>
    </div>
  )
}

