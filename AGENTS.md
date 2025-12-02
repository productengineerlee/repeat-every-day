# AGENTS.md - Certiq 프로젝트 개발 가이드라인

이 문서는 AI 에이전트가 Certiq 프로젝트에서 작업할 때 따라야 할 규칙과 가이드라인을 정의합니다.

## 핵심 원칙

### 1. shadcn/ui 컴포넌트 우선 사용

- **모든 UI 컴포넌트는 shadcn/ui를 우선적으로 사용**해야 합니다.
- 커스텀 컴포넌트를 만들기 전에 [shadcn/ui 공식 문서](https://ui.shadcn.com/docs/components)에서 적합한 컴포넌트가 있는지 확인하세요.
- shadcn/ui 컴포넌트로 구현 가능한 경우, 직접 구현하지 마세요.

### 2. 컴포넌트 추가 방법

**새로운 shadcn/ui 컴포넌트를 추가할 때는 반드시 터미널 명령어를 사용해야 합니다.**

```bash
# 기본 컴포넌트 추가 명령어
npx shadcn@latest add [component-name]

# 예시
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add dialog
npx shadcn@latest add form
npx shadcn@latest add input
npx shadcn@latest add select
npx shadcn@latest add table
npx shadcn@latest add toast
```

**중요**: 컴포넌트 파일을 직접 생성하거나 복사하지 마세요. 반드시 위의 명령어를 사용하여 추가하세요.

### 3. 프로젝트 구조

```
src/
├── components/        # 재사용 가능한 컴포넌트
│   └── ui/           # shadcn/ui 컴포넌트 (자동 생성)
├── lib/              # 유틸리티 함수
│   └── utils.ts      # cn() 함수 등
├── hooks/            # 커스텀 React 훅
└── ...
```

### 4. 스타일링 규칙

- **Tailwind CSS**를 사용하여 스타일링합니다.
- `cn()` 유틸리티 함수를 사용하여 클래스명을 병합하세요 (이미 `src/lib/utils.ts`에 정의됨).
- shadcn/ui 컴포넌트는 CSS 변수를 통해 테마를 관리합니다 (`components.json`의 `cssVariables: true` 설정).

### 5. 아이콘 사용

- **lucide-react** 라이브러리를 사용합니다 (`components.json`의 `iconLibrary: "lucide"` 설정).
- 아이콘은 `lucide-react`에서 import하여 사용하세요.

```typescript
import { Button } from "@/components/ui/button"
import { Search, User, Settings } from "lucide-react"

export function MyComponent() {
  return (
    <Button>
      <Search className="mr-2 h-4 w-4" />
      검색
    </Button>
  )
}
```

### 6. 컴포넌트 개발 워크플로우

1. **필요한 컴포넌트 확인**: shadcn/ui 문서에서 적합한 컴포넌트 찾기
2. **컴포넌트 추가**: `npx shadcn@latest add [component-name]` 명령어 실행
3. **컴포넌트 사용**: `@/components/ui/[component-name]`에서 import하여 사용
4. **커스터마이징**: 필요시 컴포넌트를 수정하되, 원본 구조는 유지

### 7. 사용 가능한 shadcn/ui 컴포넌트 예시

- **레이아웃**: Card, Separator, Tabs, Accordion
- **폼**: Button, Input, Select, Checkbox, Radio Group, Switch, Textarea, Form
- **피드백**: Alert, Toast, Dialog, Alert Dialog, Popover, Tooltip
- **데이터 표시**: Table, Badge, Avatar, Progress, Skeleton
- **네비게이션**: Breadcrumb, Dropdown Menu, Navigation Menu, Pagination
- **오버레이**: Sheet, Drawer, Context Menu

### 8. 코드 작성 규칙

- **TypeScript**를 사용합니다.
- 컴포넌트는 함수형 컴포넌트로 작성합니다.
- Props는 TypeScript 인터페이스로 타입을 정의합니다.
- 파일명은 PascalCase를 사용합니다 (예: `MyComponent.tsx`).

### 9. 예시 코드

```typescript
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface MyCardProps {
  title: string
  description?: string
  className?: string
}

export function MyCard({ title, description, className }: MyCardProps) {
  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <Input placeholder="입력하세요" />
        <Button className="mt-4">제출</Button>
      </CardContent>
    </Card>
  )
}
```

### 10. 주의사항

- ❌ **하지 말아야 할 것**:
  - shadcn/ui 컴포넌트를 직접 복사하여 생성
  - shadcn/ui로 구현 가능한데 직접 구현
  - 컴포넌트 추가 시 터미널 명령어 사용 생략

- ✅ **해야 할 것**:
  - 새로운 컴포넌트가 필요할 때 `npx shadcn@latest add` 명령어 사용
  - shadcn/ui 문서를 참고하여 적합한 컴포넌트 선택
  - `cn()` 유틸리티 함수로 클래스명 병합
  - lucide-react 아이콘 사용

## 참고 자료

- [shadcn/ui 공식 문서](https://ui.shadcn.com/)
- [shadcn/ui 컴포넌트 목록](https://ui.shadcn.com/docs/components)
- [Tailwind CSS 문서](https://tailwindcss.com/docs)
- [lucide-react 아이콘](https://lucide.dev/icons/)

