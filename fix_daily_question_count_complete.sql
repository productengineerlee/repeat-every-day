-- daily_question_count 설정 완전 수정 스크립트
-- 이 스크립트를 순서대로 실행하세요

-- 1단계: RLS 활성화 확인 및 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 2단계: 기존 정책 삭제 (중복 방지)
DROP POLICY IF EXISTS "Users can read their own daily_question_count" ON users;
DROP POLICY IF EXISTS "Users can update their own daily_question_count" ON users;
DROP POLICY IF EXISTS "Users can read their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;

-- 3단계: 컬럼이 없으면 생성, 있으면 타입 확인
DO $$
BEGIN
    -- 컬럼이 없으면 생성
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'daily_question_count'
    ) THEN
        ALTER TABLE users
        ADD COLUMN daily_question_count JSONB DEFAULT '{"빅데이터분석기사": null, "ADsP": null, "기출문제-빅데이터분석기사": null, "기출문제-ADsP": null}'::jsonb;
        
        RAISE NOTICE 'daily_question_count 컬럼이 생성되었습니다.';
    ELSE
        -- 컬럼이 있으면 타입 확인 및 필요시 변경
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' 
            AND column_name = 'daily_question_count'
            AND data_type != 'jsonb'
        ) THEN
            RAISE NOTICE 'daily_question_count 컬럼이 JSONB가 아닙니다. 타입을 확인하세요.';
        ELSE
            RAISE NOTICE 'daily_question_count 컬럼이 이미 존재합니다.';
        END IF;
    END IF;
END $$;

-- 4단계: 기존 사용자의 daily_question_count가 NULL이면 기본값 설정
UPDATE users
SET daily_question_count = '{"빅데이터분석기사": null, "ADsP": null, "기출문제-빅데이터분석기사": null, "기출문제-ADsP": null}'::jsonb
WHERE daily_question_count IS NULL;

-- 5단계: SELECT 정책 생성 (자신의 데이터 읽기)
CREATE POLICY "Users can read their own daily_question_count"
ON users
FOR SELECT
USING (auth.uid() = id);

-- 6단계: UPDATE 정책 생성 (자신의 데이터 수정)
CREATE POLICY "Users can update their own daily_question_count"
ON users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 7단계: 확인 쿼리
SELECT 
    '컬럼 확인' as check_type,
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'users' 
  AND column_name = 'daily_question_count'
UNION ALL
SELECT 
    'RLS 정책 확인' as check_type,
    policyname as column_name,
    cmd as data_type,
    '' as is_nullable
FROM pg_policies
WHERE tablename = 'users'
  AND (policyname LIKE '%daily_question_count%' OR policyname LIKE '%read%' OR policyname LIKE '%update%');

