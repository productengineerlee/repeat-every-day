/**
 * Streak API
 * 
 * 스트릭 추적 및 프리즈 기능을 위한 API 함수들
 */

import { supabase } from '../supabaseClient'

export interface StreakFreeze {
  id: string
  userId: string
  used: boolean
  usedAt: string | null
  expiresAt: string | null
  createdAt: string
}

export interface StreakStatus {
  currentStreak: number
  lastStreakDate: string | null
  availableFreezes: number
  nextFreezeExpiry: string | null
}

/**
 * 스트릭 상태 가져오기
 */
export async function getStreakStatus(userId: string): Promise<StreakStatus> {
  try {
    // 사용자 스트릭 정보
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('streak_count, last_streak_date')
      .eq('id', userId)
      .single()

    if (userError) {
      throw userError
    }

    // 사용 가능한 스트릭 프리즈 개수
    const { data: freezes, error: freezesError } = await supabase
      .from('streak_freezes')
      .select('expires_at')
      .eq('user_id', userId)
      .eq('used', false)
      .order('created_at', { ascending: true })

    if (freezesError) {
      throw freezesError
    }

    // 만료되지 않은 프리즈만 필터링
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const availableFreezes = freezes?.filter((freeze) => {
      if (!freeze.expires_at) return true
      const expiryDate = new Date(freeze.expires_at)
      expiryDate.setHours(0, 0, 0, 0)
      return expiryDate >= today
    }) || []

    // 다음 만료일 찾기
    const nextExpiry = availableFreezes
      .map((f) => f.expires_at)
      .filter((d): d is string => d !== null)
      .sort()[0] || null

    return {
      currentStreak: userData?.streak_count || 0,
      lastStreakDate: userData?.last_streak_date || null,
      availableFreezes: availableFreezes.length,
      nextFreezeExpiry: nextExpiry,
    }
  } catch (error) {
    console.error('Error fetching streak status:', error)
    return {
      currentStreak: 0,
      lastStreakDate: null,
      availableFreezes: 0,
      nextFreezeExpiry: null,
    }
  }
}

/**
 * 스트릭 프리즈 목록 가져오기
 */
export async function getStreakFreezes(
  userId: string,
  includeUsed: boolean = false
): Promise<StreakFreeze[]> {
  try {
    let query = supabase
      .from('streak_freezes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (!includeUsed) {
      query = query.eq('used', false)
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    return (
      data?.map((freeze) => ({
        id: freeze.id,
        userId: freeze.user_id,
        used: freeze.used,
        usedAt: freeze.used_at,
        expiresAt: freeze.expires_at,
        createdAt: freeze.created_at,
      })) || []
    )
  } catch (error) {
    console.error('Error fetching streak freezes:', error)
    return []
  }
}

/**
 * 스트릭 프리즈 획득
 */
export async function earnStreakFreeze(
  userId: string,
  expiresInDays?: number
): Promise<{ success: boolean; freezeId?: string; error?: string }> {
  try {
    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
      : null

    const { data, error } = await supabase
      .from('streak_freezes')
      .insert({
        user_id: userId,
        used: false,
        expires_at: expiresAt,
      })
      .select('id')
      .single()

    if (error) {
      throw error
    }

    return {
      success: true,
      freezeId: data.id,
    }
  } catch (error) {
    console.error('Error earning streak freeze:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '스트릭 프리즈 획득 실패',
    }
  }
}

/**
 * 스트릭 프리즈 수동 사용 (미래에 사용할 수 있도록 예약)
 * 실제로는 학습 활동이 없을 때 자동으로 사용됨
 */
export async function useStreakFreeze(
  userId: string,
  freezeId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 특정 프리즈 ID가 제공되지 않으면 가장 오래된 사용 가능한 프리즈 사용
    if (!freezeId) {
      const { data: freezes, error: fetchError } = await supabase
        .from('streak_freezes')
        .select('id')
        .eq('user_id', userId)
        .eq('used', false)
        .order('created_at', { ascending: true })
        .limit(1)

      if (fetchError) {
        throw fetchError
      }

      if (!freezes || freezes.length === 0) {
        return {
          success: false,
          error: '사용 가능한 스트릭 프리즈가 없습니다.',
        }
      }

      freezeId = freezes[0].id
    }

    // 프리즈 사용 처리
    const { error } = await supabase
      .from('streak_freezes')
      .update({
        used: true,
        used_at: new Date().toISOString(),
      })
      .eq('id', freezeId)
      .eq('user_id', userId)
      .eq('used', false)

    if (error) {
      throw error
    }

    return {
      success: true,
    }
  } catch (error) {
    console.error('Error using streak freeze:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '스트릭 프리즈 사용 실패',
    }
  }
}

/**
 * 스트릭 수동 업데이트 (오프라인 사용 후 동기화)
 */
export async function updateStreakManually(
  userId: string,
  activityDate?: Date
): Promise<{ success: boolean; streakCount?: number; error?: string }> {
  try {
    // 학습 기록이 있는지 확인 (해당 날짜에)
    const targetDate = activityDate || new Date()
    const startOfDay = new Date(targetDate)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(targetDate)
    endOfDay.setHours(23, 59, 59, 999)

    const { data: records, error: recordsError } = await supabase
      .from('study_records')
      .select('id')
      .eq('user_id', userId)
      .gte('created_at', startOfDay.toISOString())
      .lte('created_at', endOfDay.toISOString())
      .limit(1)

    if (recordsError) {
      throw recordsError
    }

    // 학습 기록이 있으면 트리거가 자동으로 처리하므로 수동 업데이트 불필요
    if (records && records.length > 0) {
      // 스트릭 상태 다시 가져오기
      const status = await getStreakStatus(userId)
      return {
        success: true,
        streakCount: status.currentStreak,
      }
    }

    // 학습 기록이 없으면 수동으로 스트릭 업데이트 시도
    // (이 경우는 일반적으로 발생하지 않아야 함)
    return {
      success: false,
      error: '해당 날짜에 학습 기록이 없습니다.',
    }
  } catch (error) {
    console.error('Error updating streak manually:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '스트릭 업데이트 실패',
    }
  }
}

/**
 * 만료된 스트릭 프리즈 정리
 */
export async function cleanupExpiredFreezes(): Promise<{ success: boolean; cleanedCount?: number; error?: string }> {
  try {
    // Supabase Edge Function이나 직접 SQL 호출 필요
    // 여기서는 클라이언트 측에서 만료된 것만 필터링
    const { data, error } = await supabase.rpc('cleanup_expired_streak_freezes')

    if (error) {
      // RPC 함수가 없으면 클라이언트 측에서 처리
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const { data: freezes, error: fetchError } = await supabase
        .from('streak_freezes')
        .select('id')
        .eq('used', false)
        .not('expires_at', 'is', null)
        .lt('expires_at', today.toISOString())

      if (fetchError) {
        throw fetchError
      }

      if (freezes && freezes.length > 0) {
        const { error: updateError } = await supabase
          .from('streak_freezes')
          .update({
            used: true,
            used_at: new Date().toISOString(),
          })
          .in(
            'id',
            freezes.map((f) => f.id)
          )

        if (updateError) {
          throw updateError
        }

        return {
          success: true,
          cleanedCount: freezes.length,
        }
      }

      return {
        success: true,
        cleanedCount: 0,
      }
    }

    return {
      success: true,
      cleanedCount: data || 0,
    }
  } catch (error) {
    console.error('Error cleaning up expired freezes:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '만료된 프리즈 정리 실패',
    }
  }
}















