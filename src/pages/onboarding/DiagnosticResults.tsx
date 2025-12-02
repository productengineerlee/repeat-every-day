import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts'
import { useOnboarding } from '@/context'
import { useAuth } from '@/context'
import { Button } from '@/components/ui/button'
import { calculateDiagnosticResults } from '@/lib/utils/diagnostic'
import { getDiagnosticQuestions } from '@/lib/api/questions'
import { submitOnboardingData, validateOnboardingData } from '@/lib/api/onboarding'
import { CheckCircle, TrendingUp, AlertCircle } from 'lucide-react'

export default function DiagnosticResults() {
  const { state, setDiagnosticResults, completeOnboarding } = useOnboarding()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<{
    scores: Record<string, number>
    weakAreas: string[]
  } | null>(null)
  const [chartData, setChartData] = useState<Array<{ category: string; score: number }>>([])

  // 처리 완료 플래그로 무한 루프 방지
  const [processed, setProcessed] = useState(false)

  useEffect(() => {
    // 이미 처리했거나 필수 정보가 없으면 스킵
    if (processed || !state.certificationType || !user || !state.targetExamDate) {
      if (!state.certificationType || !user || !state.targetExamDate) {
        setError('필수 정보가 누락되었습니다.')
        setLoading(false)
      }
      return
    }

    const processResults = async () => {
      try {
        setLoading(true)
        setProcessed(true) // 처리 시작 표시

        // 데이터 검증
        const validation = validateOnboardingData({
          certificationType: state.certificationType,
          targetExamDate: state.targetExamDate,
          diagnosticAnswers: state.diagnosticAnswers,
        })

        if (!validation.valid) {
          setError(validation.errors.join(' '))
          setLoading(false)
          return
        }

        // 진단 문제 다시 가져오기 (답안과 매칭하기 위해)
        const questions = await getDiagnosticQuestions(state.certificationType, 10)

        if (questions.length === 0) {
          setError('진단 문제를 찾을 수 없습니다.')
          setLoading(false)
          return
        }

        // 결과 계산
        const calculatedResults = calculateDiagnosticResults(
          questions,
          state.diagnosticAnswers
        )

        setResults(calculatedResults)
        // setDiagnosticResults는 한 번만 호출 (무한 루프 방지)
        setDiagnosticResults(calculatedResults)

        // 차트 데이터 형식으로 변환
        const chartDataArray = Object.entries(calculatedResults.scores).map(
          ([category, score]) => ({
            category,
            score,
          })
        )
        setChartData(chartDataArray)

        // 온보딩 데이터 제출 (재시도 로직 포함)
        // 에러가 발생해도 결과는 표시 (사용자가 결과를 볼 수 있도록)
        try {
          const submitResult = await submitOnboardingData(user.id, {
            certificationType: state.certificationType,
            targetExamDate: state.targetExamDate,
            diagnosticAnswers: state.diagnosticAnswers,
          })

          if (!submitResult.success) {
            console.warn('⚠️ 온보딩 데이터 저장 실패:', submitResult.error)
            // 에러가 발생해도 결과는 표시 (사용자가 결과를 볼 수 있도록)
            // setError는 호출하지 않음 (결과는 표시되어야 함)
          }
        } catch (submitError) {
          console.warn('⚠️ 온보딩 데이터 제출 중 예외 발생:', submitError)
          // 에러가 발생해도 결과는 표시
        }
      } catch (err) {
        console.error('❌ 결과 처리 중 오류:', err)
        setError('결과를 처리하는 중 오류가 발생했습니다.')
      } finally {
        setLoading(false)
      }
    }

    processResults()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // 빈 배열로 한 번만 실행

  const handleComplete = () => {
    completeOnboarding()
    navigate('/dashboard')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">결과를 분석하는 중...</p>
        </div>
      </div>
    )
  }

  if (error || !results) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <p className="text-red-600 dark:text-red-400">
            {error || '결과를 불러올 수 없습니다.'}
          </p>
          <Button onClick={() => navigate('/dashboard')}>대시보드로 이동</Button>
        </div>
      </div>
    )
  }

  const averageScore = Math.round(
    Object.values(results.scores).reduce((sum, score) => sum + score, 0) /
      Object.values(results.scores).length
  )

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h1 className="text-4xl font-bold mb-4">진단 결과</h1>
          <p className="text-muted-foreground text-lg">
            당신의 실력을 분석했습니다
          </p>
        </motion.div>

        {/* 평균 점수 카드 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-card border rounded-lg p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold mb-2">전체 평균 점수</h2>
              <p className="text-sm text-muted-foreground">
                {Object.keys(results.scores).length}개 영역의 평균
              </p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-primary">{averageScore}점</div>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {averageScore >= 80
                    ? '우수'
                    : averageScore >= 60
                    ? '양호'
                    : '보완 필요'}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 레이더 차트 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-card border rounded-lg p-6"
        >
          <h2 className="text-xl font-semibold mb-6 text-center">
            영역별 실력 분석
          </h2>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={chartData}>
                <PolarGrid />
                <PolarAngleAxis
                  dataKey="category"
                  tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                />
                <Radar
                  name="점수"
                  dataKey="score"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.6}
                  animationDuration={1000}
                  animationEasing="ease-out"
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* 취약 영역 */}
        {results.weakAreas.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                  보완이 필요한 영역
                </h3>
                <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-3">
                  다음 영역에 집중하여 학습하시면 실력 향상에 도움이 됩니다.
                </p>
                <div className="flex flex-wrap gap-2">
                  {results.weakAreas.map((area) => (
                    <span
                      key={area}
                      className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/40 text-yellow-900 dark:text-yellow-100 rounded-full text-sm font-medium"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* 완료 버튼 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex justify-center"
        >
          <Button onClick={handleComplete} size="lg" className="min-w-64">
            <CheckCircle className="mr-2 h-5 w-5" />
            맞춤형 커리큘럼 시작하기
          </Button>
        </motion.div>
      </div>
    </div>
  )
}

