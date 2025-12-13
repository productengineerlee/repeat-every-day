-- questions 테이블에 기출년도 컬럼 추가
-- Supabase Dashboard → SQL Editor에서 실행하세요

ALTER TABLE questions
ADD COLUMN IF NOT EXISTS exam_year INTEGER;

COMMENT ON COLUMN questions.exam_year IS '기출년도 (예: 2024)';

-- 기출년도와 기출회차로 정렬을 위한 인덱스 추가 (선택사항)
CREATE INDEX IF NOT EXISTS idx_questions_exam_year_session 
ON questions(exam_year, exam_session);






