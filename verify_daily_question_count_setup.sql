-- daily_question_count 설정 완전 확인 스크립트
-- 이 스크립트를 실행하여 모든 설정이 제대로 되었는지 확인하세요

-- 1. 컬럼 존재 여부 및 타입 확인
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'users' 
  AND column_name = 'daily_question_count';

-- 2. RLS 활성화 여부 확인
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'users';

-- 3. RLS 정책 확인
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'users'
  AND (policyname LIKE '%daily_question_count%' OR policyname LIKE '%read%' OR policyname LIKE '%update%');

-- 4. 테스트: 현재 사용자의 daily_question_count 확인 (인증된 사용자만 실행 가능)
-- SELECT id, email, daily_question_count 
-- FROM users 
-- WHERE id = auth.uid();

-- 5. 만약 컬럼이 없다면 생성
-- ALTER TABLE users
-- ADD COLUMN IF NOT EXISTS daily_question_count JSONB DEFAULT '{"빅데이터분석기사": null, "ADsP": null, "기출문제-빅데이터분석기사": null, "기출문제-ADsP": null}'::jsonb;

-- 6. 만약 RLS가 비활성화되어 있다면 활성화
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 7. RLS 정책이 없다면 생성 (add_users_daily_question_count_rls.sql 실행)

