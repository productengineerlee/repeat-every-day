// import { supabase } from '../supabaseClient' // 향후 Edge Function 구현 시 사용

export interface AIExplanation {
  term: string
  explanation: string
  analogy?: string
}

/**
 * AI 설명 가져오기 (캐시 우선)
 */
export async function getAIExplanation(
  term: string
): Promise<AIExplanation | null> {
  try {
    // TODO: Supabase Edge Function 호출
    // 현재는 간단한 설명 반환 (향후 Edge Function으로 대체)
    
    // 임시 설명 데이터 (실제로는 Edge Function에서 AI로 생성)
    const explanations: Record<string, string> = {
      정규화: '정규화는 데이터베이스에서 중복을 제거하고 데이터의 일관성을 유지하기 위한 과정입니다. 마치 책을 주제별로 정리하는 것과 같습니다.',
      트랜잭션: '트랜잭션은 여러 작업을 하나의 단위로 묶어서 모두 성공하거나 모두 실패하도록 보장하는 기능입니다. 은행 계좌 이체처럼 전부 성공하거나 전부 취소되는 것과 같습니다.',
      인덱스: '인덱스는 데이터를 빠르게 찾기 위한 색인입니다. 책의 목차처럼 원하는 정보를 빠르게 찾을 수 있게 해줍니다.',
      뷰: '뷰는 실제 테이블의 데이터를 특정 조건에 맞게 보여주는 가상의 테이블입니다. 창문을 통해 보이는 풍경처럼, 원하는 부분만 선택해서 볼 수 있습니다.',
      트리거: '트리거는 특정 이벤트가 발생했을 때 자동으로 실행되는 함수입니다. 문에 부착된 센서처럼, 문이 열리면 자동으로 불이 켜지는 것과 같습니다.',
    }

    const explanation = explanations[term] || `${term}에 대한 상세한 설명이 준비 중입니다.`

    return {
      term,
      explanation,
    }
  } catch (error) {
    console.error('Error fetching AI explanation:', error)
    return null
  }
}

/**
 * AI 설명 피드백 제출
 */
export async function submitAIExplanationFeedback(
  term: string,
  helpful: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    // TODO: 피드백을 데이터베이스에 저장
    // 현재는 로그만 출력
    console.log('AI explanation feedback:', { term, helpful })
    
    return { success: true }
  } catch (error) {
    console.error('Error submitting feedback:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '피드백 제출 실패',
    }
  }
}

