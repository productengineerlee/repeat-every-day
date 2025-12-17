import type { DiagnosticQuestion } from '@/lib/api/questions'

/**
 * 카테고리를 주요항목 단위로 변환
 * 예: "7-1-2-1-1" -> "7-1-2" (과정분류-과목분류-주요항목)
 */
function normalizeCategory(category: string): string {
  const parts = category.split('-')
  if (parts.length >= 3) {
    return `${parts[0]}-${parts[1]}-${parts[2]}`
  }
  return category
}

/**
 * 과목 정보 가져오기
 */
function getSubjectInfo(category: string): { subjectCode: string; subjectName: string } {
  const parts = category.split('-')
  const certId = parts[0]
  const subjectNum = parts[1]
  const subjectCode = `${certId}-${subjectNum}`
  
  const SUBJECT_MAP: Record<string, Record<string, string>> = {
    '9': {
      '1': '부동산학개론',
      '2': '민법 및 민사특별법',
      '3': '공인중개사법령',
      '4': '부동산공법',
      '5': '부동산공시법령',
      '6': '부동산세법',
    },
    '7': {
      '1': '조사방법과 설계',
      '2': '조사관리와 자료처리',
      '3': '통계분석과 활용',
    },
    '8': {
      '1': '경제이론',
      '2': '경제시사',
      '3': '상황판단',
    },
    '1': {
      '1': '소프트웨어 설계',
      '2': '소프트웨어 개발',
      '3': '데이터베이스 구축',
      '4': '프로그래밍 활용',
      '5': '정보시스템 구축 관리',
    },
    '2': {
      '1': '컴퓨터 일반',
      '2': '스프레드시트',
      '3': '데이터베이스',
    },
    '3': {
      '1': '빅데이터 분석 기획',
      '2': '빅데이터 탐색',
      '3': '빅데이터 모델링',
    },
    '4': {
      '1': '경영정보일반',
      '2': '데이터 해석 및 활용',
      '3': '경영정보 시각화 디자인',
    },
    '5': {
      '1': '데이터 이해',
      '2': '데이터 분석 기획',
      '3': '데이터 분석',
    },
    '6': {
      '1': 'SQL 기본',
      '2': 'SQL 활용',
    },
  }
  
  const subjectName = SUBJECT_MAP[certId]?.[subjectNum] || `${subjectNum}과목`
  
  return { subjectCode, subjectName }
}

/**
 * 카테고리 코드를 읽기 쉬운 이름으로 변환
 * 주요항목만 표시
 */
export function getCategoryName(category: string): string {
  // 3단계로 정규화 (4단계 이상인 경우 3단계까지만 사용)
  const parts = category.split('-')
  const normalizedCategory = parts.length >= 3 ? `${parts[0]}-${parts[1]}-${parts[2]}` : category
  
  // 주요항목 매핑
  const CATEGORY_MAP: Record<string, string> = {
    // 공인중개사 (9)
    '9-1-1': '부동산학 이론',
    '9-1-2': '부동산 경제론',
    '9-1-3': '부동산 정책론',
    '9-2-1': '민법총칙',
    '9-2-2': '물권법',
    '9-2-3': '채권법',
    '9-3-1': '공인중개사법',
    '9-3-2': '중개실무',
    '9-4-1': '국토계획법',
    '9-4-2': '건축법',
    '9-5-1': '부동산등기법',
    '9-5-2': '공간정보법',
    '9-6-1': '취득세',
    '9-6-2': '재산세',
    
    // 사회조사분석사 (7)
    '7-1-1': '통계조사계획',
    '7-1-2': '표본설계',
    '7-1-3': '설문설계',
    '7-1-4': 'FGI 정성조사',
    '7-1-5': '심층인터뷰 정성조사',
    '7-2-1': '자료수집방법',
    '7-2-2': '실사관리',
    '7-2-3': '2차 자료 분석',
    '7-2-4': '측정의 타당성과 신뢰성',
    '7-2-5': '자료처리',
    '7-3-1': '확률분포',
    '7-3-2': '기술통계분석',
    '7-3-3': '회귀분석',
    
    // TESAT (8)
    '8-1-1': '미시경제',
    '8-1-2': '거시경제',
    '8-2-1': '국내경제',
    '8-2-2': '국제경제',
    '8-3-1': '경제상황분석',
    '8-3-2': '의사결정',
    
    // 정보처리기사 (1)
    '1-1-1': '요구사항 확인',
    '1-1-2': 'UI 설계',
    '1-2-1': '개발환경 구축',
    '1-2-2': '공통모듈 구현',
    '1-3-1': '데이터베이스 설계',
    '1-3-2': 'SQL 작성',
    '1-4-1': '프로그래밍 언어',
    '1-4-2': '응용 프로그래밍',
    '1-5-1': '시스템 구축',
    '1-5-2': '시스템 관리',
    
    // 컴퓨터활용능력 (2)
    '2-1-1': '컴퓨터 개요',
    '2-1-2': '운영체제',
    '2-2-1': '스프레드시트 기본',
    '2-2-2': '함수 활용',
    '2-3-1': '데이터베이스 개요',
    '2-3-2': '액세스 활용',
    
    // 빅데이터분석기사 (3)
    '3-1-1': '분석 기획',
    '3-1-2': '분석 마스터플랜',
    '3-2-1': '데이터 수집',
    '3-2-2': '데이터 전처리',
    '3-3-1': '분석 모델 설계',
    '3-3-2': '모델 평가',
    
    // 경영정보시각화능력 (4)
    '4-1-1': '경영정보 이해',
    '4-1-2': '기업 내부 정보 파악',
    '4-1-3': '기업 외부 정보 활용',
    '4-2-1': '데이터 이해 및 해석',
    '4-2-2': '데이터 파일 시스템',
    '4-2-3': '데이터 활용',
    '4-3-1': '시각화 디자인 기본원리 이해',
    '4-3-2': '시각화 도구 활용',
    '4-3-3': '시각화 요소 디자인',
    
    // ADsP (5)
    '5-1-1': '데이터의 이해',
    '5-1-2': '데이터의 가치와 미래',
    '5-1-3': '가치 창조를 위한 데이터 사이언스와 전략 인사이트',
    '5-2-1': '데이터 분석 기획의 이해',
    '5-2-2': '분석 마스터 플랜',
    '5-3-1': 'R기초와 데이터 마트',
    '5-3-2': '통계분석',
    '5-3-3': '정형 데이터 마이닝',
    
    // SQLD (6)
    '6-1-1': 'SQL 기초',
    '6-1-2': 'DDL/DML',
    '6-2-1': '고급 SQL',
    '6-2-2': 'SQL 최적화',
  }

  // 매핑에 있으면 반환 (정규화된 카테고리 사용)
  if (CATEGORY_MAP[normalizedCategory]) {
    return CATEGORY_MAP[normalizedCategory]
  }

  // 매핑에 없는 경우 기본 형식 반환
  if (parts.length >= 3) {
    return `항목${parts[2]}`
  }
  
  return category
}

/**
 * 카테고리의 상세 정보 가져오기 (주요항목 - 세부항목 형식)
 */
function getCategoryDetailName(category: string): string {
  // 세부항목까지 포함된 맵 (4단계: 과정-과목-주요항목-세부항목)
  const DETAIL_MAP: Record<string, string> = {
    // 공인중개사 세부항목
    '9-1-1-1': '부동산학 이론 - 부동산의 개념',
    '9-1-1-2': '부동산학 이론 - 부동산의 특성',
    '9-1-2-1': '부동산 경제론 - 수요와 공급',
    '9-1-2-2': '부동산 경제론 - 시장분석',
    '9-2-1-1': '민법총칙 - 권리의 주체',
    '9-2-1-2': '민법총칙 - 법률행위',
    '9-2-2-1': '물권법 - 물권의 종류',
    '9-2-2-2': '물권법 - 소유권',
    '9-2-3-1': '채권법 - 채권총론',
    '9-2-3-2': '채권법 - 계약',
    
    // 사회조사분석사 세부항목 (사용 안 함 - 3단계 매핑으로 충분)
  }

  // 세부항목 매핑이 있으면 반환
  if (DETAIL_MAP[category]) {
    return DETAIL_MAP[category]
  }

  // 없으면 주요항목만 반환
  return getCategoryName(category)
}

/**
 * 진단 테스트 결과 계산
 * @param questions 문제 목록
 * @param answers 사용자 답안 (questionId -> answer)
 * @returns 과목별 점수, 전체 점수, 취약 영역
 */
export function calculateDiagnosticResults(
  questions: DiagnosticQuestion[],
  answers: Record<string, string>
) {
  console.log('📊 진단 결과 계산 시작')
  console.log('총 문제 수:', questions.length)
  console.log('답안 수:', Object.keys(answers).length)

  // 정답 형식 통일 함수 (1,2,3,4,5 / A,B,C,D,E / ①,②,③,④,⑤ → A,B,C,D,E로 통일)
  const normalizeAnswer = (answer: string): string => {
    const normalized = String(answer).trim().toUpperCase()
    const circleNumbers = ['①', '②', '③', '④', '⑤']
    
    // 1. 숫자 형식(1,2,3,4,5)을 A,B,C,D,E로 변환
    if (/^[1-5]$/.test(normalized)) {
      const index = parseInt(normalized) - 1
      return String.fromCharCode('A'.charCodeAt(0) + index)
    }
    
    // 2. 원형 숫자(①,②,③,④,⑤)를 A,B,C,D,E로 변환
    const circleIndex = circleNumbers.indexOf(answer.trim())
    if (circleIndex !== -1) {
      return String.fromCharCode('A'.charCodeAt(0) + circleIndex)
    }
    
    // 3. 이미 A,B,C,D,E 형식이면 그대로 반환
    return normalized
  }

  // 전체 정답/오답 카운트
  let totalCorrect = 0
  let totalQuestions = questions.length

  // 과목별 점수 집계 (카테고리를 과목 단위로 정규화)
  const subjectScores: Record<string, { correct: number; total: number }> = {}

  questions.forEach((question, index) => {
    const rawCategory = question.category || '기타'
    const subject = normalizeCategory(rawCategory) // 주요항목 단위로 변환
    const userAnswer = answers[question.id]
    
    // 데이터베이스에서는 correct_answer로 저장됨
    const questionRecord = question as any
    const correctAnswer = questionRecord.correct_answer || 
                          questionRecord.correctAnswer || 
                          question.correctAnswer
    
    // 정답 형식 정규화
    const normalizedUserAnswer = userAnswer ? normalizeAnswer(userAnswer) : null
    const normalizedCorrectAnswer = correctAnswer ? normalizeAnswer(correctAnswer) : null
    
    // 정답 비교
    const isCorrect = normalizedUserAnswer && normalizedCorrectAnswer && 
                      normalizedUserAnswer === normalizedCorrectAnswer

    console.log(`🔍 문제 ${index + 1}:`, {
      id: question.id,
      content: question.content?.substring(0, 30) + '...',
      rawCategory,
      subject,
      userAnswer,
      normalizedUserAnswer,
      correctAnswer,
      normalizedCorrectAnswer,
      isCorrect,
      match: normalizedUserAnswer === normalizedCorrectAnswer,
    })

    // 전체 정답 수 증가
    if (isCorrect) {
      totalCorrect += 1
    }

    // 과목별 집계
    if (!subjectScores[subject]) {
      subjectScores[subject] = { correct: 0, total: 0 }
    }

    subjectScores[subject].total += 1
    if (isCorrect) {
      subjectScores[subject].correct += 1
    }
  })

  // 전체 점수 계산 (10점 만점)
  const totalScore = totalQuestions > 0 ? totalCorrect : 0

  // 영역별 점수 저장 (실제 맞은 개수와 총 문제 수)
  const scores: Record<string, number> = {}
  const categoryDetails: Record<string, { correct: number; total: number; name: string }> = {}
  const weakAreas: string[] = []

  Object.entries(subjectScores).forEach(([categoryCode, { correct, total }]) => {
    const categoryName = getCategoryName(categoryCode)
    
    // 실제 맞은 개수를 점수로 사용
    scores[categoryName] = correct
    // categoryCode를 key로 사용하여 중복 방지
    categoryDetails[categoryCode] = { correct, total, name: categoryName }

    // 영역별 정답률이 60% 미만인 경우 취약 영역으로 분류
    const percentage = total > 0 ? (correct / total) * 100 : 0
    if (percentage < 60) {
      weakAreas.push(categoryName)
    }

    console.log(`영역 ${categoryName}:`, {
      categoryCode,
      correct,
      total,
      percentage: percentage.toFixed(1) + '%'
    })
  })

  // 과목별 그룹화
  const subjectGroups: Record<string, {
    subjectName: string
    subjectNumber: number
    topics: Array<{ 
      topicName: string
      categoryCode: string
      correct: number
      total: number
      percentage: number
    }>
    totalCorrect: number
    totalQuestions: number
  }> = {}

  Object.entries(subjectScores).forEach(([categoryCode, { correct, total }]) => {
    const { subjectCode, subjectName } = getSubjectInfo(categoryCode)
    const categoryName = getCategoryName(categoryCode) // 주요항목명만 표시
    
    // 3단계 카테고리 코드 추출 (과정-과목-주요항목)
    const parts = categoryCode.split('-')
    const normalizedCode = parts.length >= 3 ? `${parts[0]}-${parts[1]}-${parts[2]}` : categoryCode
    
    const percentage = total > 0 ? (correct / total) * 100 : 0

    if (!subjectGroups[subjectCode]) {
      subjectGroups[subjectCode] = {
        subjectName,
        subjectNumber: parseInt(subjectCode.split('-')[1]), // 정렬용 과목 번호
        topics: [],
        totalCorrect: 0,
        totalQuestions: 0,
      }
    }

    subjectGroups[subjectCode].topics.push({
      topicName: categoryName, // 주요항목명
      categoryCode: normalizedCode, // 3단계 카테고리 코드
      correct,
      total,
      percentage,
    })
    subjectGroups[subjectCode].totalCorrect += correct
    subjectGroups[subjectCode].totalQuestions += total
  })

  console.log('📈 최종 결과:', {
    totalScore: `${totalScore}/${totalQuestions}`,
    totalCorrect,
    categoryCount: Object.keys(scores).length,
    subjectCount: Object.keys(subjectGroups).length,
    weakAreas
  })

  return {
    scores,
    weakAreas,
    totalScore, // 전체 점수 (맞은 개수)
    totalQuestions, // 총 문제 수
    subjectGroups, // 과목별 그룹 정보
    categoryDetails, // 각 영역의 상세 정보 (correct, total)
  }
}

