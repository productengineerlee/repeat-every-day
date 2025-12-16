/**
 * Weak Area Analysis and Weighting System
 * 
 * This module provides comprehensive analysis of user performance data
 * to identify and prioritize weak knowledge areas with dynamic weighting.
 */

import { supabase } from '../supabaseClient'

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * 카테고리별 성능 통계
 */
export interface CategoryPerformance {
  category: string
  totalAttempts: number
  correctAttempts: number
  accuracy: number // 0-1
  averageTimeSpent: number // 평균 소요 시간 (초)
  lastAttemptDate: Date | null
  wrongAnswerCount: number
  recentTrend: 'improving' | 'declining' | 'stable'
}

/**
 * 오답 패턴 분석 결과
 */
export interface WrongAnswerPattern {
  category: string
  patternType: 'repeated' | 'concentrated' | 'sporadic'
  severity: 'high' | 'medium' | 'low'
  affectedQuestions: number
  frequency: number // 오답 빈도 (0-1)
  description: string
}

/**
 * 가중치 점수
 */
export interface WeightedScore {
  category: string
  baseScore: number // 기본 점수 (0-100)
  weight: number // 가중치 (0-2, 기본 1.0)
  finalScore: number // 최종 점수 (baseScore * weight)
  factors: {
    diagnosticScore: number // 진단 테스트 점수 영향
    ongoingPerformance: number // 지속 성능 영향
    wrongAnswerFrequency: number // 오답 빈도 영향
    timeSinceLastExposure: number // 마지막 학습 시간 영향
    trend: number // 성능 추세 영향
  }
}

/**
 * 약점 분석 설정
 */
export interface WeaknessAnalysisConfig {
  // 가중치 설정
  weights: {
    diagnosticScore: number // 진단 테스트 가중치 (기본: 0.3)
    ongoingPerformance: number // 지속 성능 가중치 (기본: 0.4)
    wrongAnswerFrequency: number // 오답 빈도 가중치 (기본: 0.2)
    timeSinceLastExposure: number // 마지막 학습 시간 가중치 (기본: 0.05)
    trend: number // 성능 추세 가중치 (기본: 0.05)
  }
  
  // 분석 기간 설정
  analysisPeriodDays: number // 분석 기간 (일 단위, 기본: 30)
  recentPeriodDays: number // 최근 기간 (일 단위, 기본: 7)
  
  // 약점 판단 기준
  weakAreaThreshold: number // 약점 영역 임계값 (0-1, 기본: 0.6)
  improvementThreshold: number // 개선 판단 임계값 (기본: 0.05)
  declineThreshold: number // 악화 판단 임계값 (기본: -0.05)
}

export const DEFAULT_WEAKNESS_CONFIG: WeaknessAnalysisConfig = {
  weights: {
    diagnosticScore: 0.3,
    ongoingPerformance: 0.4,
    wrongAnswerFrequency: 0.2,
    timeSinceLastExposure: 0.05,
    trend: 0.05,
  },
  analysisPeriodDays: 30,
  recentPeriodDays: 7,
  weakAreaThreshold: 0.6,
  improvementThreshold: 0.05,
  declineThreshold: -0.05,
}

// ============================================================================
// Performance Analysis Functions
// ============================================================================

/**
 * 카테고리별 성능 통계 계산
 */
export async function calculateCategoryPerformance(
  userId: string,
  periodDays: number = 30
): Promise<CategoryPerformance[]> {
  try {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - periodDays)

    // study_records와 questions 조인하여 카테고리별 통계 계산
    const { data: records, error } = await supabase
      .from('study_records')
      .select(`
        is_correct,
        time_spent,
        created_at,
        question:questions(category)
      `)
      .eq('user_id', userId)
      .gte('created_at', cutoffDate.toISOString())

    if (error) {
      throw error
    }

    // 카테고리별 집계
    const categoryStats: Record<
      string,
      {
        total: number
        correct: number
        totalTime: number
        lastDate: Date | null
      }
    > = {}

    records?.forEach((record) => {
      const category =
        (record.question as { category?: string })?.category || '기타'
      if (!categoryStats[category]) {
        categoryStats[category] = {
          total: 0,
          correct: 0,
          totalTime: 0,
          lastDate: null,
        }
      }

      categoryStats[category].total += 1
      if (record.is_correct) {
        categoryStats[category].correct += 1
      }
      categoryStats[category].totalTime += record.time_spent || 0

      const recordDate = new Date(record.created_at)
      if (
        !categoryStats[category].lastDate ||
        recordDate > categoryStats[category].lastDate
      ) {
        categoryStats[category].lastDate = recordDate
      }
    })

    // 오답 노트에서 카테고리별 오답 횟수 가져오기
    const { data: wrongAnswers } = await supabase
      .from('wrong_answers')
      .select(`
        wrong_count,
        question:questions(category)
      `)
      .eq('user_id', userId)

    const wrongCountByCategory: Record<string, number> = {}
    wrongAnswers?.forEach((wa) => {
      const category =
        (wa.question as { category?: string })?.category || '기타'
      wrongCountByCategory[category] =
        (wrongCountByCategory[category] || 0) + (wa.wrong_count || 0)
    })

    // CategoryPerformance 배열 생성
    const performances: CategoryPerformance[] = Object.entries(
      categoryStats
    ).map(([category, stats]) => {
      const accuracy =
        stats.total > 0 ? stats.correct / stats.total : 0
      const averageTimeSpent =
        stats.total > 0 ? stats.totalTime / stats.total : 0

      return {
        category,
        totalAttempts: stats.total,
        correctAttempts: stats.correct,
        accuracy,
        averageTimeSpent,
        lastAttemptDate: stats.lastDate,
        wrongAnswerCount: wrongCountByCategory[category] || 0,
        recentTrend: 'stable', // 추세는 별도 계산 필요
      }
    })

    return performances
  } catch (error) {
    console.error('Error calculating category performance:', error)
    return []
  }
}

/**
 * 최근 성능 추세 계산
 */
export async function calculateRecentTrend(
  userId: string,
  category: string,
  recentDays: number = 7,
  previousDays: number = 7
): Promise<'improving' | 'declining' | 'stable'> {
  try {
    const now = new Date()
    const recentCutoff = new Date()
    recentCutoff.setDate(recentCutoff.getDate() - recentDays)
    const previousCutoff = new Date()
    previousCutoff.setDate(previousCutoff.getDate() - recentDays - previousDays)

    // 최근 기간 성능
    const { data: recentRecords } = await supabase
      .from('study_records')
      .select(`
        is_correct,
        question:questions(category)
      `)
      .eq('user_id', userId)
      .gte('created_at', recentCutoff.toISOString())
      .lt('created_at', now.toISOString())

    // 이전 기간 성능
    const { data: previousRecords } = await supabase
      .from('study_records')
      .select(`
        is_correct,
        question:questions(category)
      `)
      .eq('user_id', userId)
      .gte('created_at', previousCutoff.toISOString())
      .lt('created_at', recentCutoff.toISOString())

    const recentCategoryRecords = recentRecords?.filter(
      (r) => (r.question as { category?: string })?.category === category
    ) || []
    const previousCategoryRecords = previousRecords?.filter(
      (r) => (r.question as { category?: string })?.category === category
    ) || []

    const recentAccuracy =
      recentCategoryRecords.length > 0
        ? recentCategoryRecords.filter((r) => r.is_correct).length /
          recentCategoryRecords.length
        : 0.5

    const previousAccuracy =
      previousCategoryRecords.length > 0
        ? previousCategoryRecords.filter((r) => r.is_correct).length /
          previousCategoryRecords.length
        : 0.5

    const diff = recentAccuracy - previousAccuracy

    if (diff > 0.05) {
      return 'improving'
    } else if (diff < -0.05) {
      return 'declining'
    }
    return 'stable'
  } catch (error) {
    console.error('Error calculating recent trend:', error)
    return 'stable'
  }
}

/**
 * 오답 패턴 감지
 */
export async function detectWrongAnswerPatterns(
  userId: string,
  category: string
): Promise<WrongAnswerPattern | null> {
  try {
    // 해당 카테고리의 오답 기록 가져오기
    const { data: wrongAnswers } = await supabase
      .from('wrong_answers')
      .select(`
        wrong_count,
        last_wrong_date,
        question:questions(category)
      `)
      .eq('user_id', userId)

    const categoryWrongAnswers = wrongAnswers?.filter(
      (wa) => (wa.question as { category?: string })?.category === category
    ) || []

    if (categoryWrongAnswers.length === 0) {
      return null
    }

    const totalWrongCount = categoryWrongAnswers.reduce(
      (sum, wa) => sum + (wa.wrong_count || 0),
      0
    )
    const affectedQuestions = categoryWrongAnswers.length
    const averageWrongCount = totalWrongCount / affectedQuestions

    // 패턴 분류
    let patternType: 'repeated' | 'concentrated' | 'sporadic' = 'sporadic'
    let severity: 'high' | 'medium' | 'low' = 'low'
    let frequency = 0
    let description = ''

    if (averageWrongCount >= 3) {
      patternType = 'repeated'
      severity = 'high'
      frequency = Math.min(1, averageWrongCount / 5)
      description = '동일 문제 반복 오답'
    } else if (affectedQuestions >= 5) {
      patternType = 'concentrated'
      severity = averageWrongCount >= 2 ? 'high' : 'medium'
      frequency = Math.min(1, affectedQuestions / 10)
      description = '다수 문제 집중 오답'
    } else {
      patternType = 'sporadic'
      severity = 'low'
      frequency = Math.min(1, affectedQuestions / 5)
      description = '산발적 오답'
    }

    return {
      category,
      patternType,
      severity,
      affectedQuestions,
      frequency,
      description,
    }
  } catch (error) {
    console.error('Error detecting wrong answer patterns:', error)
    return null
  }
}

/**
 * 가중치 점수 계산
 */
export async function calculateWeightedScores(
  userId: string,
  diagnosticScores?: Record<string, number>,
  config: WeaknessAnalysisConfig = DEFAULT_WEAKNESS_CONFIG
): Promise<WeightedScore[]> {
  try {
    // 카테고리별 성능 통계
    const performances = await calculateCategoryPerformance(
      userId,
      config.analysisPeriodDays
    )

    // 모든 카테고리 수집
    const allCategories = new Set<string>()
    performances.forEach((p) => allCategories.add(p.category))
    if (diagnosticScores) {
      Object.keys(diagnosticScores).forEach((cat) => allCategories.add(cat))
    }

    const weightedScores: WeightedScore[] = []

    for (const category of allCategories) {
      const performance = performances.find((p) => p.category === category)
      const diagnosticScore = diagnosticScores?.[category] || 50

      // 추세 계산
      const trend = await calculateRecentTrend(
        userId,
        category,
        config.recentPeriodDays
      )

      // 오답 패턴 감지
      const pattern = await detectWrongAnswerPatterns(userId, category)

      // 각 요소별 점수 계산 (0-100)
      const diagnosticScoreNormalized = diagnosticScore / 100
      const ongoingPerformanceScore = performance
        ? performance.accuracy
        : 0.5
      const wrongAnswerFrequencyScore = pattern
        ? 1 - pattern.frequency // 오답 빈도가 높을수록 낮은 점수
        : 1

      // 마지막 학습 시간 점수 (오래 안 했을수록 낮은 점수)
      const daysSinceLastExposure = performance?.lastAttemptDate
        ? Math.floor(
            (Date.now() - performance.lastAttemptDate.getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : 999
      const timeSinceLastExposureScore = Math.max(
        0,
        1 - daysSinceLastExposure / 30
      ) // 30일 이상이면 0

      // 추세 점수
      const trendScore =
        trend === 'improving'
          ? 1
          : trend === 'declining'
          ? 0.5
          : 0.75

      // 기본 점수 계산 (가중 평균)
      const baseScore =
        diagnosticScoreNormalized * config.weights.diagnosticScore +
        ongoingPerformanceScore * config.weights.ongoingPerformance +
        wrongAnswerFrequencyScore * config.weights.wrongAnswerFrequency +
        timeSinceLastExposureScore * config.weights.timeSinceLastExposure +
        trendScore * config.weights.trend

      // 가중치 계산 (약점일수록 높은 가중치)
      const isWeakArea = baseScore < config.weakAreaThreshold
      const weight = isWeakArea
        ? 1 + (1 - baseScore) * 0.5 // 약점일 경우 1.0 ~ 1.5
        : 1 - (baseScore - config.weakAreaThreshold) * 0.3 // 강점일 경우 0.7 ~ 1.0

      weightedScores.push({
        category,
        baseScore: baseScore * 100,
        weight,
        finalScore: baseScore * 100 * weight,
        factors: {
          diagnosticScore: diagnosticScoreNormalized * 100,
          ongoingPerformance: ongoingPerformanceScore * 100,
          wrongAnswerFrequency: wrongAnswerFrequencyScore * 100,
          timeSinceLastExposure: timeSinceLastExposureScore * 100,
          trend: trendScore * 100,
        },
      })
    }

    // 최종 점수 순으로 정렬
    return weightedScores.sort((a, b) => b.finalScore - a.finalScore)
  } catch (error) {
    console.error('Error calculating weighted scores:', error)
    return []
  }
}

/**
 * 약점 영역 식별
 */
export async function identifyWeakAreas(
  userId: string,
  diagnosticScores?: Record<string, number>,
  config: WeaknessAnalysisConfig = DEFAULT_WEAKNESS_CONFIG
): Promise<string[]> {
  const weightedScores = await calculateWeightedScores(
    userId,
    diagnosticScores,
    config
  )

  // 최종 점수가 임계값 이하인 카테고리를 약점으로 식별
  return weightedScores
    .filter((ws) => ws.finalScore < config.weakAreaThreshold * 100)
    .map((ws) => ws.category)
}

/**
 * 동적 가중치 조정
 * 사용자 성능 변화에 따라 가중치를 업데이트
 */
export function adjustWeights(
  currentWeights: WeaknessAnalysisConfig['weights'],
  performanceChange: Record<string, number> // 카테고리별 성능 변화 (-1 ~ 1)
): WeaknessAnalysisConfig['weights'] {
  const adjustedWeights = { ...currentWeights }

  // 전체 성능 변화 평균 계산
  const avgChange =
    Object.values(performanceChange).reduce((sum, val) => sum + val, 0) /
    Object.values(performanceChange).length

  // 성능이 개선되면 지속 성능 가중치 증가, 진단 테스트 가중치 감소
  if (avgChange > 0.1) {
    adjustedWeights.ongoingPerformance = Math.min(
      0.5,
      currentWeights.ongoingPerformance + 0.05
    )
    adjustedWeights.diagnosticScore = Math.max(
      0.2,
      currentWeights.diagnosticScore - 0.05
    )
  }
  // 성능이 악화되면 진단 테스트 가중치 증가
  else if (avgChange < -0.1) {
    adjustedWeights.diagnosticScore = Math.min(
      0.4,
      currentWeights.diagnosticScore + 0.05
    )
    adjustedWeights.ongoingPerformance = Math.max(
      0.3,
      currentWeights.ongoingPerformance - 0.05
    )
  }

  return adjustedWeights
}















