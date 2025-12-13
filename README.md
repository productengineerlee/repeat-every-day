# Certiq - 자격증 학습 플랫폼

React + TypeScript + Vite + Supabase 기반의 자격증 학습 플랫폼입니다.

## 🚀 빠른 시작

자세한 설정 방법은 **[SETUP.md](./SETUP.md)** 파일을 참고하세요.

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.local` 파일에 Supabase 프로젝트 정보를 입력하세요:

```env
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

자세한 설정 방법은 [SETUP.md](./SETUP.md#1-환경-변수-설정)를 참고하세요.

### 3. 개발 서버 시작

```bash
npm run dev
```

## 📦 주요 기능

- 📝 문제 입력 및 관리 (개별/일괄 업로드)
- 🎯 진단 테스트 및 맞춤형 학습
- 📊 학습 통계 및 분석
- 🔄 틀린 문제 복습
- 🎨 다크 모드 지원

## 🛠️ 기술 스택

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL)
- **State Management**: React Context
- **Animation**: Framer Motion
- **Charts**: Recharts

## 📝 스크립트

```bash
# 개발 서버 시작
npm run dev

# 프로덕션 빌드
npm run build

# 린트 검사
npm run lint

# 린트 자동 수정
npm run lint:fix

# 코드 포맷팅
npm run format

# 포맷 검사
npm run format:check

# 프리뷰 (빌드 후)
npm run preview
```

## 🔧 문제 해결

자세한 문제 해결 방법은 [SETUP.md](./SETUP.md#🔧-문제-해결)를 참고하세요.

### 자주 발생하는 에러

1. **"Supabase 클라이언트 생성 실패"**
   - `.env.local` 파일 확인 및 환경 변수 설정
   - 개발 서버 재시작

2. **"Could not find column" 에러**
   - SQL Editor에서 필수 컬럼 추가 스크립트 실행

3. **RLS (권한) 에러**
   - SQL Editor에서 RLS 정책 추가 스크립트 실행

## 📄 라이센스

MIT License
