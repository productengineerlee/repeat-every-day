-- questions 테이블에 관리자 INSERT 정책 추가
-- Supabase Dashboard → SQL Editor에서 실행하세요

-- 기존 정책 확인 (필요시 삭제)
-- DROP POLICY IF EXISTS "Allow admin insert questions" ON questions;
-- DROP POLICY IF EXISTS "Allow authenticated insert questions" ON questions;

-- 방법 1: 관리자만 INSERT 가능 (권장)
-- users 테이블에 is_admin 필드가 있는 경우
CREATE POLICY "Allow admin insert questions"
ON questions FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.is_admin = true
  )
);

-- 방법 2: 모든 인증된 사용자가 INSERT 가능 (개발 단계용)
-- 위 방법 1과 함께 사용하면 안 됩니다. 하나만 선택하세요.
-- CREATE POLICY "Allow authenticated insert questions"
-- ON questions FOR INSERT
-- TO authenticated
-- WITH CHECK (true);

-- 정책 확인
-- SELECT * FROM pg_policies WHERE tablename = 'questions';








