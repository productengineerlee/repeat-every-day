-- daily_question_count 컬럼을 JSONB 형식으로 생성 (컬럼이 없을 때 사용)
-- 형식: { "빅데이터분석기사": null, "ADsP": null, "기출문제-빅데이터분석기사": null, "기출문제-ADsP": null }

-- 컬럼이 없으면 생성
ALTER TABLE users
ADD COLUMN IF NOT EXISTS daily_question_count JSONB DEFAULT '{"빅데이터분석기사": null, "ADsP": null, "기출문제-빅데이터분석기사": null, "기출문제-ADsP": null}'::jsonb;

-- 기존 사용자 중 daily_question_count가 NULL인 경우 기본값 설정
UPDATE users
SET daily_question_count = '{"빅데이터분석기사": null, "ADsP": null, "기출문제-빅데이터분석기사": null, "기출문제-ADsP": null}'::jsonb
WHERE daily_question_count IS NULL;

COMMENT ON COLUMN users.daily_question_count IS '자격증별 매일 배달받을 문제 수 (JSONB 형식)';








