# Excel 파서 설정 가이드

## 현재 구현 상태

현재 CSV 파일 파싱은 완전히 구현되어 있습니다. Excel 파일(.xlsx, .xls) 파싱을 위해서는 추가 라이브러리 설치가 필요합니다.

## Excel 파일 지원 추가하기

### 1. xlsx 라이브러리 설치

```bash
npm install xlsx
npm install --save-dev @types/xlsx
```

### 2. excelParser.ts 수정

`src/lib/api/excelParser.ts` 파일의 `parseExcelFile` 함수를 다음과 같이 수정하세요:

```typescript
import * as XLSX from 'xlsx'

export async function parseExcelFile(file: File): Promise<ParseResult> {
  const reader = new FileReader()
  return new Promise((resolve, reject) => {
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        
        // 첫 번째 시트 선택
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        
        // CSV로 변환
        const csv = XLSX.utils.sheet_to_csv(worksheet)
        
        // CSV 파서 사용
        const result = parseCSV(csv)
        resolve(result)
      } catch (error) {
        reject({
          success: false,
          questions: [],
          errors: [
            {
              row: 0,
              message: `파일 파싱 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
            },
          ],
          warnings: [],
        })
      }
    }
    reader.onerror = () => {
      reject({
        success: false,
        questions: [],
        errors: [
          {
            row: 0,
            message: '파일을 읽는 중 오류가 발생했습니다.',
          },
        ],
        warnings: [],
      })
    }
    reader.readAsArrayBuffer(file)
  })
}
```

## 대안: SheetJS Community Edition

SheetJS Community Edition은 무료이며 대부분의 Excel 파일을 처리할 수 있습니다.

```bash
npm install xlsx
```

## 라이선스 고려사항

- **xlsx (SheetJS)**: Apache 2.0 라이선스 (상업적 사용 가능)
- **@types/xlsx**: TypeScript 타입 정의

## 테스트

Excel 파일 파싱이 제대로 작동하는지 테스트하려면:

1. Excel에서 템플릿을 열고 데이터를 입력
2. `.xlsx` 형식으로 저장
3. 관리자 페이지에서 업로드 테스트

## 참고

- 현재 구현은 CSV 파일만 완전히 지원합니다.
- Excel 파일 지원은 선택 사항이며, 필요시 위의 단계를 따라 구현할 수 있습니다.








