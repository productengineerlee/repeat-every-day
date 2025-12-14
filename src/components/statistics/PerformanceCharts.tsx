import { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/context'
import {
  getAccuracyTrend,
  getCategoryPerformance,
  type AccuracyTrend,
  type CategoryPerformance,
} from '@/lib/api/statistics'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart,
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { ko } from 'date-fns/locale'
import { TrendingUp, BarChart3, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

type Period = 'week' | 'month' | 'all'

const PERIOD_LABELS: Record<Period, string> = {
  week: '주간',
  month: '월간',
  all: '전체',
}

export default function PerformanceCharts() {
  const { user } = useAuth()
  const [period, setPeriod] = useState<Period>('week')
  const [accuracyTrend, setAccuracyTrend] = useState<AccuracyTrend[]>([])
  const [categoryPerformance, setCategoryPerformance] = useState<CategoryPerformance[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const [trend, category] = await Promise.all([
          getAccuracyTrend(user.id, period),
          getCategoryPerformance(user.id, period),
        ])
        setAccuracyTrend(trend)
        setCategoryPerformance(category)
      } catch (error) {
        console.error('Error fetching performance data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user, period])

  // 정확도 추이 차트 데이터 포맷팅
  const accuracyChartData = useMemo(() => {
    return accuracyTrend.map((item) => ({
      date: format(parseISO(item.date), 'M/d', { locale: ko }),
      fullDate: item.date,
      accuracy: item.accuracy,
      count: item.count,
    }))
  }, [accuracyTrend])

  // 카테고리 코드를 읽기 쉬운 이름으로 변환
  const formatCategoryName = (category: string): string => {
    const parts = category.split('-')
    if (parts.length < 2) return category
    
    // 과목명 매핑
    const SUBJECT_MAP: Record<string, Record<string, string>> = {
      '9': { '1': '부동산학개론', '2': '민법 및 민사특별법', '3': '공인중개사법령', '4': '부동산공법', '5': '부동산공시법령', '6': '부동산세법' },
      '7': { '1': '조사방법과 설계', '2': '조사관리와 자료처리', '3': '통계분석과 활용' },
      '8': { '1': '경제이론', '2': '경제시사', '3': '상황판단' },
      '1': { '1': '소프트웨어 설계', '2': '소프트웨어 개발', '3': '데이터베이스 구축', '4': '프로그래밍 활용', '5': '정보시스템 구축 관리' },
      '2': { '1': '컴퓨터 일반', '2': '스프레드시트', '3': '데이터베이스' },
      '3': { '1': '빅데이터 분석 기획', '2': '빅데이터 탐색', '3': '빅데이터 모델링' },
      '4': { '1': '경영정보일반', '2': '데이터 해석 및 활용', '3': '경영정보 시각화 디자인' },
      '5': { '1': '데이터 이해', '2': '데이터 분석 기획', '3': '데이터 분석' },
      '6': { '1': 'SQL 기본', '2': 'SQL 활용' },
    }
    
    // 주요항목 매핑
    const TOPIC_MAP: Record<string, string> = {
      '1-1-1': '요구사항 확인', '1-1-2': 'UI 설계',
      '1-2-1': '개발환경 구축', '1-2-2': '공통모듈 구현',
      '1-3-1': '데이터베이스 설계', '1-3-2': 'SQL 작성',
      '1-4-1': '프로그래밍 언어', '1-4-2': '응용 프로그래밍',
      '1-5-1': '시스템 구축', '1-5-2': '시스템 관리',
      '4-1-1': '경영정보 이해', '4-1-2': '기업 내부 정보', '4-1-3': '기업 외부 정보',
      '4-2-1': '데이터 이해 및 해석', '4-2-2': '데이터 파일 시스템', '4-2-3': '데이터 활용',
      '4-3-1': '시각화 디자인 원리', '4-3-2': '시각화 도구 활용', '4-3-3': '시각화 요소 디자인',
    }
    
    const subjectName = SUBJECT_MAP[parts[0]]?.[parts[1]] || `${parts[1]}과목`
    const topicKey = `${parts[0]}-${parts[1]}-${parts[2]}`
    const topicName = TOPIC_MAP[topicKey] || `항목${parts[2]}`
    
    return `${subjectName} > ${topicName}`
  }

  // 카테고리 성능 차트 데이터 포맷팅
  const categoryChartData = useMemo(() => {
    return categoryPerformance.map((item) => ({
      category: formatCategoryName(item.category),
      originalCategory: item.category,
      accuracy: item.accuracy,
      totalCount: item.totalCount,
      correctCount: item.correctCount,
    }))
  }, [categoryPerformance])

  // 평균 정확도 계산
  const averageAccuracy = useMemo(() => {
    if (accuracyTrend.length === 0) return 0
    const total = accuracyTrend.reduce((sum, item) => sum + item.accuracy, 0)
    return Math.round(total / accuracyTrend.length)
  }, [accuracyTrend])

  // 총 문제 수 계산
  const totalQuestions = useMemo(() => {
    return accuracyTrend.reduce((sum, item) => sum + item.count, 0)
  }, [accuracyTrend])

  if (loading) {
    return (
      <div className="bg-card border rounded-lg p-6 space-y-6">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 bg-muted animate-pulse rounded-lg" />
          <div className="flex-1">
            <div className="h-6 bg-muted animate-pulse rounded w-1/3 mb-2" />
            <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
          </div>
        </div>
        <div className="h-64 bg-muted animate-pulse rounded" />
        <div className="h-64 bg-muted animate-pulse rounded" />
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
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <motion.img 
            src="/mascot.png" 
            alt="Certiq Mascot" 
            className="w-16 h-16 object-contain drop-shadow-md"
            initial={{ rotate: -10 }}
            animate={{ rotate: 0 }}
            transition={{ type: "spring", stiffness: 200 }}
          />
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-700 dark:text-slate-200">
              학습 성과 분석
            </h2>
          </div>
        </div>
        <p className="text-sm md:text-base text-slate-600 dark:text-slate-300 mb-4">
          학습 성과를 시각적으로 확인하세요
        </p>
        <div className="flex items-center justify-center gap-2 mb-4">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <div className="flex gap-1 bg-muted rounded-lg p-1">
            {(['week', 'month', 'all'] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  'px-3 py-1 rounded text-sm font-medium transition-colors',
                  period === p
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 통계 요약 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-4 border-b">
        <div className="text-center">
          <p className="text-2xl font-bold">{averageAccuracy}%</p>
          <p className="text-xs text-muted-foreground">평균 정답률</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold">{totalQuestions}</p>
          <p className="text-xs text-muted-foreground">총 문제 수</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold">{categoryPerformance.length}</p>
          <p className="text-xs text-muted-foreground">학습 카테고리</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold">
            {categoryPerformance.length > 0
              ? Math.max(...categoryPerformance.map((c) => c.accuracy))
              : 0}
            %
          </p>
          <p className="text-xs text-muted-foreground">최고 정답률</p>
        </div>
      </div>

      {/* 정확도 추이 차트 */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">정답률 추이</h3>
        </div>
        {loading ? (
          <div className="h-[300px] flex items-center justify-center border rounded-lg bg-muted/50">
            <p className="text-muted-foreground">로딩 중...</p>
          </div>
        ) : accuracyChartData.length > 0 ? (
          <div className="w-full h-[300px]" style={{ minWidth: 0, minHeight: '300px' }}>
            <ResponsiveContainer width="100%" height="100%" minHeight={300}>
              <AreaChart data={accuracyChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorAccuracyGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />
              <XAxis
                dataKey="date"
                className="text-xs"
                tick={{ fill: 'currentColor', fontSize: 12 }}
                stroke="currentColor"
                axisLine={{ strokeWidth: 2 }}
              />
              <YAxis
                domain={[0, 100]}
                className="text-xs"
                tick={{ fill: 'currentColor', fontSize: 12 }}
                stroke="currentColor"
                axisLine={{ strokeWidth: 2 }}
                label={{ value: '정답률 (%)', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.5rem',
                  padding: '8px 12px',
                }}
                labelFormatter={(label, payload) => {
                  if (payload && payload[0]) {
                    const data = payload[0].payload as typeof accuracyChartData[0]
                    return format(parseISO(data.fullDate), 'yyyy년 M월 d일', { locale: ko })
                  }
                  return label
                }}
                formatter={(value: number) => [`${value}%`, '정답률']}
              />
              <Area
                type="monotone"
                dataKey="accuracy"
                stroke="#3b82f6"
                strokeWidth={3}
                fill="url(#colorAccuracyGradient)"
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 5, stroke: '#fff' }}
                activeDot={{ r: 7, strokeWidth: 2 }}
                animationDuration={1000}
              />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center border rounded-lg bg-muted/50">
            <p className="text-muted-foreground">데이터가 없습니다.</p>
          </div>
        )}
      </div>

      {/* 카테고리별 성능 차트 */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 justify-center">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">카테고리별 성능</h3>
        </div>
        {categoryChartData.length > 0 ? (
          <div className="w-full max-w-3xl mx-auto space-y-3">
            {categoryChartData.map((item, index) => {
              // 정답률에 따라 색상 결정
              let color = '#10b981' // 기본 녹색 (80%+)
              let colorClass = 'bg-green-500'
              if (item.accuracy < 50) {
                color = '#ef4444' // 빨강 (50% 미만)
                colorClass = 'bg-red-500'
              } else if (item.accuracy < 70) {
                color = '#f59e0b' // 주황 (50-70%)
                colorClass = 'bg-orange-500'
              } else if (item.accuracy < 80) {
                color = '#3b82f6' // 파랑 (70-80%)
                colorClass = 'bg-blue-500'
              }
              
              return (
                <div key={index} className="flex items-center gap-3">
                  {/* 카테고리 이름 */}
                  <div className="w-[300px] text-sm text-left flex-shrink-0">
                    {item.category}
                  </div>
                  
                  {/* 막대 그래프 */}
                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 bg-muted rounded-full h-6 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500`}
                        style={{ 
                          width: `${item.accuracy}%`,
                          backgroundColor: color
                        }}
                      />
                    </div>
                    
                    {/* 퍼센티지와 색상 점 */}
                    <div className="flex items-center gap-2 w-[60px]">
                      <span className="text-sm font-semibold">{item.accuracy}%</span>
                      <div className={`w-3 h-3 rounded-full ${colorClass}`} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center border rounded-lg bg-muted/50">
            <p className="text-muted-foreground">데이터가 없습니다.</p>
          </div>
        )}
      </div>
    </motion.div>
  )
}

