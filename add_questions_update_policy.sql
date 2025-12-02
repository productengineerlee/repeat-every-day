-- questions 테이블 UPDATE 정책 추가
-- Supabase Dashboard → SQL Editor에서 실행하세요

-- 기존 정책이 있으면 삭제
DROP POLICY IF EXISTS "Allow admin update questions" ON questions;

-- 관리자만 UPDATE 가능
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

COMMENT ON POLICY "Allow admin update questions" ON questions IS '관리자만 문제를 수정할 수 있습니다.';

