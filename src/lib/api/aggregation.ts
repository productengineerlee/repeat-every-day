/**
 * Data Aggregation API
 * 
 * 통계 집계 및 분석을 위한 API 함수들
 */

import { supabase } from '../supabaseClient'
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, subWeeks, subMonths } from 'date-fns'

export interface PeriodStatistics {
  period: string // 'daily' | 'weekly' | 'monthly'
  startDate: string
  endDate: string
  totalQuestions: number
  correctAnswers: number
  accuracy: number
  averageTimeSpent: number
  categories: {
    category: string
    count: number
    accuracy: number
  }[]
  dailyBreakdown?: {
    date: string
    count: number
    accuracy: number
  }[]
}

export interface ComparisonResult {
  current: PeriodStatistics
  previous: PeriodStatistics
  improvement: {
    accuracy: number // 정답률 변화 (%)
    totalQuestions: number // 문제 수 변화
    averageTimeSpent: number // 평균 시간 변화 (%)
  }
}

export interface ExamReadiness {
  overallScore: number // 0-100
  readinessLevel: 'not-ready' | 'needs-improvement' | 'ready' | 'excellent'
  predictedScore: number // 예상 점수 (0-100)
  weakAreas: string[]
  strongAreas: string[]
  recommendations: string[]
  daysUntilExam: number | null
}

/**
 * 일일 통계 집계
 */
export async function getDailyStatistics(
  userId: string,
  date: Date = new Date()
): Promise<PeriodStatistics> {
  try {
    const start = startOfDay(date)
    const end = endOfDay(date)

    const { data: records, error } = await supabase
      .from('study_records')
      .select(
        `
        is_correct,
        time_spent,
        created_at,
        question:questions(category)
      `
      )
      .eq('user_id', userId)
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())

    if (error) {
      throw error
    }

    return aggregateStatistics(records || [], 'daily', start.toISOString(), end.toISOString())
  } catch (error) {
    console.error('Error fetching daily statistics:', error)
    return createEmptyStatistics('daily', startOfDay(new Date()).toISOString(), endOfDay(new Date()).toISOString())
  }
}

/**
 * 주간 통계 집계
 */
export async function getWeeklyStatistics(
  userId: string,
  weekStart: Date = startOfWeek(new Date())
): Promise<PeriodStatistics> {
  try {
    const start = startOfWeek(weekStart)
    const end = endOfWeek(weekStart)

    const { data: records, error } = await supabase
      .from('study_records')
      .select(
        `
        is_correct,
        time_spent,
        created_at,
        question:questions(category)
      `
      )
      .eq('user_id', userId)
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())

    if (error) {
      throw error
    }

    return aggregateStatistics(records || [], 'weekly', start.toISOString(), end.toISOString())
  } catch (error) {
    console.error('Error fetching weekly statistics:', error)
    return createEmptyStatistics('weekly', startOfWeek(new Date()).toISOString(), endOfWeek(new Date()).toISOString())
  }
}

/**
 * 월간 통계 집계
 */
export async function getMonthlyStatistics(
  userId: string,
  monthStart: Date = startOfMonth(new Date())
): Promise<PeriodStatistics> {
  try {
    const start = startOfMonth(monthStart)
    const end = endOfMonth(monthStart)

    const { data: records, error } = await supabase
      .from('study_records')
      .select(
        `
        is_correct,
        time_spent,
        created_at,
        question:questions(category)
      `
      )
      .eq('user_id', userId)
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())

    if (error) {
      throw error
    }

    return aggregateStatistics(records || [], 'monthly', start.toISOString(), end.toISOString())
  } catch (error) {
    console.error('Error fetching monthly statistics:', error)
    return createEmptyStatistics('monthly', startOfMonth(new Date()).toISOString(), endOfMonth(new Date()).toISOString())
  }
}

/**
 * 통계 데이터 집계 헬퍼 함수
 */
interface StudyRecord {
  is_correct: boolean
  time_spent?: number | null
  created_at: string
  question: {
    category?: string
  } | null | {
    category?: string
  }[]
}

function aggregateStatistics(
  records: StudyRecord[],
  period: 'daily' | 'weekly' | 'monthly',
  startDate: string,
  endDate: string
): PeriodStatistics {
  let totalQuestions = 0
  let correctAnswers = 0
  let totalTimeSpent = 0
  const categoryMap: Record<string, { count: number; correct: number }> = {}
  const dailyMap: Record<string, { count: number; correct: number }> = {}

    records.forEach((record) => {
      totalQuestions += 1
      if (record.is_correct) {
        correctAnswers += 1
      }
      totalTimeSpent += record.time_spent || 0

      // question이 배열인 경우 첫 번째 요소 사용
      const questionData = Array.isArray(record.question) ? record.question[0] : record.question
      const category = (questionData as { category?: string })?.category || '기타'
    if (!categoryMap[category]) {
      categoryMap[category] = { count: 0, correct: 0 }
    }
    categoryMap[category].count += 1
    if (record.is_correct) {
      categoryMap[category].correct += 1
    }

    // 일별 집계 (주간/월간의 경우)
    if (period !== 'daily') {
      const date = new Date(record.created_at).toISOString().split('T')[0]
      if (!dailyMap[date]) {
        dailyMap[date] = { count: 0, correct: 0 }
      }
      dailyMap[date].count += 1
      if (record.is_correct) {
        dailyMap[date].correct += 1
      }
    }
  })

  const categories = Object.entries(categoryMap).map(([category, data]) => ({
    category,
    count: data.count,
    accuracy: data.count > 0 ? Math.round((data.correct / data.count) * 100) : 0,
  }))

  const dailyBreakdown =
    period !== 'daily'
      ? Object.entries(dailyMap)
          .map(([date, data]) => ({
            date,
            count: data.count,
            accuracy: data.count > 0 ? Math.round((data.correct / data.count) * 100) : 0,
          }))
          .sort((a, b) => a.date.localeCompare(b.date))
      : undefined

  return {
    period,
    startDate,
    endDate,
    totalQuestions,
    correctAnswers,
    accuracy: totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0,
    averageTimeSpent: totalQuestions > 0 ? Math.round(totalTimeSpent / totalQuestions) : 0,
    categories,
    dailyBreakdown,
  }
}

/**
 * 빈 통계 데이터 생성
 */
function createEmptyStatistics(
  period: 'daily' | 'weekly' | 'monthly',
  startDate: string,
  endDate: string
): PeriodStatistics {
  return {
    period,
    startDate,
    endDate,
    totalQuestions: 0,
    correctAnswers: 0,
    accuracy: 0,
    averageTimeSpent: 0,
    categories: [],
  }
}

/**
 * 기간 비교
 */
export async function comparePeriods(
  userId: string,
  period: 'daily' | 'weekly' | 'monthly'
): Promise<ComparisonResult> {
  try {
    let current: PeriodStatistics
    let previous: PeriodStatistics
    const now = new Date()

    if (period === 'daily') {
      current = await getDailyStatistics(userId, now)
      previous = await getDailyStatistics(userId, subDays(now, 1))
    } else if (period === 'weekly') {
      current = await getWeeklyStatistics(userId, startOfWeek(now))
      previous = await getWeeklyStatistics(userId, startOfWeek(subWeeks(now, 1)))
    } else {
      current = await getMonthlyStatistics(userId, startOfMonth(now))
      previous = await getMonthlyStatistics(userId, startOfMonth(subMonths(now, 1)))
    }

    const improvement = {
      accuracy: current.accuracy - previous.accuracy,
      totalQuestions: current.totalQuestions - previous.totalQuestions,
      averageTimeSpent:
        previous.averageTimeSpent > 0
          ? Math.round(((current.averageTimeSpent - previous.averageTimeSpent) / previous.averageTimeSpent) * 100)
          : 0,
    }

    return {
      current,
      previous,
      improvement,
    }
  } catch (error) {
    console.error('Error comparing periods:', error)
    throw error
  }
}

/**
 * 시험 준비도 예측
 */
export async function predictExamReadiness(userId: string): Promise<ExamReadiness> {
  try {
    // 사용자 정보 가져오기
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('target_exam_date, certification_type')
      .eq('id', userId)
      .single()

    if (userError) {
      throw userError
    }

    const targetExamDate = userData?.target_exam_date
      ? new Date(userData.target_exam_date)
      : null
    const daysUntilExam = targetExamDate
      ? Math.ceil((targetExamDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null

    // 최근 성능 데이터 가져오기
    const monthlyStats = await getMonthlyStatistics(userId)
    const categoryPerformance = await getCategoryPerformance(userId, 'all')

    // 전체 평균 정답률
    const overallAccuracy = monthlyStats.accuracy

    // 약점 및 강점 영역 식별
    const weakAreas = categoryPerformance
      .filter((c) => c.accuracy < 60)
      .map((c) => c.category)
    const strongAreas = categoryPerformance
      .filter((c) => c.accuracy >= 80)
      .map((c) => c.category)

    // 예상 점수 계산 (최근 성능 기반)
    const predictedScore = Math.min(100, Math.max(0, overallAccuracy + (daysUntilExam && daysUntilExam > 0 ? Math.min(10, daysUntilExam * 0.5) : 0)))

    // 준비도 레벨 결정
    let readinessLevel: ExamReadiness['readinessLevel']
    if (overallAccuracy >= 85 && weakAreas.length === 0) {
      readinessLevel = 'excellent'
    } else if (overallAccuracy >= 70 && weakAreas.length <= 2) {
      readinessLevel = 'ready'
    } else if (overallAccuracy >= 50) {
      readinessLevel = 'needs-improvement'
    } else {
      readinessLevel = 'not-ready'
    }

    // 추천 생성
    const recommendations: string[] = []
    if (weakAreas.length > 0) {
      recommendations.push(
        `${weakAreas.slice(0, 3).join(', ')} 영역에 집중 학습이 필요합니다.`
      )
    }
    if (overallAccuracy < 70) {
      recommendations.push('전체 정답률을 70% 이상으로 끌어올리세요.')
    }
    if (daysUntilExam && daysUntilExam > 0 && daysUntilExam < 30) {
      recommendations.push(`시험까지 ${daysUntilExam}일 남았습니다. 오답 노트를 활용한 집중 복습을 권장합니다.`)
    }
    if (recommendations.length === 0) {
      recommendations.push('현재 학습 상태가 양호합니다. 꾸준히 유지하세요.')
    }

    return {
      overallScore: overallAccuracy,
      readinessLevel,
      predictedScore: Math.round(predictedScore),
      weakAreas,
      strongAreas,
      recommendations,
      daysUntilExam,
    }
  } catch (error) {
    console.error('Error predicting exam readiness:', error)
    return {
      overallScore: 0,
      readinessLevel: 'not-ready',
      predictedScore: 0,
      weakAreas: [],
      strongAreas: [],
      recommendations: ['데이터가 부족합니다. 더 많은 학습을 진행해주세요.'],
      daysUntilExam: null,
    }
  }
}

/**
 * 카테고리별 성능 데이터 가져오기 (import용)
 */
async function getCategoryPerformance(
  userId: string,
  period: 'week' | 'month' | 'all'
): Promise<{ category: string; accuracy: number }[]> {
  const { getCategoryPerformance } = await import('./statistics')
  return getCategoryPerformance(userId, period)
}

