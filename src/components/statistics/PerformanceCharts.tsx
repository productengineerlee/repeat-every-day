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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
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
  const [period, setPeriod] = useState<Period>('month')
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

  // 카테고리 성능 차트 데이터 포맷팅
  const categoryChartData = useMemo(() => {
    return categoryPerformance.map((item) => ({
      category: item.category,
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
        <div className="h-6 bg-muted animate-pulse rounded w-1/3" />
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">성능 분석</h2>
          <p className="text-muted-foreground text-sm">
            학습 성과를 시각적으로 확인하세요
          </p>
        </div>
        <div className="flex items-center gap-2">
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
        {accuracyChartData.length > 0 ? (
          <div className="w-full h-[300px]" style={{ minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={accuracyChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                className="text-xs"
                tick={{ fill: 'currentColor' }}
                stroke="currentColor"
              />
              <YAxis
                domain={[0, 100]}
                className="text-xs"
                tick={{ fill: 'currentColor' }}
                stroke="currentColor"
                label={{ value: '정답률 (%)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.5rem',
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
              <Legend />
              <Line
                type="monotone"
                dataKey="accuracy"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                activeDot={{ r: 6 }}
                name="정답률"
                animationDuration={1000}
              />
              </LineChart>
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
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">카테고리별 성능</h3>
        </div>
        {categoryChartData.length > 0 ? (
          <div className="w-full h-[300px]" style={{ minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="category"
                className="text-xs"
                tick={{ fill: 'currentColor' }}
                stroke="currentColor"
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis
                domain={[0, 100]}
                className="text-xs"
                tick={{ fill: 'currentColor' }}
                stroke="currentColor"
                label={{ value: '정답률 (%)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.5rem',
                }}
                formatter={(value: number, name: string) => {
                  if (name === 'accuracy') {
                    return [`${value}%`, '정답률']
                  }
                  return [value, name]
                }}
                labelFormatter={(label) => `카테고리: ${label}`}
              />
              <Legend />
              <Bar
                dataKey="accuracy"
                fill="hsl(var(--primary))"
                name="정답률"
                radius={[8, 8, 0, 0]}
                animationDuration={1000}
              />
              </BarChart>
            </ResponsiveContainer>
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

