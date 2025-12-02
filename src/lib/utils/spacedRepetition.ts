/**
 * Spaced Repetition Utilities
 * 
 * This module implements spaced repetition algorithms based on learning science
 * to optimize long-term knowledge retention.
 */

import { supabase } from '../supabaseClient'

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * 간격 반복 세션 데이터
 */
export interface SpacedRepetitionSession {
  questionId: string
  category: string
  lastReviewDate: Date | null
  reviewCount: number // 총 복습 횟수
  consecutiveCorrect: number // 연속 정답 횟수
  easeFactor: number // 난이도 인수 (기본 2.5, SM-2 알고리즘)
  interval: number // 다음 복습까지의 간격 (일 단위)
  nextReviewDate: Date | null
}

/**
 * 간격 반복 설정
 */
export interface SpacedRepetitionConfig {
  // SM-2 알고리즘 기반 설정
  initialEaseFactor: number // 초기 난이도 인수 (기본: 2.5)
  minEaseFactor: number // 최소 난이도 인수 (기본: 1.3)
  easeFactorChange: number // 정답/오답 시 난이도 인수 변화량
  
  // 간격 설정
  initialInterval: number // 초기 간격 (일 단위, 기본: 1)
  maxInterval: number // 최대 간격 (일 단위, 기본: 365)
  
  // 성능 기반 조정
  performanceThreshold: number // 성능 임계값 (0-1, 기본: 0.8)
  intervalMultiplier: number // 성능 기반 간격 배수 (기본: 1.2)
}

export const DEFAULT_SPACED_REPETITION_CONFIG: SpacedRepetitionConfig = {
  initialEaseFactor: 2.5,
  minEaseFactor: 1.3,
  easeFactorChange: 0.15,
  initialInterval: 1,
  maxInterval: 365,
  performanceThreshold: 0.8,
  intervalMultiplier: 1.2,
}

// ============================================================================
// Spaced Repetition Calculation Functions
// ============================================================================

/**
 * SM-2 알고리즘 기반 다음 복습 간격 계산
 * SuperMemo 2 알고리즘을 기반으로 한 간격 반복 계산
 */
export function calculateNextInterval(
  session: SpacedRepetitionSession,
  isCorrect: boolean,
  config: SpacedRepetitionConfig = DEFAULT_SPACED_REPETITION_CONFIG
): SpacedRepetitionSession {
  let { easeFactor, interval, reviewCount, consecutiveCorrect } = session

  if (isCorrect) {
    // 정답인 경우
    consecutiveCorrect += 1
    reviewCount += 1

    // 첫 복습인 경우
    if (reviewCount === 1) {
      interval = config.initialInterval
    } else if (reviewCount === 2) {
      interval = 6 // 두 번째 복습은 6일 후
    } else {
      // 세 번째 복습부터는 easeFactor를 사용하여 간격 계산
      interval = Math.round(interval * easeFactor)
    }

    // easeFactor 증가 (약간씩 증가)
    easeFactor = Math.min(
      2.5,
      easeFactor + config.easeFactorChange
    )
  } else {
    // 오답인 경우
    consecutiveCorrect = 0
    reviewCount += 1

    // 간격 초기화 및 easeFactor 감소
    interval = config.initialInterval
    easeFactor = Math.max(
      config.minEaseFactor,
      easeFactor - config.easeFactorChange * 2
    )
  }

  // 최대 간격 제한
  interval = Math.min(interval, config.maxInterval)

  // 다음 복습일 계산
  const nextReviewDate = new Date()
  nextReviewDate.setDate(nextReviewDate.getDate() + interval)

  return {
    ...session,
    easeFactor,
    interval,
    reviewCount,
    consecutiveCorrect,
    nextReviewDate,
    lastReviewDate: new Date(),
  }
}

/**
 * 성능 기반 간격 조정
 * 사용자의 최근 성능에 따라 간격을 동적으로 조정
 */
export function adjustIntervalByPerformance(
  baseInterval: number,
  recentAccuracy: number, // 최근 정답률 (0-1)
  config: SpacedRepetitionConfig = DEFAULT_SPACED_REPETITION_CONFIG
): number {
  if (recentAccuracy >= config.performanceThreshold) {
    // 성능이 좋으면 간격 증가
    return Math.round(baseInterval * config.intervalMultiplier)
  } else if (recentAccuracy < 0.6) {
    // 성능이 나쁘면 간격 감소
    return Math.max(1, Math.round(baseInterval * 0.8))
  }

  // 중간 성능이면 기본 간격 유지
  return baseInterval
}

/**
 * 카테고리별 마지막 학습 시간 조회
 */
export async function getLastExposureByCategory(
  userId: string
): Promise<Record<string, Date>> {
  try {
    // study_records에서 카테고리별 마지막 학습 시간 조회
    const { data: records, error } = await supabase
      .from('study_records')
      .select(`
        created_at,
        question:questions(category)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    const lastExposure: Record<string, Date> = {}

    records?.forEach((record) => {
      const category =
        (record.question as { category?: string })?.category || '기타'
      const recordDate = new Date(record.created_at)

      if (
        !lastExposure[category] ||
        recordDate > lastExposure[category]
      ) {
        lastExposure[category] = recordDate
      }
    })

    return lastExposure
  } catch (error) {
    console.error('Error fetching last exposure by category:', error)
    return {}
  }
}

/**
 * 카테고리별 복습 횟수 및 최근 정답률 조회
 */
export async function getCategoryReviewStats(
  userId: string,
  category: string
): Promise<{ reviewCount: number; recentAccuracy: number }> {
  try {
    // 해당 카테고리의 모든 학습 기록 조회
    const { data: records, error } = await supabase
      .from('study_records')
      .select(`
        is_correct,
        created_at,
        question:questions(category)
      `)
      .eq('user_id', userId)

    if (error) {
      throw error
    }

    // 카테고리 필터링
    const categoryRecords = records?.filter(
      (r) => (r.question as { category?: string })?.category === category
    ) || []

    const reviewCount = categoryRecords.length

    // 최근 7일간의 정답률 계산
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const recentRecords = categoryRecords.filter(
      (r) => new Date(r.created_at) >= sevenDaysAgo
    )

    const recentAccuracy =
      recentRecords.length > 0
        ? recentRecords.filter((r) => r.is_correct).length / recentRecords.length
        : categoryRecords.length > 0
        ? categoryRecords.filter((r) => r.is_correct).length / categoryRecords.length
        : 0.5

    return {
      reviewCount,
      recentAccuracy,
    }
  } catch (error) {
    console.error('Error fetching category review stats:', error)
    return {
      reviewCount: 0,
      recentAccuracy: 0.5,
    }
  }
}

/**
 * 이상적인 재학습 타이밍 계산
 * 마지막 학습 시간과 성능을 기반으로 이상적인 재학습 시점 계산
 */
export function calculateIdealReviewTiming(
  lastExposure: Date | null,
  reviewCount: number,
  recentAccuracy: number,
  config: SpacedRepetitionConfig = DEFAULT_SPACED_REPETITION_CONFIG
): {
  idealDays: number
  urgency: 'high' | 'medium' | 'low'
  daysUntilIdeal: number
} {
  if (!lastExposure) {
    return {
      idealDays: 0,
      urgency: 'high',
      daysUntilIdeal: 0,
    }
  }

  // 기본 간격 계산 (SM-2 기반)
  let baseInterval = config.initialInterval
  if (reviewCount === 1) {
    baseInterval = 1
  } else if (reviewCount === 2) {
    baseInterval = 6
  } else {
    // 간격 반복 공식: interval * easeFactor^reviewCount
    const easeFactor = Math.max(
      config.minEaseFactor,
      config.initialEaseFactor - (1 - recentAccuracy) * 0.5
    )
    baseInterval = Math.round(
      config.initialInterval * Math.pow(easeFactor, Math.min(reviewCount - 1, 5))
    )
  }

  // 성능 기반 조정
  const idealInterval = adjustIntervalByPerformance(
    baseInterval,
    recentAccuracy,
    config
  )

  const now = new Date()
  const daysSinceLastExposure = Math.floor(
    (now.getTime() - lastExposure.getTime()) / (1000 * 60 * 60 * 24)
  )

  const daysUntilIdeal = idealInterval - daysSinceLastExposure

  // 긴급도 계산
  let urgency: 'high' | 'medium' | 'low' = 'low'
  if (daysUntilIdeal <= 0) {
    urgency = 'high' // 이미 지났거나 오늘 복습해야 함
  } else if (daysUntilIdeal <= 2) {
    urgency = 'medium' // 곧 복습해야 함
  }

  return {
    idealDays: idealInterval,
    urgency,
    daysUntilIdeal,
  }
}

/**
 * 신규 콘텐츠와 복습의 균형 계산
 * 일일 세트에서 신규 문제와 복습 문제의 비율 결정
 */
export function calculateReviewNewBalance(
  totalQuestions: number,
  reviewCount: number,
  recentPerformance: number
): {
  newQuestions: number
  reviewQuestions: number
} {
  // 기본 비율: 신규 60%, 복습 40%
  let newRatio = 0.6

  // 복습 횟수가 적으면 신규 비율 증가
  if (reviewCount < 3) {
    newRatio = 0.8
  }
  // 성능이 좋으면 신규 비율 증가
  else if (recentPerformance > 0.8) {
    newRatio = 0.7
  }
  // 성능이 나쁘면 복습 비율 증가
  else if (recentPerformance < 0.6) {
    newRatio = 0.5
  }

  const newQuestions = Math.max(1, Math.round(totalQuestions * newRatio))
  const reviewQuestions = totalQuestions - newQuestions

  return {
    newQuestions,
    reviewQuestions,
  }
}

/**
 * 난이도 진행 계산
 * 사용자 성능에 따른 적절한 난이도 결정
 */
export function calculateDifficultyProgression(
  currentDifficulty: number,
  recentAccuracy: number,
  attemptsAtCurrentLevel: number
): {
  recommendedDifficulty: number
  shouldProgress: boolean
  shouldRegress: boolean
} {
  let recommendedDifficulty = currentDifficulty
  let shouldProgress = false
  let shouldRegress = false

  // 성능이 좋고 현재 난이도에서 충분히 연습했으면 난이도 증가
  if (recentAccuracy >= 0.8 && attemptsAtCurrentLevel >= 5) {
    if (currentDifficulty < 5) {
      recommendedDifficulty = currentDifficulty + 1
      shouldProgress = true
    }
  }
  // 성능이 나쁘고 여러 번 시도했으면 난이도 감소
  else if (recentAccuracy < 0.5 && attemptsAtCurrentLevel >= 3) {
    if (currentDifficulty > 1) {
      recommendedDifficulty = currentDifficulty - 1
      shouldRegress = true
    }
  }

  return {
    recommendedDifficulty: Math.max(1, Math.min(5, recommendedDifficulty)),
    shouldProgress,
    shouldRegress,
  }
}

/**
 * 간격 반복 점수 계산 (개선된 버전)
 * 여러 요소를 종합하여 간격 반복 점수 계산
 */
export function calculateSpacedRepetitionScore(
  lastExposure: Date | null,
  _reviewCount: number,
  recentAccuracy: number,
  idealTiming: { idealDays: number; urgency: 'high' | 'medium' | 'low'; daysUntilIdeal: number }
): number {
  // 처음 학습하는 경우 최대 점수
  if (!lastExposure) {
    return 15
  }

  const { urgency, daysUntilIdeal } = idealTiming

  // 긴급도에 따른 점수 계산
  let score = 0
  if (urgency === 'high') {
    // 이미 복습 시기가 지났거나 오늘 복습해야 함
    score = 15
  } else if (urgency === 'medium') {
    // 곧 복습해야 함
    score = 10
  } else {
    // 아직 시간이 있지만 이상적인 시점에 가까울수록 높은 점수
    score = Math.max(0, 5 - Math.abs(daysUntilIdeal) * 0.5)
  }

  // 성능 기반 보정
  // 성능이 좋으면 간격을 늘려도 되므로 점수 감소
  // 성능이 나쁘면 더 자주 복습해야 하므로 점수 증가
  if (recentAccuracy > 0.8) {
    score *= 0.8
  } else if (recentAccuracy < 0.6) {
    score *= 1.2
  }

  return Math.min(15, Math.max(0, score))
}
