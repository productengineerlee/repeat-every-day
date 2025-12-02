/**
 * Personalized Learning Recommendation Engine
 * 
 * This module implements a recommendation algorithm for generating
 * personalized daily question sets based on user performance data.
 */

import {
  calculateWeightedScores,
  identifyWeakAreas,
  type WeightedScore,
} from './weaknessAnalysis'
import {
  getLastExposureByCategory,
  getCategoryReviewStats,
  calculateIdealReviewTiming,
  calculateSpacedRepetitionScore as calculateSRScore,
} from './spacedRepetition'

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * 사용자 성능 데이터
 */
export interface UserPerformanceData {
  userId: string
  certificationType: string
  
  // 진단 테스트 결과
  diagnosticScores?: Record<string, number> // 카테고리별 점수 (0-100)
  weakAreas?: string[] // 취약 영역 카테고리 목록
  
  // 최근 학습 기록
  recentQuestions?: string[] // 최근 N일간 풀었던 문제 ID 목록
  recentPerformance?: Record<string, number> // 문제 ID별 최근 정답률 (0-1)
  
  // 카테고리별 마지막 학습 시간
  lastExposureByCategory?: Record<string, Date> // 카테고리별 마지막 학습 시간
  
  // 전체 성능 통계
  overallAccuracy?: number // 전체 정답률 (0-1)
  totalQuestionsAnswered?: number // 총 풀이한 문제 수
}

/**
 * 문제 메타데이터
 */
export interface QuestionMetadata {
  id: string
  category: string
  difficulty: number // 1-5
  tags?: string[]
  createdAt: Date
}

/**
 * 추천 점수 계산 결과
 */
export interface RecommendationScore {
  questionId: string
  score: number // 0-100, 높을수록 추천 우선순위가 높음
  factors: {
    weakAreaBoost: number // 약점 영역 보너스 (0-30)
    recencyPenalty: number // 최근 풀이 페널티 (0-20)
    difficultyMatch: number // 난이도 적합도 (0-20)
    categoryBalance: number // 카테고리 균형 (0-15)
    spacedRepetition: number // 간격 반복 점수 (0-15)
  }
}

/**
 * 추천 엔진 설정
 */
export interface RecommendationConfig {
  // 기본 설정
  targetQuestionCount: number // 목표 문제 수 (기본: 5)
  
  // 가중치 설정
  weights: {
    weakAreaBoost: number // 약점 영역 가중치 (기본: 0.3)
    recencyPenalty: number // 최근 풀이 페널티 가중치 (기본: 0.2)
    difficultyMatch: number // 난이도 적합도 가중치 (기본: 0.2)
    categoryBalance: number // 카테고리 균형 가중치 (기본: 0.15)
    spacedRepetition: number // 간격 반복 가중치 (기본: 0.15)
  }
  
  // 필터링 설정
  excludeRecentDays: number // 최근 N일간 풀었던 문제 제외 (기본: 1)
  minDifficulty: number // 최소 난이도 (기본: 1)
  maxDifficulty: number // 최대 난이도 (기본: 5)
  
  // 간격 반복 설정
  idealReviewInterval: number // 이상적인 복습 간격 (일 단위, 기본: 7)
  minReviewInterval: number // 최소 복습 간격 (일 단위, 기본: 3)
}

// ============================================================================
// Default Configuration
// ============================================================================

export const DEFAULT_CONFIG: RecommendationConfig = {
  targetQuestionCount: 5,
  weights: {
    weakAreaBoost: 0.3,
    recencyPenalty: 0.2,
    difficultyMatch: 0.2,
    categoryBalance: 0.15,
    spacedRepetition: 0.15,
  },
  excludeRecentDays: 1,
  minDifficulty: 1,
  maxDifficulty: 5,
  idealReviewInterval: 7,
  minReviewInterval: 3,
}

// ============================================================================
// Core Recommendation Functions
// ============================================================================

/**
 * 약점 영역 보너스 점수 계산
 * 약점 영역에 속한 문제일수록 높은 점수
 * 가중치 점수를 활용하여 더 정교한 보너스 계산
 */
function calculateWeakAreaBoost(
  category: string,
  weakAreas: string[] = [],
  weightedScores?: WeightedScore[]
): number {
  if (weakAreas.length === 0 && !weightedScores) {
    return 0
  }
  
  // 가중치 점수가 있으면 더 정교한 계산
  if (weightedScores) {
    const categoryScore = weightedScores.find((ws) => ws.category === category)
    if (categoryScore) {
      // 약점 영역이고 가중치가 높을수록 더 큰 보너스
      // 최대 30점, 가중치에 비례하여 조정
      const baseBoost = weakAreas.includes(category) ? 30 : 0
      const weightMultiplier = Math.max(1, categoryScore.weight)
      return baseBoost * weightMultiplier
    }
  }
  
  // 기본 로직 (가중치 점수가 없는 경우)
  if (weakAreas.includes(category)) {
    return 30 // 최대 보너스
  }
  
  return 0
}

/**
 * 최근 풀이 페널티 계산
 * 최근에 풀었던 문제일수록 낮은 점수
 */
function calculateRecencyPenalty(
  questionId: string,
  recentQuestions: string[] = []
): number {
  if (recentQuestions.length === 0) {
    return 0
  }
  
  const daysSinceLastAnswer = recentQuestions.indexOf(questionId)
  if (daysSinceLastAnswer === -1) {
    return 0 // 최근에 풀지 않았으면 페널티 없음
  }
  
  // 최근에 풀었을수록 높은 페널티 (최대 20)
  return Math.max(0, 20 - daysSinceLastAnswer * 5)
}

/**
 * 난이도 적합도 점수 계산
 * 사용자의 현재 수준에 맞는 난이도일수록 높은 점수
 */
function calculateDifficultyMatch(
  difficulty: number,
  overallAccuracy: number = 0.5
): number {
  // 정답률에 따라 목표 난이도 계산
  // 정답률이 높을수록 더 어려운 문제 추천
  let targetDifficulty = 3 // 기본값
  
  if (overallAccuracy < 0.4) {
    targetDifficulty = 2 // 낮은 정답률 -> 쉬운 문제
  } else if (overallAccuracy < 0.6) {
    targetDifficulty = 3 // 중간 정답률 -> 중간 난이도
  } else if (overallAccuracy < 0.8) {
    targetDifficulty = 4 // 높은 정답률 -> 어려운 문제
  } else {
    targetDifficulty = 5 // 매우 높은 정답률 -> 매우 어려운 문제
  }
  
  // 난이도 차이에 따라 점수 계산 (최대 20)
  const diff = Math.abs(difficulty - targetDifficulty)
  return Math.max(0, 20 - diff * 5)
}

/**
 * 카테고리 균형 점수 계산
 * 이미 선택된 문제들과의 카테고리 다양성을 고려
 */
function calculateCategoryBalance(
  category: string,
  selectedCategories: string[] = []
): number {
  if (selectedCategories.length === 0) {
    return 15 // 첫 문제는 최대 점수
  }
  
  // 이미 선택된 카테고리와 중복되면 낮은 점수
  const categoryCount = selectedCategories.filter((c) => c === category).length
  return Math.max(0, 15 - categoryCount * 5)
}

/**
 * 간격 반복 점수 계산 (개선된 버전)
 * 마지막 학습 시간, 복습 횟수, 최근 성능을 종합하여 점수 계산
 */
async function calculateSpacedRepetitionScore(
  category: string,
  lastExposure: Date | undefined,
  userId: string
): Promise<number> {
  if (!lastExposure) {
    return 15 // 처음 학습하는 카테고리는 최대 점수
  }
  
  // 카테고리별 복습 통계 조회
  const { reviewCount, recentAccuracy } = await getCategoryReviewStats(
    userId,
    category
  )
  
  // 이상적인 재학습 타이밍 계산
  const idealTiming = calculateIdealReviewTiming(
    lastExposure,
    reviewCount,
    recentAccuracy
  )
  
  // 간격 반복 점수 계산
  return calculateSRScore(
    lastExposure,
    reviewCount,
    recentAccuracy,
    idealTiming
  )
}

/**
 * 개별 문제에 대한 추천 점수 계산
 */
export async function calculateRecommendationScore(
  question: QuestionMetadata,
  userData: UserPerformanceData,
  selectedQuestions: QuestionMetadata[] = [],
  config: RecommendationConfig = DEFAULT_CONFIG,
  weightedScores?: WeightedScore[]
): Promise<RecommendationScore> {
  const selectedCategories = selectedQuestions.map((q) => q.category)
  
  // 각 요소별 점수 계산
  const weakAreaBoost = calculateWeakAreaBoost(
    question.category,
    userData.weakAreas,
    weightedScores
  )
  
  const recencyPenalty = calculateRecencyPenalty(
    question.id,
    userData.recentQuestions
  )
  
  const difficultyMatch = calculateDifficultyMatch(
    question.difficulty,
    userData.overallAccuracy
  )
  
  const categoryBalance = calculateCategoryBalance(
    question.category,
    selectedCategories
  )
  
  const lastExposure = userData.lastExposureByCategory?.[question.category]
  const spacedRepetition = await calculateSpacedRepetitionScore(
    question.category,
    lastExposure,
    userData.userId
  )
  
  // 가중치 적용하여 최종 점수 계산
  const score =
    weakAreaBoost * config.weights.weakAreaBoost +
    (20 - recencyPenalty) * config.weights.recencyPenalty + // 페널티는 빼기
    difficultyMatch * config.weights.difficultyMatch +
    categoryBalance * config.weights.categoryBalance +
    spacedRepetition * config.weights.spacedRepetition
  
  return {
    questionId: question.id,
    score: Math.max(0, Math.min(100, score)), // 0-100 범위로 제한
    factors: {
      weakAreaBoost,
      recencyPenalty,
      difficultyMatch,
      categoryBalance,
      spacedRepetition,
    },
  }
}

/**
 * 문제 목록에서 추천 문제 선택
 */
export async function selectRecommendedQuestions(
  candidates: QuestionMetadata[],
  userData: UserPerformanceData,
  config: RecommendationConfig = DEFAULT_CONFIG
): Promise<QuestionMetadata[]> {
  // 최근 풀이한 문제 제외
  const recentCutoff = new Date()
  recentCutoff.setDate(recentCutoff.getDate() - config.excludeRecentDays)
  
  const filteredCandidates = candidates.filter((q) => {
    // 최근 풀이한 문제 제외
    if (userData.recentQuestions?.includes(q.id)) {
      return false
    }
    
    // 난이도 필터링
    if (q.difficulty < config.minDifficulty || q.difficulty > config.maxDifficulty) {
      return false
    }
    
    return true
  })
  
  // 가중치 점수 계산 (약점 분석 시스템 활용)
  const weightedScores = await calculateWeightedScores(
    userData.userId,
    userData.diagnosticScores
  )
  
  // 약점 영역 업데이트 (가중치 점수 기반)
  const identifiedWeakAreas = await identifyWeakAreas(
    userData.userId,
    userData.diagnosticScores
  )
  userData.weakAreas = identifiedWeakAreas
  
  // 카테고리별 마지막 학습 시간 업데이트
  if (!userData.lastExposureByCategory) {
    userData.lastExposureByCategory = await getLastExposureByCategory(
      userData.userId
    )
  }
  
  const selected: QuestionMetadata[] = []
  
  // 그리디 알고리즘으로 문제 선택
  // 각 단계에서 가장 높은 점수의 문제를 선택하고,
  // 선택된 문제를 고려하여 다시 점수를 계산
  for (let i = 0; i < config.targetQuestionCount && filteredCandidates.length > 0; i++) {
    // 남은 후보들에 대한 점수 계산
    const remainingCandidates = filteredCandidates.filter(
      (q) => !selected.some((s) => s.id === q.id)
    )
    
    if (remainingCandidates.length === 0) {
      break
    }
    
    // 각 후보에 대한 점수 계산 (비동기)
    const scorePromises = remainingCandidates.map((question) =>
      calculateRecommendationScore(
        question,
        userData,
        selected,
        config,
        weightedScores
      ).then((score) => ({ question, score }))
    )
    
    const scores = await Promise.all(scorePromises)
    
    // 가장 높은 점수의 문제 선택
    scores.sort((a, b) => b.score.score - a.score.score)
    const best = scores[0]
    
    selected.push(best.question)
  }
  
  return selected
}

