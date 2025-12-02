import type { DiagnosticQuestion } from '@/lib/api/questions'

/**
 * 진단 테스트 결과 계산
 * @param questions 문제 목록
 * @param answers 사용자 답안 (questionId -> answer)
 * @returns 카테고리별 점수와 취약 영역
 */
export function calculateDiagnosticResults(
  questions: DiagnosticQuestion[],
  answers: Record<string, string>
) {
  // 카테고리별 점수 집계
  const categoryScores: Record<string, { correct: number; total: number }> = {}

  questions.forEach((question) => {
    const category = question.category || '기타'
    const userAnswer = answers[question.id]
    // 데이터베이스에서는 correct_answer로 저장됨
    const questionRecord = question as DiagnosticQuestion & { correct_answer?: string }
    const correctAnswer = questionRecord.correct_answer || question.correctAnswer
    const isCorrect = userAnswer === correctAnswer

    if (!categoryScores[category]) {
      categoryScores[category] = { correct: 0, total: 0 }
    }

    categoryScores[category].total += 1
    if (isCorrect) {
      categoryScores[category].correct += 1
    }
  })

  // 카테고리별 점수 계산 (0-100)
  const scores: Record<string, number> = {}
  const weakAreas: string[] = []

  Object.entries(categoryScores).forEach(([category, { correct, total }]) => {
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0
    scores[category] = percentage

    // 60점 미만인 카테고리를 취약 영역으로 분류
    if (percentage < 60) {
      weakAreas.push(category)
    }
  })

  return {
    scores,
    weakAreas,
  }
}

