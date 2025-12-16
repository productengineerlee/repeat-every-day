-- exam_session과 exam_number 컬럼 존재 여부 확인
-- Supabase Dashboard → SQL Editor에서 실행하세요

-- 1. 컬럼 존재 여부 확인
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'questions'
  AND column_name IN ('exam_session', 'exam_number')
ORDER BY column_name;

-- 2. 컬럼이 없으면 아래 스크립트 실행:
-- add_exam_session_columns.sql 파일의 내용을 실행하세요








