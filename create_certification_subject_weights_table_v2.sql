-- certification_subject_weights 테이블 생성 (수정 버전)
-- Supabase Dashboard → SQL Editor에서 실행하세요
-- 전체를 한 번에 실행하세요 (Ctrl+A 후 실행)

-- 1. 기존 테이블이 있으면 삭제 (선택사항 - 처음 실행 시에는 필요 없음)
-- DROP TABLE IF EXISTS public.certification_subject_weights CASCADE;

-- 2. 테이블 생성
CREATE TABLE IF NOT EXISTS public.certification_subject_weights (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  certification_type TEXT NOT NULL,
  subject_number INTEGER NOT NULL CHECK (subject_number >= 1 AND subject_number <= 5),
  question_count INTEGER NOT NULL DEFAULT 0 CHECK (question_count >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(certification_type, subject_number)
);

-- 3. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_certification_subject_weights_certification_type 
ON public.certification_subject_weights(certification_type);

-- 4. updated_at 자동 업데이트 트리거 함수 (이미 있으면 재생성)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. 트리거 생성
DROP TRIGGER IF EXISTS update_certification_subject_weights_updated_at ON public.certification_subject_weights;
CREATE TRIGGER update_certification_subject_weights_updated_at
BEFORE UPDATE ON public.certification_subject_weights
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 6. 테이블 설명 추가
COMMENT ON TABLE public.certification_subject_weights IS '자격증별 과목별 진단 테스트 문항 수 설정';
COMMENT ON COLUMN public.certification_subject_weights.certification_type IS '자격증 유형';
COMMENT ON COLUMN public.certification_subject_weights.subject_number IS '과목 번호 (1-5)';
COMMENT ON COLUMN public.certification_subject_weights.question_count IS '해당 과목에 배정할 문항 수';

-- 7. 모든 자격증 초기 데이터 입력
INSERT INTO public.certification_subject_weights (certification_type, subject_number, question_count)
VALUES 
  -- 정보처리기사: 2-2-2-2-2 (총 10문제)
  ('정보처리기사', 1, 2),
  ('정보처리기사', 2, 2),
  ('정보처리기사', 3, 2),
  ('정보처리기사', 4, 2),
  ('정보처리기사', 5, 2),
  -- 컴퓨터활용능력: 2-4-4-0-0 (총 10문제)
  ('컴퓨터활용능력', 1, 2),
  ('컴퓨터활용능력', 2, 4),
  ('컴퓨터활용능력', 3, 4),
  ('컴퓨터활용능력', 4, 0),
  ('컴퓨터활용능력', 5, 0),
  -- 빅데이터분석기사: 2-2-4-2-0 (총 10문제)
  ('빅데이터분석기사', 1, 2),
  ('빅데이터분석기사', 2, 2),
  ('빅데이터분석기사', 3, 4),
  ('빅데이터분석기사', 4, 2),
  ('빅데이터분석기사', 5, 0),
  -- 경영정보시각화능력: 2-4-4-0-0 (총 10문제)
  ('경영정보시각화능력', 1, 2),
  ('경영정보시각화능력', 2, 4),
  ('경영정보시각화능력', 3, 4),
  ('경영정보시각화능력', 4, 0),
  ('경영정보시각화능력', 5, 0),
  -- ADsP: 2-2-6-0-0 (총 10문제)
  ('ADsP', 1, 2),
  ('ADsP', 2, 2),
  ('ADsP', 3, 6),
  ('ADsP', 4, 0),
  ('ADsP', 5, 0),
  -- SQLD: 2-8-0-0-0 (총 10문제)
  ('SQLD', 1, 2),
  ('SQLD', 2, 8),
  ('SQLD', 3, 0),
  ('SQLD', 4, 0),
  ('SQLD', 5, 0)
ON CONFLICT (certification_type, subject_number) 
DO UPDATE SET question_count = EXCLUDED.question_count;

-- 8. 생성 확인 쿼리
SELECT 
  '테이블 생성 완료!' as status,
  COUNT(*) as total_records,
  COUNT(DISTINCT certification_type) as 자격증_종류수
FROM public.certification_subject_weights;

-- 9. 자격증별 문항 수 확인
SELECT 
  certification_type,
  subject_number,
  question_count
FROM public.certification_subject_weights
WHERE question_count > 0
ORDER BY certification_type, subject_number;

