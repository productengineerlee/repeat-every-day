/**
 * Weak Area Analysis API
 * 
 * 약점 영역 상세 분석을 위한 API 함수들
 */

import { supabase } from '../supabaseClient'
import {
  calculateCategoryPerformance,
  calculateWeightedScores,
  type CategoryPerformance,
  type WeightedScore,
} from '../utils/weaknessAnalysis'

export interface DetailedWeaknessAnalysis {
  category: string
  currentScore: number
  previousScore: number
  improvement: number
  trend: 'improving' | 'declining' | 'stable'
  performance: CategoryPerformance | null
  weightedScore: WeightedScore | null
  recommendation: string
  priority: 'high' | 'medium' | 'low'
}

export interface QuestionLevelPerformance {
  questionId: string
  content: string
  difficulty: number
  attempts: number
  correctCount: number
  accuracy: number
  lastAttemptDate: string | null
}

/**
 * 상세 약점 분석 데이터 가져오기
 */
export async function getDetailedWeaknessAnalysis(
  userId: string
): Promise<DetailedWeaknessAnalysis[]> {
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

    // 가중치 점수 계산
    const weightedScores = await calculateWeightedScores(
      userId,
      currentScores
    )

    // 카테고리별 성능 통계
    const performances = await calculateCategoryPerformance(userId, 30)

    // 상세 분석 데이터 생성
    const analysis: DetailedWeaknessAnalysis[] = Object.entries(
      currentScores
    ).map(([category, currentScore]) => {
      const previousScore = previousScores?.[category] || currentScore
      const improvement = currentScore - previousScore

      let trend: 'improving' | 'declining' | 'stable' = 'stable'
      if (improvement > 5) {
        trend = 'improving'
      } else if (improvement < -5) {
        trend = 'declining'
      }

      const performance = performances.find((p) => p.category === category) || null
      const weightedScore = weightedScores.find((ws) => ws.category === category) || null

      // 우선순위 결정
      let priority: 'high' | 'medium' | 'low' = 'medium'
      if (currentScore < 40) {
        priority = 'high'
      } else if (currentScore < 60) {
        priority = 'medium'
      } else {
        priority = 'low'
      }

      // 개인화된 추천 생성
      const recommendation = generateRecommendation(
        category,
        currentScore,
        improvement,
        trend,
        performance,
        weightedScore
      )

      return {
        category,
        currentScore,
        previousScore,
        improvement,
        trend,
        performance: performance || null,
        weightedScore: weightedScore || null,
        recommendation,
        priority,
      }
    })

    // 우선순위 순으로 정렬
    return analysis.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      }
      return a.currentScore - b.currentScore
    })
  } catch (error) {
    console.error('Error fetching detailed weakness analysis:', error)
    return []
  }
}

/**
 * 개인화된 추천 생성
 */
function generateRecommendation(
  category: string,
  currentScore: number,
  improvement: number,
  trend: 'improving' | 'declining' | 'stable',
  performance: CategoryPerformance | null,
  weightedScore: WeightedScore | null
): string {
  const recommendations: string[] = []

  // 점수 기반 추천
  if (currentScore < 40) {
    recommendations.push(
      `${category} 영역의 기초를 탄탄히 다지세요. 기본 개념부터 다시 학습하는 것을 권장합니다.`
    )
  } else if (currentScore < 60) {
    recommendations.push(
      `${category} 영역에서 더 많은 연습이 필요합니다. 유사한 문제를 반복 풀이해보세요.`
    )
  } else if (currentScore < 80) {
    recommendations.push(
      `${category} 영역이 꾸준히 개선되고 있습니다. 조금만 더 노력하면 목표에 도달할 수 있습니다.`
    )
  }

  // 추세 기반 추천
  if (trend === 'improving' && improvement > 10) {
    recommendations.push(
      `최근 ${improvement.toFixed(1)}점 향상되었습니다! 현재 학습 방법을 유지하세요.`
    )
  } else if (trend === 'declining') {
    recommendations.push(
      `성능이 하락하고 있습니다. 학습 방법을 점검하고 오답 노트를 활용하세요.`
    )
  }

  // 성능 통계 기반 추천
  if (performance) {
    if (performance.accuracy < 0.5) {
      recommendations.push(
        `정답률이 낮습니다. 문제를 천천히 읽고 개념을 정확히 이해하는 데 집중하세요.`
      )
    }
    if (performance.wrongAnswerCount > 10) {
      recommendations.push(
        `오답이 많습니다. 오답 노트를 활용하여 틀린 문제를 정기적으로 복습하세요.`
      )
    }
    if (performance.averageTimeSpent > 300) {
      recommendations.push(
        `문제 풀이 시간이 길어요. 시간 관리를 연습하고 빠르게 판단하는 능력을 기르세요.`
      )
    }
  }

  // 가중치 기반 추천
  if (weightedScore) {
    const factors = weightedScore.factors
    if (factors.wrongAnswerFrequency < 50) {
      recommendations.push(
        `오답 빈도가 높습니다. 해당 카테고리의 기본 개념을 다시 학습하세요.`
      )
    }
    if (factors.timeSinceLastExposure < 30) {
      recommendations.push(
        `오래 학습하지 않은 영역입니다. 최근에 학습한 내용을 복습하세요.`
      )
    }
  }

  return recommendations.length > 0
    ? recommendations[0]
    : `${category} 영역을 꾸준히 학습하세요.`
}

/**
 * 카테고리별 문제 수준 성능 데이터 가져오기
 */
export async function getQuestionLevelPerformance(
  userId: string,
  category: string
): Promise<QuestionLevelPerformance[]> {
  try {
    // 해당 카테고리의 문제들 가져오기
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('id, content, difficulty')
      .eq('category', category)
      .limit(100)

    if (questionsError) {
      throw questionsError
    }

    if (!questions || questions.length === 0) {
      return []
    }

    const questionIds = questions.map((q) => q.id)

    // 사용자의 학습 기록 가져오기
    const { data: records, error: recordsError } = await supabase
      .from('study_records')
      .select('question_id, is_correct, created_at')
      .eq('user_id', userId)
      .in('question_id', questionIds)

    if (recordsError) {
      throw recordsError
    }

    // 문제별 성능 집계
    const questionMap: Record<
      string,
      {
        attempts: number
        correctCount: number
        lastAttemptDate: string | null
      }
    > = {}

    records?.forEach((record) => {
      const qId = record.question_id
      if (!questionMap[qId]) {
        questionMap[qId] = {
          attempts: 0,
          correctCount: 0,
          lastAttemptDate: null,
        }
      }
      questionMap[qId].attempts += 1
      if (record.is_correct) {
        questionMap[qId].correctCount += 1
      }
      if (
        !questionMap[qId].lastAttemptDate ||
        record.created_at > questionMap[qId].lastAttemptDate
      ) {
        questionMap[qId].lastAttemptDate = record.created_at
      }
    })

    // 결과 배열 생성
    const result: QuestionLevelPerformance[] = questions.map((question) => {
      const stats = questionMap[question.id] || {
        attempts: 0,
        correctCount: 0,
        lastAttemptDate: null,
      }

      return {
        questionId: question.id,
        content: question.content.substring(0, 100) + (question.content.length > 100 ? '...' : ''),
        difficulty: question.difficulty,
        attempts: stats.attempts,
        correctCount: stats.correctCount,
        accuracy:
          stats.attempts > 0
            ? Math.round((stats.correctCount / stats.attempts) * 100)
            : 0,
        lastAttemptDate: stats.lastAttemptDate,
      }
    })

    // 정확도 순으로 정렬 (낮은 것부터)
    return result.sort((a, b) => {
      if (a.attempts === 0 && b.attempts === 0) return 0
      if (a.attempts === 0) return 1
      if (b.attempts === 0) return -1
      return a.accuracy - b.accuracy
    })
  } catch (error) {
    console.error('Error fetching question level performance:', error)
    return []
  }
}

