import { supabase } from '../supabaseClient'

export interface UserStreak {
  streakCount: number
  lastStreakDate: string | null
}

export interface DailyQuestionSet {
  id: string
  questionIds: string[]
  completed: boolean
  completedAt: string | null
  createdAt: string
  progress: number // 0-100
  tempQuestionIds?: string[] // 임시 문제 ID (클라이언트 측에서만 사용)
}

/**
 * 사용자 연속 학습일 정보 가져오기
 */
export async function getUserStreak(userId: string): Promise<UserStreak> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('streak_count, last_streak_date')
      .eq('id', userId)
      .maybeSingle()

    // PGRST116(데이터 없음)이 아닌 실제 에러만 처리
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching user streak:', error)
    }

    const streakCount = data?.streak_count || 0

    // 스트릭 마일스톤 달성 시 보상 분배
    if (streakCount > 0) {
      try {
        const { distributeRewardForStreak } = await import('./rewards')
        await distributeRewardForStreak(userId, streakCount)
      } catch (rewardError) {
        // 보상 분배 실패해도 스트릭 정보는 반환
        console.warn('Failed to distribute streak reward:', rewardError)
      }
    }

    return {
      streakCount,
      lastStreakDate: data?.last_streak_date || null,
    }
  } catch (error) {
    console.error('Error fetching user streak:', error)
    return {
      streakCount: 0,
      lastStreakDate: null,
    }
  }
}

/**
 * 오늘의 일일 문제 세트 가져오기
 */
export async function getTodayDailySet(
  userId: string
): Promise<DailyQuestionSet | null> {
  try {
    console.log(`🔍 getTodayDailySet 호출: userId=${userId}`)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    console.log(`📅 날짜 범위: ${today.toISOString()} ~ ${tomorrow.toISOString()}`)

    // 오늘 생성된 일일 세트 찾기
    const { data, error } = await supabase
      .from('daily_sets')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    // PGRST116(데이터 없음)이 아닌 실제 에러만 처리
    if (error && error.code !== 'PGRST116') {
      console.error('❌ Error fetching daily set:', error)
      console.error('에러 코드:', error.code)
      console.error('에러 메시지:', error.message)
      return null
    }

    if (!data) {
      console.log('📭 오늘의 일일 세트가 없습니다.')
      return null
    }

    console.log(`✅ 일일 세트를 찾았습니다: id=${data.id}, question_ids=${data.question_ids?.length || 0}개`)

    // 진행률 계산 (완료된 문제 수 / 전체 문제 수)
    const totalQuestions = data.question_ids?.length || 0
    let completedCount = 0

    if (totalQuestions > 0) {
      // study_records에서 오늘 완료한 문제 수 확인
      const { data: records } = await supabase
        .from('study_records')
        .select('question_id')
        .eq('user_id', userId)
        .in('question_id', data.question_ids)
        .gte('created_at', today.toISOString())
        .lt('created_at', tomorrow.toISOString())

      // 중복 제거: 고유한 question_id의 개수만 세기
      if (records && records.length > 0) {
        const uniqueQuestionIds = new Set(records.map((r: any) => r.question_id))
        completedCount = uniqueQuestionIds.size
      }
    }

    const progress = totalQuestions > 0 ? Math.round((completedCount / totalQuestions) * 100) : 0

    // question_ids가 비어있으면 빈 배열 반환 (임시 문제 ID 생성하지 않음)
    const questionIds = data.question_ids || []

    return {
      id: data.id,
      questionIds: questionIds, // 빈 배열이어도 그대로 반환
      completed: data.completed || false,
      completedAt: data.completed_at || null,
      createdAt: data.created_at,
      progress,
    }
  } catch (error) {
    console.error('Error fetching daily set:', error)
    return null
  }
}

/**
 * 일일 문제 세트 생성 (문제가 없어도 생성 가능)
 */
export async function createDailySet(
  userId: string,
  questionIds: string[] = []
): Promise<{ success: boolean; setId?: string; error?: string; tempQuestionIds?: string[] }> {
  try {
    // UUID 형식 검증 (유효한 UUID만 필터링)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    const validQuestionIds = questionIds.filter((id) => uuidRegex.test(id))

    // 유효한 문제 ID가 없으면 빈 배열로 저장 (임시 문제 ID는 클라이언트에서 사용)
    const questionIdsToSave = validQuestionIds.length > 0 ? validQuestionIds : []

    const { data, error } = await supabase
      .from('daily_sets')
      .insert({
        user_id: userId,
        question_ids: questionIdsToSave, // 빈 배열도 허용
      })
      .select('id')
      .maybeSingle()

    // PGRST116(데이터 없음)이 아닌 실제 에러만 처리
    if (error && error.code !== 'PGRST116') {
      // 400 에러인 경우 더 자세한 정보 로깅
      if (error.code === '23503' || error.message?.includes('foreign key')) {
        console.error('❌ 외래키 제약조건 위반:', {
          error: error.message,
          questionIds: questionIdsToSave,
          userId,
        })
        // 외래키 제약조건 위반 시에도 빈 배열로 재시도
        const { data: retryData, error: retryError } = await supabase
          .from('daily_sets')
          .insert({
            user_id: userId,
            question_ids: [], // 빈 배열로 재시도
          })
          .select('id')
          .maybeSingle()

        if (retryError && retryError.code !== 'PGRST116') {
          throw retryError
        }

        if (retryData) {
          // 빈 배열로 저장 성공
          return {
            success: true,
            setId: retryData.id,
          }
        }
      }
      
      // 다른 에러는 그대로 throw
      if (error.code !== '23503') {
        throw error
      }
    }

    if (!data) {
      return {
        success: false,
        error: '일일 세트 생성 후 데이터를 가져올 수 없습니다.',
      }
    }

    // 유효한 문제 ID가 없어도 성공으로 처리 (빈 배열로 저장)
    // 임시 문제 ID 생성하지 않음

    return {
      success: true,
      setId: data.id,
    }
  } catch (error) {
    console.error('Error creating daily set:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '일일 세트 생성 실패',
    }
  }
}

export interface WeaknessAnalysis {
  category: string
  currentScore: number
  previousScore: number
  improvement: number // 개선도 (양수면 개선, 음수면 악화)
  trend: 'improving' | 'declining' | 'stable'
}

/**
 * 취약 영역 분석 데이터 가져오기
 */
export async function getWeaknessAnalysis(
  userId: string
): Promise<WeaknessAnalysis[]> {
  try {
    // 최근 진단 결과 가져오기
    const { data: recentDiagnosis, error: diagnosisError } = await supabase
      .from('diagnosis_results')
      .select('scores, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(2)

    if (diagnosisError) {
      throw diagnosisError
    }

    if (!recentDiagnosis || recentDiagnosis.length === 0) {
      return []
    }

    const currentScores = recentDiagnosis[0].scores as Record<string, number>
    const previousScores =
      recentDiagnosis.length > 1
        ? (recentDiagnosis[1].scores as Record<string, number>)
        : null

    // 카테고리별 분석 데이터 생성
    const analysis: WeaknessAnalysis[] = Object.entries(currentScores).map(
      ([category, currentScore]) => {
        const previousScore = previousScores?.[category] || currentScore
        const improvement = currentScore - previousScore

        let trend: 'improving' | 'declining' | 'stable' = 'stable'
        if (improvement > 5) {
          trend = 'improving'
        } else if (improvement < -5) {
          trend = 'declining'
        }

        return {
          category,
          currentScore,
          previousScore,
          improvement,
          trend,
        }
      }
    )

    // 개선도 순으로 정렬
    return analysis.sort((a, b) => b.improvement - a.improvement)
  } catch (error) {
    console.error('Error fetching weakness analysis:', error)
    return []
  }
}

// 향후 알림 시스템 구현 시 사용할 타입
// export interface Notification {
//   id: string
//   message: string
//   read: boolean
//   createdAt: string
// }

