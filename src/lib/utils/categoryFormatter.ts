/**
 * 카테고리 포맷 유틸리티
 * 
 * category 코드를 "자격증명 > 과목명 > 주요항목" 형식으로 변환
 */

// 사회조사분석사 과목명 매핑
const socialResearchSubjects: Record<string, string> = {
  '1': '조사방법과 설계',
  '2': '조사관리와 자료처리',
  '3': '통계분석과 활용',
}

// 사회조사분석사 주요항목 매핑
const socialResearchTopics: Record<string, Record<string, string>> = {
  '1': {
    '1': '통계조사개론',
    '2': '표본설계',
    '3': '설문설계',
    '4': 'FGI 정성조사',
    '5': '심층인터뷰 정성조사',
  },
  '2': {
    '1': '자료수집방법',
    '2': '조사관리',
    '3': '2차 자료 분석',
    '4': '측정의 타당성과 신뢰성',
    '5': '자료처리',
  },
  '3': {
    '1': '확률분포',
    '2': '기술통계분석',
    '3': '회귀분석',
  },
}

// 경영정보시각화능력 과목명 매핑
const managementInfoSubjects: Record<string, string> = {
  '1': '경영정보일반',
  '2': '데이터 해석 및 활용',
  '3': '경영정보 시각화 디자인',
}

// 경영정보시각화능력 주요항목 매핑
const managementInfoTopics: Record<string, Record<string, string>> = {
  '1': {
    '1': '경영정보 이해',
    '2': '기업 내부 정보 파악',
    '3': '기업 외부 정보 활용',
  },
  '2': {
    '1': '데이터 이해 및 해석',
    '2': '데이터 파일 시스템',
    '3': '데이터 활용',
  },
  '3': {
    '1': '시각화 디자인 원리',
    '2': '시각화 도구 활용',
    '3': '시각화 요소 디자인',
  },
}

// 정보처리기사 과목명 매핑
const itEngineerSubjects: Record<string, string> = {
  '1': '소프트웨어설계',
  '2': '소프트웨어개발',
  '3': '데이터베이스구축',
  '4': '프로그래밍언어활용',
  '5': '정보시스템구축관리',
}

// 정보처리기사 주요항목 매핑
const itEngineerTopics: Record<string, Record<string, string>> = {
  '1': {
    '1': '요구사항 확인',
    '2': '화면 설계',
    '3': '애플리케이션 설계',
    '4': '인터페이스 설계',
  },
  '2': {
    '1': '데이터 입출력 구현',
    '2': '통합 구현',
    '3': '제품소프트웨어 패키징',
    '4': '애플리케이션 테스트 관리',
    '5': '인터페이스 구현',
  },
  '3': {
    '1': 'SQL 응용',
    '2': 'SQL 활용',
    '3': '논리 데이터베이스 설계',
    '4': '물리 데이터베이스 설계',
    '5': '데이터 전환',
  },
  '4': {
    '1': '서버프로그램 구현',
    '2': '프로그래밍 언어 활용',
    '3': '응용 SW 기초 기술 활용',
  },
  '5': {
    '1': '소프트웨어개발 방법론 활용',
    '2': 'IT프로젝트 정보시스템 구축관리',
    '3': '소프트웨어 개발 보안 구축',
    '4': '시스템 보안 구축',
  },
}

// TESAT 과목명 매핑
const tesatSubjects: Record<string, string> = {
  '1': '경제이론 (기초, 응용)',
  '2': '경제시사 (기초, 응용)',
  '3': '상황판단 (응용복합)',
}

// TESAT 주요항목 매핑
const tesatTopics: Record<string, Record<string, string>> = {
  '1': {
    '1': '기초일반',
    '2': '미시',
    '3': '거시',
    '4': '금융',
    '5': '국제',
  },
  '2': {
    '1': '정책(통계)',
    '2': '정식(통어)',
    '3': '경영(회사법 회계 재무)',
  },
  '3': {
    '1': '자료해석',
    '2': '이슈분석',
    '3': '의사결정(비용편익분석)',
  },
}

// ADsP 과목명 매핑
const adspSubjects: Record<string, string> = {
  '1': '데이터 이해',
  '2': '데이터분석 기획',
  '3': '데이터분석',
}

// ADsP 주요항목 매핑
const adspTopics: Record<string, Record<string, string>> = {
  '1': {
    '1': '데이터의 이해',
    '2': '데이터의 가치와 미래',
    '3': '가치 창조를 위한 데이터 사이언스와 전략 인사이트',
  },
  '2': {
    '1': '데이터분석 기획의 이해',
    '2': '분석 마스터 플랜',
  },
  '3': {
    '1': 'R기초와 데이터 마트',
    '2': '통계분석',
    '3': '정형 데이터 마이닝',
  },
}

// SQLD 과목명 매핑
const sqldSubjects: Record<string, string> = {
  '1': '데이터 모델링의 이해',
  '2': 'SQL 기본 및 활용',
}

// SQLD 주요항목 매핑
const sqldTopics: Record<string, Record<string, string>> = {
  '1': {
    '1': '데이터 모델링의 이해',
    '2': '데이터 모델과 SQL',
  },
  '2': {
    '1': 'SQL 기본',
    '2': 'SQL 활용',
    '3': '관리 구문',
  },
}

// 컴퓨터활용능력 과목명 매핑
const computerSubjects: Record<string, string> = {
  '1': '컴퓨터 일반',
  '2': '스프레드시트 일반',
  '3': '데이터베이스 일반',
}

// 빅데이터분석기사 과목명 매핑
const bigdataSubjects: Record<string, string> = {
  '1': '빅데이터 분석 기획',
  '2': '빅데이터 탐색',
  '3': '빅데이터 모델링',
  '4': '빅데이터 결과해석',
}

// 공인중개사 과목명 매핑
const realestateSubjects: Record<string, string> = {
  '1': '부동산학개론',
  '2': '민법및민사특별법',
}

/**
 * 카테고리 코드를 "자격증명 > 과목명 > 주요항목" 형식으로 변환
 * @param certType 자격증 이름
 * @param category 카테고리 코드 (예: "4-3-1-1-1")
 * @returns 포맷된 카테고리 문자열
 */
export function formatCategoryDisplay(certType: string, category: string): string {
  if (!category || !certType) {
    return certType || '일반'
  }

  const parts = category.split('-')
  if (parts.length < 3) return certType

  const [, subject, item] = parts // major는 사용 안 함 (certificationType 사용)

  // 사회조사분석사
  if (certType === '사회조사분석사') {
    const subjectName = socialResearchSubjects[subject] || `제${subject}과목`
    const topicName = socialResearchTopics[subject]?.[item] || `항목${item}`
    return `${subjectName} > ${topicName}`
  }

  // 경영정보시각화능력
  if (certType === '경영정보시각화능력') {
    const subjectName = managementInfoSubjects[subject] || `제${subject}과목`
    const topicName = managementInfoTopics[subject]?.[item] || `항목${item}`
    return `${subjectName} > ${topicName}`
  }

  // 정보처리기사
  if (certType === '정보처리기사') {
    const subjectName = itEngineerSubjects[subject] || `제${subject}과목`
    const topicName = itEngineerTopics[subject]?.[item] || `항목${item}`
    return `${subjectName} > ${topicName}`
  }

  // TESAT
  if (certType === 'TESAT') {
    const subjectName = tesatSubjects[subject] || `제${subject}과목`
    const topicName = tesatTopics[subject]?.[item] || `항목${item}`
    return `${subjectName} > ${topicName}`
  }

  // ADsP
  if (certType === 'ADsP') {
    const subjectName = adspSubjects[subject] || `제${subject}과목`
    const topicName = adspTopics[subject]?.[item] || `항목${item}`
    return `${subjectName} > ${topicName}`
  }

  // SQLD
  if (certType === 'SQLD') {
    const subjectName = sqldSubjects[subject] || `제${subject}과목`
    const topicName = sqldTopics[subject]?.[item] || `항목${item}`
    return `${subjectName} > ${topicName}`
  }

  // 컴퓨터활용능력
  if (certType === '컴퓨터활용능력') {
    const subjectName = computerSubjects[subject] || `제${subject}과목`
    const topicName = `항목${item}`
    return `${subjectName} > ${topicName}`
  }

  // 빅데이터분석기사
  if (certType === '빅데이터분석기사') {
    const subjectName = bigdataSubjects[subject] || `제${subject}과목`
    const topicName = `항목${item}`
    return `${subjectName} > ${topicName}`
  }

  // 공인중개사
  if (certType === '공인중개사') {
    const subjectName = realestateSubjects[subject] || `제${subject}과목`
    const topicName = `항목${item}`
    return `${subjectName} > ${topicName}`
  }

  // 기타 자격증
  return `제${subject}과목 > 항목${item}`
}

