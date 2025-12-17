/**
 * 난이도 변환 유틸리티
 * 숫자 난이도(1-5)를 한글('상', '중', '하')로 변환
 */

export function formatDifficulty(difficulty: number | string | null | undefined): string {
  if (difficulty === null || difficulty === undefined) return '중'
  
  // 이미 한글인 경우 그대로 반환
  if (typeof difficulty === 'string' && ['상', '중', '하'].includes(difficulty)) {
    return difficulty
  }
  
  const diffNum = Number(difficulty)
  if (!isNaN(diffNum) && diffNum >= 1 && diffNum <= 5) {
    if (diffNum === 5 || diffNum === 4) return '상'
    if (diffNum === 3 || diffNum === 2) return '중'
    if (diffNum === 1) return '하'
  }
  
  return '중' // 기본값
}

