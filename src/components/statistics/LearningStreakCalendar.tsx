import { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/context'
import { getDailyActivity, getStreakData, type DailyActivity, type StreakData } from '@/lib/api/statistics'
import { format, eachDayOfInterval, isSameDay, addMonths, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import { ko } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Flame } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CalendarDay {
  date: Date
  activity: DailyActivity | null
  isToday: boolean
  isInCurrentMonth: boolean
}

export default function LearningStreakCalendar() {
  const { user } = useAuth()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [activityData, setActivityData] = useState<DailyActivity[]>([])
  const [streakData, setStreakData] = useState<StreakData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const [activity, streak] = await Promise.all([
          getDailyActivity(user.id, 365),
          getStreakData(user.id),
        ])
        setActivityData(activity)
        setStreakData(streak)
      } catch (error) {
        console.error('Error fetching calendar data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user, currentMonth]) // currentMonth를 의존성에 추가하여 월 변경 시 데이터 새로고침

  // 활동 맵 생성
  const activityMap = useMemo(() => {
    const map: Record<string, DailyActivity> = {}
    activityData.forEach((activity) => {
      map[activity.date] = activity
    })
    return map
  }, [activityData])

  // 캘린더 그리드 생성
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const start = startOfMonth(monthStart)
    const end = endOfMonth(monthEnd)

    // 캘린더 시작일을 일요일로 맞추기
    const startDay = start.getDay()
    const adjustedStart = new Date(start)
    adjustedStart.setDate(adjustedStart.getDate() - startDay)

    const days = eachDayOfInterval({ start: adjustedStart, end })
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return days.map((date) => {
      const dateStr = format(date, 'yyyy-MM-dd')
      const activity = activityMap[dateStr] || null
      const isToday = isSameDay(date, today)
      const isInCurrentMonth = date >= monthStart && date <= monthEnd

      return {
        date,
        activity,
        isToday,
        isInCurrentMonth,
      } as CalendarDay
    })
  }, [currentMonth, activityMap])

  // 색상 강도 계산 (더 연한 색상으로 가독성 향상)
  const getIntensityColor = (count: number): string => {
    if (count === 0) return 'bg-muted'
    if (count >= 10) return 'bg-green-200 dark:bg-green-800/40'
    if (count >= 5) return 'bg-green-100 dark:bg-green-800/30'
    if (count >= 3) return 'bg-green-50 dark:bg-green-800/20'
    if (count >= 1) return 'bg-green-50/50 dark:bg-green-800/10'
    return 'bg-muted'
  }

  // 스트릭 날짜 확인 (현재 스트릭의 날짜들)
  const streakDates = useMemo(() => {
    if (!streakData || streakData.currentStreak === 0) return new Set<string>()

    const dates = new Set<string>()
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = 0; i < streakData.currentStreak; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      dates.add(format(date, 'yyyy-MM-dd'))
    }

    return dates
  }, [streakData])

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
  }

  const handleToday = () => {
    setCurrentMonth(new Date())
  }

  if (loading) {
    return (
      <div className="bg-card border rounded-lg p-6">
        <div className="h-6 bg-muted animate-pulse rounded w-1/3 mb-4" />
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="h-8 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </div>
    )
  }

  const weekDays = ['일', '월', '화', '수', '목', '금', '토']

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-card border rounded-lg p-6 space-y-4"
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">학습 캘린더</h2>
          <p className="text-muted-foreground text-sm">
            매일의 학습 활동을 확인하세요
          </p>
        </div>
        {streakData && streakData.currentStreak > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
            <Flame className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            <span className="font-bold text-orange-600 dark:text-orange-400">
              {streakData.currentStreak}일 연속
            </span>
          </div>
        )}
      </div>

      {/* 통계 요약 */}
      {streakData && (
        <div className="grid grid-cols-3 gap-4 pb-4 border-b">
          <div className="text-center">
            <p className="text-2xl font-bold">{streakData.currentStreak}</p>
            <p className="text-xs text-muted-foreground">현재 스트릭</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{streakData.longestStreak}</p>
            <p className="text-xs text-muted-foreground">최장 스트릭</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{streakData.totalDays}</p>
            <p className="text-xs text-muted-foreground">총 학습일</p>
          </div>
        </div>
      )}

      {/* 월 네비게이션 */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePreviousMonth}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">
            {format(currentMonth, 'yyyy년 M월', { locale: ko })}
          </h3>
          <Button variant="outline" size="sm" onClick={handleToday}>
            오늘
          </Button>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleNextMonth}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* 캘린더 그리드 */}
      <div className="space-y-2">
        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-muted-foreground py-1"
            >
              {day}
            </div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => {
            const dateStr = format(day.date, 'yyyy-MM-dd')
            const isStreakDay = streakDates.has(dateStr)
            const intensity = day.activity?.count || 0
            const hasActivity = intensity > 0

            return (
              <motion.div
                key={dateStr}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, delay: index * 0.01 }}
                className={`relative h-20 rounded-md transition-all flex flex-col items-center justify-center p-1 ${
                  !day.isInCurrentMonth
                    ? 'opacity-30'
                    : ''
                } ${getIntensityColor(intensity)} ${
                  day.isToday ? 'ring-2 ring-primary' : ''
                } ${isStreakDay ? 'ring-2 ring-orange-500 dark:ring-orange-400' : ''}`}
              >
                {/* 날짜 (숫자만, bold) */}
                <div className={`text-sm font-bold mb-1 ${
                  hasActivity ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  {format(day.date, 'd')}
                </div>
                
                {/* 학습 여부 아이콘 */}
                <div className="text-lg mb-0.5">
                  {hasActivity ? (
                    <span className="text-green-600 dark:text-green-400">○</span>
                  ) : (
                    <span className="text-muted-foreground/40">✕</span>
                  )}
                </div>
                
                {/* 학습 정보 (간결한 형식) */}
                {day.activity && day.activity.count > 0 && (
                  <div className="text-xs font-medium text-foreground">
                    {day.activity.correctCount}/{day.activity.count}({day.activity.accuracy}%)
                  </div>
                )}
                
                {/* 스트릭 아이콘 */}
                {isStreakDay && (
                  <div className="absolute top-0.5 right-0.5">
                    <Flame className="h-3 w-3 text-orange-500" />
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* 범례 */}
      <div className="flex items-center justify-center gap-4 pt-4 border-t text-xs">
        <span className="text-muted-foreground">활동량:</span>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-muted" />
          <span>없음</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-green-50/50 dark:bg-green-800/10" />
          <span>1-2문제</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-green-50 dark:bg-green-800/20" />
          <span>3-4문제</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-green-100 dark:bg-green-800/30" />
          <span>5-9문제</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-green-200 dark:bg-green-800/40" />
          <span>10문제+</span>
        </div>
      </div>
    </motion.div>
  )
}

