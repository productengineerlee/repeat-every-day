/**
 * Excel/CSV 파일 파서
 * 문제 일괄 업로드를 위한 파싱 로직
 */

import type { QuestionInput } from './questions'

export interface ExcelRow {
  자격증: string
  과정분류?: string // 1-9 (정보처리기사, 컴퓨터활용능력, 빅데이터분석기사, 경영정보시각화능력, ADsP, SQLD, 사회조사분석사, TESAT, 공인중개사)
  과목분류?: string // 1-6 (1과목, 2과목, 3과목, 4과목, 5과목, 6과목)
  주요항목?: string
  세부항목?: string
  세세항목?: string
  카테고리?: string // 기존 형식 지원 (1-2-3-4-5)
  레이블?: string // 자동 생성 또는 수동 입력
  문제제시문: string
  서브제시문?: string // 값 없음 허용
  선택지1: string
  선택지2: string
  선택지3: string
  선택지4: string
  선택지5?: string // 값 없음 허용 (4지선다인 경우)
  정답: string // 공백 허용
  해설?: string // 값 없음 허용
  난이도?: string // 값 없음 허용
  태그?: string
  기출년도?: string // 값 없음 허용
  기출회차?: string // 값 없음 허용
  기출번호?: string // 값 없음 허용
  출제빈도?: string // 값 없음 허용
  이미지URL?: string
}

export interface ParseResult {
  success: boolean
  questions: QuestionInput[]
  errors: ParseError[]
  warnings: ParseWarning[]
}

export interface ParseError {
  row: number
  field?: string
  message: string
  value?: string
}

export interface ParseWarning {
  row: number
  message: string
  value?: string
}

/**
 * JSON 배열 데이터를 직접 파싱하여 QuestionInput 배열로 변환
 * (Excel 파일에서 sheet_to_json으로 변환한 데이터 처리용)
 * @param jsonData 2차원 배열 데이터 (첫 행은 헤더)
 * @returns 파싱 결과
 */
export function parseJSONData(jsonData: Array<Array<string | number>>): ParseResult {
  if (jsonData.length < 2) {
    return {
      success: false,
      questions: [],
      errors: [
        {
          row: 0,
          message: '데이터에 헤더와 데이터가 없습니다.',
        },
      ],
      warnings: [],
    }
  }

  // 헤더 파싱
  const headers = jsonData[0].map(h => String(h || ''))
  
  // 헤더 정규화 및 매핑
  const normalizedHeaders = headers.map(h => h.trim())
  const headerMapping = createFlexibleHeaderMapping(normalizedHeaders)
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📋 JSON 데이터 헤더 파싱 시작')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('원본 헤더:', headers)
  console.log('헤더 개수:', headers.length)
  console.log('정규화된 헤더:', normalizedHeaders)
  console.log('헤더 매핑 결과:', headerMapping)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  
  // 기출 관련 헤더의 인덱스 확인
  const 기출년도인덱스 = normalizedHeaders.findIndex(h => h.includes('기출년도') || h.includes('기출 년도'))
  const 기출회차인덱스 = normalizedHeaders.findIndex(h => (h.includes('기출회차') || h.includes('기출 회차')) && !h.includes('년도'))
  const 기출번호인덱스 = normalizedHeaders.findIndex(h => (h.includes('기출번호') || h.includes('기출 번호')) && !h.includes('년도') && !h.includes('회차'))
  
  console.log('🔍 기출 헤더 인덱스:')
  console.log(`  기출년도: 인덱스 ${기출년도인덱스} (헤더: "${normalizedHeaders[기출년도인덱스]}")`)
  console.log(`  기출회차: 인덱스 ${기출회차인덱스} (헤더: "${normalizedHeaders[기출회차인덱스]}")`)
  console.log(`  기출번호: 인덱스 ${기출번호인덱스} (헤더: "${normalizedHeaders[기출번호인덱스]}")`)
  
  const questions: QuestionInput[] = []
  const errors: ParseError[] = []
  const warnings: ParseWarning[] = []

  // 데이터 행 파싱 (첫 행은 헤더이므로 1부터 시작)
  for (let i = 1; i < jsonData.length; i++) {
    const values = jsonData[i].map(v => String(v || ''))

    if (values.length === 0) continue // 빈 행 건너뛰기
    
    // 모든 값이 비어있는 행은 조용히 건너뛰기
    const hasAnyValue = values.some(v => v && v.trim() !== '')
    if (!hasAnyValue) {
      continue
    }

    const rowData: Partial<ExcelRow> = {}
    
    // 기출년도와 기출회차 값을 직접 저장
    if (기출년도인덱스 >= 0 && values[기출년도인덱스]) {
      rowData.기출년도 = values[기출년도인덱스].trim()
    }
    if (기출회차인덱스 >= 0 && values[기출회차인덱스]) {
      const sessionValue = values[기출회차인덱스].trim()
      // 2자리로 포맷팅
      const sessionNum = parseInt(sessionValue, 10)
      if (!isNaN(sessionNum)) {
        rowData.기출회차 = String(sessionNum).padStart(2, '0')
      } else {
        rowData.기출회차 = sessionValue
      }
    }
    if (기출번호인덱스 >= 0 && values[기출번호인덱스]) {
      rowData.기출번호 = values[기출번호인덱스].trim()
    }
    
    // 헤더 매핑을 사용하여 데이터 매핑
    normalizedHeaders.forEach((header, index) => {
      const mappedKey = headerMapping[header]
      const rawValue = values[index]
      
      // 값이 undefined이거나 null인 경우 빈 문자열로 처리
      const value = (rawValue !== undefined && rawValue !== null) ? String(rawValue).trim() : ''
      
      if (mappedKey && value) {
        rowData[mappedKey as keyof ExcelRow] = value
      }
    })
    
    // 카테고리 조합
    if (rowData.과정분류 || rowData.과목분류 || rowData.주요항목 || rowData.세부항목 || rowData.세세항목) {
      const categoryParts: string[] = []
      if (rowData.과정분류?.trim()) categoryParts.push(rowData.과정분류.trim())
      if (rowData.과목분류?.trim()) categoryParts.push(rowData.과목분류.trim())
      if (rowData.주요항목?.trim()) categoryParts.push(rowData.주요항목.trim())
      if (rowData.세부항목?.trim()) categoryParts.push(rowData.세부항목.trim())
      if (rowData.세세항목?.trim()) categoryParts.push(rowData.세세항목.trim())
      
      if (categoryParts.length > 0) {
        rowData.카테고리 = categoryParts.join('-')
      }
    }
    
    // 자격증이 없으면 과정분류에서 추출 시도
    if (!rowData.자격증 && rowData.과정분류) {
      const certificationMap: Record<string, string> = {
        '1': '정보처리기사',
        '2': '컴퓨터활용능력',
        '3': '빅데이터분석기사',
        '4': '경영정보시각화능력',
        '5': 'ADsP',
        '6': 'SQLD',
        '7': '사회조사분석사',
        '8': 'TESAT',
        '9': '공인중개사',
      }
      rowData.자격증 = certificationMap[rowData.과정분류.trim()]
    }

    // 디버깅 로그 (첫 번째 행과 중간 행)
    if (i === 1 || i === Math.floor(jsonData.length / 2)) {
      console.log(`\n📊 ========== 데이터 행 ${i} (엑셀 행 ${i + 1}) ==========`)
      console.log('📋 전체 헤더 개수:', normalizedHeaders.length)
      console.log('📝 전체 값 개수:', values.length)
      console.log('🔍 기출 관련 값:')
      if (기출년도인덱스 >= 0) {
        console.log(`  → 기출년도 [${기출년도인덱스}]: "${values[기출년도인덱스]}" → rowData.기출년도: "${rowData.기출년도}"`)
      }
      if (기출회차인덱스 >= 0) {
        console.log(`  → 기출회차 [${기출회차인덱스}]: "${values[기출회차인덱스]}" → rowData.기출회차: "${rowData.기출회차}"`)
      }
      if (기출번호인덱스 >= 0) {
        console.log(`  → 기출번호 [${기출번호인덱스}]: "${values[기출번호인덱스]}" → rowData.기출번호: "${rowData.기출번호}"`)
      }
    }
    
    // 행 데이터 검증 및 변환
    const result = parseRow(rowData, i + 1)
    
    if (result.errors.length === 0 && result.question) {
      questions.push(result.question)
    } else {
      errors.push(...result.errors)
    }
    
    warnings.push(...result.warnings)
  }

  const hasErrors = errors.length > 0
  
  return {
    success: !hasErrors || questions.length > 0,
    questions,
    errors,
    warnings,
  }
}

/**
 * CSV 파일을 파싱하여 QuestionInput 배열로 변환
 * @param csvContent CSV 파일 내용
 * @returns 파싱 결과
 */
export function parseCSV(csvContent: string): ParseResult {
  // 줄바꿈 문자 정규화 (Windows: \r\n, Mac: \r, Unix: \n)
  const normalizedContent = csvContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const lines = normalizedContent.split('\n').filter((line) => line.trim() !== '')
  
  if (lines.length < 2) {
    return {
      success: false,
      questions: [],
      errors: [
        {
          row: 0,
          message: 'CSV 파일에 헤더와 데이터가 없습니다.',
        },
      ],
      warnings: [],
    }
  }

  // 헤더 파싱
  const headerLine = lines[0]
  const headers = parseCSVLine(headerLine)
  
  // 헤더 정규화 및 매핑 (공백 제거, 유사한 이름 매핑)
  const normalizedHeaders = headers.map(h => h.trim())
  const headerMapping = createFlexibleHeaderMapping(normalizedHeaders)
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📋 CSV 헤더 파싱 시작')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('원본 헤더:', headers)
  console.log('헤더 개수:', headers.length)
  console.log('정규화된 헤더:', normalizedHeaders)
  console.log('헤더 매핑 결과:', headerMapping)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  
  // 기출 관련 헤더의 인덱스 확인
  const 기출년도인덱스 = normalizedHeaders.findIndex(h => h.includes('기출년도') || h.includes('기출 년도'))
  const 기출회차인덱스 = normalizedHeaders.findIndex(h => (h.includes('기출회차') || h.includes('기출 회차')) && !h.includes('년도'))
  const 기출번호인덱스 = normalizedHeaders.findIndex(h => (h.includes('기출번호') || h.includes('기출 번호')) && !h.includes('년도') && !h.includes('회차'))
  
  console.log('🔍 기출 헤더 인덱스:')
  console.log(`  기출년도: 인덱스 ${기출년도인덱스} (헤더: "${normalizedHeaders[기출년도인덱스]}")`)
  console.log(`  기출회차: 인덱스 ${기출회차인덱스} (헤더: "${normalizedHeaders[기출회차인덱스]}")`)
  console.log(`  기출번호: 인덱스 ${기출번호인덱스} (헤더: "${normalizedHeaders[기출번호인덱스]}")`)
  
  // 기출정보 필드 매핑 확인
  const examFields = ['기출년도', '기출회차', '기출번호']
  const examFieldMapping = examFields.map(field => {
    const mappedHeader = Object.keys(headerMapping).find(key => headerMapping[key] === field)
    return { field, mappedHeader, found: !!mappedHeader }
  })
  console.log('🔍 기출정보 필드 매핑 확인:', examFieldMapping)
  
  // 매핑되지 않은 헤더 확인 (디버깅용)
  const unmappedHeaders = normalizedHeaders.filter(h => !headerMapping[h] && h.trim() !== '')
  if (unmappedHeaders.length > 0) {
    console.warn('⚠️ 매핑되지 않은 헤더:', unmappedHeaders)
  }
  
  // 필수 필드 매핑 확인
  const requiredFields: Array<{ field: keyof ExcelRow; name: string }> = [
    { field: '자격증', name: '자격증' },
    { field: '과정분류', name: '과정분류' }, // 카테고리의 첫 번째 필드
    { field: '문제제시문', name: '문제제시문' },
  ]
  const missingFields = requiredFields.filter(({ field }) => 
    !Object.values(headerMapping).includes(field)
  )
  
  // 첫 번째 데이터 행으로부터 필수 필드 추론 시도
  if (missingFields.length > 0 && lines.length > 1) {
    const firstDataLine = lines[1]
    const firstDataValues = parseCSVLine(firstDataLine)
    
    console.warn('⚠️ 필수 필드가 매핑되지 않았습니다:', missingFields.map(f => f.name))
    console.log('💡 사용 가능한 헤더:', normalizedHeaders)
    
    // 데이터 기반 자동 매핑 시도
    const autoMapping = inferMissingFields(
      normalizedHeaders,
      firstDataValues,
      headerMapping,
      missingFields.map(f => f.field)
    )
    
    if (Object.keys(autoMapping).length > 0) {
      console.log('🔧 자동 매핑 시도:', autoMapping)
      Object.assign(headerMapping, autoMapping)
    }
  }

  const questions: QuestionInput[] = []
  const errors: ParseError[] = []
  const warnings: ParseWarning[] = []

  // 데이터 행 파싱
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    const values = parseCSVLine(line)

    if (values.length === 0) continue // 빈 행 건너뛰기
    
    // 모든 값이 비어있는 행은 조용히 건너뛰기 (경고/에러 없음)
    const hasAnyValue = values.some(v => v && v.trim() !== '')
    if (!hasAnyValue) {
      continue // 완전히 빈 행은 아무것도 표시하지 않고 건너뛰기
    }

    const rowData: Partial<ExcelRow> = {}
    let 기출년도 = ''
    let 기출회차번호 = ''
    
    // 헤더 매핑을 사용하여 데이터 매핑
    normalizedHeaders.forEach((header, index) => {
      const mappedKey = headerMapping[header]
      const rawValue = values[index]
      
      // 값이 undefined이거나 null인 경우 빈 문자열로 처리
      const value = (rawValue !== undefined && rawValue !== null) ? String(rawValue).trim() : ''
      
      // "문제서브제ㅅ 선택지1" 같은 잘못된 헤더명 처리
      // 헤더에 "선택지1"이 포함되어 있으면 선택지1로 처리
      if (header.includes('선택지1') || header.includes('선택지 1')) {
        // 값이 ①로 시작하면 선택지1로 처리
        if (value && value.trim().startsWith('①')) {
          rowData.선택지1 = value.trim()
        } else if (value) {
          // ①가 없어도 값이 있으면 선택지1로 처리
          rowData.선택지1 = value.trim()
        }
      } else if (mappedKey) {
        // "정답 해설" 컬럼인 경우 분리 처리
        if ((header.includes('정답') && header.includes('해설')) || 
            header.includes('정답해설') || 
            header.includes('answer explanation')) {
          // 값이 비어있지 않은 경우에만 처리
          if (value && value.trim()) {
            // 공백, 탭, 쉼표 등으로 분리 시도
            const separators = [/\s+/, /\t/, /,/, /;/]
            let parts: string[] = [value]
            
            for (const sep of separators) {
              const testParts = value.split(sep)
              if (testParts.length >= 2 && testParts[0].trim().length <= 5) {
                // 첫 번째 부분이 짧으면(정답일 가능성) 분리 성공
                parts = testParts
                break
              }
            }
            
            if (parts.length > 0) {
              const firstPart = parts[0].trim()
              // 첫 번째 부분이 A-E 또는 ①-⑤ 또는 1-5 형식이면 정답으로 처리
              if (/^[A-Ea-e①②③④⑤1-5]$/.test(firstPart) || firstPart.length <= 2) {
                rowData['정답' as keyof ExcelRow] = firstPart
                // 나머지를 해설로 사용 (해설이 비어있을 때만)
                if (parts.length > 1 && !rowData.해설) {
                  rowData['해설' as keyof ExcelRow] = parts.slice(1).join(' ').trim()
                }
              } else {
                // 첫 번째 부분이 정답 형식이 아니면 전체를 해설로 처리
                if (!rowData.해설) {
                  rowData['해설' as keyof ExcelRow] = value
                }
              }
            }
          }
        } else {
          // 빈 값도 저장 (나중에 검증에서 처리)
          rowData[mappedKey as keyof ExcelRow] = value
        }
      }
      
  // 기출년도와 기출회차가 분리된 경우 처리 (매핑과 별도로 처리)
  // 헤더 매핑이 안 된 경우를 대비해 직접 확인
  if (header.includes('기출년도') || header.includes('기출 년도')) {
    기출년도 = value
    // rowData에 직접 저장 (덮어쓰기)
    rowData.기출년도 = value
  }
  if (header.includes('기출회차') && !header.includes('년도')) {
    기출회차번호 = value
    // rowData에 직접 저장 (덮어쓰기)
    rowData.기출회차 = value
  }
  if (header.includes('기출번호') && !header.includes('년도') && !header.includes('회차')) {
    // rowData에 직접 저장 (덮어쓰기)
    rowData.기출번호 = value
  }
    })
    
    // 기출년도와 기출회차가 분리된 경우 각각 저장 (위에서 이미 저장했지만 안전장치)
    if (기출년도 && !rowData.기출년도) {
      rowData.기출년도 = 기출년도
    }
    if (기출회차번호 && !rowData.기출회차) {
      // 기출회차번호를 숫자로 변환 후 2자리로 포맷팅 (37 -> 37, 1 -> 01)
      const sessionNum = parseInt(기출회차번호.trim(), 10)
      if (!isNaN(sessionNum)) {
        rowData.기출회차 = String(sessionNum).padStart(2, '0')
      } else {
        rowData.기출회차 = 기출회차번호.padStart(2, '0')
      }
    }
    
    // 기출회차가 "YYYY-MM" 형식인 경우 분리 (기출년도가 없을 때만)
    if (rowData.기출회차 && rowData.기출회차.includes('-') && !rowData.기출년도) {
      const parts = rowData.기출회차.split('-')
      if (parts.length === 2 && /^\d{4}$/.test(parts[0]) && /^\d{2}$/.test(parts[1])) {
        rowData.기출년도 = parts[0]
        rowData.기출회차 = parts[1]
      }
    }
    
    // 카테고리 조합: 5개 필드가 있으면 조합, 없으면 기존 카테고리 사용
    if (rowData.과정분류 || rowData.과목분류 || rowData.주요항목 || rowData.세부항목 || rowData.세세항목) {
      const categoryParts: string[] = []
      if (rowData.과정분류?.trim()) categoryParts.push(rowData.과정분류.trim())
      if (rowData.과목분류?.trim()) categoryParts.push(rowData.과목분류.trim())
      if (rowData.주요항목?.trim()) categoryParts.push(rowData.주요항목.trim())
      if (rowData.세부항목?.trim()) categoryParts.push(rowData.세부항목.trim())
      if (rowData.세세항목?.trim()) categoryParts.push(rowData.세세항목.trim())
      
      if (categoryParts.length > 0) {
        rowData.카테고리 = categoryParts.join('-')
      }
    }
    
    // 자격증이 없으면 과정분류 또는 카테고리에서 추출 시도
    if (!rowData.자격증) {
      let 대분류번호 = ''
      
      // 과정분류가 있으면 사용
      if (rowData.과정분류?.trim()) {
        대분류번호 = rowData.과정분류.trim()
      } else if (rowData.카테고리) {
        // 기존 카테고리 형식에서 추출
        const categoryParts = rowData.카테고리.split('-')
        if (categoryParts.length > 0) {
          대분류번호 = categoryParts[0]
        }
      }
      
      if (대분류번호) {
        const certificationMap: Record<string, string> = {
          '1': '정보처리기사',
          '2': '컴퓨터활용능력',
          '3': '빅데이터분석기사',
          '4': '경영정보시각화능력',
          '5': 'ADsP',
          '6': 'SQLD',
          '7': '사회조사분석사',
          '8': 'TESAT',
          '9': '공인중개사',
        }
        if (certificationMap[대분류번호]) {
          rowData.자격증 = certificationMap[대분류번호]
        }
      }
    }
    
    // 레이블 자동 생성: 카테고리가 있으면 레이블로 사용 (수동 입력이 없을 경우)
    if (!rowData.레이블 && rowData.카테고리) {
      rowData.레이블 = rowData.카테고리
    }
    
    // 첫 번째 행과 중간 행 상세 디버깅
    if (i === 1 || i === Math.floor(lines.length / 2)) {
      console.log(`\n📊 ========== 데이터 행 ${i} (엑셀 행 ${i + 1}) ==========`)
      console.log('📋 전체 헤더 개수:', normalizedHeaders.length)
      console.log('📝 전체 값 개수:', values.length)
      console.log('📋 전체 헤더:', normalizedHeaders)
      console.log('📝 전체 값:', values)
      
      // 기출 관련 헤더 찾기
      const 기출년도헤더 = normalizedHeaders.find(h => h.includes('기출년도') || h.includes('기출 년도'))
      const 기출회차헤더 = normalizedHeaders.find(h => (h.includes('기출회차') || h.includes('기출 회차')) && !h.includes('년도'))
      const 기출번호헤더 = normalizedHeaders.find(h => (h.includes('기출번호') || h.includes('기출 번호')) && !h.includes('년도') && !h.includes('회차'))
      
      console.log('🔍 기출 관련 헤더:')
      console.log('  기출년도 헤더:', 기출년도헤더 || '(없음)')
      console.log('  기출회차 헤더:', 기출회차헤더 || '(없음)')
      console.log('  기출번호 헤더:', 기출번호헤더 || '(없음)')
      
      if (기출년도헤더) {
        const idx = normalizedHeaders.indexOf(기출년도헤더)
        console.log(`  → 기출년도 인덱스: ${idx}`)
        console.log(`  → 기출년도 값: "${values[idx]}" (타입: ${typeof values[idx]}, 길이: ${values[idx]?.length || 0})`)
        console.log(`  → values 배열 범위: 0 ~ ${values.length - 1}`)
      }
      if (기출회차헤더) {
        const idx = normalizedHeaders.indexOf(기출회차헤더)
        console.log(`  → 기출회차 인덱스: ${idx}`)
        console.log(`  → 기출회차 값: "${values[idx]}" (타입: ${typeof values[idx]}, 길이: ${values[idx]?.length || 0})`)
      }
      if (기출번호헤더) {
        const idx = normalizedHeaders.indexOf(기출번호헤더)
        console.log(`  → 기출번호 인덱스: ${idx}`)
        console.log(`  → 기출번호 값: "${values[idx]}" (타입: ${typeof values[idx]}, 길이: ${values[idx]?.length || 0})`)
      }
      
      console.log('💾 rowData 기출정보:')
      console.log('  rowData.기출년도:', rowData.기출년도, `(타입: ${typeof rowData.기출년도})`)
      console.log('  rowData.기출회차:', rowData.기출회차, `(타입: ${typeof rowData.기출회차})`)
      console.log('  rowData.기출번호:', rowData.기출번호, `(타입: ${typeof rowData.기출번호})`)
      
      console.log('🔗 헤더 매핑 (기출 관련만):')
      Object.entries(headerMapping).forEach(([header, field]) => {
        if (header.includes('기출') || field.includes('기출')) {
          console.log(`  "${header}" → "${field}"`)
        }
      })
    }

    // 행 데이터 검증 및 변환 (값이 하나라도 있는 행만 처리)
    const result = parseRow(rowData, i + 1)
    
    // 에러가 있는 행의 원본 데이터 로깅 (디버깅용)
    if (result.errors.length > 0 && result.errors.some(e => e.field === '자격증' || e.field === '카테고리' || e.field === '문제제시문' || e.field === '레이블')) {
      console.warn(`⚠️ 행 ${i + 1} 파싱 문제:`, {
        원본값: values,
        원본값개수: values.length,
        헤더개수: normalizedHeaders.length,
        매핑된데이터: rowData,
        에러: result.errors.map(e => e.message),
      })
    }
    if (result.question) {
      questions.push(result.question)
    } else {
      console.warn(`⚠️ 행 ${i + 1}: 문제 생성 실패로 스킵됨 (필수 필드 누락 또는 검증 실패)`)
    }
    if (result.errors.length > 0) {
      errors.push(...result.errors)
    }
    if (result.warnings.length > 0) {
      warnings.push(...result.warnings)
    }
  }

  console.log('\n📊 ========== 파싱 완료 ==========')
  console.log(`  전체 행 수: ${lines.length - 1}개 (헤더 제외)`)
  console.log(`  성공: ${questions.length}개`)
  console.log(`  스킵: ${lines.length - 1 - questions.length}개`)
  console.log(`  에러: ${errors.length}개`)
  console.log(`  경고: ${warnings.length}개`)
  console.log(`====================================\n`)
  
  return {
    success: errors.length === 0,
    questions,
    errors,
    warnings,
  }
}

/**
 * CSV 라인 파싱 (쉼표로 구분, 따옴표 처리)
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // 이스케이프된 따옴표
        current += '"'
        i++
      } else {
        // 따옴표 시작/끝
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      // 쉼표로 구분
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }
  result.push(current) // 마지막 필드

  return result
}

/**
 * 헤더 맵 생성 (한글/영문 매핑)
 */
function createHeaderMap(headers: string[]): Record<string, number> {
  const map: Record<string, number> = {}
  headers.forEach((header, index) => {
    map[header.trim()] = index
  })
  return map
}

/**
 * 데이터 기반으로 누락된 필드 추론
 */
function inferMissingFields(
  headers: string[],
  firstRowValues: string[],
  existingMapping: Record<string, keyof ExcelRow>,
  missingFields: Array<keyof ExcelRow>
): Record<string, keyof ExcelRow> {
  const inferred: Record<string, keyof ExcelRow> = {}
  
  headers.forEach((header, index) => {
    // 이미 매핑된 헤더는 건너뛰기
    if (existingMapping[header] || inferred[header]) return
    
    const value = (firstRowValues[index] || '').trim()
    if (!value) return
    
    // 정답 추론: A-E, ①-⑤, 1-5 형식
    if (missingFields.includes('정답') && !inferred[header]) {
      if (/^[A-Ea-e①②③④⑤1-5]$/.test(value)) {
        inferred[header] = '정답'
        return
      }
    }
    
    // 난이도 추론: 상, 중, 하
    if (missingFields.includes('난이도') && !inferred[header]) {
      if (['상', '중', '하', 'high', 'medium', 'low', 'HIGH', 'MEDIUM', 'LOW'].includes(value)) {
        inferred[header] = '난이도'
        return
      }
    }
    
    // 해설 추론: 긴 텍스트 (20자 이상)
    if (missingFields.includes('해설') && !inferred[header]) {
      if (value.length > 20 && !value.match(/^[A-Ea-e①②③④⑤1-5]$/)) {
        inferred[header] = '해설'
        return
      }
    }
    
    // 카테고리 추론: 숫자-숫자 형식
    if (missingFields.includes('카테고리') && !inferred[header]) {
      if (/^\d+(-\d+)+$/.test(value)) {
        inferred[header] = '카테고리'
        return
      }
    }
    
    // 문제제시문 추론: 긴 텍스트 (10자 이상, 정답/난이도가 아님)
    if (missingFields.includes('문제제시문') && !inferred[header]) {
      if (value.length > 10 && 
          !/^[A-Ea-e①②③④⑤1-5]$/.test(value) &&
          !['상', '중', '하'].includes(value) &&
          !/^\d+(-\d+)+$/.test(value)) {
        inferred[header] = '문제제시문'
        return
      }
    }
  })
  
  return inferred
}

/**
 * 유연한 헤더 매핑 생성 (다양한 헤더 이름 지원)
 */
function createFlexibleHeaderMapping(headers: string[]): Record<string, keyof ExcelRow> {
  const mapping: Record<string, keyof ExcelRow> = {}
  
  // 헤더 이름 매핑 규칙 (우선순위 순서대로)
  const headerRules: Array<{ patterns: string[]; key: keyof ExcelRow; priority: number }> = [
    // 정답/해설 통합 컬럼 (우선순위 높음)
    { patterns: ['정답 해설', '정답해설', 'answer explanation'], key: '정답', priority: 1 },
    // 필수 필드
    { patterns: ['정답', 'answer', 'correct', '정답번호'], key: '정답', priority: 2 },
    { patterns: ['해설', 'explanation', '설명', '해설문'], key: '해설', priority: 2 },
    { patterns: ['난이도', 'difficulty', 'level'], key: '난이도', priority: 2 },
    // 자격증/카테고리
    { patterns: ['자격증', 'certification', '자격증선택'], key: '자격증', priority: 3 },
    { patterns: ['카테고리', 'category'], key: '카테고리', priority: 3 },
    // 카테고리 분류 필드 (5개 필드)
    { patterns: ['과정분류'], key: '과정분류', priority: 3 },
    { patterns: ['과목분류'], key: '과목분류', priority: 3 },
    { patterns: ['주요항목'], key: '주요항목', priority: 3 },
    { patterns: ['세부항목'], key: '세부항목', priority: 3 },
    { patterns: ['세세항목'], key: '세세항목', priority: 3 },
    // 문제 내용
    { patterns: ['문제제시문', '문제 제시문', '문제', 'question', '문제내용'], key: '문제제시문', priority: 3 },
    { patterns: ['서브제시문', '서브 제시문', '문제서브제시문', '문제 서브 제시문', '문제 서브제시문', 'sub'], key: '서브제시문', priority: 3 },
    // 레이블 (자동 생성 또는 수동 입력)
    { patterns: ['레이블', 'label'], key: '레이블', priority: 3 },
    // 선택지
    { patterns: ['선택지1', '선택지 1', 'option1', '보기1'], key: '선택지1', priority: 3 },
    { patterns: ['선택지2', '선택지 2', 'option2', '보기2'], key: '선택지2', priority: 3 },
    { patterns: ['선택지3', '선택지 3', 'option3', '보기3'], key: '선택지3', priority: 3 },
    { patterns: ['선택지4', '선택지 4', 'option4', '보기4'], key: '선택지4', priority: 3 },
    { patterns: ['선택지5', '선택지 5', 'option5', '보기5'], key: '선택지5', priority: 3 },
    // 기타
    { patterns: ['태그', 'tag', 'tags'], key: '태그', priority: 4 },
    { patterns: ['기출년도', '기출 년도', 'exam_year', 'examYear'], key: '기출년도', priority: 4 },
    { patterns: ['기출회차', '기출 회차', 'exam_session', 'examSession'], key: '기출회차', priority: 4 },
    { patterns: ['기출번호', '기출 번호', 'exam_number', 'examNumber'], key: '기출번호', priority: 4 },
    { patterns: ['출제빈도', '출제 빈도', 'frequency'], key: '출제빈도', priority: 4 },
    { patterns: ['이미지URL', '이미지 URL', 'image_url', 'imageUrl', '이미지'], key: '이미지URL', priority: 4 },
  ]
  
  headers.forEach((header) => {
    const normalizedHeader = header.trim()
    if (!normalizedHeader) return // 빈 헤더 건너뛰기
    
    // 이미 매핑된 헤더는 건너뛰기
    if (mapping[normalizedHeader]) return
    
    // 우선순위 순서대로 매칭 시도
    const sortedRules = [...headerRules].sort((a, b) => a.priority - b.priority)
    
    // 정확히 일치하는 경우
    for (const rule of sortedRules) {
      if (rule.patterns.some(pattern => normalizedHeader === pattern)) {
        mapping[normalizedHeader] = rule.key
        return
      }
    }
    
    // 부분 일치하는 경우 (공백 무시, 대소문자 무시)
    for (const rule of sortedRules) {
      const matched = rule.patterns.some(pattern => {
        const normalizedPattern = pattern.replace(/\s+/g, '').toLowerCase()
        const normalizedHeaderNoSpace = normalizedHeader.replace(/\s+/g, '').toLowerCase()
        // 헤더에 패턴이 포함되거나, 패턴에 헤더가 포함되는 경우
        return normalizedHeaderNoSpace.includes(normalizedPattern) || 
               normalizedPattern.includes(normalizedHeaderNoSpace) ||
               normalizedHeaderNoSpace === normalizedPattern
      })
      if (matched) {
        mapping[normalizedHeader] = rule.key
        return
      }
    }
    
    // 한글 자모 단위 매칭 (예: "정답"과 "정답번호" 매칭)
    for (const rule of sortedRules) {
      const matched = rule.patterns.some(pattern => {
        // 한글인 경우 초성/중성/종성 분리하여 매칭
        const patternChars = pattern.split('')
        const headerChars = normalizedHeader.split('')
        
        // 패턴의 모든 문자가 헤더에 순서대로 포함되는지 확인
        let patternIndex = 0
        for (let i = 0; i < headerChars.length && patternIndex < patternChars.length; i++) {
          if (headerChars[i] === patternChars[patternIndex] || 
              headerChars[i].toLowerCase() === patternChars[patternIndex].toLowerCase()) {
            patternIndex++
          }
        }
        
        return patternIndex === patternChars.length
      })
      if (matched) {
        mapping[normalizedHeader] = rule.key
        return
      }
    }
  })
  
  return mapping
}

/**
 * 행 데이터를 QuestionInput으로 변환
 */
function parseRow(
  rowData: Partial<ExcelRow>,
  rowNumber: number
): {
  question: QuestionInput | null
  errors: ParseError[]
  warnings: ParseWarning[]
} {
  const errors: ParseError[] = []
  const warnings: ParseWarning[] = []

  // 필수 필드 검증
  // 필수: 자격증, 과정분류(또는 카테고리), 문제제시문, 선택지1-4 (최소 4개)
  // 선택: 과목분류, 주요항목, 세부항목, 세세항목, 레이블(자동생성), 서브제시문, 선택지5, 정답(공백허용), 해설, 난이도, 출제빈도, 기출년도, 기출회차, 기출번호
  
  // 필수 필드가 비어있으면 경고만 표시 (에러가 아닌 경고)
  if (!rowData.자격증 || rowData.자격증.trim() === '') {
    warnings.push({
      row: rowNumber,
      message: '자격증이 비어있습니다. 나중에 추가할 수 있습니다.',
    })
  }

  // 카테고리 검증: 5개 필드 또는 기존 카테고리 형식
  const hasCategoryFields = rowData.과정분류?.trim() || rowData.과목분류?.trim() || 
                            rowData.주요항목?.trim() || rowData.세부항목?.trim() || 
                            rowData.세세항목?.trim()
  const hasCategoryString = rowData.카테고리?.trim()
  
  if (!hasCategoryFields && !hasCategoryString) {
    warnings.push({
      row: rowNumber,
      message: '카테고리(과정분류, 과목분류 등)가 비어있습니다. 나중에 추가할 수 있습니다.',
    })
  }

  if (!rowData.문제제시문 || rowData.문제제시문.trim() === '') {
    warnings.push({
      row: rowNumber,
      message: '문제제시문이 비어있습니다. 나중에 추가할 수 있습니다.',
    })
  }

  // 선택지 검증 (최소 4개 필수, 선택지5는 선택)
  const options: string[] = []
  if (rowData.선택지1?.trim()) options.push(rowData.선택지1.trim())
  if (rowData.선택지2?.trim()) options.push(rowData.선택지2.trim())
  if (rowData.선택지3?.trim()) options.push(rowData.선택지3.trim())
  if (rowData.선택지4?.trim()) options.push(rowData.선택지4.trim())
  if (rowData.선택지5?.trim()) options.push(rowData.선택지5.trim()) // 선택지5는 선택 (4지선다인 경우 없음)

  if (options.length < 4) {
    warnings.push({
      row: rowNumber,
      message: `선택지가 ${options.length}개만 입력되어 있습니다. 최소 4개가 필요합니다. 나중에 추가할 수 있습니다.`,
    })
  }

  // 정답 검증 (공백 허용, 값이 있으면 A-E여야 함)
  let correctAnswer = rowData.정답?.trim() || ''
  
  // 정답이 비어있으면 공백 허용 (경고만 표시)
  if (!correctAnswer) {
    warnings.push({
      row: rowNumber,
      message: '정답이 비어있습니다. 나중에 추가할 수 있습니다.',
    })
  } else {
    // 한글 숫자 형식 변환 (①→A, ②→B, ③→C, ④→D, ⑤→E)
    const circleNumberMap: Record<string, string> = {
      '①': 'A', '②': 'B', '③': 'C', '④': 'D', '⑤': 'E',
      '1': 'A', '2': 'B', '3': 'C', '4': 'D', '5': 'E',
    }
    
    // 원형 숫자나 일반 숫자로 시작하는 경우 변환
    if (circleNumberMap[correctAnswer]) {
      correctAnswer = circleNumberMap[correctAnswer]
    } else {
      // 대문자로 변환
      correctAnswer = correctAnswer.toUpperCase()
    }
    
    if (!['A', 'B', 'C', 'D', 'E'].includes(correctAnswer)) {
      errors.push({
        row: rowNumber,
        field: '정답',
        message: `정답은 A, B, C, D, E 또는 ①, ②, ③, ④, ⑤ 중 하나여야 합니다. (현재: ${rowData.정답})`,
        value: rowData.정답 || '',
      })
    }

    // 정답 인덱스 검증 (정답이 있고 선택지가 있는 경우만)
    if (correctAnswer && options.length > 0) {
      const answerIndex = correctAnswer.charCodeAt(0) - 65 // A=0, B=1, C=2, D=3, E=4
      if (answerIndex >= options.length) {
        errors.push({
          row: rowNumber,
          field: '정답',
          message: `정답 인덱스가 선택지 개수를 초과합니다. (정답: ${correctAnswer}, 선택지 개수: ${options.length})`,
          value: correctAnswer,
        })
      }
    }
  }

  // 해설 검증 (값 없음 허용)
  if (!rowData.해설 || rowData.해설.trim() === '') {
    warnings.push({
      row: rowNumber,
      message: '해설이 비어있습니다. 나중에 추가할 수 있습니다.',
    })
  }

  // 난이도 검증 (값 없음 허용)
  const difficulty = rowData.난이도?.trim()
  if (!difficulty) {
    warnings.push({
      row: rowNumber,
      message: '난이도가 비어있습니다. 나중에 추가할 수 있습니다.',
    })
  } else if (!['상', '중', '하'].includes(difficulty)) {
    errors.push({
      row: rowNumber,
      field: '난이도',
      message: `난이도는 상, 중, 하 중 하나여야 합니다. (현재: ${difficulty})`,
      value: difficulty,
    })
  }

  // 카테고리 형식 검증 및 조합
  let category = rowData.카테고리?.trim()
  
  // 5개 필드가 있으면 조합
  if (rowData.과정분류 || rowData.과목분류 || rowData.주요항목 || rowData.세부항목 || rowData.세세항목) {
    const categoryParts: string[] = []
    if (rowData.과정분류?.trim()) categoryParts.push(rowData.과정분류.trim())
    if (rowData.과목분류?.trim()) categoryParts.push(rowData.과목분류.trim())
    if (rowData.주요항목?.trim()) categoryParts.push(rowData.주요항목.trim())
    if (rowData.세부항목?.trim()) categoryParts.push(rowData.세부항목.trim())
    if (rowData.세세항목?.trim()) categoryParts.push(rowData.세세항목.trim())
    
    if (categoryParts.length > 0) {
      category = categoryParts.join('-')
    }
  }
  
  // 카테고리가 없으면 과정분류만으로 기본 카테고리 생성
  if (!category || category.trim() === '') {
    const 대분류 = rowData.과정분류?.trim() || '1'
    category = 대분류 // 최소한 과정분류만이라도 카테고리로 사용
    console.log(`📝 행 ${rowNumber}: 카테고리 기본값 설정 (${category})`)
  }
  
  // 카테고리 형식 검증 (예: 1-2-3-4-5)
  if (category && !/^\d+(-\d+)*$/.test(category)) {
    warnings.push({
      row: rowNumber,
      message: `카테고리 형식이 올바르지 않을 수 있습니다. (예: 1-2-3-4-5)`,
      value: category,
    })
  }

  // 기출년도 숫자 검증
  let examYear: number | undefined
  if (rowData.기출년도?.trim()) {
    const yearNum = parseInt(rowData.기출년도.trim(), 10)
    if (isNaN(yearNum) || yearNum < 1900 || yearNum > 2100) {
      warnings.push({
        row: rowNumber,
        message: `기출년도는 1900-2100 사이의 숫자여야 합니다.`,
        value: rowData.기출년도,
      })
    } else {
      examYear = yearNum
    }
  }

  // 기출회차 형식 검증 (01, 02 등 2자리 숫자 또는 YYYY-MM 형식)
  const examSession = rowData.기출회차?.trim()
  if (examSession && !/^\d{2}$/.test(examSession) && !/^\d{4}-\d{2}$/.test(examSession)) {
    warnings.push({
      row: rowNumber,
      message: `기출회차 형식이 올바르지 않을 수 있습니다. (예: 01 또는 2024-01)`,
      value: examSession,
    })
  }

  // 출제빈도 숫자 검증
  let frequency: number | undefined
  if (rowData.출제빈도?.trim()) {
    const freqNum = parseInt(rowData.출제빈도.trim(), 10)
    if (isNaN(freqNum) || freqNum < 0) {
      warnings.push({
        row: rowNumber,
        message: `출제빈도는 0 이상의 숫자여야 합니다.`,
        value: rowData.출제빈도,
      })
    } else {
      frequency = freqNum
    }
  }

  // 기출번호 숫자 검증
  let examNumber: number | undefined
  if (rowData.기출번호?.trim()) {
    const examNum = parseInt(rowData.기출번호.trim(), 10)
    if (isNaN(examNum) || examNum < 0) {
      warnings.push({
        row: rowNumber,
        message: `기출번호는 0 이상의 숫자여야 합니다.`,
        value: rowData.기출번호,
      })
    } else {
      examNumber = examNum
    }
  }

  // 필수 필드 검증 (완화됨):
  // 1. 문제제시문: 반드시 필요
  // 2. 선택지: 최소 2개 (2지선다 허용)
  // 3. 자격증 또는 과정분류: 둘 중 하나만 있으면 됨 (과정분류에서 자격증 추론 가능)
  // 4. 카테고리: 과정분류만 있어도 됨 (기본값으로 "1" 사용)
  
  // 과정분류나 자격증이 하나라도 있는지 확인
  const has자격증OrCategory = (rowData.자격증 && rowData.자격증.trim() !== '') || 
                             (rowData.과정분류 && rowData.과정분류.trim() !== '')
  
  // 필수 필드 검증 (최소 조건만 확인)
  if (!rowData.문제제시문 || rowData.문제제시문.trim() === '') {
    console.warn(`⚠️ 행 ${rowNumber}: 문제제시문 없음으로 스킵`)
    return { question: null, errors, warnings }
  }
  
  if (options.length < 2) {
    console.warn(`⚠️ 행 ${rowNumber}: 선택지 부족으로 스킵 (최소 2개 필요, 현재 ${options.length}개)`)
    return { question: null, errors, warnings }
  }
  
  if (!has자격증OrCategory) {
    console.warn(`⚠️ 행 ${rowNumber}: 자격증 또는 과정분류 없음으로 스킵`, {
      자격증: rowData.자격증 || '(없음)',
      과정분류: rowData.과정분류 || '(없음)',
    })
    return { question: null, errors, warnings }
  }
  
  // 과정분류만 있고 자격증이 없으면 과정분류에서 자격증 추론
  if (!rowData.자격증 || rowData.자격증.trim() === '') {
    const 대분류번호 = rowData.과정분류?.trim() || '1'
    const certificationMap: Record<string, string> = {
      '1': '정보처리기사',
      '2': '컴퓨터활용능력',
      '3': '빅데이터분석기사',
      '4': '경영정보시각화능력',
      '5': 'ADsP',
      '6': 'SQLD',
      '7': '사회조사분석사',
      '8': 'TESAT',
      '9': '공인중개사',
    }
    rowData.자격증 = certificationMap[대분류번호] || '정보처리기사'
  }
  
  // 치명적 에러가 있으면 저장하지 않음
  const criticalErrors = errors.filter(e => 
    e.field === '정답' && e.message.includes('정답 인덱스가 선택지 개수를 초과')
  )
  
  if (criticalErrors.length > 0) {
    return { question: null, errors, warnings }
  }

  // 태그 파싱 (레이블을 태그에 추가, 쉼표로 구분된 태그도 추가)
  const tags: string[] = []
  
  // 레이블을 태그에 추가 (자동 생성 또는 수동 입력)
  // 단, 기출정보(년도, 회차, 번호)는 태그로 포함하지 않음
  const labelValue = rowData.레이블?.trim() || rowData.카테고리?.trim() || ''
  if (labelValue) {
    // 기출정보가 포함된 레이블인지 확인 (예: "37 기출 47번")
    const isExamInfo = /^\d+\s*(기출|회차)/.test(labelValue) || 
                       /\d+\s*번/.test(labelValue) ||
                       labelValue === String(rowData.기출회차) ||
                       labelValue === String(rowData.기출번호) ||
                       labelValue === `기출 ${rowData.기출번호}번`
    
    if (!isExamInfo) {
      tags.push(labelValue)
    }
  }
  
  // 추가 태그가 있으면 추가
  if (rowData.태그?.trim()) {
    const additionalTags = rowData.태그
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => {
        // 기출정보가 포함된 태그는 제외
        const isExamInfo = /^\d+\s*(기출|회차)/.test(tag) || 
                           /\d+\s*번/.test(tag)
        return tag !== '' && !tags.includes(tag) && !isExamInfo
      })
    tags.push(...additionalTags)
  }

  // 기출회차 처리 (YYYY-MM 형식인 경우 분리)
  let finalExamYear = examYear
  let finalExamSession = examSession
  
  if (examSession && examSession.includes('-') && !finalExamYear) {
    const parts = examSession.split('-')
    if (parts.length === 2 && /^\d{4}$/.test(parts[0]) && /^\d{2}$/.test(parts[1])) {
      finalExamYear = parseInt(parts[0], 10)
      finalExamSession = parts[1]
    }
  }

  // QuestionInput 생성 (필수 필드는 이미 검증됨)
  // 선택 필드는 값이 없으면 undefined로 설정
  // 카테고리 최종 확인 (5개 필드 조합 또는 기존 카테고리)
  let finalCategory = category
  if (!finalCategory) {
    const categoryParts: string[] = []
    if (rowData.과정분류?.trim()) categoryParts.push(rowData.과정분류.trim())
    if (rowData.과목분류?.trim()) categoryParts.push(rowData.과목분류.trim())
    if (rowData.주요항목?.trim()) categoryParts.push(rowData.주요항목.trim())
    if (rowData.세부항목?.trim()) categoryParts.push(rowData.세부항목.trim())
    if (rowData.세세항목?.trim()) categoryParts.push(rowData.세세항목.trim())
    
    if (categoryParts.length > 0) {
      finalCategory = categoryParts.join('-')
    }
  }
  
  // 카테고리가 없으면 저장하지 않음 (이미 위에서 검증했지만 안전장치)
  if (!finalCategory) {
    return { question: null, errors, warnings }
  }
  
  // 기출회차 최종 정규화 (2자리 형식으로)
  let finalExamSessionFormatted = finalExamSession
  if (finalExamSession) {
    // 숫자로 변환 후 2자리로 포맷팅
    const sessionNum = parseInt(finalExamSession.trim(), 10)
    if (!isNaN(sessionNum)) {
      finalExamSessionFormatted = String(sessionNum).padStart(2, '0')
    } else {
      // 숫자가 아니면 원본 유지
      finalExamSessionFormatted = finalExamSession.trim()
    }
  }
  
  // 기출정보가 있는지 확인 (모든 행 로깅)
  const has기출정보 = rowData.기출년도 || rowData.기출회차 || rowData.기출번호
  if (has기출정보) {
    console.log(`📝 행 ${rowNumber} 기출정보:`, {
      원본년도: rowData.기출년도,
      원본회차: rowData.기출회차,
      원본번호: rowData.기출번호,
      '→최종년도': finalExamYear,
      '→최종회차': finalExamSessionFormatted,
      '→최종번호': examNumber,
    })
  }
  
  // 기출정보가 있는데 최종 값이 없으면 경고
  if (has기출정보 && !finalExamYear && !finalExamSessionFormatted && examNumber === undefined) {
    console.warn(`⚠️ 행 ${rowNumber}: 기출정보 파싱 실패!`, {
      원본데이터: {
        기출년도: rowData.기출년도,
        기출회차: rowData.기출회차,
        기출번호: rowData.기출번호,
      },
      파싱결과: {
        examYear변수: examYear,
        examSession변수: examSession,
        examNumber변수: examNumber,
      }
    })
  }
  
  const question: QuestionInput = {
    content: rowData.문제제시문!.trim(),
    subContent: rowData.서브제시문?.trim() || undefined, // 값 없음 허용
    subContentImageUrl: rowData.이미지URL?.trim() || undefined,
    options: options,
    correctAnswer: correctAnswer || '', // 공백 허용 (빈 문자열 가능)
    explanation: rowData.해설?.trim() || '', // 값 없음 허용 (빈 문자열 가능)
    certificationType: rowData.자격증!.trim(),
    category: finalCategory,
    difficulty: difficulty ? (difficulty as '상' | '중' | '하') : '중', // 값 없으면 기본값 '중'
    tags: tags.length > 0 ? tags : [],
    frequency,
    // 기출정보: 값이 있으면 명시적으로 전달 (undefined가 아닌 값으로)
    examYear: finalExamYear !== undefined ? finalExamYear : undefined,
    examSession: finalExamSessionFormatted || undefined,
    examNumber: examNumber !== undefined ? examNumber : undefined,
  }
  
  // 모든 행의 최종 기출정보 로깅 (처음 5개 행만)
  if (rowNumber <= 5) {
    console.log(`📝 행 ${rowNumber} 최종 QuestionInput 기출정보:`, {
      examYear: question.examYear,
      examSession: question.examSession,
      examNumber: question.examNumber,
      tags: question.tags,
    })
  }
  
  // 기출정보가 있는데 저장되지 않는 경우 경고
  if ((rowData.기출년도 || rowData.기출회차 || rowData.기출번호) && 
      (!question.examYear && !question.examSession && !question.examNumber)) {
    console.warn(`⚠️ 행 ${rowNumber}: 기출정보가 파싱되었지만 저장되지 않음`, {
      원본기출년도: rowData.기출년도,
      원본기출회차: rowData.기출회차,
      원본기출번호: rowData.기출번호,
      최종examYear: question.examYear,
      최종examSession: question.examSession,
      최종examNumber: question.examNumber,
    })
  }

  return { question, errors, warnings }
}

/**
 * Excel 파일 (XLSX) 파싱을 위한 헬퍼 함수
 */
export async function parseExcelFile(file: File): Promise<ParseResult> {
  // xlsx 라이브러리를 동적으로 import
  const XLSX = await import('xlsx')
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { 
          type: 'array', 
          cellDates: true, 
          cellNF: false, 
          cellText: false,
          raw: false // 숫자를 문자열로 변환
        })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        
        // 개선: sheet_to_json으로 배열 데이터를 가져와서 직접 처리
        // CSV 변환 과정을 건너뛰어 줄바꿈 문제를 회피
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1, // 배열의 배열로 반환 (헤더를 키로 사용하지 않음)
          raw: false, // 모든 값을 문자열로 변환
          defval: '' // 빈 셀은 빈 문자열로
        }) as Array<Array<string | number>>
        
        console.log('📄 Excel → JSON 변환 완료')
        console.log('전체 행 수:', jsonData.length)
        console.log('JSON 데이터 첫 2행:', JSON.stringify(jsonData.slice(0, 2), null, 2))
        
        // JSON 데이터를 직접 처리 (CSV 변환 건너뛰기)
        const result = parseJSONData(jsonData)
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

