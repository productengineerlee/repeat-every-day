-- certification_subject_weights 테이블 확인 쿼리
-- Supabase Dashboard → SQL Editor에서 실행하세요

-- 1. 테이블 존재 여부 확인
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'certification_subject_weights'
ORDER BY ordinal_position;

-- 2. 초기 데이터 확인
SELECT * FROM certification_subject_weights
ORDER BY certification_type, subject_number;

-- 3. 경영정보시각화능력 데이터 확인
SELECT 
  certification_type,
  subject_number,
  question_count,
  created_at,
  updated_at
FROM certification_subject_weights
WHERE certification_type = '경영정보시각화능력'
ORDER BY subject_number;






