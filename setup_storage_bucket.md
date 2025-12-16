# Supabase Storage 버킷 설정 가이드

## Storage 버킷 생성 방법

### 1단계: Supabase Dashboard 접속
1. https://supabase.com/dashboard 접속
2. 프로젝트 선택

### 2단계: Storage 메뉴로 이동
- 왼쪽 메뉴에서 **Storage** 클릭

### 3단계: 새 버킷 생성
1. **"New bucket"** 또는 **"Create bucket"** 버튼 클릭
2. 버킷 이름 입력: `images`
3. **Public bucket** 옵션 선택 (이미지 URL을 공개적으로 접근 가능하게 하려면)
   - 또는 **Private bucket** 선택 (인증된 사용자만 접근 가능)
4. **Create bucket** 클릭

### 4단계: RLS 정책 설정 (Private bucket인 경우)

Private bucket을 선택한 경우, 다음 RLS 정책을 추가해야 합니다:

#### Storage Policies 설정
1. Storage → `images` 버킷 클릭
2. **Policies** 탭 클릭
3. **New Policy** 클릭
4. 다음 정책 추가:

**업로드 정책:**
```sql
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'images' AND
  (storage.foldername(name))[1] = 'question-images'
);
```

**읽기 정책:**
```sql
CREATE POLICY "Allow public read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'images');
```

또는 인증된 사용자만 읽기 가능하게 하려면:

```sql
CREATE POLICY "Allow authenticated read"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'images');
```

**삭제 정책:**
```sql
CREATE POLICY "Allow authenticated delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'images' AND
  auth.uid()::text = (storage.foldername(name))[2]
);
```

### 5단계: 확인
- Storage → `images` 버킷이 생성되었는지 확인
- 이미지 업로드를 다시 시도해보세요

## 문제 해결

### 버킷이 이미 있는 경우
- 버킷 이름이 정확히 `images`인지 확인
- 대소문자 구분에 주의

### 권한 오류가 발생하는 경우
- RLS 정책이 올바르게 설정되었는지 확인
- Public bucket으로 설정했는지 확인








