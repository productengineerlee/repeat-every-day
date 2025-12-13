-- questions 테이블 생성
-- Supabase Dashboard → SQL Editor에서 실행하세요

-- questions 테이블 생성
CREATE TABLE IF NOT EXISTS questions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  content TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_answer TEXT NOT NULL,
  explanation TEXT NOT NULL,
  certification_type TEXT NOT NULL,
  category TEXT NOT NULL,
  difficulty INTEGER NOT NULL,
  tags TEXT[] DEFAULT '{}',
  sub_content TEXT,
  sub_content_image_url TEXT,
  frequency INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_questions_certification_type ON questions(certification_type);
CREATE INDEX IF NOT EXISTS idx_questions_category ON questions(category);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_tags ON questions USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_questions_created_at ON questions(created_at DESC);

-- 난이도 제약 조건 (1-5 범위)
ALTER TABLE questions 
ADD CONSTRAINT check_difficulty_range 
CHECK (difficulty >= 1 AND difficulty <= 5);

-- 테이블 설명 추가
COMMENT ON TABLE questions IS '문제 정보를 저장하는 테이블';
COMMENT ON COLUMN questions.content IS '문제 제시문';
COMMENT ON COLUMN questions.sub_content IS '문제 서브 제시문 (선택사항)';
COMMENT ON COLUMN questions.sub_content_image_url IS '서브 제시문 이미지 URL (선택사항)';
COMMENT ON COLUMN questions.options IS '선택지 배열 (JSONB)';
COMMENT ON COLUMN questions.correct_answer IS '정답 (A, B, C, D, E)';
COMMENT ON COLUMN questions.explanation IS '문제 해설';
COMMENT ON COLUMN questions.certification_type IS '자격증 유형';
COMMENT ON COLUMN questions.category IS '카테고리 (예: 1-2-3-4-5)';
COMMENT ON COLUMN questions.difficulty IS '난이도 (1-5)';
COMMENT ON COLUMN questions.tags IS '레이블/태그 배열';
COMMENT ON COLUMN questions.frequency IS '출제빈도 (선택사항)';

-- 테이블 확인
-- SELECT * FROM information_schema.tables WHERE table_name = 'questions';






