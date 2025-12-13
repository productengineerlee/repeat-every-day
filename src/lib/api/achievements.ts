/**
 * Achievements API
 * 
 * 성취도 시스템 관련 API 함수들
 */

import { supabase } from '../supabaseClient'
import * as Icons from 'lucide-react'

export interface Achievement {
  id: string
  code: string
  name: string
  description: string
  category: 'streak' | 'accuracy' | 'completion' | 'speed' | 'mastery'
  icon: string
  requirementValue: number
  requirementType: 'count' | 'percentage' | 'days' | 'consecutive'
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

export interface UserAchievement {
  id: string
  userId: string
  achievementId: string
  achievement: Achievement
  progress: number // 0-100
  unlockedAt: string | null
  createdAt: string
  updatedAt: string
}

/**
 * 모든 Achievement 목록 가져오기
 */
export async function getAllAchievements(): Promise<Achievement[]> {
  try {
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .order('category', { ascending: true })
      .order('requirement_value', { ascending: true })

    if (error) {
      throw error
    }

    return (data || []).map((a) => ({
      id: a.id,
      code: a.code,
      name: a.name,
      description: a.description,
      category: a.category,
      icon: a.icon,
      requirementValue: a.requirement_value,
      requirementType: a.requirement_type,
      rarity: a.rarity,
    }))
  } catch (error) {
    console.error('Error fetching achievements:', error)
    return []
  }
}

/**
 * 사용자의 Achievement 목록 가져오기
 */
export async function getUserAchievements(
  userId: string
): Promise<UserAchievement[]> {
  try {
    const { data, error } = await supabase
      .from('user_achievements')
      .select(
        `
        *,
        achievement:achievements(*)
      `
      )
      .eq('user_id', userId)
      .order('unlocked_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: true })

    if (error) {
      throw error
    }

    return (data || []).map((ua) => ({
      id: ua.id,
      userId: ua.user_id,
      achievementId: ua.achievement_id,
      achievement: {
        id: ua.achievement.id,
        code: ua.achievement.code,
        name: ua.achievement.name,
        description: ua.achievement.description,
        category: ua.achievement.category,
        icon: ua.achievement.icon,
        requirementValue: ua.achievement.requirement_value,
        requirementType: ua.achievement.requirement_type,
        rarity: ua.achievement.rarity,
      },
      progress: ua.progress,
      unlockedAt: ua.unlocked_at,
      createdAt: ua.created_at,
      updatedAt: ua.updated_at,
    }))
  } catch (error) {
    console.error('Error fetching user achievements:', error)
    return []
  }
}

/**
 * Achievement 진행도 업데이트
 */
export async function updateAchievementProgress(
  userId: string,
  achievementCode: string,
  progress: number,
  unlocked: boolean = false
): Promise<{ success: boolean; error?: string }> {
  try {
    // Achievement ID 찾기
    const { data: achievement, error: achievementError } = await supabase
      .from('achievements')
      .select('id')
      .eq('code', achievementCode)
      .single()

    if (achievementError || !achievement) {
      throw new Error('Achievement not found')
    }

    // 기존 기록 확인
    const { data: existing } = await supabase
      .from('user_achievements')
      .select('id, unlocked_at')
      .eq('user_id', userId)
      .eq('achievement_id', achievement.id)
      .single()

    if (existing) {
      // 이미 달성한 경우 업데이트하지 않음
      if (existing.unlocked_at) {
        return { success: true }
      }

      // 진행도 업데이트
      const updateData: {
        progress: number
        unlocked_at?: string
      } = {
        progress: Math.min(100, Math.max(0, progress)),
      }

      if (unlocked && progress >= 100) {
        updateData.unlocked_at = new Date().toISOString()
      }

      const { error: updateError } = await supabase
        .from('user_achievements')
        .update(updateData)
        .eq('id', existing.id)

      if (updateError) {
        throw updateError
      }
    } else {
      // 새 기록 생성 (upsert 사용하여 중복 방지)
      const insertData: {
        user_id: string
        achievement_id: string
        progress: number
        unlocked_at?: string
      } = {
        user_id: userId,
        achievement_id: achievement.id,
        progress: Math.min(100, Math.max(0, progress)),
      }

      if (unlocked && progress >= 100) {
        insertData.unlocked_at = new Date().toISOString()
      }

      const { error: insertError } = await supabase
        .from('user_achievements')
        .upsert(insertData, {
          onConflict: 'user_id,achievement_id',
          ignoreDuplicates: false
        })

      if (insertError) {
        // 중복 키 에러는 무시 (이미 존재하는 경우)
        if (insertError.code !== '23505') {
          throw insertError
        }
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Error updating achievement progress:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '업데이트 실패',
    }
  }
}

/**
 * 사용자 통계 기반 Achievement 진행도 계산 및 업데이트
 */
export async function checkAndUpdateAchievements(
  userId: string
): Promise<{ unlocked: string[]; updated: string[] }> {
  try {
    const unlocked: string[] = []
    const updated: string[] = []

    // 사용자 통계 가져오기
    const [
      { data: userData },
      { data: studyRecords },
      { data: dailySets },
      { data: wrongAnswers },
    ] = await Promise.all([
      supabase.from('users').select('streak_count').eq('id', userId).single(),
      supabase
        .from('study_records')
        .select('is_correct')
        .eq('user_id', userId),
      supabase
        .from('daily_sets')
        .select('completed, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      supabase
        .from('wrong_answers')
        .select('graduated')
        .eq('user_id', userId)
        .eq('graduated', true),
    ])

    const streakCount = userData?.streak_count || 0
    const totalQuestions = studyRecords?.length || 0
    const correctCount =
      studyRecords?.filter((r) => r.is_correct).length || 0
    const accuracy =
      totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0
    const completedDailySets = dailySets?.filter((ds) => ds.completed).length || 0
    const masteredQuestions = wrongAnswers?.length || 0

    // 스트릭 기반 Achievement 체크
    const streakAchievements = [3, 7, 30, 100]
    for (const target of streakAchievements) {
      const code = `streak_${target}`
      const progress = Math.min(100, Math.round((streakCount / target) * 100))
      const unlockedNow = streakCount >= target

      const result = await updateAchievementProgress(
        userId,
        code,
        progress,
        unlockedNow
      )
      if (result.success) {
        if (unlockedNow) {
          unlocked.push(code)
          // 성취도 달성 시 보상 분배
          const { distributeRewardForAchievement } = await import('./rewards')
          await distributeRewardForAchievement(userId, code)
        }
        updated.push(code)
      }
    }

    // 정확도 기반 Achievement 체크
    const accuracyAchievements = [50, 70, 85, 95]
    for (const target of accuracyAchievements) {
      const code = `accuracy_${target}`
      const progress = Math.min(100, Math.round((accuracy / target) * 100))
      const unlockedNow = accuracy >= target

      const result = await updateAchievementProgress(
        userId,
        code,
        progress,
        unlockedNow
      )
      if (result.success) {
        if (unlockedNow) {
          unlocked.push(code)
          // 성취도 달성 시 보상 분배
          const { distributeRewardForAchievement } = await import('./rewards')
          await distributeRewardForAchievement(userId, code)
        }
        updated.push(code)
      }
    }

    // 완료 기반 Achievement 체크
    const completionAchievements = [10, 50, 100, 500, 1000]
    for (const target of completionAchievements) {
      const code = `complete_${target}`
      const progress = Math.min(100, Math.round((totalQuestions / target) * 100))
      const unlockedNow = totalQuestions >= target

      const result = await updateAchievementProgress(
        userId,
        code,
        progress,
        unlockedNow
      )
      if (result.success) {
        if (unlockedNow) {
          unlocked.push(code)
          // 성취도 달성 시 보상 분배
          const { distributeRewardForAchievement } = await import('./rewards')
          await distributeRewardForAchievement(userId, code)
        }
        updated.push(code)
      }
    }

    // 일일 세트 완료 Achievement 체크
    const dailySetAchievements = [7, 30]
    for (const target of dailySetAchievements) {
      const code = `daily_set_${target}`
      const progress = Math.min(100, Math.round((completedDailySets / target) * 100))
      const unlockedNow = completedDailySets >= target

      const result = await updateAchievementProgress(
        userId,
        code,
        progress,
        unlockedNow
      )
      if (result.success) {
        if (unlockedNow) {
          unlocked.push(code)
          // 성취도 달성 시 보상 분배
          const { distributeRewardForAchievement } = await import('./rewards')
          await distributeRewardForAchievement(userId, code)
        }
        updated.push(code)
      }
    }

    // 마스터리 기반 Achievement 체크
    const masteryAchievements = [10, 50, 100]
    for (const target of masteryAchievements) {
      const code = `mastery_${target}`
      const progress = Math.min(100, Math.round((masteredQuestions / target) * 100))
      const unlockedNow = masteredQuestions >= target

      const result = await updateAchievementProgress(
        userId,
        code,
        progress,
        unlockedNow
      )
      if (result.success) {
        if (unlockedNow) {
          unlocked.push(code)
          // 성취도 달성 시 보상 분배
          const { distributeRewardForAchievement } = await import('./rewards')
          await distributeRewardForAchievement(userId, code)
        }
        updated.push(code)
      }
    }

    // 새로 달성된 성취도에 대해 알림 표시
    if (unlocked.length > 0) {
      const { getAllAchievements } = await import('./achievements')
      const allAchievements = await getAllAchievements()
      
      for (const code of unlocked) {
        const achievement = allAchievements.find((a) => a.code === code)
        if (achievement) {
          // 알림 표시 (비동기로 실행, 에러가 발생해도 무시)
          import('../utils/notificationScheduler')
            .then(({ showAchievementNotification }) => {
              showAchievementNotification(
                userId,
                achievement.name,
                achievement.description
              ).catch((err) => {
                console.error('Error showing achievement notification:', err)
              })
            })
            .catch(() => {
              // 알림 모듈 로드 실패 시 무시
            })
        }
      }
    }

    return { unlocked, updated }
  } catch (error) {
    console.error('Error checking achievements:', error)
    return { unlocked: [], updated: [] }
  }
}

/**
 * 아이콘 컴포넌트 가져오기
 */
export function getAchievementIcon(iconName: string) {
  const IconComponent = (Icons as unknown as Record<string, React.ComponentType<{ className?: string; size?: number }>>)[iconName]
  return IconComponent || Icons.Award
}

