import { useState } from 'react'
import { useOnboarding } from '@/context'
import { Button } from '@/components/ui/button'
import { format, addMonths, addYears, isBefore, isAfter, startOfToday } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'

export default function ExamDatePicker() {
  const { state, setTargetExamDate, nextStep, previousStep } = useOnboarding()
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    state.targetExamDate || null
  )
  const [currentMonth, setCurrentMonth] = useState<Date>(
    state.targetExamDate || new Date()
  )
  const [error, setError] = useState<string | null>(null)

  const today = startOfToday()
  const maxDate = addYears(today, 1)

  const handleDateSelect = (date: Date) => {
    // 날짜 유효성 검사
    if (isBefore(date, today)) {
      setError('과거 날짜는 선택할 수 없습니다.')
      return
    }

    if (isAfter(date, maxDate)) {
      setError('시험 날짜는 오늘로부터 1년 이내로 선택해주세요.')
      return
    }

    setSelectedDate(date)
    setError(null)
  }

  const handleNext = () => {
    if (!selectedDate) {
      setError('시험 날짜를 선택해주세요.')
      return
    }

    setTargetExamDate(selectedDate)
    nextStep()
  }

  const handlePrevious = () => {
    previousStep()
  }

  const goToPreviousMonth = () => {
    setCurrentMonth(addMonths(currentMonth, -1))
  }

  const goToNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
  }

  const goToToday = () => {
    setCurrentMonth(new Date())
  }

  // 달력 그리드 생성
  const getCalendarDays = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()

    // 해당 월의 첫 날과 마지막 날
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)

    // 첫 날의 요일 (0 = 일요일)
    const firstDayOfWeek = firstDay.getDay()
    const daysInMonth = lastDay.getDate()

    const days: (Date | null)[] = []

    // 이전 달의 날짜들 (빈 칸)
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null)
    }

    // 현재 달의 날짜들
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }

    return days
  }

  const calendarDays = getCalendarDays()
  const weekDays = ['일', '월', '화', '수', '목', '금', '토']

  const isDateDisabled = (date: Date) => {
    return isBefore(date, today) || isAfter(date, maxDate)
  }

  const isDateSelected = (date: Date) => {
    if (!selectedDate) return false
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">시험 날짜 선택</h1>
          <p className="text-muted-foreground text-lg">
            목표 시험 날짜를 선택해주세요
          </p>
        </div>

        {/* 달력 */}
        <div className="bg-card border rounded-lg p-6">
          {/* 달력 헤더 */}
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={goToPreviousMonth}
              aria-label="이전 달"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">
                {format(currentMonth, 'yyyy년 M월', { locale: ko })}
              </h2>
              <Button variant="ghost" size="sm" onClick={goToToday}>
                오늘
              </Button>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={goToNextMonth}
              aria-label="다음 달"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((day) => (
              <div
                key={day}
                className="text-center text-sm font-medium text-muted-foreground py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* 날짜 그리드 */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((date, index) => {
              if (!date) {
                return <div key={index} className="aspect-square" />
              }

              const disabled = isDateDisabled(date)
              const selected = isDateSelected(date)
              const isToday =
                date.getDate() === today.getDate() &&
                date.getMonth() === today.getMonth() &&
                date.getFullYear() === today.getFullYear()

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => !disabled && handleDateSelect(date)}
                  disabled={disabled}
                  className={`
                    aspect-square rounded-md text-sm font-medium transition-colors
                    ${
                      disabled
                        ? 'text-muted-foreground/30 cursor-not-allowed'
                        : 'hover:bg-accent cursor-pointer'
                    }
                    ${
                      selected
                        ? 'bg-primary text-primary-foreground'
                        : isToday
                        ? 'bg-accent font-bold'
                        : ''
                    }
                  `}
                >
                  {date.getDate()}
                </button>
              )
            })}
          </div>
        </div>

        {/* 선택된 날짜 표시 */}
        {selectedDate && (
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-lg">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="font-medium">
                선택된 날짜: {format(selectedDate, 'yyyy년 M월 d일 (E)', { locale: ko })}
              </span>
            </div>
          </div>
        )}

        {/* 에러 메시지 */}
        {error && (
          <div className="p-4 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            {error}
          </div>
        )}

        {/* 네비게이션 버튼 */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={handlePrevious}>
            이전
          </Button>
          <Button onClick={handleNext} disabled={!selectedDate}>
            다음
          </Button>
        </div>
      </div>
    </div>
  )
}

