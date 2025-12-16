-- questions 테이블에 frequency 컬럼 추가
-- Supabase Dashboard → SQL Editor에서 실행하세요

ALTER TABLE questions 
ADD COLUMN IF NOT EXISTS frequency INTEGER;

-- 컬럼 설명 추가 (선택사항)
COMMENT ON COLUMN questions.frequency IS '출제빈도 (선택사항)';








