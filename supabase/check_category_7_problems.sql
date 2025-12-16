-- 과정분류 7번(사회조사분석사)으로 업로드된 문제 현황 확인

-- 1. 전체 자격증별 문제 개수
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

-- 2. category가 '7%'로 시작하는 문제들의 certification_type 분포
SELECT
  certification_type,
  COUNT(*) as count
FROM questions
WHERE category LIKE '7%'
GROUP BY certification_type
ORDER BY count DESC;

-- 3. category별 문제 개수 (상위 20개)
SELECT
  LEFT(category, 3) as category_prefix,
  certification_type,
  COUNT(*) as count
FROM questions
GROUP BY LEFT(category, 3), certification_type
ORDER BY LEFT(category, 3), certification_type;

-- 4. 최근 업로드된 문제 확인 (category 7번)
SELECT
  id,
  certification_type,
  category,
  LEFT(content, 80) as content_preview,
  exam_year,
  exam_session,
  exam_number,
  created_at
FROM questions
WHERE category LIKE '7%'
ORDER BY created_at DESC
LIMIT 20;

-- 5. 정보처리기사로 분류된 문제 중 category가 '7%'인 문제 수
SELECT
  COUNT(*) as wrong_classification_count
FROM questions
WHERE category LIKE '7%'
  AND certification_type = '정보처리기사';



