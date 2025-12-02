/**
 * 어려운 용어 목록 (향후 AI로 자동 감지하거나 데이터베이스에서 가져올 수 있음)
 */
const DIFFICULT_TERMS = [
  '정규화',
  '정규형',
  '트랜잭션',
  'ACID',
  '인덱스',
  '뷰',
  '트리거',
  '프로시저',
  '함수',
  '제약조건',
  '외래키',
  '기본키',
  '후보키',
  '대체키',
  '복합키',
  '도메인',
  '엔티티',
  '속성',
  '관계',
  'ERD',
  '데이터베이스',
  '스키마',
  '무결성',
  '동시성',
  '락',
  '데드락',
  '커밋',
  '롤백',
  '세이브포인트',
  'SQL',
  'DDL',
  'DML',
  'DCL',
  'TCL',
  '조인',
  '서브쿼리',
  '집계함수',
  '윈도우함수',
  'CTE',
  'UNION',
  'INTERSECT',
  'EXCEPT',
  'CASE',
  'NULL',
  'COALESCE',
  'NULLIF',
  'EXISTS',
  'IN',
  'LIKE',
  '정규표현식',
  '패턴매칭',
  '집합',
  '관계대수',
  '관계해석',
  '관계모델',
  '관계형',
  '비정규형',
  '1NF',
  '2NF',
  '3NF',
  'BCNF',
  '4NF',
  '5NF',
  '다치종속',
  '결정자',
  '종속자',
  '함수종속',
  '완전함수종속',
  '부분함수종속',
  '이행종속',
  '역정규화',
  '반정규화',
  '파티셔닝',
  '샤딩',
  '복제',
  '백업',
  '복구',
  '로그',
  '체크포인트',
  '버퍼',
  '캐시',
  '힙',
  'B-트리',
  'B+트리',
  '해시',
  '비트맵',
  '클러스터',
  '비클러스터',
  '커버링',
  '옵티마이저',
  '실행계획',
  '쿼리최적화',
  '인덱스스캔',
  '풀스캔',
  '테이블스캔',
  '조인알고리즘',
  '중첩루프',
  '정렬병합',
  '해시조인',
  '세미조인',
  '안티조인',
  '카티션곱',
  '데카르트곱',
  '크로스조인',
  '내부조인',
  '외부조인',
  '왼쪽외부조인',
  '오른쪽외부조인',
  '완전외부조인',
  '자연조인',
  '동등조인',
  '비동등조인',
  '셀프조인',
  '상관서브쿼리',
  '비상관서브쿼리',
  '스칼라서브쿼리',
  '인라인뷰',
  '뷰',
  '물리뷰',
  '논리뷰',
  '인덱스뷰',
  '구체화뷰',
  '시퀀스',
  '시노님',
  '동의어',
  '시퀀스',
  '시퀀스',
]

/**
 * 하이라이트된 용어 정보
 */
export interface HighlightedTerm {
  text: string
  isTerm: boolean
  startIndex: number
  endIndex: number
}

/**
 * 텍스트에서 어려운 용어를 찾아 하이라이트 정보 반환
 */
export function findDifficultTerms(text: string): HighlightedTerm[] {
  const result: HighlightedTerm[] = []
  let lastIndex = 0

  // 정규식으로 모든 어려운 용어 찾기
  const pattern = new RegExp(
    `(${DIFFICULT_TERMS.join('|')})`,
    'gi'
  )

  let match
  while ((match = pattern.exec(text)) !== null) {
    // 매치 전의 텍스트 추가
    if (match.index > lastIndex) {
      result.push({
        text: text.substring(lastIndex, match.index),
        isTerm: false,
        startIndex: lastIndex,
        endIndex: match.index,
      })
    }

    // 하이라이트된 용어 추가
    result.push({
      text: match[0],
      isTerm: true,
      startIndex: match.index,
      endIndex: pattern.lastIndex,
    })

    lastIndex = pattern.lastIndex
  }

  // 마지막 매치 후의 텍스트 추가
  if (lastIndex < text.length) {
    result.push({
      text: text.substring(lastIndex),
      isTerm: false,
      startIndex: lastIndex,
      endIndex: text.length,
    })
  }

  // 매치가 없으면 원본 텍스트만 반환
  if (result.length === 0) {
    return [
      {
        text,
        isTerm: false,
        startIndex: 0,
        endIndex: text.length,
      },
    ]
  }

  return result
}

/**
 * 텍스트에 하이라이트가 필요한지 확인
 */
export function hasDifficultTerms(text: string): boolean {
  const pattern = new RegExp(
    `(${DIFFICULT_TERMS.join('|')})`,
    'gi'
  )
  return pattern.test(text)
}

