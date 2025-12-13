/**
 * 문제 일괄 업로드 API
 * Excel/CSV 파일을 파싱하여 데이터베이스에 저장
 */

import { supabase } from '../supabaseClient'
import type { QuestionInput } from './questions'
import { parseCSV, parseExcelFile, type ParseResult } from './excelParser'
import { saveQuestion, updateQuestion } from './questions'

export interface BatchUploadResult {
  success: boolean
  totalRows: number
  successCount: number
  updateCount?: number // 덮어쓰기로 업데이트된 개수
  insertCount?: number // 새로 추가된 개수
  errorCount: number
  errors: Array<{
    row: number
    question?: Partial<QuestionInput>
    error: string
  }>
  warnings: Array<{
    row: number
    message: string
  }>
}

/**
 * CSV 파일을 파싱하고 일괄 업로드
 * @param csvContent CSV 파일 내용
 * @param onProgress 진행률 콜백 (0-100)
 * @param overwrite 기존 문제 덮어쓰기 여부
 * @returns 업로드 결과
 */
export async function batchUploadFromCSV(
  csvContent: string,
  onProgress?: (progress: number) => void,
  overwrite: boolean = false
): Promise<BatchUploadResult> {
  // 1. CSV 파싱
  const parseResult = parseCSV(csvContent)
  
  if (!parseResult.success) {
    return {
      success: false,
      totalRows: parseResult.questions.length + parseResult.errors.length,
      successCount: 0,
      errorCount: parseResult.errors.length,
      errors: parseResult.errors.map((err) => ({
        row: err.row,
        error: err.message,
      })),
      warnings: parseResult.warnings,
    }
  }

  // 2. 문제 일괄 저장
  return await batchSaveQuestions(parseResult.questions, onProgress, parseResult.warnings, overwrite)
}

/**
 * Excel 파일을 파싱하고 일괄 업로드
 * @param file Excel 파일
 * @param onProgress 진행률 콜백 (0-100)
 * @param overwrite 기존 문제 덮어쓰기 여부
 * @returns 업로드 결과
 */
export async function batchUploadFromExcel(
  file: File,
  onProgress?: (progress: number) => void,
  overwrite: boolean = false
): Promise<BatchUploadResult> {
  // 1. Excel 파일 파싱
  const parseResult = await parseExcelFile(file)
  
  if (!parseResult.success) {
    return {
      success: false,
      totalRows: parseResult.questions.length + parseResult.errors.length,
      successCount: 0,
      errorCount: parseResult.errors.length,
      errors: parseResult.errors.map((err) => ({
        row: err.row,
        error: err.message,
      })),
      warnings: parseResult.warnings,
    }
  }

  // 2. 문제 일괄 저장
  return await batchSaveQuestions(parseResult.questions, onProgress, parseResult.warnings, overwrite)
}

/**
 * 기존 문제 찾기 (자격증 + 카테고리 + 문제제시문 또는 기출년도 + 기출회차 + 기출번호)
 */
async function findExistingQuestion(question: QuestionInput): Promise<string | null> {
  try {
    console.log('🔍 기존 문제 검색 시작:', {
      certificationType: question.certificationType,
      category: question.category,
      contentPreview: question.content.substring(0, 50),
      examYear: question.examYear,
      examSession: question.examSession,
      examNumber: question.examNumber,
    })
    
    // 1. 기출년도 + 기출회차 + 기출번호가 모두 있으면 우선 검색 (가장 정확)
    if (question.examYear && question.examSession && question.examNumber !== undefined) {
      // examSession을 숫자로 변환 (앞의 0 제거)
      const sessionStr = String(question.examSession).trim()
      const sessionNum = parseInt(sessionStr, 10)
      
      console.log('🔍 기출정보로 검색:', {
        examYear: question.examYear,
        examSession: question.examSession,
        sessionNum: sessionNum,
        examNumber: question.examNumber,
        certificationType: question.certificationType,
      })
      
      if (isNaN(sessionNum)) {
        console.warn('⚠️ 기출회차를 숫자로 변환할 수 없음:', sessionStr)
      } else {
        // 여러 형식으로 시도: "37", "037", "37" (숫자 비교)
        const sessionVariants = [
          String(sessionNum).padStart(2, '0'), // "37" -> "37", "1" -> "01"
          sessionStr, // 원본
          String(sessionNum), // 숫자만 "37"
        ]
        
        // 중복 제거
        const uniqueVariants = [...new Set(sessionVariants)]
        
        console.log('🔍 기출회차 변형 목록:', uniqueVariants)
        
        // 먼저 정확한 매칭 시도
        for (const sessionVariant of uniqueVariants) {
          const { data: data2, error: error2 } = await supabase
            .from('questions')
            .select('id, exam_session')
            .eq('certification_type', question.certificationType)
            .eq('exam_year', question.examYear)
            .eq('exam_session', sessionVariant)
            .eq('exam_number', question.examNumber)
            .limit(1)
            .maybeSingle()
          
          if (error2 && error2.code !== 'PGRST116') {
            console.error(`❌ 기존 문제 검색 중 오류 (기출정보, ${sessionVariant}):`, error2)
          }
          
          if (data2?.id) {
            console.log(`✅ 기출정보로 기존 문제 찾음 (회차: ${sessionVariant}, DB값: ${data2.exam_session}):`, data2.id)
            return data2.id
          }
        }
        
        // 정확한 매칭이 안 되면 숫자로 비교 (DB의 exam_session도 숫자로 변환해서 비교)
        // 하지만 Supabase에서는 숫자 비교를 직접 할 수 없으므로, 모든 가능한 형식으로 시도
        console.log('⚠️ 정확한 매칭 실패, 숫자 비교 시도')
        
        const { data: allMatches, error: allError } = await supabase
          .from('questions')
          .select('id, exam_session, exam_year, exam_number')
          .eq('certification_type', question.certificationType)
          .eq('exam_year', question.examYear)
          .eq('exam_number', question.examNumber)
        
        if (!allError && allMatches) {
          for (const match of allMatches) {
            const dbSessionNum = parseInt(String(match.exam_session || '').trim(), 10)
            if (!isNaN(dbSessionNum) && dbSessionNum === sessionNum) {
              console.log(`✅ 숫자 비교로 기존 문제 찾음 (회차: ${sessionNum}, DB값: ${match.exam_session}):`, match.id)
              return match.id
            }
          }
        }
      }
      
      console.log('⚠️ 기출정보로 기존 문제를 찾지 못함 (모든 형식 시도함)')
    }
    
    // 2. 자격증 + 카테고리 + 문제제시문으로 검색 (공백 정규화)
    // 문제제시문 정규화: 앞뒤 공백 제거, 연속 공백을 하나로, 줄바꿈 제거
    const normalizedContent = question.content
      .trim()
      .replace(/\s+/g, ' ') // 연속된 공백을 하나로
      .replace(/\n/g, ' ') // 줄바꿈을 공백으로
      .replace(/\r/g, '') // 캐리지 리턴 제거
      .trim()
    
    console.log('🔍 문제제시문으로 검색:', {
      certificationType: question.certificationType,
      category: question.category,
      contentLength: normalizedContent.length,
      contentPreview: normalizedContent.substring(0, 100),
    })
    
    // 먼저 정확한 매칭 시도
    let { data: data1, error: error1 } = await supabase
      .from('questions')
      .select('id, content')
      .eq('certification_type', question.certificationType)
      .eq('category', question.category)
      .eq('content', normalizedContent)
      .limit(10) // 여러 개일 수 있으므로 limit 증가
    
    if (error1 && error1.code !== 'PGRST116') {
      console.error('❌ 기존 문제 검색 중 오류:', error1)
    }
    
    if (data1 && data1.length > 0) {
      // 정확히 일치하는 첫 번째 문제 반환
      console.log(`✅ 문제제시문으로 기존 문제 찾음 (${data1.length}개):`, data1[0].id)
      return data1[0].id
    }
    
    // 정확한 매칭이 안 되면 DB의 모든 문제를 가져와서 정규화 후 비교
    console.log('⚠️ 정확한 매칭 실패, 정규화 비교 시도')
    const { data: allQuestions, error: allError } = await supabase
      .from('questions')
      .select('id, content')
      .eq('certification_type', question.certificationType)
      .eq('category', question.category)
      .limit(100) // 최대 100개까지 비교
    
    if (!allError && allQuestions) {
      for (const q of allQuestions) {
        const dbContentNormalized = (q.content || '')
          .trim()
          .replace(/\s+/g, ' ')
          .replace(/\n/g, ' ')
          .replace(/\r/g, '')
          .trim()
        
        if (dbContentNormalized === normalizedContent) {
          console.log('✅ 정규화 비교로 기존 문제 찾음:', q.id)
          return q.id
        }
      }
    }
    
    console.log('⚠️ 문제제시문으로 기존 문제를 찾지 못함')
    
    console.log('❌ 기존 문제를 찾지 못함 - 새로 추가됩니다')
    return null
  } catch (error) {
    console.error('❌ 기존 문제 검색 중 예외:', error)
    return null
  }
}

/**
 * 문제들을 배치로 저장
 * @param questions 저장할 문제 배열
 * @param onProgress 진행률 콜백
 * @param warnings 경고 메시지
 * @param overwrite 기존 문제 덮어쓰기 여부
 * @returns 업로드 결과
 */
async function batchSaveQuestions(
  questions: QuestionInput[],
  onProgress?: (progress: number) => void,
  warnings: ParseResult['warnings'] = [],
  overwrite: boolean = false
): Promise<BatchUploadResult> {
  const totalRows = questions.length
  let successCount = 0
  let updateCount = 0
  let insertCount = 0
  let skippedCount = 0 // 스킵된 문제 개수
  const errors: BatchUploadResult['errors'] = []
  
  // 배치 크기 (한 번에 처리할 문제 수)
  const BATCH_SIZE = 10

  console.log(`\n📊 ========== 일괄 저장 시작 ==========`)
  console.log(`  총 문제 수: ${totalRows}개`)
  console.log(`  덮어쓰기 모드: ${overwrite}`)
  console.log(`  배치 크기: ${BATCH_SIZE}개씩 처리`)
  console.log(`=========================================\n`)

  for (let i = 0; i < questions.length; i += BATCH_SIZE) {
    const batch = questions.slice(i, i + BATCH_SIZE)
    
    // 배치 병렬 처리
    const batchPromises = batch.map(async (question, batchIndex) => {
      const rowNumber = i + batchIndex + 1 // 실제 행 번호 (헤더 제외)
      
      try {
        // 덮어쓰기 모드인 경우 기존 문제 찾기
        if (overwrite) {
          const existingId = await findExistingQuestion(question)
          
          if (existingId) {
            console.log(`📝 행 ${rowNumber}: 기존 문제 업데이트 시작 (ID: ${existingId})`)
            console.log(`📝 행 ${rowNumber}: 업데이트할 기출정보:`, {
              examYear: question.examYear,
              examSession: question.examSession,
              examNumber: question.examNumber,
            })
            // 기존 문제 업데이트
            const result = await updateQuestion(existingId, question)
            
            if (result.error) {
              console.error(`❌ 행 ${rowNumber}: 업데이트 실패:`, result.error)
              errors.push({
                row: rowNumber,
                question,
                error: `업데이트 실패: ${result.error}`,
              })
              return false
            }
            
            console.log(`✅ 행 ${rowNumber}: 업데이트 성공 (ID: ${result.id})`)
            updateCount++
            successCount++
            return true
          } else {
            // 덮어쓰기 모드인데 기존 문제를 찾지 못한 경우
            console.warn(`⚠️ 행 ${rowNumber}: 덮어쓰기 모드이지만 기존 문제를 찾지 못함`)
            console.warn(`⚠️ 행 ${rowNumber}: 검색에 사용한 정보:`, {
              certificationType: question.certificationType,
              category: question.category,
              contentPreview: question.content.substring(0, 50),
              examYear: question.examYear,
              examSession: question.examSession,
              examNumber: question.examNumber,
            })
            // 덮어쓰기 모드에서는 기존 문제를 찾지 못하면 새로 추가
            skippedCount++
          }
        }
        
        // 새로 추가
        console.log(`➕ 행 ${rowNumber}: 새로 추가 시작`)
        const result = await saveQuestion(question)
        
        if (result.error) {
          console.error(`❌ 행 ${rowNumber}: 추가 실패:`, result.error)
          errors.push({
            row: rowNumber,
            question,
            error: result.error,
          })
          return false
        }
        
        console.log(`✅ 행 ${rowNumber}: 추가 성공 (ID: ${result.id})`)
        insertCount++
        successCount++
        return true
      } catch (error) {
        errors.push({
          row: rowNumber,
          question,
          error: error instanceof Error ? error.message : '알 수 없는 오류',
        })
        return false
      }
    })

    await Promise.all(batchPromises)

    // 진행률 업데이트
    if (onProgress) {
      const progress = Math.round(((i + batch.length) / totalRows) * 100)
      onProgress(Math.min(progress, 100))
    }
  }

  console.log('📊 일괄 업로드 결과:', {
    totalRows,
    successCount,
    updateCount,
    insertCount,
    skippedCount: overwrite ? skippedCount : undefined,
    errorCount: errors.length,
  })
  
  // 덮어쓰기 모드에서 스킵된 문제가 많으면 경고
  if (overwrite && skippedCount > 0) {
    console.warn(`⚠️ 덮어쓰기 모드에서 ${skippedCount}개 문제를 찾지 못해 새로 추가되었습니다.`)
  }
  
  return {
    success: errors.length === 0,
    totalRows,
    successCount,
    updateCount: overwrite ? updateCount : undefined,
    insertCount: overwrite ? insertCount : undefined,
    errorCount: errors.length,
    errors,
    warnings: warnings.map((w) => ({
      row: w.row,
      message: w.message,
    })),
  }
}

/**
 * 중복 문제 검증 (동일 자격증 + 카테고리 + 문제제시문)
 */
export async function checkDuplicateQuestions(
  questions: QuestionInput[]
): Promise<Array<{ question: QuestionInput; isDuplicate: boolean }>> {
  const results: Array<{ question: QuestionInput; isDuplicate: boolean }> = []

  for (const question of questions) {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('id')
        .eq('certification_type', question.certificationType)
        .eq('category', question.category)
        .eq('content', question.content)
        .limit(1)

      if (error) {
        console.error('중복 검사 중 오류:', error)
        results.push({ question, isDuplicate: false })
      } else {
        results.push({ question, isDuplicate: (data?.length || 0) > 0 })
      }
    } catch (error) {
      console.error('중복 검사 중 예외:', error)
      results.push({ question, isDuplicate: false })
    }
  }

  return results
}



