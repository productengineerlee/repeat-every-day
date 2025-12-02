import { supabase } from '../supabaseClient'
import type { Question } from '@/types'

/**
 * 임시 문제 생성 (클라이언트 측에서만 사용)
 */
function createTemporaryQuestion(
  questionId: string,
  index: number,
  certificationType: string = '정보처리기사'
): Question {
  const categories = getCategoriesForCertification(certificationType)
  const category = categories[index % categories.length]
  const questionNumber = index + 1

  const options = getMockOptionsForCategory(certificationType, category, questionNumber)
  const content = getMockContentForCategory(certificationType, category, questionNumber)
  const explanation = getMockExplanationForCategory(certificationType, category, questionNumber)

  return {
    id: questionId,
    content,
    options,
    correctAnswer: 'A',
    explanation,
    certificationType,
    category,
    difficulty: Math.floor(Math.random() * 3) + 2,
    tags: [category],
    createdAt: new Date(),
  }
}

/**
 * 자격증 유형별 카테고리 목록
 */
function getCategoriesForCertification(certificationType: string): string[] {
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
function getMockContentForCategory(
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
    },
    'SQLD': {
      'SQL 기본': [
        'SELECT 문의 기본 구조는?',
        'WHERE 절과 HAVING 절의 차이점은?',
        'JOIN의 종류와 특징은?',
        '서브쿼리(Subquery)의 사용 목적은?',
        '집계 함수의 종류는?',
      ],
    },
  }

  const certTemplates = templates[certificationType] || {}
  const categoryTemplates = certTemplates[category] || [
    `${category} 관련 문제 ${number}`,
    `${category} 영역의 핵심 개념은?`,
  ]

  return categoryTemplates[number % categoryTemplates.length] || `${category} 문제 ${number}`
}

/**
 * 임시 선택지 생성
 */
function getMockOptionsForCategory(
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
      ],
    },
    'SQLD': {
      'SQL 기본': [
        ['SELECT 컬럼 FROM 테이블 WHERE 조건', 'SELECT 컬럼 WHERE 조건 FROM 테이블', 'FROM 테이블 SELECT 컬럼 WHERE 조건', 'WHERE 조건 SELECT 컬럼 FROM 테이블', 'SELECT 컬럼 WHERE 조건'],
        ['WHERE는 행 필터링, HAVING은 그룹 필터링', 'WHERE는 그룹 필터링, HAVING은 행 필터링', 'WHERE와 HAVING은 동일하다', 'WHERE는 집계 함수만 사용 가능', 'HAVING은 집계 함수 사용 불가'],
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
function getMockExplanationForCategory(
  certificationType: string,
  category: string,
  number: number
): string {
  return `${category} 영역의 핵심 개념을 이해하는 것이 중요합니다. 이 문제는 ${certificationType} 자격증의 기본 지식을 확인하는 문제입니다. 정답을 선택한 이유와 각 선택지의 의미를 다시 한번 확인해보세요.`
}

export interface StudySession {
  id: string
  userId: string
  questionIds: string[]
  answers: Record<string, { answer: string; isCorrect: boolean; timeSpent: number }>
  currentIndex: number
  startedAt: Date
  completedAt?: Date
}

/**
 * 문제 상세 정보 가져오기
 */
export async function getQuestionDetails(
  questionId: string
): Promise<Question | null> {
  try {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('id', questionId)
      .single()

    if (error) {
      throw error
    }

    return data as Question
  } catch (error) {
    console.error('Error fetching question details:', error)
    return null
  }
}

/**
 * 임시 문제 ID인지 확인
 */
function isTemporaryQuestionId(questionId: string): boolean {
  return questionId.startsWith('temp-') || !questionId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
}

/**
 * 임시 문제 생성
 */
function createTemporaryQuestions(
  questionIds: string[],
  certificationType: string = '정보처리기사'
): Question[] {
  return questionIds.map((id, index) => 
    createTemporaryQuestion(id, index, certificationType)
  )
}

/**
 * 여러 문제 가져오기 (임시 문제 ID 처리 포함)
 */
export async function getQuestions(
  questionIds: string[]
): Promise<Question[]> {
  try {
    if (questionIds.length === 0) {
      return []
    }

    // 임시 문제 ID와 실제 문제 ID 분리
    const tempIds = questionIds.filter(isTemporaryQuestionId)
    const realIds = questionIds.filter((id) => !isTemporaryQuestionId(id))

    let realQuestions: Question[] = []

    // 실제 문제 ID가 있으면 가져오기
    if (realIds.length > 0) {
      console.log(`🔍 실제 문제 ${realIds.length}개를 DB에서 가져오는 중...`)
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .in('id', realIds)

      if (error) {
        console.error('❌ 실제 문제를 가져오는 중 에러 발생:', error)
        console.error('에러 상세:', JSON.stringify(error, null, 2))
      } else if (data) {
        console.log(`✅ DB에서 ${data.length}개의 문제를 성공적으로 가져왔습니다.`)
        // 첫 번째 문제의 원본 데이터 확인
        if (data.length > 0) {
          console.log(`🔍 첫 번째 문제 원본 데이터:`, {
            id: data[0].id,
            difficulty: data[0].difficulty,
            difficultyType: typeof data[0].difficulty,
            certification_type: data[0].certification_type,
            category: data[0].category,
          })
        }
        // 데이터 변환 (Supabase 형식을 Question 타입으로)
        realQuestions = data.map((q: any) => {
          // options 처리
          let options: string[] = []
          if (Array.isArray(q.options)) {
            options = q.options
          } else if (typeof q.options === 'string') {
            try {
              options = JSON.parse(q.options)
            } catch (e) {
              console.warn('⚠️ options 파싱 실패:', e)
              options = []
            }
          }

          // correct_answer 처리 (①, ②, ③, ④, ⑤ 형식 지원)
          let correctAnswer = q.correct_answer || q.correctAnswer || '1'
          // 숫자 형식(1,2,3,4,5)을 원형 숫자 형식(①,②,③,④,⑤)으로 변환
          if (/^[1-5]$/.test(correctAnswer)) {
            const circleNumbers = ['①', '②', '③', '④', '⑤']
            correctAnswer = circleNumbers[parseInt(correctAnswer) - 1]
          }

          return {
            id: q.id,
            content: q.content,
            options,
            correctAnswer,
            explanation: q.explanation || '',
            certificationType: q.certification_type || q.certificationType,
            category: q.category || '일반',
            difficulty: (() => {
              // 난이도가 null이거나 undefined가 아닌 경우에만 사용
              if (q.difficulty !== null && q.difficulty !== undefined) {
                const diff = Number(q.difficulty)
                // 숫자로 변환 가능하고 1-5 범위 내인지 확인
                if (!isNaN(diff) && diff >= 1 && diff <= 5) {
                  // 숫자를 '상', '중', '하'로 변환 (5=상, 3=중, 1=하, 나머지는 가장 가까운 값)
                  if (diff === 5) return '상'
                  if (diff === 3) return '중'
                  if (diff === 1) return '하'
                  // 2나 4는 가장 가까운 값으로 (2→중, 4→상)
                  if (diff === 2) return '중'
                  if (diff === 4) return '상'
                  return '중' // 기본값
                }
                console.warn(`⚠️ 잘못된 난이도 값: ${q.difficulty} (문제 ID: ${q.id})`)
              }
              return '중' // 기본값
            })(),
            tags: Array.isArray(q.tags) ? q.tags : (q.tags || []),
            createdAt: q.created_at ? new Date(q.created_at) : new Date(),
          }
        })
        console.log(`📝 변환된 문제 샘플:`, realQuestions[0] ? {
          id: realQuestions[0].id,
          content: realQuestions[0].content?.substring(0, 50) + '...',
          optionsCount: realQuestions[0].options?.length,
          correctAnswer: realQuestions[0].correctAnswer,
          category: realQuestions[0].category,
          difficulty: realQuestions[0].difficulty, // '상', '중', '하'로 변환됨
          rawDifficulty: data[0]?.difficulty, // DB에서 가져온 원본 난이도 (숫자)
        } : '없음')
      } else {
        console.warn('⚠️ DB에서 데이터를 가져왔지만 data가 null입니다.')
      }
    }

    // 임시 문제 ID가 있으면 경고만 표시 (임시 문제 생성하지 않음)
    if (tempIds.length > 0) {
      console.warn(`⚠️ 임시 문제 ID ${tempIds.length}개를 감지했습니다. DB에서 실제 문제를 찾을 수 없습니다.`)
      console.warn(`임시 문제 ID들:`, tempIds)
      // 임시 문제를 생성하지 않고 빈 배열로 진행
      // realQuestions는 이미 DB에서 가져온 실제 문제만 포함
    }

    // questionIds 순서대로 정렬
    const questionMap = new Map(realQuestions.map((q) => [q.id, q]))
    const sortedQuestions = questionIds
      .map((id) => questionMap.get(id))
      .filter((q): q is Question => q !== undefined)

    console.log(`📊 최종 반환 문제 수: ${sortedQuestions.length}개`)
    return sortedQuestions
  } catch (error) {
    console.error('❌ Error fetching questions:', error)
    console.error('에러 상세:', JSON.stringify(error, null, 2))
    // 에러 발생 시 빈 배열 반환 (임시 문제 생성하지 않음)
    return []
  }
}

/**
 * 답안 제출 및 학습 기록 저장
 */
export async function submitAnswer(
  userId: string,
  questionId: string,
  userAnswer: string,
  isCorrect: boolean,
  timeSpent: number
): Promise<{ success: boolean; error?: string }> {
  try {
    // 임시 문제 ID인 경우 데이터베이스에 저장하지 않음 (로컬 스토리지만 사용)
    if (isTemporaryQuestionId(questionId)) {
      console.log('📝 임시 문제 답안은 로컬 스토리지만 저장합니다.')
      return { success: true }
    }

    // study_records에 기록
    const { error: recordError } = await supabase.from('study_records').insert({
      user_id: userId,
      question_id: questionId,
      user_answer: userAnswer,
      is_correct: isCorrect,
      time_spent: timeSpent,
    })

    if (recordError) {
      // 403 에러나 외래키 제약조건 위반인 경우에도 성공으로 처리 (임시 문제일 수 있음)
      if (recordError.code === '23503' || recordError.status === 403) {
        console.warn('⚠️ 문제 ID가 유효하지 않아 로컬 스토리지만 저장합니다:', recordError)
        return { success: true }
      }
      throw recordError
    }

    // 오답인 경우 wrong_answers 테이블에 기록
    if (!isCorrect) {
      try {
        const { data: existingWrong } = await supabase
          .from('wrong_answers')
          .select('id, wrong_count')
          .eq('user_id', userId)
          .eq('question_id', questionId)
          .maybeSingle()

        if (existingWrong) {
          // 기존 오답 기록 업데이트
          await supabase
            .from('wrong_answers')
            .update({
              wrong_count: existingWrong.wrong_count + 1,
              last_wrong_date: new Date().toISOString(),
            })
            .eq('id', existingWrong.id)
        } else {
          // 새로운 오답 기록 생성
          await supabase.from('wrong_answers').insert({
            user_id: userId,
            question_id: questionId,
            wrong_count: 1,
            last_wrong_date: new Date().toISOString(),
          })
        }
      } catch (wrongAnswerError) {
        // 오답 기록 저장 실패해도 답안 제출은 성공으로 처리
        console.warn('⚠️ 오답 기록 저장 실패:', wrongAnswerError)
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Error submitting answer:', error)
    // 에러가 발생해도 성공으로 처리 (임시 문제일 수 있음)
    return { success: true }
  }
}

/**
 * 세션 저장 (로컬 스토리지)
 */
export function saveSessionToLocal(session: StudySession): void {
  try {
    localStorage.setItem(`study_session_${session.userId}`, JSON.stringify(session))
  } catch (error) {
    console.error('Error saving session to local storage:', error)
  }
}

/**
 * 세션 불러오기 (로컬 스토리지)
 */
export function loadSessionFromLocal(userId: string): StudySession | null {
  try {
    const stored = localStorage.getItem(`study_session_${userId}`)
    if (!stored) return null

    const session = JSON.parse(stored) as StudySession
    // Date 객체 복원
    session.startedAt = new Date(session.startedAt)
    if (session.completedAt) {
      session.completedAt = new Date(session.completedAt)
    }

    return session
  } catch (error) {
    console.error('Error loading session from local storage:', error)
    return null
  }
}

/**
 * 세션 삭제 (로컬 스토리지)
 */
export function clearSessionFromLocal(userId: string): void {
  try {
    localStorage.removeItem(`study_session_${userId}`)
  } catch (error) {
    console.error('Error clearing session from local storage:', error)
  }
}



