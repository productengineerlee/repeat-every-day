-- questions 테이블 UPDATE RLS 정책 수정 (완전한 버전)
-- Supabase Dashboard → SQL Editor에서 실행하세요

-- 1. 기존 정책이 있으면 삭제
DROP POLICY IF EXISTS "Allow admin update questions" ON questions;

-- 2. UPDATE 정책 생성 (관리자만 UPDATE 가능)
CREATE POLICY "Allow admin update questions"
ON questions 
FOR UPDATE
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

-- 3. RLS 활성화 (이미 활성화되어 있어도 에러 없음)
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- 4. 정책 확인
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'questions' AND cmd = 'UPDATE';








