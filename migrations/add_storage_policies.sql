-- Storage 버킷 RLS 정책 추가
-- Supabase Dashboard → SQL Editor에서 실행하세요

-- 1. Storage 버킷에 대한 정책 활성화 확인
-- Storage 버킷은 기본적으로 RLS가 활성화되어 있습니다.

-- 2. 업로드 정책 (인증된 사용자가 자신의 폴더에 업로드 가능)
CREATE POLICY "Allow authenticated uploads to question-images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'images' AND
  (storage.foldername(name))[1] = 'question-images'
);

-- 3. 읽기 정책 (공개 읽기 - Public bucket인 경우)
-- Public bucket을 사용하는 경우:
CREATE POLICY "Allow public read images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'images');

-- 또는 인증된 사용자만 읽기 가능하게 하려면:
-- CREATE POLICY "Allow authenticated read images"
-- ON storage.objects FOR SELECT
-- TO authenticated
-- USING (bucket_id = 'images');

-- 4. 삭제 정책 (사용자가 자신이 업로드한 파일만 삭제 가능)
CREATE POLICY "Allow users delete own images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'images' AND
  auth.uid()::text = (storage.foldername(name))[2]
);

-- 5. 업데이트 정책 (선택사항 - 필요시)
-- CREATE POLICY "Allow users update own images"
-- ON storage.objects FOR UPDATE
-- TO authenticated
-- USING (
--   bucket_id = 'images' AND
--   auth.uid()::text = (storage.foldername(name))[2]
-- );

-- 정책 확인
-- SELECT * FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects';








