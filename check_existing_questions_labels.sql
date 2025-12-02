-- 기존 문제들의 레이블 구조 확인
-- Supabase Dashboard → SQL Editor에서 실행하세요

-- 1. questions 테이블의 category 필드 확인 (카테고리 구조)
SELECT 
  id,
  certification_type,
  category,
  tags,
  created_at
FROM questions
ORDER BY created_at DESC
LIMIT 20;

-- 2. category 필드의 형식 분석
SELECT 
  category,
  COUNT(*) as count
FROM questions
WHERE category IS NOT NULL AND category != ''
GROUP BY category
ORDER BY count DESC;

-- 3. tags 필드 확인 (레이블이 tags에 저장되는 경우)
SELECT 
  id,
  certification_type,
  category,
  tags,
  array_length(tags, 1) as tag_count
FROM questions
WHERE tags IS NOT NULL AND array_length(tags, 1) > 0
ORDER BY created_at DESC
LIMIT 20;

-- 4. category와 tags 비교
SELECT 
  id,
  certification_type,
  category,
  tags,
  CASE 
    WHEN category = ANY(tags) THEN '일치'
    ELSE '불일치'
  END as match_status
FROM questions
WHERE category IS NOT NULL 
  AND tags IS NOT NULL 
  AND array_length(tags, 1) > 0
LIMIT 20;

