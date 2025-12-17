-- 새로운 자격증 3개 추가: 사회조사분석사, TESAT, 공인중개사
-- certification_subject_weights 테이블에 과목별 문항 수 기본값 추가

-- 1. 사회조사분석사 (3과목)
INSERT INTO certification_subject_weights (certification_type, subject_number, question_count)
VALUES
  ('사회조사분석사', 1, 3),  -- 조사방법과 설계
  ('사회조사분석사', 2, 4),  -- 조사관리와 자료처리
  ('사회조사분석사', 3, 3)   -- 통계분석과 활용
ON CONFLICT (certification_type, subject_number) 
DO UPDATE SET question_count = EXCLUDED.question_count;

-- 2. TESAT (3과목)
INSERT INTO certification_subject_weights (certification_type, subject_number, question_count)
VALUES
  ('TESAT', 1, 4),  -- 경제이론(기초, 응용)
  ('TESAT', 2, 3),  -- 경제시사(기초, 응용)
  ('TESAT', 3, 3)   -- 상황판단(응용복합)
ON CONFLICT (certification_type, subject_number) 
DO UPDATE SET question_count = EXCLUDED.question_count;

-- 3. 공인중개사 (6과목)
INSERT INTO certification_subject_weights (certification_type, subject_number, question_count)
VALUES
  ('공인중개사', 1, 2),  -- 부동산학개론
  ('공인중개사', 2, 2),  -- 민법 및 민사특별법
  ('공인중개사', 3, 2),  -- 공인중개사법령
  ('공인중개사', 4, 2),  -- 부동산공법
  ('공인중개사', 5, 1),  -- 부동산공시법령
  ('공인중개사', 6, 1)   -- 부동산세법
ON CONFLICT (certification_type, subject_number) 
DO UPDATE SET question_count = EXCLUDED.question_count;

-- 결과 확인
SELECT certification_type, subject_number, question_count
FROM certification_subject_weights
WHERE certification_type IN ('사회조사분석사', 'TESAT', '공인중개사')
ORDER BY certification_type, subject_number;



