-- questions 테이블에 기출회차와 기출번호 컬럼 추가
-- Supabase Dashboard → SQL Editor에서 실행하세요

ALTER TABLE questions
ADD COLUMN IF NOT EXISTS exam_session TEXT;

ALTER TABLE questions
ADD COLUMN IF NOT EXISTS exam_number INTEGER;

COMMENT ON COLUMN questions.exam_session IS '기출회차 (예: 2024년 1회차, 2024년 2회차 등)';
COMMENT ON COLUMN questions.exam_number IS '기출번호 (해당 회차 내 문제 번호)';

-- 기출번호로 정렬을 위한 인덱스 추가 (선택사항)
CREATE INDEX IF NOT EXISTS idx_questions_exam_session_number 
ON questions(exam_session, exam_number);








