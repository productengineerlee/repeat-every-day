import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/context'
import {
  getDetailedWeaknessAnalysis,
  getQuestionLevelPerformance,
  type DetailedWeaknessAnalysis,
  type QuestionLevelPerformance,
} from '@/lib/api/weaknessAnalysis'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Filter,
  Lightbulb,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function WeakAreaAnalysis() {
  const { user } = useAuth()
  const [analysis, setAnalysis] = useState<DetailedWeaknessAnalysis[]>([])
  const [filteredAnalysis, setFilteredAnalysis] = useState<DetailedWeaknessAnalysis[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [questionPerformance, setQuestionPerformance] = useState<QuestionLevelPerformance[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all')

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const data = await getDetailedWeaknessAnalysis(user.id)
        setAnalysis(data)
        setFilteredAnalysis(data)
      } catch (error) {
        console.error('Error fetching weakness analysis:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user])

  // 필터링 적용
  useEffect(() => {
    let filtered = [...analysis]

    if (priorityFilter !== 'all') {
      filtered = filtered.filter((item) => item.priority === priorityFilter)
    }

    setFilteredAnalysis(filtered)
  }, [analysis, priorityFilter])

  // 카테고리 확장/축소
  const toggleCategory = async (category: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(category)) {
      newExpanded.delete(category)
      setSelectedCategory(null)
      setQuestionPerformance([])
    } else {
      newExpanded.add(category)
      setSelectedCategory(category)
      // 문제 수준 성능 데이터 가져오기
      if (user) {
        const questions = await getQuestionLevelPerformance(user.id, category)
        setQuestionPerformance(questions)
      }
    }
    setExpandedCategories(newExpanded)
  }

  // 레이더 차트 데이터 생성
  const radarChartData = filteredAnalysis.map((item) => ({
    category: item.category.length > 8 ? item.category.substring(0, 8) + '...' : item.category,
    fullCategory: item.category,
    score: item.currentScore,
    full: 100,
  }))

  const getTrendIcon = (trend: DetailedWeaknessAnalysis['trend']) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getPriorityColor = (priority: DetailedWeaknessAnalysis['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-red-300 dark:border-red-700'
      case 'medium':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700'
      case 'low':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-300 dark:border-green-700'
    }
  }

  if (loading) {
    return (
      <div className="bg-card border rounded-lg p-6 space-y-4">
        <div className="h-6 bg-muted animate-pulse rounded w-1/3" />
        <div className="h-64 bg-muted animate-pulse rounded" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </div>
    )
  }

  if (analysis.length === 0) {
    return (
      <div className="bg-card border rounded-lg p-6 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">
          아직 분석할 데이터가 없습니다.
          <br />
          진단 테스트를 완료하면 취약 영역 분석을 확인할 수 있습니다.
        </p>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-card border rounded-lg p-6 space-y-6"
    >
      {/* 헤더 */}
      <div>
        <h2 className="text-2xl font-bold mb-2">상세 약점 분석</h2>
        <p className="text-muted-foreground text-sm">
          영역별 상세 성능 분석과 개인화된 학습 추천을 확인하세요
        </p>
      </div>

      {/* 필터 */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">우선순위:</span>
        {(['all', 'high', 'medium', 'low'] as const).map((priority) => (
          <button
            key={priority}
            onClick={() => setPriorityFilter(priority)}
            className={cn(
              'px-3 py-1 rounded-lg text-sm font-medium transition-colors',
              priorityFilter === priority
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80'
            )}
          >
            {priority === 'all' ? '전체' : priority === 'high' ? '높음' : priority === 'medium' ? '보통' : '낮음'}
          </button>
        ))}
      </div>

      {/* 레이더 차트 */}
      {radarChartData.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">전체 성능 레이더 차트</h3>
          <div className="w-full h-[400px]" style={{ minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarChartData}>
              <PolarGrid stroke="hsl(var(--muted))" />
              <PolarAngleAxis
                dataKey="category"
                tick={{ fill: 'currentColor', fontSize: 12 }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tick={{ fill: 'currentColor', fontSize: 10 }}
              />
              <Radar
                name="점수"
                dataKey="score"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.6}
                animationDuration={1000}
              />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 상세 분석 리스트 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">영역별 상세 분석</h3>
        {filteredAnalysis.map((item, index) => {
          const isExpanded = expandedCategories.has(item.category)

          return (
            <motion.div
              key={item.category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className={cn(
                'border rounded-lg overflow-hidden transition-all',
                getPriorityColor(item.priority)
              )}
            >
              {/* 카테고리 헤더 */}
              <button
                onClick={() => toggleCategory(item.category)}
                className="w-full p-4 flex items-center justify-between hover:bg-opacity-50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex items-center gap-2">
                    {getTrendIcon(item.trend)}
                    <span className="font-semibold text-lg">{item.category}</span>
                    <span className={cn('text-xs px-2 py-1 rounded', getPriorityColor(item.priority))}>
                      {item.priority === 'high' ? '높음' : item.priority === 'medium' ? '보통' : '낮음'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 ml-auto">
                    <div className="text-right">
                      <span className="font-bold text-xl">{item.currentScore}점</span>
                      {item.improvement !== 0 && (
                        <span
                          className={cn(
                            'text-sm ml-2',
                            item.improvement > 0
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-red-600 dark:text-red-400'
                          )}
                        >
                          {item.improvement > 0 ? '+' : ''}
                          {item.improvement.toFixed(1)}점
                        </span>
                      )}
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </div>
                </div>
              </button>

              {/* 확장된 내용 */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 bg-background space-y-4 border-t">
                      {/* 추천 */}
                      <div className="flex items-start gap-2 p-3 bg-primary/10 rounded-lg">
                        <Lightbulb className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-sm mb-1">학습 추천</p>
                          <p className="text-sm text-muted-foreground">{item.recommendation}</p>
                        </div>
                      </div>

                      {/* 성능 통계 */}
                      {item.performance && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground">정답률</p>
                            <p className="text-lg font-bold">
                              {Math.round(item.performance.accuracy * 100)}%
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">시도 횟수</p>
                            <p className="text-lg font-bold">{item.performance.totalAttempts}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">오답 수</p>
                            <p className="text-lg font-bold">{item.performance.wrongAnswerCount}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">평균 시간</p>
                            <p className="text-lg font-bold">
                              {Math.round(item.performance.averageTimeSpent)}초
                            </p>
                          </div>
                        </div>
                      )}

                      {/* 문제 수준 성능 */}
                      {questionPerformance.length > 0 && item.category === selectedCategory && (
                        <div className="space-y-2">
                          <h4 className="font-semibold text-sm">문제별 성능 (정확도 낮은 순)</h4>
                          <div className="max-h-64 overflow-y-auto space-y-2">
                            {questionPerformance.slice(0, 10).map((q) => (
                              <div
                                key={q.questionId}
                                className="p-2 bg-muted rounded text-sm flex items-center justify-between"
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="truncate">{q.content}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-muted-foreground">
                                      난이도: {q.difficulty}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      시도: {q.attempts}회
                                    </span>
                                  </div>
                                </div>
                                <div className="ml-4 text-right">
                                  <p
                                    className={cn(
                                      'font-bold',
                                      q.accuracy < 50
                                        ? 'text-red-600 dark:text-red-400'
                                        : q.accuracy < 70
                                        ? 'text-yellow-600 dark:text-yellow-400'
                                        : 'text-green-600 dark:text-green-400'
                                    )}
                                  >
                                    {q.accuracy}%
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}

