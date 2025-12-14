import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/context'
import { getDiagnosticResults } from '@/lib/api/onboarding'
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { TrendingUp, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'

interface DiagnosticResult {
  id: string
  user_id: string
  scores: Record<string, number>
  weak_areas: string[]
  subject_groups?: Record<string, {
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
  category_details?: Record<string, { correct: number; total: number; name: string }>
  total_score?: number
  total_questions?: number
  created_at: string
}

export default function InitialDiagnosticResults() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [result, setResult] = useState<DiagnosticResult | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchResults = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const data = await getDiagnosticResults(user.id)
        setResult(data)
      } catch (error) {
        console.error('Error fetching diagnostic results:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [user])

  if (loading) {
    return (
      <div className="bg-card border rounded-lg p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 bg-muted animate-pulse rounded-lg" />
          <div className="flex-1">
            <div className="h-6 bg-muted animate-pulse rounded w-1/3 mb-2" />
            <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
          </div>
        </div>
        <div className="h-64 bg-muted animate-pulse rounded" />
      </div>
    )
  }

  if (!result) {
    return (
      <div className="bg-card border rounded-lg p-6 text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
        <p className="text-muted-foreground">
          진단 테스트 결과가 없습니다.
          <br />
          진단 테스트를 완료하면 결과를 확인할 수 있습니다.
        </p>
        <Button onClick={() => navigate('/onboarding')}>
          진단 테스트 시작하기
        </Button>
      </div>
    )
  }

  // 차트 데이터 생성
  const totalScore = result.total_score ?? 0
  const totalQuestions = result.total_questions ?? 10
  const categoryCount = result.category_details ? Object.keys(result.category_details).length : 0

  // 레이더 차트 데이터
  const chartData = result.category_details
    ? Object.entries(result.category_details)
        .map(([_, details]) => {
          const percentage = details.total > 0 ? (details.correct / details.total) * 100 : 0
          return {
            category: details.name,
            score: Math.round(percentage),
          }
        })
    : []

  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <motion.img
            src="/mascot.png"
            alt="Certiq Mascot"
            className="w-16 h-16 object-contain drop-shadow-md"
            initial={{ rotate: -10 }}
            animate={{ rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200 }}
          />
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-700 dark:text-slate-200">
              최초 진단 결과
            </h2>
          </div>
        </div>
        <p className="text-sm md:text-base text-slate-600 dark:text-slate-300">
          진단 테스트에서 확인된 영역별 점수입니다
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
            <h3 className="text-lg font-semibold mb-2">전체 점수</h3>
            <p className="text-sm text-muted-foreground">
              총 {totalQuestions}문제 · {categoryCount}개 주요항목
            </p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-primary">
              {totalScore}<span className="text-2xl text-muted-foreground">/{totalQuestions}</span>
            </div>
            <div className="flex items-center gap-1 mt-2 justify-end">
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
      {chartData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-card border rounded-lg p-6"
        >
          <h3 className="text-xl font-semibold mb-6 text-center">
            과목별 실력 분석
          </h3>
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
      {result.subject_groups && Object.keys(result.subject_groups).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="bg-card border rounded-lg p-6"
        >
          <div className="mb-6">
            <h3 className="text-xl font-semibold">과목별 상세 분석</h3>
          </div>
          <div className="space-y-6">
            {Object.entries(result.subject_groups)
              .sort(([, a], [, b]) => a.subjectNumber - b.subjectNumber)
              .map(([subjectCode, subjectData]) => {
                const avgPercentage = subjectData.totalQuestions > 0
                  ? ((subjectData.totalCorrect / subjectData.totalQuestions) * 100).toFixed(1)
                  : '0.0'

                return (
                  <div key={subjectCode} className="border-l-4 border-primary pl-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-semibold text-primary">
                        {subjectData.subjectNumber}과목 - {subjectData.subjectName}
                      </h4>
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

      {/* 안내 메시지 */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-sm text-blue-900 dark:text-blue-100">
          💡 이 결과는 최초 진단 테스트 결과입니다.
          현재 학습 성과는 위의 <strong>"학습 성과 분석"</strong> 섹션에서 확인하세요.
        </p>
      </div>
    </div>
  )
}
