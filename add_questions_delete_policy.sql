-- questions 테이블 DELETE 정책 추가
-- Supabase Dashboard → SQL Editor에서 실행하세요

-- 관리자만 DELETE 가능
CREATE POLICY "Allow admin delete questions"
ON questions FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.is_admin = true
  )
);

COMMENT ON POLICY "Allow admin delete questions" ON questions IS '관리자만 문제를 삭제할 수 있습니다.';






