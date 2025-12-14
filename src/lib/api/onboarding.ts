import { supabase } from '../supabaseClient'
import type { CertificationType } from '@/context'
import { getDiagnosticQuestions } from './questions'
import { calculateDiagnosticResults } from '../utils/diagnostic'

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
    } = {
      certification_type: certificationType,
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
      } = {
        id: userId,
        email: authUser.user.email || '',
        certification_type: certificationType,
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



