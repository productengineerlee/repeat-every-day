-- daily_question_count 컬럼 확인 쿼리
-- 이 쿼리를 실행하여 컬럼이 제대로 생성되었는지 확인하세요

-- 1. 컬럼 존재 여부 확인
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'users' 
  AND column_name = 'daily_question_count';

-- 2. 현재 사용자의 daily_question_count 값 확인 (자신의 사용자 ID로 변경 필요)
-- SELECT id, email, daily_question_count 
-- FROM users 
-- WHERE id = 'YOUR_USER_ID_HERE';

-- 3. 컬럼이 없으면 생성
-- ALTER TABLE users
-- ADD COLUMN IF NOT EXISTS daily_question_count JSONB DEFAULT '{"빅데이터분석기사": null, "ADsP": null, "기출문제-빅데이터분석기사": null, "기출문제-ADsP": null}'::jsonb;








