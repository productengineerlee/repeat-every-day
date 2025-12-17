-- questions 테이블의 UPDATE RLS 정책 확인 및 수정
-- Supabase Dashboard → SQL Editor에서 실행하세요

-- 1. 현재 RLS 정책 확인
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'questions' AND cmd = 'UPDATE';

-- 2. 기존 정책이 있으면 삭제
DROP POLICY IF EXISTS "Allow admin update questions" ON questions;

-- 3. UPDATE 정책 생성 (관리자만 UPDATE 가능)
CREATE POLICY "Allow admin update questions"
ON questions FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.is_admin = true
  )
);

-- 4. RLS 활성화 확인
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'questions';

-- 5. RLS가 비활성화되어 있다면 활성화
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- 6. exam_session과 exam_number 컬럼 존재 확인
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'questions'
  AND column_name IN ('exam_session', 'exam_number');

