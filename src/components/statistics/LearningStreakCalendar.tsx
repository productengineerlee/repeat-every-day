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

    // 페이지 포커스 시 데이터 새로고침
    const handleFocus = () => {
      if (user) {
        fetchData()
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [user, currentMonth])

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

  // 정답률 기반 색상 계산 (심플하고 직관적)
  const getActivityColor = (activity: DailyActivity | null): string => {
    if (!activity || activity.count === 0) {
      return 'bg-gray-50/50 dark:bg-gray-800/10'
    }
    
    const accuracy = activity.accuracy
    if (accuracy >= 80) return 'bg-emerald-500 dark:bg-emerald-600'
    if (accuracy >= 60) return 'bg-green-500 dark:bg-green-600'
    if (accuracy >= 40) return 'bg-amber-500 dark:bg-amber-600'
    return 'bg-rose-500 dark:bg-rose-600'
  }

  // 스트릭 날짜 확인 (실제 학습 활동이 있는 연속 날짜들만)
  const streakDates = useMemo(() => {
    if (!streakData || streakData.currentStreak === 0) return new Set<string>()

    const dates = new Set<string>()
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // 실제 학습 활동이 있는 날만 연속으로 찾기
    let consecutiveDays = 0
    for (let i = 0; i < 365; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = format(date, 'yyyy-MM-dd')
      const activity = activityMap[dateStr]

      // 학습 활동이 있으면 스트릭에 추가
      if (activity && activity.count > 0) {
        dates.add(dateStr)
        consecutiveDays++
        
        // 설정된 스트릭 개수만큼만 추가
        if (consecutiveDays >= streakData.currentStreak) {
          break
        }
      } else {
        // 학습이 없으면 스트릭 중단
        break
      }
    }

    return dates
  }, [streakData, activityMap])

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
      <div className="bg-card border rounded-lg p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 bg-muted animate-pulse rounded-lg" />
          <div className="flex-1">
            <div className="h-6 bg-muted animate-pulse rounded w-1/3 mb-2" />
            <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
          </div>
        </div>
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
              학습 캘린더
            </h2>
          </div>
        </div>
        <p className="text-sm md:text-base text-slate-600 dark:text-slate-300 mb-4">
          매일의 학습 활동을 확인하세요
        </p>
        {streakData && streakData.currentStreak > 0 && (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg mb-4">
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
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {calendarDays.map((day, index) => {
            const dateStr = format(day.date, 'yyyy-MM-dd')
            const isStreakDay = streakDates.has(dateStr)
            const hasActivity = day.activity && day.activity.count > 0

            return (
              <motion.div
                key={dateStr}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, delay: index * 0.01 }}
                className={`
                  relative h-16 sm:h-20 md:h-24 rounded-lg transition-all duration-300
                  flex flex-col items-center justify-center p-1 sm:p-2
                  ${!day.isInCurrentMonth ? 'opacity-30' : ''}
                  ${getActivityColor(day.activity)}
                  ${hasActivity 
                    ? 'shadow-md hover:shadow-lg transform hover:-translate-y-0.5' 
                    : 'border border-gray-200/50 dark:border-gray-700/50'
                  }
                  ${day.isToday 
                    ? 'ring-2 sm:ring-4 ring-primary/50 ring-offset-1 sm:ring-offset-2' 
                    : ''
                  }
                  ${isStreakDay && !day.isToday
                    ? 'ring-1 sm:ring-2 ring-orange-400/60' 
                    : ''
                  }
                  cursor-pointer
                `}
              >
                {/* 날짜 숫자 */}
                <div className={`text-xs sm:text-sm md:text-base font-bold mb-0.5 sm:mb-1.5 ${
                  hasActivity 
                    ? 'text-white' 
                    : 'text-gray-600 dark:text-gray-400'
                }`}>
                  {format(day.date, 'd')}
                </div>
                
                {/* 학습 상태 아이콘 */}
                <div className="text-lg sm:text-xl md:text-2xl mb-0.5 sm:mb-1">
                  {hasActivity ? (
                    <span className="text-white drop-shadow-sm">✓</span>
                  ) : (
                    <span className="text-gray-300 dark:text-gray-600">—</span>
                  )}
                </div>
                
                {/* 학습 정보 */}
                {hasActivity && day.activity && (
                  <div className="text-[10px] sm:text-xs font-semibold text-white/95">
                    <span className="hidden sm:inline">
                      {day.activity.correctCount}/{day.activity.count}
                    </span>
                    <span className="text-[9px] sm:text-[10px] ml-0.5">
                      ({day.activity.accuracy}%)
                    </span>
                  </div>
                )}
                
                {/* 스트릭 불꽃 아이콘 */}
                {isStreakDay && (
                  <div className="absolute top-0.5 sm:top-1 right-0.5 sm:right-1">
                    <Flame className="h-3 sm:h-3.5 w-3 sm:w-3.5 text-orange-400 drop-shadow-sm" />
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* 범례 - 정답률 기준 */}
      <div className="pt-4 border-t">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-xs">
          <span className="text-muted-foreground font-medium mb-1 sm:mb-0">정답률:</span>
          <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-2 sm:gap-3 justify-center items-center">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded shadow-sm bg-gray-50 dark:bg-gray-800/10 border border-gray-200 dark:border-gray-700" />
              <span className="text-muted-foreground whitespace-nowrap">학습 없음</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded shadow-sm bg-rose-500 dark:bg-rose-600" />
              <span className="whitespace-nowrap">~40%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded shadow-sm bg-amber-500 dark:bg-amber-600" />
              <span className="whitespace-nowrap">40-60%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded shadow-sm bg-green-500 dark:bg-green-600" />
              <span className="whitespace-nowrap">60-80%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded shadow-sm bg-emerald-500 dark:bg-emerald-600" />
              <span className="whitespace-nowrap">80%+</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

