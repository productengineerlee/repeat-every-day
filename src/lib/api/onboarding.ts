import { supabase } from '../supabaseClient'
import type { CertificationType } from '@/context'
import { getDiagnosticQuestions } from './questions'
import { calculateDiagnosticResults } from '../utils/diagnostic'
import { saveWrongAnswers } from './wrongAnswers'

export interface OnboardingData {
  certificationType: CertificationType
  targetExamDate?: Date | null
  diagnosticAnswers: Record<string, string>
}

export interface SaveOnboardingResult {
  success: boolean
  error?: string
  diagnosisResultId?: string
}

/**
 * 사용자 자격증 정보 저장 (upsert 사용)
 */
export async function saveUserCertification(
  userId: string,
  certificationType: CertificationType,
  targetExamDate?: Date | null
): Promise<{ success: boolean; error?: string }> {
  try {
    // 먼저 사용자가 존재하는지 확인
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .maybeSingle()

    const updateData: {
      certification_type: CertificationType
      target_exam_date?: string
      daily_question_count?: number
    } = {
      certification_type: certificationType,
      daily_question_count: 3, // 기본 일일 문제 수를 3으로 설정
    }

    // targetExamDate가 있으면 추가
    if (targetExamDate) {
      updateData.target_exam_date = targetExamDate.toISOString().split('T')[0]
    }

    if (existingUser) {
      // 사용자가 존재하면 업데이트
      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId)

      if (error) {
        throw error
      }
    } else {
      // 사용자가 없으면 생성 (auth.users에서 가져온 정보 사용)
      const { data: authUser } = await supabase.auth.getUser()
      
      if (!authUser.user) {
        throw new Error('인증된 사용자를 찾을 수 없습니다.')
      }

      const insertData: {
        id: string
        email: string
        certification_type: CertificationType
        target_exam_date?: string
        daily_question_count: number
      } = {
        id: userId,
        email: authUser.user.email || '',
        certification_type: certificationType,
        daily_question_count: 3, // 기본 일일 문제 수를 3으로 설정
      }

      // targetExamDate가 있으면 추가
      if (targetExamDate) {
        insertData.target_exam_date = targetExamDate.toISOString().split('T')[0]
      }

      const { error } = await supabase
        .from('users')
        .insert(insertData)

      if (error) {
        throw error
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Error saving user certification:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '자격증 정보 저장 실패',
    }
  }
}

/**
 * 진단 테스트 결과 조회
 */
export async function getDiagnosticResults(userId: string) {
  try {
    const { data, error } = await supabase
      .from('diagnosis_results')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('Error fetching diagnostic results:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in getDiagnosticResults:', error)
    return null
  }
}

/**
 * 진단 테스트 결과 저장 (upsert 사용 - 중복 방지)
 */
export async function saveDiagnosticResults(
  userId: string,
  scores: Record<string, number>,
  weakAreas: string[],
  subjectGroups?: Record<string, any>,
  categoryDetails?: Record<string, any>,
  totalScore?: number,
  totalQuestions?: number
): Promise<{ success: boolean; error?: string; diagnosisResultId?: string }> {
  try {
    // 먼저 기존 진단 결과가 있는지 확인
    const { data: existingResult } = await supabase
      .from('diagnosis_results')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()

    if (existingResult) {
      // 기존 결과가 있으면 업데이트
      const updateData: any = {
        scores,
        weak_areas: weakAreas,
      }
      
      if (subjectGroups) updateData.subject_groups = subjectGroups
      if (categoryDetails) updateData.category_details = categoryDetails
      if (totalScore !== undefined) updateData.total_score = totalScore
      if (totalQuestions !== undefined) updateData.total_questions = totalQuestions
      
      const { data, error } = await supabase
        .from('diagnosis_results')
        .update(updateData)
        .eq('id', existingResult.id)
        .select('id')
        .single()

      if (error) {
        throw error
      }

      return {
        success: true,
        diagnosisResultId: data.id,
      }
    } else {
      // 기존 결과가 없으면 생성
      const insertData: any = {
        user_id: userId,
        scores,
        weak_areas: weakAreas,
      }
      
      if (subjectGroups) insertData.subject_groups = subjectGroups
      if (categoryDetails) insertData.category_details = categoryDetails
      if (totalScore !== undefined) insertData.total_score = totalScore
      if (totalQuestions !== undefined) insertData.total_questions = totalQuestions
      
      const { data, error } = await supabase
        .from('diagnosis_results')
        .insert(insertData)
        .select('id')
        .single()

      if (error) {
        // 외래키 제약조건 위반인 경우 더 명확한 에러 메시지
        if (error.code === '23503') {
          throw new Error('사용자 정보가 없습니다. 먼저 사용자 정보를 저장해주세요.')
        }
        throw error
      }

      return {
        success: true,
        diagnosisResultId: data.id,
      }
    }
  } catch (error) {
    console.error('Error saving diagnostic results:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '진단 결과 저장 실패',
    }
  }
}

/**
 * 온보딩 데이터 제출 (재시도 로직 포함)
 */
export async function submitOnboardingData(
  userId: string,
  data: OnboardingData,
  retries: number = 3
): Promise<SaveOnboardingResult> {
  let lastError: string | undefined

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // 1. 사용자 자격증 정보 저장
      const certificationResult = await saveUserCertification(
        userId,
        data.certificationType,
        data.targetExamDate
      )

      if (!certificationResult.success) {
        throw new Error(certificationResult.error || '자격증 정보 저장 실패')
      }

      // 2. 진단 문제 가져오기
      const questions = await getDiagnosticQuestions(data.certificationType, 10)

      if (questions.length === 0) {
        throw new Error('진단 문제를 찾을 수 없습니다.')
      }

      // 3. 진단 결과 계산
      const results = calculateDiagnosticResults(questions, data.diagnosticAnswers)

      // 4. 진단 결과 저장 (상세 정보 포함)
      const diagnosisResult = await saveDiagnosticResults(
        userId,
        results.scores,
        results.weakAreas,
        results.subjectGroups,
        results.categoryDetails,
        results.totalScore,
        results.totalQuestions
      )

      if (!diagnosisResult.success) {
        throw new Error(diagnosisResult.error || '진단 결과 저장 실패')
      }

      // 5. 틀린 문제를 오답 노트에 저장
      // 정답과 사용자 답안을 비교하여 틀린 문제 찾기
      const wrongQuestionIds: string[] = []
      
      // 정답 형식 통일 함수 (1,2,3,4,5 / A,B,C,D,E / ㄱ,ㄴ,ㄷ,ㄹ,ㅁ / ①,②,③,④,⑤ → ①,②,③,④,⑤로 통일)
      const normalizeAnswer = (answer: string): string => {
        const trimmed = String(answer).trim()
        const circleNumbers = ['①', '②', '③', '④', '⑤']
        const koreanConsonants = ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ']
        
        // 1. 숫자 형식(1,2,3,4,5)을 ①,②,③,④,⑤로 변환
        if (/^[1-5]$/.test(trimmed)) {
          const index = parseInt(trimmed) - 1
          return circleNumbers[index]
        }
        
        // 2. 알파벳 형식(A,B,C,D,E)을 ①,②,③,④,⑤로 변환
        const upperTrimmed = trimmed.toUpperCase()
        if (/^[A-E]$/i.test(upperTrimmed)) {
          const index = upperTrimmed.charCodeAt(0) - 'A'.charCodeAt(0)
          return circleNumbers[index]
        }
        
        // 3. 한글 자음(ㄱ,ㄴ,ㄷ,ㄹ,ㅁ)을 ①,②,③,④,⑤로 변환
        const koreanIndex = koreanConsonants.indexOf(trimmed)
        if (koreanIndex !== -1) {
          return circleNumbers[koreanIndex]
        }
        
        // 4. 이미 원형 숫자(①,②,③,④,⑤) 형식이면 그대로 반환
        if (circleNumbers.includes(trimmed)) {
          return trimmed
        }
        
        // 5. 그 외의 경우 원본 반환 (에러 방지)
        return trimmed
      }
      
      for (const question of questions) {
        const userAnswer = data.diagnosticAnswers[question.id]
        if (userAnswer) {
          const normalizedUserAnswer = normalizeAnswer(userAnswer)
          const normalizedCorrectAnswer = normalizeAnswer(question.correctAnswer)
          
          if (normalizedUserAnswer !== normalizedCorrectAnswer) {
            wrongQuestionIds.push(question.id)
          }
        }
      }

      // 틀린 문제가 있으면 저장
      if (wrongQuestionIds.length > 0) {
        const wrongAnswersResult = await saveWrongAnswers(userId, wrongQuestionIds)
        
        if (!wrongAnswersResult.success) {
          console.warn('⚠️ 일부 오답 저장 실패:', wrongAnswersResult.error)
          // 오답 저장 실패는 치명적이지 않으므로 계속 진행
        } else {
          console.log(`✅ ${wrongAnswersResult.savedCount}개의 오답 저장 완료`)
        }
      }

      return {
        success: true,
        diagnosisResultId: diagnosisResult.diagnosisResultId,
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : '알 수 없는 오류'
      console.error(`Onboarding submission attempt ${attempt} failed:`, error)

      // 마지막 시도가 아니면 잠시 대기 후 재시도
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt))
      }
    }
  }

  return {
    success: false,
    error: lastError || '온보딩 데이터 제출 실패',
  }
}

/**
 * 온보딩 데이터 검증
 */
export function validateOnboardingData(data: Partial<OnboardingData>): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!data.certificationType) {
    errors.push('자격증을 선택해주세요.')
  }

  // targetExamDate는 선택 사항이지만, 제공된 경우 유효성 검사
  if (data.targetExamDate) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const examDate = new Date(data.targetExamDate)
    examDate.setHours(0, 0, 0, 0)

    if (examDate < today) {
      errors.push('시험 날짜는 오늘 이후여야 합니다.')
    }

    const maxDate = new Date(today)
    maxDate.setFullYear(maxDate.getFullYear() + 1)
    if (examDate > maxDate) {
      errors.push('시험 날짜는 1년 이내여야 합니다.')
    }
  }

  if (!data.diagnosticAnswers || Object.keys(data.diagnosticAnswers).length === 0) {
    errors.push('진단 테스트를 완료해주세요.')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * 사용자 온보딩 완료 여부 확인
 */
export async function checkOnboardingComplete(
  userId: string
): Promise<{ completed: boolean; hasDiagnosis: boolean }> {
  try {
    // users 테이블에서 사용자 정보 확인 (maybeSingle 사용 - 데이터가 없어도 에러 없음)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('certification_type, target_exam_date')
      .eq('id', userId)
      .maybeSingle()

    // 에러가 있고 PGRST116(데이터 없음)이 아닌 경우만 throw
    if (userError && userError.code !== 'PGRST116') {
      console.error('Error fetching user data:', userError)
      // 에러가 있어도 계속 진행 (사용자가 없을 수 있음)
    }

    // target_exam_date는 선택 사항이므로 certification_type만 확인
    const hasCertification = !!userData?.certification_type

    // 진단 결과 확인 (maybeSingle 사용 - 데이터가 없어도 에러 없음)
    const { data: diagnosisData, error: diagnosisError } = await supabase
      .from('diagnosis_results')
      .select('id')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle()

    // 에러가 있고 PGRST116(데이터 없음)이 아닌 경우만 로그
    if (diagnosisError && diagnosisError.code !== 'PGRST116') {
      console.error('Error fetching diagnosis data:', diagnosisError)
    }

    return {
      completed: hasCertification && !!diagnosisData,
      hasDiagnosis: !!diagnosisData,
    }
  } catch (error) {
    console.error('Error checking onboarding status:', error)
    // 에러 발생 시 안전하게 false 반환
    return {
      completed: false,
      hasDiagnosis: false,
    }
  }
}



