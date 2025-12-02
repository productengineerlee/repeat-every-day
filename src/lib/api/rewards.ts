/**
 * Rewards API
 * 
 * 보상 메커니즘 및 분배 시스템을 위한 API 함수들
 */

import { supabase } from '../supabaseClient'

export type RewardCategory = 'streak_freeze' | 'hint' | 'theme' | 'experience' | 'badge'
export type RewardSource = 'achievement' | 'streak' | 'challenge' | 'daily_login' | 'manual'
export type RewardRarity = 'common' | 'rare' | 'epic' | 'legendary'

export interface RewardType {
  id: string
  code: string
  name: string
  description: string | null
  category: RewardCategory
  value: number | null
  icon: string | null
  rarity: RewardRarity
  createdAt: string
}

export interface UserReward {
  id: string
  userId: string
  rewardType: RewardType
  quantity: number
  usedQuantity: number
  availableQuantity: number
  expiresAt: string | null
  createdAt: string
  updatedAt: string
}

export interface RewardDistribution {
  id: string
  userId: string
  rewardType: RewardType
  quantity: number
  sourceType: RewardSource
  sourceId: string | null
  distributedAt: string
}

export interface UserLevel {
  level: number
  experiencePoints: number
  experienceToNextLevel: number
  progressToNextLevel: number // 0-100
}

/**
 * 모든 보상 타입 가져오기
 */
export async function getAllRewardTypes(): Promise<RewardType[]> {
  try {
    const { data, error } = await supabase
      .from('reward_types')
      .select('*')
      .order('rarity', { ascending: true })
      .order('name', { ascending: true })

    if (error) {
      throw error
    }

    return (
      data?.map((rt) => ({
        id: rt.id,
        code: rt.code,
        name: rt.name,
        description: rt.description,
        category: rt.category as RewardCategory,
        value: rt.value,
        icon: rt.icon,
        rarity: rt.rarity as RewardRarity,
        createdAt: rt.created_at,
      })) || []
    )
  } catch (error) {
    console.error('Error fetching reward types:', error)
    return []
  }
}

/**
 * 사용자 보상 인벤토리 가져오기
 */
export async function getUserRewards(
  userId: string,
  category?: RewardCategory
): Promise<UserReward[]> {
  try {
    let query = supabase
      .from('user_rewards')
      .select(
        `
        *,
        reward_type:reward_types(*)
      `
      )
      .eq('user_id', userId)
      .gt('quantity', 0) // 사용 가능한 보상만

    if (category) {
      query = query.eq('reward_type.category', category)
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    return (
      data?.map((ur) => ({
        id: ur.id,
        userId: ur.user_id,
        rewardType: {
          id: ur.reward_type.id,
          code: ur.reward_type.code,
          name: ur.reward_type.name,
          description: ur.reward_type.description,
          category: ur.reward_type.category as RewardCategory,
          value: ur.reward_type.value,
          icon: ur.reward_type.icon,
          rarity: ur.reward_type.rarity as RewardRarity,
          createdAt: ur.reward_type.created_at,
        },
        quantity: ur.quantity,
        usedQuantity: ur.used_quantity,
        availableQuantity: ur.quantity - ur.used_quantity,
        expiresAt: ur.expires_at,
        createdAt: ur.created_at,
        updatedAt: ur.updated_at,
      })) || []
    )
  } catch (error) {
    console.error('Error fetching user rewards:', error)
    return []
  }
}

/**
 * 사용자 레벨 정보 가져오기
 */
export async function getUserLevel(userId: string): Promise<UserLevel> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('level, experience_points')
      .eq('id', userId)
      .single()

    if (error) {
      throw error
    }

    const level = data?.level || 1
    const experiencePoints = data?.experience_points || 0

    // 다음 레벨까지 필요한 경험치 계산
    const expForCurrentLevel = Math.pow(level - 1, 2) * 100
    const expForNextLevel = Math.pow(level, 2) * 100
    const experienceToNextLevel = expForNextLevel - experiencePoints
    const progressToNextLevel =
      level === 1
        ? Math.min(100, (experiencePoints / expForNextLevel) * 100)
        : Math.min(
            100,
            ((experiencePoints - expForCurrentLevel) /
              (expForNextLevel - expForCurrentLevel)) *
              100
          )

    return {
      level,
      experiencePoints,
      experienceToNextLevel: Math.max(0, experienceToNextLevel),
      progressToNextLevel: Math.max(0, Math.min(100, progressToNextLevel)),
    }
  } catch (error) {
    console.error('Error fetching user level:', error)
    return {
      level: 1,
      experiencePoints: 0,
      experienceToNextLevel: 100,
      progressToNextLevel: 0,
    }
  }
}

/**
 * 보상 분배
 */
export async function distributeReward(
  userId: string,
  rewardCode: string,
  quantity: number = 1,
  sourceType: RewardSource = 'manual',
  sourceId?: string
): Promise<{ success: boolean; error?: string; rewardTypeId?: string }> {
  try {
    const { data, error } = await supabase.rpc('distribute_reward', {
      p_user_id: userId,
      p_reward_code: rewardCode,
      p_quantity: quantity,
      p_source_type: sourceType,
      p_source_id: sourceId || null,
    })

    if (error) {
      throw error
    }

    if (data && typeof data === 'object' && 'success' in data) {
      const result = data as { success: boolean; error?: string; reward_type_id?: string }
      return {
        success: result.success,
        error: result.error,
        rewardTypeId: result.reward_type_id,
      }
    }

    return {
      success: true,
    }
  } catch (error) {
    console.error('Error distributing reward:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '보상 분배 실패',
    }
  }
}

/**
 * 보상 사용
 */
export async function useReward(
  userId: string,
  rewardId: string,
  quantity: number = 1
): Promise<{ success: boolean; error?: string; remainingQuantity?: number }> {
  try {
    // 보상 정보 가져오기
    const { data: reward, error: fetchError } = await supabase
      .from('user_rewards')
      .select('quantity, used_quantity, reward_type:reward_types(code, category)')
      .eq('id', rewardId)
      .eq('user_id', userId)
      .single()

    if (fetchError) {
      throw fetchError
    }

    if (!reward) {
      return {
        success: false,
        error: '보상을 찾을 수 없습니다.',
      }
    }

    const availableQuantity = reward.quantity - reward.used_quantity
    if (availableQuantity < quantity) {
      return {
        success: false,
        error: `사용 가능한 보상이 부족합니다. (보유: ${availableQuantity}, 요청: ${quantity})`,
      }
    }

    // 보상 사용 처리
    const { data, error } = await supabase
      .from('user_rewards')
      .update({
        used_quantity: reward.used_quantity + quantity,
        updated_at: new Date().toISOString(),
      })
      .eq('id', rewardId)
      .eq('user_id', userId)
      .select('quantity, used_quantity')
      .single()

    if (error) {
      throw error
    }

    return {
      success: true,
      remainingQuantity: (data?.quantity || 0) - (data?.used_quantity || 0),
    }
  } catch (error) {
    console.error('Error using reward:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '보상 사용 실패',
    }
  }
}

/**
 * 보상 분배 기록 가져오기
 */
export async function getRewardDistributions(
  userId: string,
  limit: number = 50
): Promise<RewardDistribution[]> {
  try {
    const { data, error } = await supabase
      .from('reward_distributions')
      .select(
        `
        *,
        reward_type:reward_types(*)
      `
      )
      .eq('user_id', userId)
      .order('distributed_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw error
    }

    return (
      data?.map((rd) => ({
        id: rd.id,
        userId: rd.user_id,
        rewardType: {
          id: rd.reward_type.id,
          code: rd.reward_type.code,
          name: rd.reward_type.name,
          description: rd.reward_type.description,
          category: rd.reward_type.category as RewardCategory,
          value: rd.reward_type.value,
          icon: rd.reward_type.icon,
          rarity: rd.reward_type.rarity as RewardRarity,
          createdAt: rd.reward_type.created_at,
        },
        quantity: rd.quantity,
        sourceType: rd.source_type as RewardSource,
        sourceId: rd.source_id,
        distributedAt: rd.distributed_at,
      })) || []
    )
  } catch (error) {
    console.error('Error fetching reward distributions:', error)
    return []
  }
}

/**
 * 성취도 달성 시 보상 분배
 */
export async function distributeRewardForAchievement(
  userId: string,
  achievementCode: string
): Promise<{ success: boolean; rewards?: string[]; error?: string }> {
  try {
    // 성취도별 보상 매핑
    const achievementRewards: Record<string, string[]> = {
      streak_3: ['exp_100'],
      streak_7: ['exp_500', 'streak_freeze'],
      streak_30: ['exp_1000', 'streak_freeze', 'badge_streak_30'],
      streak_100: ['exp_1000', 'streak_freeze', 'theme_dark'],
      accuracy_50: ['exp_100'],
      accuracy_70: ['exp_500', 'hint'],
      accuracy_85: ['exp_1000', 'hint', 'badge_accuracy_90'],
      accuracy_95: ['exp_1000', 'hint', 'theme_colorful'],
      completion_10: ['exp_100'],
      completion_50: ['exp_500'],
      completion_100: ['exp_1000'],
      completion_500: ['exp_1000', 'theme_dark'],
      completion_1000: ['exp_1000', 'theme_colorful'],
    }

    const rewardCodes = achievementRewards[achievementCode] || ['exp_100']

    const distributedRewards: string[] = []
    for (const rewardCode of rewardCodes) {
      const result = await distributeReward(
        userId,
        rewardCode,
        1,
        'achievement',
        achievementCode
      )
      if (result.success) {
        distributedRewards.push(rewardCode)
      }
    }

    return {
      success: distributedRewards.length > 0,
      rewards: distributedRewards,
    }
  } catch (error) {
    console.error('Error distributing reward for achievement:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '성취도 보상 분배 실패',
    }
  }
}

/**
 * 스트릭 달성 시 보상 분배
 */
export async function distributeRewardForStreak(
  userId: string,
  streakCount: number
): Promise<{ success: boolean; rewards?: string[]; error?: string }> {
  try {
    const rewards: string[] = []

    // 스트릭 마일스톤별 보상
    if (streakCount === 7) {
      const result = await distributeReward(userId, 'exp_500', 1, 'streak')
      if (result.success) rewards.push('exp_500')
    } else if (streakCount === 30) {
      const result = await distributeReward(userId, 'streak_freeze', 1, 'streak')
      if (result.success) rewards.push('streak_freeze')
    } else if (streakCount % 100 === 0) {
      const result = await distributeReward(userId, 'exp_1000', 1, 'streak')
      if (result.success) rewards.push('exp_1000')
    }

    return {
      success: rewards.length > 0,
      rewards,
    }
  } catch (error) {
    console.error('Error distributing reward for streak:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '스트릭 보상 분배 실패',
    }
  }
}








