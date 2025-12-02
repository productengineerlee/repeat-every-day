import { supabase } from '../supabaseClient'
import type { Question } from '@/types'

export interface DiagnosticQuestion extends Question {
  category: string
}

/**
 * 임시 진단 문제 생성 (데이터베이스에 문제가 없을 때 사용)
 */
function generateMockDiagnosticQuestions(
  certificationType: string,
  count: number = 10
): DiagnosticQuestion[] {
  const categories = getCategoriesByCertification(certificationType)
  const questions: DiagnosticQuestion[] = []

  for (let i = 0; i < count; i++) {
    const category = categories[i % categories.length]
    const questionNumber = i + 1
    
    const mockOptions = getMockOptions(certificationType, category, questionNumber)
    
    questions.push({
      id: `mock-diagnostic-${certificationType}-${questionNumber}`,
      content: getMockQuestionContent(certificationType, category, questionNumber),
      options: mockOptions, // 배열로 반환 (AnswerOptions에서 A, B, C, D로 변환)
      correctAnswer: 'A', // 첫 번째 옵션이 정답 (A)
      explanation: getMockExplanation(certificationType, category, questionNumber),
      certificationType,
      category,
      difficulty: Math.floor(Math.random() * 3) + 2, // 2-4 난이도
      tags: [category],
      createdAt: new Date(),
    })
  }

  return questions
}

/**
 * 자격증 유형별 카테고리 목록
 */
function getCategoriesByCertification(certificationType: string): string[] {
  const categoryMap: Record<string, string[]> = {
    '정보처리기사': ['데이터베이스', '운영체제', '네트워크', '소프트웨어공학', '알고리즘'],
    'ADsP': ['데이터 이해', '데이터 분석 기획', '데이터 분석', '데이터 시각화'],
    'SQLD': ['SQL 기본', 'SQL 활용', 'SQL 최적화', '데이터 모델링'],
    '정보처리산업기사': ['데이터베이스', '운영체제', '네트워크', '프로그래밍'],
    '빅데이터분석기사': ['빅데이터 기초', '데이터 분석', '머신러닝', '데이터 시각화'],
  }

  return categoryMap[certificationType] || ['기본', '일반', '응용', '심화']
}

/**
 * 임시 문제 내용 생성
 */
function getMockQuestionContent(
  certificationType: string,
  category: string,
  number: number
): string {
  const templates: Record<string, Record<string, string[]>> = {
    '정보처리기사': {
      '데이터베이스': [
        '다음 중 관계형 데이터베이스의 특징이 아닌 것은?',
        '정규화의 목적은 무엇인가?',
        '트랜잭션의 ACID 속성 중 일관성(Consistency)의 의미는?',
        '인덱스(Index)의 주요 목적은 무엇인가?',
        '데이터베이스 무결성 제약조건 중 참조 무결성은 무엇인가?',
      ],
      '운영체제': [
        '프로세스와 스레드의 차이점은?',
        '교착상태(Deadlock)가 발생하는 조건은?',
        '가상 메모리(Virtual Memory)의 목적은?',
        '스케줄링 알고리즘 중 FCFS의 특징은?',
        '세마포어(Semaphore)의 주요 용도는?',
      ],
      '네트워크': [
        'OSI 7계층 모델에서 전송 계층의 역할은?',
        'TCP와 UDP의 차이점은?',
        'IP 주소와 MAC 주소의 차이점은?',
        '라우팅 프로토콜의 종류는?',
        '방화벽(Firewall)의 주요 기능은?',
      ],
    },
    'ADsP': {
      '데이터 이해': [
        '빅데이터의 3V 특징은 무엇인가?',
        '데이터 레이크와 데이터 웨어하우스의 차이점은?',
        '데이터 품질 관리의 중요성은?',
        '구조화 데이터와 비구조화 데이터의 차이점은?',
        '메타데이터의 역할은 무엇인가?',
      ],
      '데이터 분석': [
        '상관관계와 인과관계의 차이점은?',
        '회귀분석의 목적은 무엇인가?',
        '클러스터링 알고리즘의 종류는?',
        '과적합(Overfitting)을 방지하는 방법은?',
        '교차검증(Cross-validation)의 목적은?',
      ],
    },
    'SQLD': {
      'SQL 기본': [
        'SELECT 문의 기본 구조는?',
        'WHERE 절과 HAVING 절의 차이점은?',
        'JOIN의 종류와 특징은?',
        '서브쿼리(Subquery)의 사용 목적은?',
        '집계 함수의 종류는?',
      ],
      'SQL 활용': [
        '윈도우 함수(Window Function)의 특징은?',
        'CTE(Common Table Expression)의 장점은?',
        'UNION과 UNION ALL의 차이점은?',
        'EXISTS와 IN의 차이점은?',
        'CASE 문의 활용 방법은?',
      ],
    },
  }

  const certTemplates = templates[certificationType] || {}
  const categoryTemplates = certTemplates[category] || [
    `${category} 관련 문제 ${number}`,
    `${category} 영역의 핵심 개념은?`,
    `${category}에서 중요한 것은?`,
  ]

  return categoryTemplates[number % categoryTemplates.length] || `${category} 문제 ${number}`
}

/**
 * 임시 선택지 생성
 */
function getMockOptions(
  certificationType: string,
  category: string,
  number: number
): string[] {
  const baseOptions = [
    '첫 번째 선택지 (정답)',
    '두 번째 선택지',
    '세 번째 선택지',
    '네 번째 선택지',
    '다섯 번째 선택지',
  ]

  // 자격증 유형별로 더 구체적인 선택지 생성
  const specificOptions: Record<string, Record<string, string[][]>> = {
    '정보처리기사': {
      '데이터베이스': [
        ['데이터 중복을 최소화한다', '데이터 일관성을 유지한다', '데이터 무결성을 보장한다', '데이터 저장 공간을 증가시킨다', '데이터 접근 속도를 향상시킨다'],
        ['데이터 중복 제거', '데이터 저장 공간 증가', '데이터 접근 속도 저하', '데이터 복잡도 증가', '데이터 보안 강화'],
        ['트랜잭션 실행 중 데이터 일관성 유지', '트랜잭션의 원자성 보장', '트랜잭션의 격리성 보장', '트랜잭션의 지속성 보장', '트랜잭션의 동시성 제어'],
        ['데이터 검색 속도 향상', '데이터 저장 공간 절약', '데이터 중복 제거', '데이터 보안 강화', '데이터 백업 용이'],
        ['외래키를 통한 참조 관계 유지', '기본키의 유일성 보장', 'NOT NULL 제약조건', 'CHECK 제약조건', 'UNIQUE 제약조건'],
      ],
      '운영체제': [
        ['프로세스는 독립적인 메모리 공간을 가지지만 스레드는 공유한다', '프로세스는 공유 메모리를 사용하지만 스레드는 독립적이다', '프로세스와 스레드는 동일하다', '프로세스는 스레드보다 가볍다', '스레드는 프로세스보다 무겁다'],
        ['상호 배제, 점유 대기, 비선점, 순환 대기', '상호 배제, 점유 대기, 선점, 순환 대기', '상호 배제, 비점유 대기, 비선점, 순환 대기', '상호 배제, 점유 대기, 비선점, 비순환', '상호 배제, 비점유 대기, 선점, 비순환'],
        ['물리 메모리보다 큰 프로그램 실행 가능', '물리 메모리 크기 제한', '메모리 접근 속도 향상', 'CPU 사용률 감소', '디스크 I/O 감소'],
        ['먼저 도착한 작업을 먼저 처리', '짧은 작업을 먼저 처리', '우선순위가 높은 작업을 먼저 처리', '반응 시간이 짧은 작업을 먼저 처리', 'CPU 사용률이 높은 작업을 먼저 처리'],
        ['공유 자원 접근 제어', '프로세스 생성', '메모리 할당', '파일 시스템 관리', '네트워크 통신'],
      ],
    },
    'ADsP': {
      '데이터 이해': [
        ['Volume, Velocity, Variety', 'Volume, Value, Variety', 'Velocity, Value, Variety', 'Volume, Velocity, Veracity', 'Volume, Value, Veracity'],
        ['데이터 레이크는 원시 데이터 저장, 웨어하우스는 구조화된 데이터 저장', '데이터 레이크는 구조화된 데이터만 저장', '데이터 웨어하우스는 원시 데이터 저장', '데이터 레이크와 웨어하우스는 동일하다', '데이터 레이크는 분석 불가능한 데이터 저장'],
        ['신뢰할 수 있는 의사결정 지원', '데이터 저장 공간 절약', '데이터 처리 속도 향상', '데이터 보안 강화', '데이터 백업 용이'],
        ['구조화 데이터는 스키마가 있고, 비구조화 데이터는 스키마가 없다', '구조화 데이터는 스키마가 없고, 비구조화 데이터는 스키마가 있다', '구조화 데이터와 비구조화 데이터는 동일하다', '구조화 데이터는 텍스트만 포함', '비구조화 데이터는 숫자만 포함'],
        ['데이터에 대한 정보 제공', '데이터 저장 공간 절약', '데이터 처리 속도 향상', '데이터 보안 강화', '데이터 백업 용이'],
      ],
    },
    'SQLD': {
      'SQL 기본': [
        ['SELECT 컬럼 FROM 테이블 WHERE 조건', 'SELECT 컬럼 WHERE 조건 FROM 테이블', 'FROM 테이블 SELECT 컬럼 WHERE 조건', 'WHERE 조건 SELECT 컬럼 FROM 테이블', 'SELECT 컬럼 WHERE 조건'],
        ['WHERE는 행 필터링, HAVING은 그룹 필터링', 'WHERE는 그룹 필터링, HAVING은 행 필터링', 'WHERE와 HAVING은 동일하다', 'WHERE는 집계 함수만 사용 가능', 'HAVING은 집계 함수 사용 불가'],
        ['INNER JOIN, LEFT JOIN, RIGHT JOIN, FULL OUTER JOIN', 'INNER JOIN만 존재', 'LEFT JOIN만 존재', 'JOIN은 하나의 종류만 존재', 'JOIN은 사용하지 않는다'],
        ['복잡한 쿼리 단순화', '쿼리 속도 향상', '데이터 저장 공간 절약', '데이터 보안 강화', '데이터 백업 용이'],
        ['COUNT, SUM, AVG, MAX, MIN', 'COUNT, SUM, AVG만 존재', 'MAX, MIN만 존재', '집계 함수는 존재하지 않는다', 'SELECT만 집계 함수'],
      ],
    },
  }

  const certOptions = specificOptions[certificationType] || {}
  const categoryOptions = certOptions[category] || []
  
  if (categoryOptions.length > 0) {
    return categoryOptions[number % categoryOptions.length]
  }

  return baseOptions
}

/**
 * 임시 해설 생성
 */
function getMockExplanation(
  certificationType: string,
  category: string,
  number: number
): string {
  return `${category} 영역의 핵심 개념을 이해하는 것이 중요합니다. 이 문제는 ${certificationType} 자격증의 기본 지식을 확인하는 진단 문제입니다. 정답을 선택한 이유와 각 선택지의 의미를 다시 한번 확인해보세요.`
}

/**
 * Supabase 데이터를 Question 타입으로 변환
 */
function transformSupabaseQuestion(data: any): DiagnosticQuestion {
  // options가 JSONB이면 배열로 변환, 아니면 그대로 사용
  const options = Array.isArray(data.options) 
    ? data.options 
    : typeof data.options === 'string' 
      ? JSON.parse(data.options) 
      : []

  // correct_answer 또는 correctAnswer 처리
  const correctAnswer = data.correct_answer || data.correctAnswer || '1'

  return {
    id: data.id,
    content: data.content,
    options,
    correctAnswer,
    explanation: data.explanation || '',
    certificationType: data.certification_type || data.certificationType,
    category: data.category || '일반',
    difficulty: data.difficulty || 3,
    tags: Array.isArray(data.tags) ? data.tags : [],
    createdAt: data.created_at ? new Date(data.created_at) : new Date(),
  }
}

/**
 * 진단 테스트용 문제 가져오기
 * @param certificationType 자격증 유형
 * @param count 가져올 문제 수 (기본값: 10)
 */
export async function getDiagnosticQuestions(
  certificationType: string,
  count: number = 10
): Promise<DiagnosticQuestion[]> {
  try {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('certification_type', certificationType)
      .limit(count)

    if (error) {
      console.warn('⚠️ 데이터베이스에서 문제를 가져오는 중 에러 발생:', error)
      // 에러가 발생해도 임시 문제 생성
    }

    // 데이터베이스에서 문제를 가져왔고 개수가 충분한 경우
    if (data && data.length >= count) {
      return data.map(transformSupabaseQuestion)
    }

    // 데이터베이스에 문제가 없거나 부족한 경우 임시 문제 생성
    console.log(`📝 데이터베이스에 문제가 없어 임시 진단 문제 ${count}개를 생성합니다.`)
    const mockQuestions = generateMockDiagnosticQuestions(certificationType, count)
    
    // 데이터베이스에서 일부 문제를 가져온 경우, 부족한 만큼만 임시 문제 추가
    if (data && data.length > 0) {
      const transformedData = data.map(transformSupabaseQuestion)
      const needed = count - data.length
      const additionalMock = generateMockDiagnosticQuestions(certificationType, needed)
      return [...transformedData, ...additionalMock]
    }

    return mockQuestions
  } catch (error) {
    console.error('❌ Error fetching diagnostic questions:', error)
    // 에러 발생 시에도 임시 문제 반환
    console.log(`📝 에러 발생으로 인해 임시 진단 문제 ${count}개를 생성합니다.`)
    return generateMockDiagnosticQuestions(certificationType, count)
  }
}

/**
 * 일일 문제 세트 생성용 문제 ID 가져오기
 * @param userId 사용자 ID
 * @param certificationType 자격증 유형
 * @param count 가져올 문제 수 (기본값: 5)
 */
/**
 * 임시 문제를 데이터베이스에 생성하고 ID 반환
 */
async function createMockQuestionsInDatabase(
  certificationType: string,
  count: number = 5
): Promise<string[]> {
  const categories = getCategoriesByCertification(certificationType)
  const questionIds: string[] = []

  for (let i = 0; i < count; i++) {
    const category = categories[i % categories.length]
    const questionNumber = i + 1
    const mockOptions = getMockOptions(certificationType, category, questionNumber)

    try {
      const { data, error } = await supabase
        .from('questions')
        .insert({
          content: getMockQuestionContent(certificationType, category, questionNumber),
          options: mockOptions,
          correct_answer: 'A',
          explanation: getMockExplanation(certificationType, category, questionNumber),
          certification_type: certificationType,
          category,
          difficulty: Math.floor(Math.random() * 3) + 2,
          tags: [category],
        })
        .select('id')
        .single()

      if (error) {
        console.warn(`⚠️ 임시 문제 ${i + 1} 생성 실패:`, error)
        // 에러가 발생해도 계속 진행
        continue
      }

      if (data?.id) {
        questionIds.push(data.id)
      }
    } catch (error) {
      console.warn(`⚠️ 임시 문제 ${i + 1} 생성 중 예외 발생:`, error)
      // 에러가 발생해도 계속 진행
    }
  }

  return questionIds
}

export async function getDailyQuestionSet(
  userId: string,
  certificationType: string,
  count: number = 5
): Promise<string[]> {
  try {
    console.log(`🔍 getDailyQuestionSet 호출: userId=${userId}, certificationType=${certificationType}, count=${count}`)
    
    // 개인화된 일일 세트 생성 함수 사용 시도
    const { data: personalizedResult, error: personalizedError } = await supabase.rpc(
      'generate_personalized_daily_set',
      {
        user_uuid: userId,
        certification_type_param: certificationType,
        question_count: count,
      }
    )

    if (personalizedError) {
      console.log(`⚠️ 개인화 함수 에러 (무시하고 계속):`, personalizedError.message)
    } else if (personalizedResult && Array.isArray(personalizedResult) && personalizedResult.length > 0) {
      console.log(`✅ 개인화 함수에서 ${personalizedResult.length}개의 문제 ID를 반환했습니다.`)
      return personalizedResult
    }

    // 개인화 함수가 실패한 경우 기존 함수 사용
    const { data: functionResult, error: functionError } = await supabase.rpc(
      'get_daily_question_set',
      {
        user_uuid: userId,
        certification_type_param: certificationType,
        question_count: count,
      }
    )

    if (functionError) {
      console.log(`⚠️ 기본 함수 에러 (무시하고 계속):`, functionError.message)
    } else if (functionResult && Array.isArray(functionResult) && functionResult.length > 0) {
      console.log(`✅ 기본 함수에서 ${functionResult.length}개의 문제 ID를 반환했습니다.`)
      return functionResult
    }

    // 함수가 없거나 실패한 경우 직접 문제 가져오기 (fallback)
    console.log(`📝 RPC 함수가 없거나 실패했으므로 직접 DB 쿼리를 실행합니다.`)
    
    // 자격증별 대분류 번호 매핑
    const certificationToCategoryMap: Record<string, string> = {
      '정보처리기사': '1',
      '컴퓨터활용능력': '2',
      '빅데이터분석기사': '3',
      '경영정보시각화능력': '4',
      'ADsP': '5',
      'SQLD': '6',
    }
    
    // 자격증에 해당하는 카테고리 필터 적용
    let query = supabase
      .from('questions')
      .select('id, category, certification_type, content')
      .eq('certification_type', certificationType)
    
    // 자격증별 카테고리 필터링 (카테고리가 해당 자격증 번호로 시작하는 문제만)
    const categoryPrefix = certificationToCategoryMap[certificationType]
    if (categoryPrefix) {
      const categoryFilter = `${categoryPrefix}-%`
      console.log(`🔍 ${certificationType} 필터 적용: category LIKE '${categoryFilter}'`)
      query = query.like('category', categoryFilter)
    } else {
      console.log(`⚠️ ${certificationType}에 대한 카테고리 매핑이 없습니다. 필터링 없이 조회합니다.`)
    }
    
    const { data, error } = await query.limit(count)

    if (error) {
      console.error('❌ 데이터베이스에서 문제를 가져오는 중 에러 발생:', error)
      console.error('에러 코드:', error.code)
      console.error('에러 메시지:', error.message)
      console.error('에러 상세:', JSON.stringify(error, null, 2))
      // 에러 발생 시 빈 배열 반환 (임시 문제 생성하지 않음)
      return []
    }

    console.log(`📊 DB 쿼리 결과: certificationType=${certificationType}, count=${count}, found=${data?.length || 0}`)
    if (data && data.length > 0) {
      console.log(`📋 찾은 문제 ID들:`, data.map((q: any) => ({ 
        id: q.id, 
        category: q.category,
        contentPreview: q.content?.substring(0, 30) + '...'
      })))
    } else {
      // 문제가 없는 경우 더 자세한 정보 확인
      console.log(`🔍 문제가 없습니다. 전체 문제 수를 확인합니다...`)
      const { data: allData, error: allError } = await supabase
        .from('questions')
        .select('id, category, certification_type')
        .eq('certification_type', certificationType)
        .limit(10)
      
      if (allError) {
        console.error('❌ 전체 문제 조회 에러:', allError)
      } else {
        console.log(`📊 ${certificationType} 전체 문제 수: ${allData?.length || 0}개`)
        if (allData && allData.length > 0) {
          console.log(`📋 전체 문제 카테고리 샘플:`, allData.map((q: any) => q.category).slice(0, 5))
        }
      }
    }

    // 데이터베이스에서 문제를 가져온 경우
    if (data && data.length > 0) {
      // 요청한 개수만큼만 반환 (정확히 count개)
      const resultIds = data.slice(0, count).map((q) => q.id)
      console.log(`✅ ${resultIds.length}개의 문제를 반환합니다 (요청: ${count}개, 찾은 문제: ${data.length}개)`)
      return resultIds
    }

    // 데이터베이스에 문제가 없는 경우
    console.warn(`⚠️ 데이터베이스에 ${certificationType} 문제가 없습니다. (카테고리 필터: ${certificationType === '빅데이터분석기사' ? '3-%' : '없음'})`)
    return []
  } catch (error) {
    console.error('❌ Error fetching daily question set:', error)
    console.error('에러 상세:', JSON.stringify(error, null, 2))
    // 에러 발생 시 빈 배열 반환 (임시 문제 생성하지 않음)
    return []
  }
}

/**
 * 기출문제만 가져오는 함수 (examSession이 있는 문제만)
 */
export async function getExamQuestionSet(
  userId: string,
  certificationType: string,
  count: number = 5
): Promise<string[]> {
  try {
    console.log(`🔍 getExamQuestionSet 호출: userId=${userId}, certificationType=${certificationType}, count=${count}`)
    
    // 자격증별 대분류 번호 매핑
    const certificationToCategoryMap: Record<string, string> = {
      '정보처리기사': '1',
      '컴퓨터활용능력': '2',
      '빅데이터분석기사': '3',
      '경영정보시각화능력': '4',
      'ADsP': '5',
      'SQLD': '6',
    }
    
    // 자격증에 해당하는 카테고리 필터 적용 + 기출문제만 (exam_session이 null이 아닌 문제)
    let query = supabase
      .from('questions')
      .select('id, category, certification_type, exam_session')
      .eq('certification_type', certificationType)
    
    // 자격증별 카테고리 필터링 (카테고리가 해당 자격증 번호로 시작하는 문제만)
    const categoryPrefix = certificationToCategoryMap[certificationType]
    if (categoryPrefix) {
      const categoryFilter = `${categoryPrefix}-%`
      console.log(`🔍 ${certificationType} 기출문제 필터 적용: category LIKE '${categoryFilter}'`)
      query = query.like('category', categoryFilter)
    } else {
      console.log(`⚠️ ${certificationType}에 대한 카테고리 매핑이 없습니다. 필터링 없이 조회합니다.`)
    }
    
    // exam_session 필터링 시도 (컬럼이 없을 수 있으므로)
    try {
      query = query.not('exam_session', 'is', null) // exam_session이 null이 아닌 문제만
      console.log(`🔍 exam_session 필터 추가: exam_session IS NOT NULL`)
    } catch (filterError) {
      console.log(`⚠️ exam_session 필터 추가 실패 (컬럼이 없을 수 있음):`, filterError)
    }
    
    // 기출번호 순으로 정렬 시도 (컬럼이 없을 수 있으므로)
    try {
      query = query.order('exam_number', { ascending: true })
    } catch (orderError) {
      console.log(`⚠️ exam_number 정렬 실패 (컬럼이 없을 수 있음):`, orderError)
      // 정렬 실패 시 created_at으로 정렬
      query = query.order('created_at', { ascending: false })
    }
    
    const { data, error } = await query.limit(count)

    if (error) {
      console.error('❌ 데이터베이스에서 기출문제를 가져오는 중 에러 발생:', error)
      console.error('에러 코드:', error.code)
      console.error('에러 메시지:', error.message)
      
      // exam_session 또는 exam_number 컬럼이 없는 경우, 일반 문제를 가져오도록 fallback
      if (error.message?.includes('exam_session') || error.message?.includes('exam_number') || error.code === '42703') {
        console.log(`⚠️ exam_session 또는 exam_number 컬럼이 없어 일반 문제를 가져옵니다.`)
        // 일반 문제 가져오기 함수 호출
        return await getDailyQuestionSet(userId, certificationType, count)
      }
      
      // 에러 발생 시 빈 배열 반환
      return []
    }

    console.log(`📊 기출문제 쿼리 결과: certificationType=${certificationType}, count=${count}, found=${data?.length || 0}`)
    if (data && data.length > 0) {
      console.log(`📋 찾은 기출문제 ID들:`, data.map((q: any) => ({ 
        id: q.id, 
        category: q.category,
        examSession: q.exam_session
      })))
    }

    if (data && data.length > 0) {
      return data.map((q) => q.id)
    }

    // 기출문제가 없으면 일반 문제를 가져오도록 fallback
    console.log(`⚠️ 기출문제가 없어 일반 문제를 가져옵니다.`)
    return await getDailyQuestionSet(userId, certificationType, count)
  } catch (error) {
    console.error('❌ Error fetching exam question set:', error)
    // 예외 발생 시 일반 문제를 가져오도록 fallback
    try {
      return await getDailyQuestionSet(userId, certificationType, count)
    } catch (fallbackError) {
      console.error('❌ Fallback도 실패:', fallbackError)
      return []
    }
  }
}

/**
 * 관리자용 문제 입력 인터페이스
 */
export interface QuestionInput {
  content: string // 문제 제시문
  subContent?: string // 문제 서브 제시문
  subContentImageUrl?: string // 서브 제시문 이미지 URL
  options: string[] // 선택지 배열 (4개 또는 5개)
  correctAnswer: string // 정답 (A, B, C, D, E)
  explanation: string // 해설
  certificationType: string // 자격증 유형
  category: string // 카테고리
  difficulty: '상' | '중' | '하' // 난이도
  tags: string[] // 레이블/태그 배열
  frequency?: number // 출제빈도
  examSession?: string // 기출회차 (예: 2024년 1회차)
  examNumber?: number // 기출번호
}

/**
 * 관리자용 문제 목록 조회 인터페이스
 */
export interface QuestionListItem {
  id: string
  content: string // 미리보기 (50자 제한)
  certificationType: string
  category: string
  difficulty: number
  createdAt: string
  optionsCount: number
}

/**
 * 관리자용 문제 상세 인터페이스
 */
export interface QuestionDetail {
  id: string
  content: string
  subContent?: string
  subContentImageUrl?: string
  options: string[]
  correctAnswer: string // A, B, C, D, E
  explanation: string
  certificationType: string
  category: string
  difficulty: number // 1-5 (상=5, 중=3, 하=1)
  tags: string[]
  frequency?: number
  examSession?: string // 기출회차
  examNumber?: number // 기출번호
  createdAt: string
}

/**
 * 관리자용 문제 목록 조회
 */
export async function getQuestionsList(options?: {
  certificationType?: string
  category?: string
  search?: string
  examSession?: string // 기출회차 필터
  limit?: number
  offset?: number
  orderBy?: 'created_at' | 'category' | 'difficulty' | 'exam_number'
  order?: 'asc' | 'desc'
}): Promise<{
  questions: QuestionListItem[]
  total: number
  error?: string
}> {
  try {
    const {
      certificationType,
      category,
      search,
      examSession,
      limit = 50,
      offset = 0,
      orderBy = 'created_at',
      order = 'desc',
    } = options || {}

    let query = supabase.from('questions').select('*', { count: 'exact' })

    // 필터링
    if (certificationType) {
      query = query.eq('certification_type', certificationType)
    }
    if (category) {
      query = query.like('category', `${category}%`)
    }
    if (search) {
      query = query.ilike('content', `%${search}%`)
    }
    if (examSession) {
      query = query.eq('exam_session', examSession)
    }

    // 정렬: 기출회차가 선택된 경우 기출번호로 정렬, 아니면 지정된 정렬 사용
    if (examSession && orderBy === 'created_at') {
      // 기출회차가 선택되면 기본적으로 기출번호 오름차순으로 정렬
      query = query.order('exam_number', { ascending: true })
    } else {
      query = query.order(orderBy, { ascending: order === 'asc' })
    }

    // 페이지네이션
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('문제 목록 조회 실패:', error)
      return {
        questions: [],
        total: 0,
        error: error.message,
      }
    }

    const questions: QuestionListItem[] =
      data?.map((q: any) => ({
        id: q.id,
        content: q.content?.substring(0, 50) + (q.content?.length > 50 ? '...' : ''),
        certificationType: q.certification_type,
        category: q.category,
        difficulty: q.difficulty,
        createdAt: q.created_at,
        optionsCount: Array.isArray(q.options) ? q.options.length : 0,
        examSession: q.exam_session,
        examNumber: q.exam_number,
      })) || []

    return {
      questions,
      total: count || 0,
    }
  } catch (error) {
    console.error('문제 목록 조회 중 예외 발생:', error)
    return {
      questions: [],
      total: 0,
      error: error instanceof Error ? error.message : '문제 목록 조회 중 알 수 없는 오류가 발생했습니다.',
    }
  }
}

/**
 * 관리자용 문제 상세 조회
 */
export async function getQuestionById(questionId: string): Promise<{
  question: QuestionDetail | null
  error?: string
}> {
  try {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('id', questionId)
      .single()

    if (error) {
      console.error('문제 상세 조회 실패:', error)
      return {
        question: null,
        error: error.message,
      }
    }

    if (!data) {
      return {
        question: null,
        error: '문제를 찾을 수 없습니다.',
      }
    }

    // options 처리
    let options: string[] = []
    if (Array.isArray(data.options)) {
      options = data.options
    } else if (typeof data.options === 'string') {
      try {
        options = JSON.parse(data.options)
      } catch (e) {
        console.warn('options 파싱 실패:', e)
        options = []
      }
    }

    // 난이도를 '상', '중', '하'로 변환 (표시용)
    const difficultyToText: Record<number, '상' | '중' | '하'> = {
      5: '상',
      3: '중',
      1: '하',
    }
    // 숫자를 텍스트로 변환 (없으면 가장 가까운 값)
    const difficultyText = difficultyToText[data.difficulty] || 
      (data.difficulty >= 4 ? '상' : data.difficulty >= 2 ? '중' : '하')

    const question: QuestionDetail = {
      id: data.id,
      content: data.content,
      subContent: data.sub_content,
      subContentImageUrl: data.sub_content_image_url,
      options,
      correctAnswer: data.correct_answer,
      explanation: data.explanation,
      certificationType: data.certification_type,
      category: data.category,
      difficulty: data.difficulty,
      tags: Array.isArray(data.tags) ? data.tags : [],
      frequency: data.frequency,
      examSession: data.exam_session,
      examNumber: data.exam_number,
      createdAt: data.created_at,
    }

    return {
      question,
    }
  } catch (error) {
    console.error('문제 상세 조회 중 예외 발생:', error)
    return {
      question: null,
      error: error instanceof Error ? error.message : '문제 상세 조회 중 알 수 없는 오류가 발생했습니다.',
    }
  }
}

/**
 * 관리자용 문제 수정
 */
export async function updateQuestion(
  questionId: string,
  question: QuestionInput
): Promise<{ id: string | null; error: string | null }> {
  try {
    // 난이도를 숫자로 변환 (상=5, 중=3, 하=1)
    const difficultyMap: Record<string, number> = {
      '상': 5,
      '중': 3,
      '하': 1,
    }
    const difficultyNumber = difficultyMap[question.difficulty] || 3
    console.log(`📊 난이도 변환: "${question.difficulty}" → ${difficultyNumber}`)

    // 정답 검증
    const answerIndex = question.correctAnswer.charCodeAt(0) - 65 // A=0, B=1, C=2, D=3, E=4
    if (answerIndex < 0 || answerIndex >= question.options.length) {
      return {
        id: null,
        error: `정답이 선택지 범위를 벗어났습니다. 선택지 개수: ${question.options.length}, 정답: ${question.correctAnswer}`,
      }
    }

    // 업데이트 데이터 준비
    const updateData: any = {
      content: question.content,
      options: question.options,
      correct_answer: question.correctAnswer,
      explanation: question.explanation,
      certification_type: question.certificationType,
      category: question.category,
      difficulty: difficultyNumber,
      tags: question.tags || [],
    }

    // 서브 제시문이 있으면 추가 (없으면 필드 자체를 포함하지 않음)
    if (question.subContent) {
      updateData.sub_content = question.subContent
    }

    // 서브 제시문 이미지가 있으면 추가 (없으면 필드 자체를 포함하지 않음)
    if (question.subContentImageUrl) {
      updateData.sub_content_image_url = question.subContentImageUrl
    }

    // 출제빈도가 있으면 추가 (없으면 필드 자체를 포함하지 않음)
    if (question.frequency !== undefined && question.frequency !== null) {
      updateData.frequency = question.frequency
    }

    // 기출회차가 있으면 추가 (빈 문자열이 아닐 때만)
    if (question.examSession && question.examSession.trim() !== '') {
      updateData.exam_session = question.examSession.trim()
    } else {
      // 빈 문자열이거나 undefined/null이면 null로 설정 (기존 값 제거)
      updateData.exam_session = null
    }

    // 기출번호가 있으면 추가 (없으면 null로 설정)
    if (question.examNumber !== undefined && question.examNumber !== null) {
      updateData.exam_number = question.examNumber
    } else {
      // undefined/null이면 null로 설정 (기존 값 제거)
      updateData.exam_number = null
    }

    // 데이터베이스에 업데이트
    console.log('📝 업데이트 데이터:', JSON.stringify(updateData, null, 2))
    
    const { data: updateResult, error: updateError } = await supabase
      .from('questions')
      .update(updateData)
      .eq('id', questionId)
      .select('id, exam_session, exam_number')
      .maybeSingle()

    console.log('📊 업데이트 결과:', { updateResult, updateError })

    if (updateError) {
      console.error('문제 수정 오류:', updateError)
      console.error('오류 상세:', {
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
        code: updateError.code,
      })

      // 406 에러는 보통 RLS 정책이나 권한 문제
      if (updateError.code === 'PGRST116' || updateError.message?.includes('406') || updateError.message?.includes('Not Acceptable')) {
        return {
          id: null,
          error: `업데이트 권한 오류 (406): ${updateError.message}. RLS 정책을 확인하세요.`,
        }
      }

      // RLS 정책 에러 체크
      if (updateError.message?.includes('RLS') || updateError.message?.includes('policy') || updateError.message?.includes('permission') || updateError.message?.includes('row-level security')) {
        return {
          id: null,
          error: `권한 오류: ${updateError.message}. 관리자 권한이 필요합니다. RLS 정책을 확인하세요.`,
        }
      }

      // 컬럼이 없는 경우 재시도 (해당 컬럼 제외)
      const missingColumns = []
      if (updateError.message?.includes('frequency') || updateError.message?.includes("Could not find the 'frequency' column") || updateError.code === '42703') {
        if (updateError.message?.includes('frequency')) {
          missingColumns.push('frequency')
        }
      }
      if (updateError.message?.includes('exam_session') || updateError.message?.includes("Could not find the 'exam_session' column") || updateError.code === '42703') {
        if (updateError.message?.includes('exam_session')) {
          missingColumns.push('exam_session')
        }
      }
      if (updateError.message?.includes('exam_number') || updateError.message?.includes("Could not find the 'exam_number' column") || updateError.code === '42703') {
        if (updateError.message?.includes('exam_number')) {
          missingColumns.push('exam_number')
        }
      }

      if (missingColumns.length > 0) {
        console.log(`${missingColumns.join(', ')} 컬럼이 없어 재시도합니다 (해당 컬럼 제외)`)
        const retryData: any = { ...updateData }
        missingColumns.forEach(col => {
          if (col === 'frequency') delete retryData.frequency
          if (col === 'exam_session') delete retryData.exam_session
          if (col === 'exam_number') delete retryData.exam_number
        })
        
        const { error: retryError } = await supabase
          .from('questions')
          .update(retryData)
          .eq('id', questionId)
        
        if (retryError) {
          console.error('재시도 후 오류:', retryError)
          
          // "Cannot coerce" 에러는 업데이트는 성공했지만 반환된 데이터가 없거나 여러 개일 때 발생
          if (retryError.message?.includes('Cannot coerce') || retryError.message?.includes('single JSON object')) {
            console.log('재시도: 업데이트는 성공했지만 반환 데이터가 없습니다. questionId를 반환합니다.')
            return {
              id: questionId,
              error: null,
            }
          }
          
          // 재시도 후에도 컬럼 에러가 발생하면 모든 선택적 컬럼 제거하고 재시도
          const retryMissingColumns = []
          if (retryError.message?.includes('frequency') || retryError.message?.includes("Could not find the 'frequency' column")) {
            retryMissingColumns.push('frequency')
          }
          if (retryError.message?.includes('exam_session') || retryError.message?.includes("Could not find the 'exam_session' column")) {
            retryMissingColumns.push('exam_session')
          }
          if (retryError.message?.includes('exam_number') || retryError.message?.includes("Could not find the 'exam_number' column")) {
            retryMissingColumns.push('exam_number')
          }
          
          if (retryMissingColumns.length > 0) {
            console.log(`재시도 후에도 ${retryMissingColumns.join(', ')} 컬럼이 없어 모든 선택적 컬럼을 제거하고 재시도합니다`)
            const finalRetryData: any = { ...retryData }
            // 모든 선택적 컬럼 제거
            delete finalRetryData.frequency
            delete finalRetryData.exam_session
            delete finalRetryData.exam_number
            delete finalRetryData.sub_content
            delete finalRetryData.sub_content_image_url
            
            const { data: finalRetryResult, error: finalRetryError } = await supabase
              .from('questions')
              .update(finalRetryData)
              .eq('id', questionId)
              .select('id')
              .maybeSingle()
            
            if (finalRetryError) {
              console.error('최종 재시도 후 오류:', finalRetryError)
              
              // "Cannot coerce" 에러는 업데이트는 성공했지만 반환된 데이터가 없거나 여러 개일 때 발생
              if (finalRetryError.message?.includes('Cannot coerce') || finalRetryError.message?.includes('single JSON object')) {
                console.log('최종 재시도: 업데이트는 성공했지만 반환 데이터가 없습니다. questionId를 반환합니다.')
                return {
                  id: questionId,
                  error: null,
                }
              }
              
              // RLS 정책 에러 체크
              if (finalRetryError.message?.includes('RLS') || finalRetryError.message?.includes('policy') || finalRetryError.message?.includes('permission')) {
                return {
                  id: null,
                  error: `권한 오류: ${finalRetryError.message}. 관리자 권한이 필요합니다.`,
                }
              }
              return {
                id: null,
                error: finalRetryError.message || '문제 수정에 실패했습니다.',
              }
            }
            
            console.log('최종 재시도 성공:', questionId)
            return {
              id: questionId,
              error: null,
            }
          }
          
          // RLS 정책 에러 체크
          if (retryError.message?.includes('RLS') || retryError.message?.includes('policy') || retryError.message?.includes('permission')) {
            return {
              id: null,
              error: `권한 오류: ${retryError.message}. 관리자 권한이 필요합니다.`,
            }
          }
          return {
            id: null,
            error: retryError.message || '문제 수정에 실패했습니다.',
          }
        }
        
        console.log('✅ 재시도 성공:', retryResult)
        return {
          id: retryResult?.id || questionId,
          error: null,
        }
      }

      // RLS 정책 에러 체크
      if (updateError.message?.includes('RLS') || updateError.message?.includes('policy') || updateError.message?.includes('permission') || updateError.message?.includes('row-level security')) {
        return {
          id: null,
          error: `권한 오류: ${updateError.message}. 관리자 권한이 필요합니다. RLS 정책을 확인하세요.`,
        }
      }

      return {
        id: null,
        error: updateError.message || '문제 수정에 실패했습니다.',
      }
    }

    // 업데이트 성공 확인
    if (updateResult) {
      console.log('✅ 업데이트 성공:', {
        id: updateResult.id,
        exam_session: updateResult.exam_session,
        exam_number: updateResult.exam_number,
      })
      return {
        id: updateResult.id || questionId,
        error: null,
      }
    } else {
      // 업데이트 결과가 없지만 에러도 없는 경우, 실제로 업데이트되었는지 확인
      console.log('⚠️ 업데이트 결과가 없습니다. 데이터 확인 중...')
      const { data: verifyData, error: verifyError } = await supabase
        .from('questions')
        .select('id, exam_session, exam_number')
        .eq('id', questionId)
        .maybeSingle()
      
      if (verifyError) {
        console.error('데이터 확인 오류:', verifyError)
        return {
          id: null,
          error: `업데이트 후 데이터 확인 실패: ${verifyError.message}`,
        }
      }
      
      console.log('📋 현재 저장된 데이터:', verifyData)
      
      // exam_session과 exam_number가 예상대로 저장되었는지 확인
      if (updateData.exam_session !== undefined && verifyData?.exam_session !== updateData.exam_session) {
        console.warn('⚠️ exam_session이 예상과 다릅니다:', {
          예상: updateData.exam_session,
          실제: verifyData?.exam_session,
        })
      }
      
      if (updateData.exam_number !== undefined && verifyData?.exam_number !== updateData.exam_number) {
        console.warn('⚠️ exam_number가 예상과 다릅니다:', {
          예상: updateData.exam_number,
          실제: verifyData?.exam_number,
        })
      }
      
      return {
        id: questionId,
        error: null,
      }
    }
  } catch (error) {
    console.error('문제 수정 중 예외 발생:', error)
    return {
      id: null,
      error: error instanceof Error ? error.message : '문제 수정 중 알 수 없는 오류가 발생했습니다.',
    }
  }
}

/**
 * 관리자용 문제 삭제
 */
export async function deleteQuestion(questionId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('questions')
      .delete()
      .eq('id', questionId)

    if (error) {
      console.error('문제 삭제 오류:', error)
      
      // RLS 정책 에러 체크
      if (error.message?.includes('RLS') || error.message?.includes('policy') || error.message?.includes('permission')) {
        return {
          success: false,
          error: `권한 오류: ${error.message}. 관리자 권한이 필요합니다.`,
        }
      }

      return {
        success: false,
        error: error.message || '문제 삭제에 실패했습니다.',
      }
    }

    return {
      success: true,
    }
  } catch (error) {
    console.error('문제 삭제 중 예외 발생:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '문제 삭제 중 알 수 없는 오류가 발생했습니다.',
    }
  }
}

/**
 * 관리자용 문제 저장
 * @param question 입력할 문제 데이터
 * @returns 생성된 문제 ID
 */
export async function saveQuestion(question: QuestionInput): Promise<{ id: string | null; error: string | null }> {
  try {
    // 난이도를 숫자로 변환 (상=5, 중=3, 하=1)
    const difficultyMap: Record<string, number> = {
      '상': 5,
      '중': 3,
      '하': 1,
    }
    const difficultyNumber = difficultyMap[question.difficulty] || 3
    console.log(`📊 난이도 변환: "${question.difficulty}" → ${difficultyNumber}`)

    // 정답 검증 (선택지 개수와 일치하는지 확인)
    const answerIndex = question.correctAnswer.charCodeAt(0) - 65 // A=0, B=1, C=2, D=3, E=4
    if (answerIndex < 0 || answerIndex >= question.options.length) {
      return {
        id: null,
        error: `정답이 선택지 범위를 벗어났습니다. 선택지 개수: ${question.options.length}, 정답: ${question.correctAnswer}`,
      }
    }

    // 문제 데이터 준비
    const questionData: any = {
      content: question.content,
      options: question.options,
      correct_answer: question.correctAnswer,
      explanation: question.explanation,
      certification_type: question.certificationType,
      category: question.category,
      difficulty: difficultyNumber, // 숫자로 저장 (상=5, 중=3, 하=1)
      tags: question.tags || [],
    }

    // 서브 제시문이 있으면 추가
    if (question.subContent) {
      questionData.sub_content = question.subContent
    }

    // 서브 제시문 이미지가 있으면 추가
    // 주의: sub_content_image_url 컬럼이 데이터베이스에 없으면 이 필드는 저장되지 않습니다
    // 컬럼 추가: ALTER TABLE questions ADD COLUMN sub_content_image_url TEXT;
    if (question.subContentImageUrl) {
      questionData.sub_content_image_url = question.subContentImageUrl
    }

    // 출제빈도가 있으면 추가 (데이터베이스에 컬럼이 있는 경우에만)
    // 주의: frequency 컬럼이 데이터베이스에 없으면 이 필드는 저장되지 않습니다
    // 데이터베이스에 컬럼을 추가하려면: ALTER TABLE questions ADD COLUMN frequency INTEGER;
    if (question.frequency !== undefined && question.frequency !== null) {
      // frequency 컬럼이 있는지 확인할 수 없으므로, 에러 발생 시 제거
      // 일단 포함시키고, 에러가 발생하면 제거하는 방식으로 처리
      questionData.frequency = question.frequency
    }

    // 기출회차가 있으면 추가
    if (question.examSession) {
      questionData.exam_session = question.examSession
    }

    // 기출번호가 있으면 추가
    if (question.examNumber !== undefined && question.examNumber !== null) {
      questionData.exam_number = question.examNumber
    }

    // 현재 사용자 확인
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return {
        id: null,
        error: '로그인이 필요합니다.',
      }
    }

    console.log('문제 데이터 저장 시도:', {
      questionData,
      userId: user.id,
      userEmail: user.email,
    })
    
    // 데이터베이스에 저장
    const { data, error } = await supabase
      .from('questions')
      .insert(questionData)
      .select('id')
      .single()

    if (error) {
      console.error('문제 저장 오류:', error)
      console.error('오류 상세:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      })
      
      // 컬럼이 없는 경우 재시도 (해당 컬럼 제외)
      const missingColumns = []
      if (error.message?.includes('frequency') || error.message?.includes("Could not find the 'frequency' column")) {
        missingColumns.push('frequency')
      }
      if (error.message?.includes('exam_session') || error.message?.includes("Could not find the 'exam_session' column")) {
        missingColumns.push('exam_session')
      }
      if (error.message?.includes('exam_number') || error.message?.includes("Could not find the 'exam_number' column")) {
        missingColumns.push('exam_number')
      }

      if (missingColumns.length > 0) {
        console.log(`${missingColumns.join(', ')} 컬럼이 없어 재시도합니다 (해당 컬럼 제외)`)
        const retryData: any = { ...questionData }
        missingColumns.forEach(col => {
          if (col === 'frequency') delete retryData.frequency
          if (col === 'exam_session') delete retryData.exam_session
          if (col === 'exam_number') delete retryData.exam_number
        })
        
        const { data: retryResult, error: retryError } = await supabase
          .from('questions')
          .insert(retryData)
          .select('id')
          .single()
        
        if (retryError) {
          console.error('재시도 후 오류:', retryError)
          
          // 재시도 후에도 컬럼 에러가 발생하면 모든 선택적 컬럼 제거하고 재시도
          const retryMissingColumns = []
          if (retryError.message?.includes('frequency') || retryError.message?.includes("Could not find the 'frequency' column")) {
            retryMissingColumns.push('frequency')
          }
          if (retryError.message?.includes('exam_session') || retryError.message?.includes("Could not find the 'exam_session' column")) {
            retryMissingColumns.push('exam_session')
          }
          if (retryError.message?.includes('exam_number') || retryError.message?.includes("Could not find the 'exam_number' column")) {
            retryMissingColumns.push('exam_number')
          }
          
          if (retryMissingColumns.length > 0) {
            console.log(`재시도 후에도 ${retryMissingColumns.join(', ')} 컬럼이 없어 모든 선택적 컬럼을 제거하고 재시도합니다`)
            const finalRetryData: any = { ...retryData }
            // 모든 선택적 컬럼 제거
            delete finalRetryData.frequency
            delete finalRetryData.exam_session
            delete finalRetryData.exam_number
            delete finalRetryData.sub_content
            delete finalRetryData.sub_content_image_url
            
            const { data: finalRetryResult, error: finalRetryError } = await supabase
              .from('questions')
              .insert(finalRetryData)
              .select('id')
              .single()
            
            if (finalRetryError) {
              console.error('최종 재시도 후 오류:', finalRetryError)
              // RLS 정책 오류인 경우 더 명확한 메시지 제공
              if (finalRetryError.code === '42501' || finalRetryError.message?.includes('permission') || finalRetryError.message?.includes('policy')) {
                return {
                  id: null,
                  error: '권한이 없습니다. 관리자 권한이 필요하거나 데이터베이스 RLS 정책을 확인해주세요.',
                }
              }
              return {
                id: null,
                error: finalRetryError.message || '문제 저장에 실패했습니다.',
              }
            }
            
            console.log('최종 재시도 성공:', finalRetryResult?.id)
            return {
              id: finalRetryResult?.id || null,
              error: null,
            }
          }
          
          // RLS 정책 오류인 경우 더 명확한 메시지 제공
          if (retryError.code === '42501' || retryError.message?.includes('permission') || retryError.message?.includes('policy')) {
            return {
              id: null,
              error: '권한이 없습니다. 관리자 권한이 필요하거나 데이터베이스 RLS 정책을 확인해주세요.',
            }
          }
          
          return {
            id: null,
            error: retryError.message || '문제 저장에 실패했습니다.',
          }
        }
        
        console.log('재시도 성공:', retryResult?.id)
        return {
          id: retryResult?.id || null,
          error: null,
        }
      }
      
      // RLS 정책 오류인 경우 더 명확한 메시지 제공
      if (error.code === '42501' || error.message?.includes('permission') || error.message?.includes('policy')) {
        return {
          id: null,
          error: '권한이 없습니다. 관리자 권한이 필요하거나 데이터베이스 RLS 정책을 확인해주세요.',
        }
      }
      
      return {
        id: null,
        error: error.message || '문제 저장에 실패했습니다.',
      }
    }

    console.log('문제 저장 성공:', data?.id)
    return {
      id: data?.id || null,
      error: null,
    }
  } catch (error) {
    console.error('문제 저장 중 예외 발생:', error)
    return {
      id: null,
      error: error instanceof Error ? error.message : '문제 저장 중 알 수 없는 오류가 발생했습니다.',
    }
  }
}

