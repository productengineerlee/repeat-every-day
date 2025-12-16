-- daily_question_count 설정 안전 버전 스크립트
-- 이 스크립트는 기존 정책을 삭제하지 않고, 필요한 것만 추가합니다
-- 더 안전하지만, 기존 정책과 충돌할 수 있습니다

-- 1단계: RLS 활성화 확인 및 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 2단계: 컬럼이 없으면 생성
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'daily_question_count'
    ) THEN
        ALTER TABLE users
        ADD COLUMN daily_question_count JSONB DEFAULT '{"빅데이터분석기사": null, "ADsP": null, "기출문제-빅데이터분석기사": null, "기출문제-ADsP": null}'::jsonb;
        
        RAISE NOTICE 'daily_question_count 컬럼이 생성되었습니다.';
    ELSE
        RAISE NOTICE 'daily_question_count 컬럼이 이미 존재합니다.';
    END IF;
END $$;

-- 3단계: 기존 사용자의 daily_question_count가 NULL이면 기본값 설정
UPDATE users
SET daily_question_count = '{"빅데이터분석기사": null, "ADsP": null, "기출문제-빅데이터분석기사": null, "기출문제-ADsP": null}'::jsonb
WHERE daily_question_count IS NULL;

-- 4단계: SELECT 정책 생성 (이미 존재하면 에러 발생 - 무시 가능)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'users' 
        AND policyname = 'Users can read their own daily_question_count'
    ) THEN
        CREATE POLICY "Users can read their own daily_question_count"
        ON users
        FOR SELECT
        USING (auth.uid() = id);
        
        RAISE NOTICE 'SELECT 정책이 생성되었습니다.';
    ELSE
        RAISE NOTICE 'SELECT 정책이 이미 존재합니다.';
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'SELECT 정책이 이미 존재합니다.';
END $$;

-- 5단계: UPDATE 정책 생성 (이미 존재하면 에러 발생 - 무시 가능)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'users' 
        AND policyname = 'Users can update their own daily_question_count'
    ) THEN
        CREATE POLICY "Users can update their own daily_question_count"
        ON users
        FOR UPDATE
        USING (auth.uid() = id)
        WITH CHECK (auth.uid() = id);
        
        RAISE NOTICE 'UPDATE 정책이 생성되었습니다.';
    ELSE
        RAISE NOTICE 'UPDATE 정책이 이미 존재합니다.';
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'UPDATE 정책이 이미 존재합니다.';
END $$;

-- 6단계: 확인 쿼리
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








