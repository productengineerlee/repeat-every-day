/**
 * Statistics and Analytics API
 * 
 * 학습 통계 및 분석 데이터를 가져오는 API 함수들
 */

import { supabase } from '../supabaseClient'

export interface DailyActivity {
  date: string // YYYY-MM-DD 형식
  count: number // 해당 날짜에 풀이한 문제 수
  correctCount: number // 정답 수
  accuracy: number // 정답률 (0-100)
}

export interface StreakData {
  currentStreak: number
  longestStreak: number
  totalDays: number
  activityMap: Record<string, DailyActivity>
}

/**
 * 일일 활동 데이터 가져오기 (최근 1년)
 */
export async function getDailyActivity(
  userId: string,
  days: number = 365
): Promise<DailyActivity[]> {
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    startDate.setHours(0, 0, 0, 0)

    // study_records에서 일일 활동 데이터 집계
    const { data: records, error } = await supabase
      .from('study_records')
      .select('is_correct, created_at')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true })

    if (error) {
      throw error
    }

    // 날짜별로 집계 (한국 시간대 기준)
    const activityMap: Record<string, { count: number; correctCount: number }> = {}

    // 날짜별로 집계 (한국 시간대 기준)
    const kstOffset = 9 * 60 * 60 * 1000 // 9시간을 밀리초로

    records?.forEach((record) => {
      // UTC 시간을 한국 시간(UTC+9)으로 변환
      const utcDate = new Date(record.created_at)
      const kstDate = new Date(utcDate.getTime() + kstOffset)
      const date = kstDate.toISOString().split('T')[0]
      
      if (!activityMap[date]) {
        activityMap[date] = { count: 0, correctCount: 0 }
      }
      activityMap[date].count += 1
      if (record.is_correct) {
        activityMap[date].correctCount += 1
      }
    })

    // 모든 날짜를 포함하는 배열 생성 (빈 날짜도 포함) - KST 기준
    const result: DailyActivity[] = []
    const todayKST = new Date(new Date().getTime() + kstOffset)
    const todayKSTStr = todayKST.toISOString().split('T')[0]
    
    // KST 기준으로 날짜 배열 생성
    for (let i = 0; i < days; i++) {
      const dateKST = new Date(todayKST)
      dateKST.setDate(dateKST.getDate() - (days - 1 - i))
      const dateStr = dateKST.toISOString().split('T')[0]

      const activity = activityMap[dateStr]
      result.push({
        date: dateStr,
        count: activity?.count || 0,
        correctCount: activity?.correctCount || 0,
        accuracy:
          activity && activity.count > 0
            ? Math.round((activity.correctCount / activity.count) * 100)
            : 0,
      })
    }

    return result
  } catch (error) {
    console.error('Error fetching daily activity:', error)
    return []
  }
}

/**
 * 스트릭 데이터 가져오기
 */
export async function getStreakData(userId: string): Promise<StreakData> {
  try {
    // 일일 활동 데이터 가져오기
    const dailyActivity = await getDailyActivity(userId, 365)

    // 활동 맵 생성
    const activityMap: Record<string, DailyActivity> = {}
    dailyActivity.forEach((activity) => {
      activityMap[activity.date] = activity
    })

    // 현재 스트릭 계산 (오늘부터 역순으로 연속된 학습일 계산)
    const kstOffset = 9 * 60 * 60 * 1000
    const nowKST = new Date(new Date().getTime() + kstOffset)
    const todayDateStr = nowKST.toISOString().split('T')[0]
    
    console.log('🔥 스트릭 계산 시작')
    console.log('📅 오늘 날짜 (KST):', todayDateStr)
    console.log('📊 활동 맵 키들:', Object.keys(activityMap).sort().reverse().slice(0, 10))
    console.log('📊 오늘 활동 데이터:', activityMap[todayDateStr])
    
    let currentStreak = 0
    for (let i = 0; i < 365; i++) {
      // KST 기준으로 i일 전 날짜 계산
      const checkDateKST = new Date(nowKST.getTime())
      checkDateKST.setDate(checkDateKST.getDate() - i)
      const dateStr = checkDateKST.toISOString().split('T')[0]
      
      const activity = activityMap[dateStr]
      
      if (i < 5) {
        console.log(`  Day -${i} (${dateStr}):`, activity ? `${activity.count}문제` : '학습 없음')
      }
      
      if (activity && activity.count > 0) {
        currentStreak++
      } else {
        // 첫 날(오늘)이 아니면 스트릭 중단
        if (i > 0) {
          break
        }
      }
    }
    
    console.log('🔥 최종 스트릭:', currentStreak)

    // 최장 스트릭 계산
    let longestStreak = 0
    let tempStreak = 0
    const sortedDates = [...dailyActivity]
      .filter((a) => a.count > 0)
      .map((a) => a.date)
      .sort()

    if (sortedDates.length > 0) {
      let prevDate: Date | null = null
      sortedDates.forEach((dateStr) => {
        const date = new Date(dateStr)
        date.setHours(0, 0, 0, 0)

        if (prevDate) {
          const diffDays = Math.floor(
            (date.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
          )
          if (diffDays === 1) {
            tempStreak += 1
          } else {
            longestStreak = Math.max(longestStreak, tempStreak)
            tempStreak = 1
          }
        } else {
          tempStreak = 1
        }
        prevDate = date
      })
      longestStreak = Math.max(longestStreak, tempStreak)
    }

    // 총 학습일 계산
    const totalDays = dailyActivity.filter((a) => a.count > 0).length

    return {
      currentStreak,
      longestStreak,
      totalDays,
      activityMap,
    }
  } catch (error) {
    console.error('Error fetching streak data:', error)
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalDays: 0,
      activityMap: {},
    }
  }
}

export interface AccuracyTrend {
  date: string // YYYY-MM-DD 형식
  accuracy: number // 정답률 (0-100)
  count: number // 해당 날짜의 문제 수
}

export interface CategoryPerformance {
  category: string
  accuracy: number // 정답률 (0-100)
  totalCount: number // 총 문제 수
  correctCount: number // 정답 수
}

/**
 * 정확도 추이 데이터 가져오기
 */
export async function getAccuracyTrend(
  userId: string,
  period: 'week' | 'month' | 'all' = 'month'
): Promise<AccuracyTrend[]> {
  try {
    let days = 30 // 기본값: 월간
    if (period === 'week') {
      days = 7
    } else if (period === 'month') {
      days = 30
    } else {
      days = 365
    }

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    startDate.setHours(0, 0, 0, 0)

    // study_records에서 날짜별 정확도 집계
    const { data: records, error } = await supabase
      .from('study_records')
      .select('is_correct, created_at')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true })

    if (error) {
      throw error
    }

    // 날짜별로 집계 (한국 시간대 기준)
    const trendMap: Record<string, { count: number; correctCount: number }> = {}
    const kstOffset = 9 * 60 * 60 * 1000 // 9시간을 밀리초로

    records?.forEach((record) => {
      // UTC 시간을 한국 시간(UTC+9)으로 변환
      const utcDate = new Date(record.created_at)
      const kstDate = new Date(utcDate.getTime() + kstOffset)
      const date = kstDate.toISOString().split('T')[0]
      
      if (!trendMap[date]) {
        trendMap[date] = { count: 0, correctCount: 0 }
      }
      trendMap[date].count += 1
      if (record.is_correct) {
        trendMap[date].correctCount += 1
      }
    })

    // 결과 배열 생성 - KST 기준
    const result: AccuracyTrend[] = []
    const todayKST = new Date(new Date().getTime() + kstOffset)

    for (let i = 0; i < days; i++) {
      const dateKST = new Date(todayKST)
      dateKST.setDate(dateKST.getDate() - (days - 1 - i))
      const dateStr = dateKST.toISOString().split('T')[0]

      const data = trendMap[dateStr]
      const count = data?.count || 0
      const correctCount = data?.correctCount || 0
      const accuracy = count > 0 ? Math.round((correctCount / count) * 100) : 0

      result.push({
        date: dateStr,
        accuracy,
        count,
      })
    }

    return result
  } catch (error) {
    console.error('Error fetching accuracy trend:', error)
    return []
  }
}

/**
 * 카테고리별 성능 데이터 가져오기
 */
export async function getCategoryPerformance(
  userId: string,
  period: 'week' | 'month' | 'all' = 'month'
): Promise<CategoryPerformance[]> {
  try {
    let days = 30 // 기본값: 월간
    if (period === 'week') {
      days = 7
    } else if (period === 'month') {
      days = 30
    } else {
      days = 365
    }

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    startDate.setHours(0, 0, 0, 0)

    // study_records와 questions 조인하여 카테고리별 성능 집계
    const { data: records, error } = await supabase
      .from('study_records')
      .select(
        `
        is_correct,
        question:questions(category)
      `
      )
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())

    if (error) {
      throw error
    }

    // 카테고리별 집계
    const categoryMap: Record<
      string,
      { totalCount: number; correctCount: number }
    > = {}

    records?.forEach((record) => {
      const category =
        (record.question as { category?: string })?.category || '기타'
      if (!categoryMap[category]) {
        categoryMap[category] = { totalCount: 0, correctCount: 0 }
      }
      categoryMap[category].totalCount += 1
      if (record.is_correct) {
        categoryMap[category].correctCount += 1
      }
    })

    // 결과 배열 생성
    const result: CategoryPerformance[] = Object.entries(categoryMap).map(
      ([category, data]) => ({
        category,
        accuracy:
          data.totalCount > 0
            ? Math.round((data.correctCount / data.totalCount) * 100)
            : 0,
        totalCount: data.totalCount,
        correctCount: data.correctCount,
      })
    )

    // 정확도 순으로 정렬
    return result.sort((a, b) => b.accuracy - a.accuracy)
  } catch (error) {
    console.error('Error fetching category performance:', error)
    return []
  }
}

