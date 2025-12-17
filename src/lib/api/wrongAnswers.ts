import { supabase } from '../supabaseClient'
import type { WrongAnswer } from '@/types'

export interface WrongAnswerWithQuestion extends WrongAnswer {
  question?: {
    id: string
    content: string
    options: string[]
    correctAnswer: string
    explanation: string
    category: string
    certificationType?: string
    difficulty?: number | string
  }
  consecutiveCorrect?: number
}

/**
 * 오답 목록 가져오기
 */
export async function getWrongAnswers(
  userId: string,
  category: 'all' | 'today' | 'review' | 'graduated'
): Promise<WrongAnswerWithQuestion[]> {
  try {
    let query = supabase
      .from('wrong_answers')
      .select(`
        *,
        question:questions(id, content, options, correct_answer, explanation, category, certification_type, difficulty)
      `)
      .eq('user_id', userId)

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    switch (category) {
      case 'all':
        // 전체 오답 (졸업하지 않은 모든 문제)
        query = query.eq('graduated', false)
        break
      case 'today':
        // 오늘 틀린 문제
        query = query.gte('last_wrong_date', today.toISOString())
        break
      case 'review':
        // 복습 알림 (다음 복습일이 오늘 이전이거나 오늘인 문제)
        query = query
          .lte('next_review_date', today.toISOString())
          .eq('graduated', false)
        break
      case 'graduated':
        // 졸업한 문제
        query = query.eq('graduated', true)
        break
    }

    const { data, error } = await query.order('next_review_date', {
      ascending: true,
    })

    if (error) {
      throw error
    }

    // 선택지 텍스트에서 숫자 접두사만 제거 (원형 숫자는 유지)
    const cleanOptionText = (text: string): string => {
      // "숫자. " 형식만 제거: "0. ① 수익비용..." → "① 수익비용..."
      return text.replace(/^\d+\.\s*/, '').trim()
    }

    // snake_case를 camelCase로 변환하고 연속 정답 횟수 추가
    const result = await Promise.all((data || []).map(async (item: any) => ({
      id: item.id,
      userId: item.user_id,
      questionId: item.question_id,
      wrongCount: item.wrong_count ?? 0,
      lastWrongDate: new Date(item.last_wrong_date),
      nextReviewDate: item.next_review_date ? new Date(item.next_review_date) : undefined,
      graduated: item.graduated ?? false,
      createdAt: new Date(item.created_at),
      updatedAt: new Date(item.updated_at),
      question: item.question ? {
        id: item.question.id,
        content: item.question.content,
        options: (() => {
          // options 처리
          let options: string[] = []
          if (Array.isArray(item.question.options)) {
            options = item.question.options.map((opt: string) => cleanOptionText(opt))
          } else if (typeof item.question.options === 'string') {
            try {
              const parsedOptions = JSON.parse(item.question.options)
              options = Array.isArray(parsedOptions) 
                ? parsedOptions.map((opt: string) => cleanOptionText(opt))
                : []
            } catch (e) {
              console.warn('⚠️ options 파싱 실패:', e)
              options = []
            }
          }
          return options
        })(),
        correctAnswer: (() => {
          // correct_answer 처리 (다양한 형식 지원: 1,2,3,4,5 / A,B,C,D,E / ①,②,③,④,⑤)
          let correctAnswer = item.question.correct_answer || item.question.correctAnswer || '1'
          correctAnswer = String(correctAnswer).trim()
          
          const circleNumbers = ['①', '②', '③', '④', '⑤']
          
          // 1. 숫자 형식(1,2,3,4,5)을 원형 숫자로 변환
          if (/^[1-5]$/.test(correctAnswer)) {
            return circleNumbers[parseInt(correctAnswer) - 1]
          }
          
          // 2. 알파벳 형식(A,B,C,D,E)을 원형 숫자로 변환
          if (/^[A-E]$/i.test(correctAnswer)) {
            const index = correctAnswer.toUpperCase().charCodeAt(0) - 'A'.charCodeAt(0)
            return circleNumbers[index]
          }
          
          // 3. 이미 원형 숫자면 그대로 반환
          if (/^[①②③④⑤]$/.test(correctAnswer)) {
            return correctAnswer
          }
          
          // 기본값
          return '①'
        })(),
        explanation: item.question.explanation || '',
        category: item.question.category,
        certificationType: item.question.certification_type,
        difficulty: (() => {
          // 난이도를 '상', '중', '하'로 변환
          const diff = item.question.difficulty
          if (diff === null || diff === undefined) return '중'
          
          const diffNum = Number(diff)
          if (!isNaN(diffNum) && diffNum >= 1 && diffNum <= 5) {
            if (diffNum === 5) return '상'
            if (diffNum === 4) return '상'
            if (diffNum === 3) return '중'
            if (diffNum === 2) return '중'
            if (diffNum === 1) return '하'
          }
          return '중' // 기본값
        })(),
      } : undefined,
      consecutiveCorrect: await getConsecutiveCorrectCount(userId, item.question_id),
    })))
    
    return result as WrongAnswerWithQuestion[]
  } catch (error) {
    console.error('Error fetching wrong answers:', error)
    return []
  }
}

/**
 * 연속 정답 횟수 계산 (study_records 기반)
 */
export async function getConsecutiveCorrectCount(
  userId: string,
  questionId: string
): Promise<number> {
  try {
    // 최근 study_records를 시간 역순으로 가져오기
    const { data: records, error } = await supabase
      .from('study_records')
      .select('is_correct, created_at')
      .eq('user_id', userId)
      .eq('question_id', questionId)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Error fetching study records:', error)
      return 0
    }

    if (!records || records.length === 0) {
      return 0
    }

    // 연속 정답 횟수 계산
    let count = 0
    for (const record of records) {
      if (record.is_correct) {
        count++
      } else {
        break
      }
    }

    return count
  } catch (error) {
    console.error('Error calculating consecutive correct count:', error)
    return 0
  }
}

/**
 * 복습 완료 처리
 */
export async function markReviewComplete(
  userId: string,
  questionId: string,
  isCorrect: boolean
): Promise<{ success: boolean; graduated?: boolean; error?: string }> {
  try {
    // study_records에 기록
    const { error: recordError } = await supabase.from('study_records').insert({
      user_id: userId,
      question_id: questionId,
      user_answer: '',
      is_correct: isCorrect,
      time_spent: 0,
    })

    if (recordError) {
      throw recordError
    }

    // wrong_answers 테이블 업데이트
    const { data: wrongAnswer, error: fetchError } = await supabase
      .from('wrong_answers')
      .select('*')
      .eq('user_id', userId)
      .eq('question_id', questionId)
      .single()

    if (fetchError) {
      throw fetchError
    }

    if (isCorrect) {
      // 연속 정답 횟수 계산
      const consecutiveCorrect = await getConsecutiveCorrectCount(
        userId,
        questionId
      )

      // 정답인 경우 다음 복습일 계산 (에빙하우스 망각 곡선)
      // 연속 정답 횟수를 사용하여 간격 결정
      const nextReviewDate = calculateNextReviewDate(
        consecutiveCorrect,
        new Date(wrongAnswer.next_review_date || wrongAnswer.last_wrong_date)
      )

      // 5번 연속 정답이면 졸업
      const graduated = consecutiveCorrect >= 5

      const { error: updateError } = await supabase
        .from('wrong_answers')
        .update({
          next_review_date: nextReviewDate.toISOString(),
          graduated,
        })
        .eq('id', wrongAnswer.id)

      if (updateError) {
        throw updateError
      }

      return { success: true, graduated }
    } else {
      // 오답인 경우 틀린 횟수 증가 및 다음 복습일 재설정
      const { error: updateError } = await supabase
        .from('wrong_answers')
        .update({
          wrong_count: wrongAnswer.wrong_count + 1,
          last_wrong_date: new Date().toISOString(),
          next_review_date: new Date().toISOString(), // 즉시 재복습
          graduated: false,
        })
        .eq('id', wrongAnswer.id)

      if (updateError) {
        throw updateError
      }

      return { success: true, graduated: false }
    }
  } catch (error) {
    console.error('Error marking review complete:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '복습 완료 처리 실패',
    }
  }
}

/**
 * 에빙하우스 망각 곡선 기반 다음 복습일 계산
 */
function calculateNextReviewDate(
  reviewCount: number,
  lastReviewDate: Date
): Date {
  const intervals = [1, 3, 7, 14, 30] // 일 단위
  const intervalIndex = Math.min(reviewCount, intervals.length - 1)
  const daysToAdd = intervals[intervalIndex]

  const nextDate = new Date(lastReviewDate)
  nextDate.setDate(nextDate.getDate() + daysToAdd)

  return nextDate
}

