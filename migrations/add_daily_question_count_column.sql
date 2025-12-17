-- users 테이블에 daily_question_count 컬럼 추가
ALTER TABLE users
ADD COLUMN IF NOT EXISTS daily_question_count INTEGER DEFAULT 5;

COMMENT ON COLUMN users.daily_question_count IS '매일 배달받을 문제 수 (기본값: 5)';

-- 기존 사용자에게 기본값 5 설정
UPDATE users
SET daily_question_count = 5
WHERE daily_question_count IS NULL;








