-- users 테이블의 daily_question_count 컬럼에 대한 RLS 정책 추가
-- 사용자가 자신의 daily_question_count를 읽고 쓸 수 있도록 설정

-- 기존 정책이 있으면 삭제 (중복 방지)
DROP POLICY IF EXISTS "Users can read their own daily_question_count" ON users;
DROP POLICY IF EXISTS "Users can update their own daily_question_count" ON users;

-- 1. SELECT 정책 (자신의 데이터 읽기)
CREATE POLICY "Users can read their own daily_question_count"
ON users
FOR SELECT
USING (auth.uid() = id);

-- 2. UPDATE 정책 (자신의 데이터 수정)
CREATE POLICY "Users can update their own daily_question_count"
ON users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 참고: users 테이블에 RLS가 활성화되어 있어야 합니다
-- RLS 활성화 확인:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'users';

-- RLS가 비활성화되어 있다면 활성화:
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;

