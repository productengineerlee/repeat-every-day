-- questions 테이블 구조 확인
-- Supabase Dashboard → SQL Editor에서 실행하세요

-- 1. 테이블 존재 확인
SELECT 
  table_name,
  table_schema
FROM information_schema.tables 
WHERE table_name = 'questions';

-- 2. 컬럼 확인
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'questions'
ORDER BY ordinal_position;

-- 3. 필요한 컬럼이 있는지 확인
-- 다음 컬럼들이 있는지 확인:
-- - sub_content (TEXT)
-- - sub_content_image_url (TEXT)
-- - frequency (INTEGER)

-- 4. RLS 정책 확인
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'questions';






