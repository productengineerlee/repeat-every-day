-- 과정분류 7번으로 잘못 저장된 문제들을 사회조사분석사로 수정

-- 1. 현재 잘못 저장된 데이터 확인
SELECT 
  id,
  certification_type,
  category,
  content,
  created_at
FROM questions
WHERE category LIKE '7%'
  AND certification_type != '사회조사분석사'
ORDER BY created_at DESC
LIMIT 20;

-- 2. 과정분류 7번(사회조사분석사)으로 저장해야 할 문제들을 수정
UPDATE questions
SET certification_type = '사회조사분석사'
WHERE category LIKE '7%'
  AND certification_type != '사회조사분석사';

-- 3. 수정 결과 확인
SELECT 
  certification_type,
  COUNT(*) as count
FROM questions
WHERE category LIKE '7%'
GROUP BY certification_type;

-- 4. 모든 자격증별 문제 개수 확인
SELECT 
  certification_type,
  COUNT(*) as total_count
FROM questions
GROUP BY certification_type
ORDER BY 
  CASE certification_type
    WHEN '정보처리기사' THEN 1
    WHEN '컴퓨터활용능력' THEN 2
    WHEN '빅데이터분석기사' THEN 3
    WHEN '경영정보시각화능력' THEN 4
    WHEN 'ADsP' THEN 5
    WHEN 'SQLD' THEN 6
    WHEN '사회조사분석사' THEN 7
    WHEN 'TESAT' THEN 8
    WHEN '공인중개사' THEN 9
    ELSE 99
  END;

