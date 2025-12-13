# Certiq 프로젝트 설정 가이드

## 🚀 빠른 시작

### 1. 환경 변수 설정

프로젝트 루트에 `.env.local` 파일이 생성되어 있습니다. 실제 Supabase 프로젝트 정보로 업데이트해야 합니다.

#### Supabase 프로젝트 생성

1. [Supabase](https://supabase.com) 웹사이트 방문
2. "Start your project" 클릭 (무료 계정 생성)
3. 새 프로젝트 생성
   - Project Name: `certiq` (또는 원하는 이름)
   - Database Password: 안전한 비밀번호 설정
   - Region: `Northeast Asia (Seoul)` 선택 권장

#### API 키 가져오기

프로젝트가 생성되면:

1. Supabase Dashboard → 왼쪽 메뉴에서 **Settings** (⚙️) 클릭
2. **API** 탭 선택
3. 다음 정보를 복사:
   - **Project URL** (예: `https://abcdefghijk.supabase.co`)
   - **anon public** 키

#### .env.local 파일 업데이트

`.env.local` 파일을 열고 복사한 값으로 업데이트:

```env
VITE_SUPABASE_URL=https://여기에-프로젝트-URL-입력.supabase.co
VITE_SUPABASE_ANON_KEY=여기에-anon-public-키-입력
```

### 2. 데이터베이스 테이블 생성

Supabase Dashboard → **SQL Editor**로 이동하여 다음 SQL 파일들을 순서대로 실행:

1. **questions 테이블 생성**
   ```sql
   -- 프로젝트 루트의 create_questions_table.sql 파일 내용 복사 후 실행
   ```

2. **필수 컬럼 추가**
   ```sql
   -- 프로젝트 루트의 add_questions_columns.sql 파일 내용 복사 후 실행
   ```

3. **기출년도 컬럼 추가** (선택사항)
   ```sql
   -- 프로젝트 루트의 add_exam_year_column.sql 파일 내용 복사 후 실행
   ```

4. **RLS (Row Level Security) 정책 추가**
   ```sql
   -- 프로젝트 루트의 add_questions_insert_policy.sql 파일 내용 복사 후 실행
   ```

### 3. 개발 서버 시작

```bash
# 의존성 설치 (처음 한 번만)
npm install

# 개발 서버 시작
npm run dev
```

브라우저에서 `http://localhost:5173` 접속

## 📝 주요 SQL 파일 설명

프로젝트 루트에 다음 SQL 파일들이 있습니다:

- `create_questions_table.sql` - questions 테이블 생성
- `add_questions_columns.sql` - sub_content, sub_content_image_url 컬럼 추가
- `add_exam_year_column.sql` - exam_year 컬럼 추가
- `add_questions_insert_policy.sql` - INSERT 권한 정책
- `add_questions_update_policy.sql` - UPDATE 권한 정책
- `add_questions_delete_policy.sql` - DELETE 권한 정책

## 🔧 문제 해결

### "Supabase 클라이언트 생성 실패" 에러

- `.env.local` 파일이 있는지 확인
- 환경 변수 값이 올바르게 입력되었는지 확인
- 개발 서버를 재시작 (`Ctrl+C` 후 `npm run dev`)

### "Could not find column" 에러

- SQL Editor에서 `add_questions_columns.sql` 실행
- 또는 콘솔 에러 메시지에서 "SQL 직접 실행하기" 섹션 참고

### RLS (권한) 에러

- SQL Editor에서 `add_questions_insert_policy.sql` 실행
- 개발 단계에서는 모든 인증된 사용자에게 권한 부여
- 프로덕션에서는 is_admin 체크로 변경 권장

## 📚 추가 정보

- [Supabase 공식 문서](https://supabase.com/docs)
- [React + Vite 가이드](https://vitejs.dev/guide/)
- [Tailwind CSS 문서](https://tailwindcss.com/docs)





