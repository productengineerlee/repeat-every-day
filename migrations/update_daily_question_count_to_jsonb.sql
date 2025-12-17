-- daily_question_count를 JSONB로 변경하여 자격증별 문제 수 저장
-- 형식: { "빅데이터분석기사": 5, "ADsP": 3, "기출문제-빅데이터분석기사": 1, "기출문제-ADsP": 3 }

-- 1단계: 임시 컬럼 생성
ALTER TABLE users
ADD COLUMN IF NOT EXISTS daily_question_count_jsonb JSONB;

-- 2단계: 기존 INTEGER 값을 JSONB로 변환하여 임시 컬럼에 저장 (null로 초기화)
UPDATE users
SET daily_question_count_jsonb = jsonb_build_object(
  '빅데이터분석기사', NULL,
  'ADsP', NULL,
  '기출문제-빅데이터분석기사', NULL,
  '기출문제-ADsP', NULL
)
WHERE daily_question_count IS NOT NULL;

-- 3단계: NULL인 경우 null 값으로 설정 (기본값 없음)
UPDATE users
SET daily_question_count_jsonb = '{"빅데이터분석기사": null, "ADsP": null, "기출문제-빅데이터분석기사": null, "기출문제-ADsP": null}'::jsonb
WHERE daily_question_count_jsonb IS NULL;

-- 4단계: 기존 컬럼 삭제
ALTER TABLE users
DROP COLUMN IF EXISTS daily_question_count;

-- 5단계: 임시 컬럼을 daily_question_count로 이름 변경
ALTER TABLE users
RENAME COLUMN daily_question_count_jsonb TO daily_question_count;

-- 6단계: 기본값 설정 (null)
ALTER TABLE users
ALTER COLUMN daily_question_count SET DEFAULT '{"빅데이터분석기사": null, "ADsP": null, "기출문제-빅데이터분석기사": null, "기출문제-ADsP": null}'::jsonb;

COMMENT ON COLUMN users.daily_question_count IS '자격증별 매일 배달받을 문제 수 (JSONB 형식)';

