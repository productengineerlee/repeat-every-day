import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { useOnboarding } from '@/context'
import { useAuth } from '@/context'
import { Button } from '@/components/ui/button'
import { calculateDiagnosticResults } from '@/lib/utils/diagnostic'
import { getDiagnosticQuestions } from '@/lib/api/questions'
import { submitOnboardingData, validateOnboardingData } from '@/lib/api/onboarding'
import { CheckCircle, TrendingUp, AlertCircle, RotateCcw } from 'lucide-react'

export default function DiagnosticResults() {
  const { state, setDiagnosticResults, completeOnboarding, reset, nextStep } = useOnboarding()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<{
    scores: Record<string, number>
    weakAreas: string[]
    totalScore?: number
    totalQuestions?: number
    subjectGroups?: Record<string, {
      subjectName: string
      subjectNumber: number
      topics: Array<{ 
        topicName: string
        categoryCode: string
        correct: number
        total: number
        percentage: number
      }>
      totalCorrect: number
      totalQuestions: number
    }>
    categoryDetails?: Record<string, { correct: number; total: number; name: string }>
  } | null>(null)
  const [chartData, setChartData] = useState<Array<{ 
    id: string
    category: string
    score: number 
  }>>([])

  // 처리 완료 플래그로 무한 루프 방지
  const [processed, setProcessed] = useState(false)

  const handleRetakeDiagnostic = () => {
    // localStorage 플래그 초기화 (재진단 허용)
    localStorage.removeItem('diagnostic_completed')
    localStorage.removeItem('diagnostic_certification')
    localStorage.removeItem('diagnostic_results')
    
    reset() // 온보딩 상태 초기화
    navigate('/onboarding')
  }

  useEffect(() => {
    // 이미 처리했거나 필수 정보가 없으면 스킵
    if (processed || !state.certificationType) {
      if (!state.certificationType) {
        setError('자격증이 선택되지 않았습니다.')
        setLoading(false)
      }
      return
    }

    const processResults = async () => {
      try {
        setLoading(true)
        setProcessed(true) // 처리 시작 표시

        // 데이터 검증 (targetExamDate는 선택 사항)
        const validation = validateOnboardingData({
          certificationType: state.certificationType,
          targetExamDate: state.targetExamDate || undefined,
          diagnosticAnswers: state.diagnosticAnswers,
        })

        if (!validation.valid) {
          setError(validation.errors.join(' '))
          setLoading(false)
          return
        }

        // 진단 문제 다시 가져오기 (답안과 매칭하기 위해)
        console.log('🔄 진단 문제 다시 가져오는 중...')
        const questions = await getDiagnosticQuestions(state.certificationType, 10)
        console.log('📦 가져온 문제 수:', questions.length)

        if (questions.length === 0) {
          setError('진단 문제를 찾을 수 없습니다.')
          setLoading(false)
          return
        }

        console.log('📝 사용자 답안:', state.diagnosticAnswers)
        console.log('📝 답안 개수:', Object.keys(state.diagnosticAnswers).length)

        // 결과 계산
        console.log('🧮 결과 계산 시작...')
        const calculatedResults = calculateDiagnosticResults(
          questions,
          state.diagnosticAnswers
        )
        console.log('📊 계산된 결과:', calculatedResults)

        setResults(calculatedResults)
        // setDiagnosticResults는 한 번만 호출 (무한 루프 방지)
        setDiagnosticResults(calculatedResults)
        
        // 진단 완료 표시 저장 (로그인 유도용)
        // 비회원 상태에서 진단 테스트를 완료한 경우, 회원가입 후 자동으로 이 데이터를 DB에 저장하기 위해 localStorage에 보관
        localStorage.setItem('diagnostic_completed', 'true')
        localStorage.setItem('diagnostic_certification', state.certificationType)
        // 진단 결과 전체 저장 (회원가입 후 DB 동기화용)
        localStorage.setItem('diagnostic_results', JSON.stringify({
          certificationType: state.certificationType,
          targetExamDate: state.targetExamDate,
          diagnosticAnswers: state.diagnosticAnswers,
          results: calculatedResults,
        }))

        // 차트 데이터 형식으로 변환 (0-100 범위의 퍼센트)
        const chartDataArray = Object.entries(calculatedResults.categoryDetails || {})
          .filter(([_, details]) => details && details.total > 0) // 유효한 데이터만 필터링
          .map(([categoryCode, details]) => {
            const percentage = (details.correct / details.total) * 100
            return {
              id: categoryCode, // 고유 ID로 원본 카테고리 코드 사용
              category: details.name, // 표시용 카테고리 이름
              score: Math.round(percentage),
            }
          })
        
        console.log('📊 차트 데이터:', chartDataArray)
        console.log('📊 차트 데이터 길이:', chartDataArray.length)
        console.log('📊 차트 렌더링 조건:', {
          hasData: chartDataArray.length > 0,
          firstItem: chartDataArray[0],
        })
        setChartData(chartDataArray)

        // 로그인한 사용자만 온보딩 데이터 제출 (재시도 로직 포함)
        // 로그인하지 않은 사용자는 결과만 확인하고 저장하지 않음
        if (user) {
          try {
            const submitResult = await submitOnboardingData(user.id, {
              certificationType: state.certificationType,
              targetExamDate: state.targetExamDate || undefined,
              diagnosticAnswers: state.diagnosticAnswers,
            })

            if (!submitResult.success) {
              console.warn('⚠️ 온보딩 데이터 저장 실패:', submitResult.error)
              // 에러가 발생해도 결과는 표시 (사용자가 결과를 볼 수 있도록)
              // setError는 호출하지 않음 (결과는 표시되어야 함)
            }
            
            // 로그인한 사용자는 DB에 저장되므로 localStorage 플래그 제거
            localStorage.removeItem('diagnostic_completed')
            localStorage.removeItem('diagnostic_certification')
            localStorage.removeItem('diagnostic_results')
          } catch (submitError) {
            console.warn('⚠️ 온보딩 데이터 제출 중 예외 발생:', submitError)
            // 에러가 발생해도 결과는 표시
          }
        } else {
          // 로그인하지 않은 사용자는 결과만 확인
          console.log('로그인하지 않은 사용자: 진단 결과는 표시만 하고 저장하지 않습니다.')
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

  const handleComplete = useCallback(async () => {
    try {
      console.log('✅ 완료 버튼 클릭됨!')
      console.log('User 상태:', user)
      
      if (user) {
        // 로그인한 사용자는 대시보드로 바로 이동 (일일 문제 수는 이미 3으로 설정됨)
        console.log('→ 로그인 사용자 - 대시보드로 이동')
        completeOnboarding()
        navigate('/dashboard', { replace: true })
      } else {
        // 로그인하지 않은 사용자는 회원가입으로 이동
        console.log('→ 비회원 - 회원가입 페이지로 이동')
        
        // 진단 결과를 localStorage에 저장 (회원가입 후 사용)
        try {
          const diagnosticData = {
            certificationType: state.certificationType,
            targetExamDate: state.targetExamDate,
            diagnosticAnswers: state.diagnosticAnswers,
            results: results,
          }
          localStorage.setItem('diagnostic_results', JSON.stringify(diagnosticData))
          console.log('💾 진단 결과 localStorage 저장 완료')
        } catch (storageError) {
          console.error('❌ localStorage 저장 실패:', storageError)
        }
        
        navigate('/signup', { replace: true })
      }
    } catch (error) {
      console.error('❌ 완료 처리 중 오류:', error)
      // 에러가 발생해도 회원가입 페이지로 이동
      if (!user) {
        navigate('/signup', { replace: true })
      }
    }
  }, [user, navigate, completeOnboarding, state, results])

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

  // 전체 점수 (10점 만점)
  const totalScore = results.totalScore ?? 0
  const totalQuestions = results.totalQuestions ?? 10
  const categoryCount = Object.keys(results.scores).length

  return (
    <div className="min-h-screen flex items-center justify-center p-4 pb-24">
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
              <h2 className="text-lg font-semibold mb-2">전체 점수</h2>
              <p className="text-sm text-muted-foreground">
                총 {totalQuestions}문제 · {categoryCount}개 주요항목
              </p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-primary">
                {totalScore}<span className="text-2xl text-muted-foreground">/{totalQuestions}</span>
              </div>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {totalScore >= 8
                    ? '우수'
                    : totalScore >= 6
                    ? '양호'
                    : '보완 필요'}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 레이더 차트 */}
        {chartData && chartData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-card border rounded-lg p-6"
          >
            <h2 className="text-xl font-semibold mb-6 text-center">
              과목별 실력 분석
            </h2>
            <div style={{ width: '100%', height: '400px', minHeight: '400px', position: 'relative' }}>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={chartData} width={500} height={400}>
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
                <Tooltip 
                  formatter={(value: number) => [`${value}%`, '정답률']}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Radar
                  name="정답률"
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
        )}

        {/* 과목별 상세 분석 */}
        {results.subjectGroups && Object.keys(results.subjectGroups).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="bg-card border rounded-lg p-6"
          >
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-semibold rounded-full">
                  {state.certificationType}
                </span>
              </div>
              <h2 className="text-xl font-semibold">과목별 상세 분석</h2>
            </div>
            <div className="space-y-6">
              {Object.entries(results.subjectGroups)
                .sort(([, a], [, b]) => a.subjectNumber - b.subjectNumber)
                .map(([subjectCode, subjectData]) => {
                  const avgPercentage = subjectData.totalQuestions > 0 
                    ? ((subjectData.totalCorrect / subjectData.totalQuestions) * 100).toFixed(1)
                    : '0.0'
                  
                  return (
                    <div key={subjectCode} className="border-l-4 border-primary pl-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-primary">
                          {subjectData.subjectNumber}과목 - {subjectData.subjectName}
                        </h3>
                        <span className="text-sm text-muted-foreground">
                          {subjectData.totalCorrect}/{subjectData.totalQuestions} ({avgPercentage}%)
                        </span>
                      </div>
                    <div className="space-y-2">
                      {subjectData.topics.map((topic, index) => (
                        <div 
                          key={index}
                          className="flex items-center justify-between py-2 px-3 bg-muted/30 rounded-md hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{topic.topicName}</span>
                            <span className="text-xs text-muted-foreground">({topic.categoryCode})</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary transition-all"
                                style={{ width: `${topic.percentage}%` }}
                              />
                            </div>
                            <span className="text-sm font-bold text-primary min-w-[4rem] text-right">
                              {topic.correct}/{topic.total} ({topic.percentage.toFixed(0)}%)
                            </span>
                          </div>
                        </div>
                      ))}
                      </div>
                    </div>
                  )
                })}
            </div>
          </motion.div>
        )}

        {/* 취약 영역 */}
        {results.weakAreas.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
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
          transition={{ duration: 0.5, delay: 0.45 }}
          className="flex flex-col items-center gap-4 bg-card border rounded-lg p-6"
        >
          {!user && (
            <p className="text-sm text-muted-foreground text-center">
              학습을 시작하려면 회원가입이 필요합니다.
            </p>
          )}
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <Button 
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                console.log('🔵 버튼 클릭됨!')
                handleComplete()
              }} 
              size="lg" 
              className="w-full sm:flex-1"
              type="button"
            >
              <CheckCircle className="mr-2 h-5 w-5" />
              {user ? '다음 단계 (학습 설정)' : '회원가입하고 시작하기'}
            </Button>
            <Button 
              onClick={handleRetakeDiagnostic} 
              variant="outline" 
              size="lg" 
              className="w-full sm:flex-1 border-2"
            >
              <RotateCcw className="mr-2 h-5 w-5" />
              진단 다시 보기
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

