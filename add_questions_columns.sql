-- questions 테이블에 누락된 컬럼 추가
-- Supabase Dashboard → SQL Editor에서 실행하세요

-- sub_content 컬럼 추가 (문제 서브 제시문)
ALTER TABLE questions 
ADD COLUMN IF NOT EXISTS sub_content TEXT;

-- sub_content_image_url 컬럼 추가 (서브 제시문 이미지 URL)
ALTER TABLE questions 
ADD COLUMN IF NOT EXISTS sub_content_image_url TEXT;

-- 컬럼 설명 추가 (선택사항)
COMMENT ON COLUMN questions.sub_content IS '문제 서브 제시문 (선택사항)';
COMMENT ON COLUMN questions.sub_content_image_url IS '서브 제시문 이미지 URL (선택사항)';

-- 컬럼 확인
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'questions';

