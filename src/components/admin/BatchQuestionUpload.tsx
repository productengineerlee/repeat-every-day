/**
 * 문제 일괄 업로드 컴포넌트
 * Excel/CSV 파일을 업로드하여 문제를 일괄 등록
 */

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Download, Info } from 'lucide-react'
import { batchUploadFromCSV, batchUploadFromExcel, type BatchUploadResult } from '@/lib/api/batchUpload'
import { parseCSV, type ParseResult } from '@/lib/api/excelParser'

export default function BatchQuestionUpload() {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<BatchUploadResult | null>(null)
  const [previewResult, setPreviewResult] = useState<ParseResult | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [overwrite, setOverwrite] = useState(false) // 덮어쓰기 옵션
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 파일 선택 핸들러
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      setSelectedFile(null)
      return
    }

    // 파일 확장자 확인
    const fileName = file.name.toLowerCase()
    const isCSV = fileName.endsWith('.csv')
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls')

    if (!isCSV && !isExcel) {
      alert('CSV 또는 Excel 파일만 업로드할 수 있습니다.')
      setSelectedFile(null)
      return
    }

    // 파일 상태 업데이트
    setSelectedFile(file)

    // 미리보기 (CSV만 지원)
    if (isCSV) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const csvContent = e.target?.result as string
        const parseResult = parseCSV(csvContent)
        setPreviewResult(parseResult)
      }
      reader.readAsText(file)
    } else {
      setPreviewResult(null)
    }
  }

  // 파일 업로드 핸들러
  const handleUpload = async () => {
    if (!selectedFile) {
      alert('파일을 선택해주세요.')
      return
    }

    setUploading(true)
    setProgress(0)
    setResult(null)

    try {
      const fileName = selectedFile.name.toLowerCase()
      const isCSV = fileName.endsWith('.csv')
      
      let uploadResult: BatchUploadResult

      if (isCSV) {
        const reader = new FileReader()
        reader.onload = async (e) => {
          const csvContent = e.target?.result as string
          uploadResult = await batchUploadFromCSV(csvContent, (prog) => {
            setProgress(prog)
          }, overwrite)
          setResult(uploadResult)
          setUploading(false)
        }
        reader.onerror = () => {
          alert('파일을 읽는 중 오류가 발생했습니다.')
          setUploading(false)
        }
        reader.readAsText(selectedFile)
      } else {
        uploadResult = await batchUploadFromExcel(selectedFile, (prog) => {
          setProgress(prog)
        }, overwrite)
        setResult(uploadResult)
        setUploading(false)
      }
    } catch (error) {
      console.error('❌ 업로드 실패:', error)
      console.error('에러 상세:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        type: typeof error,
      })
      alert(`업로드 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
      setUploading(false)
    }
  }

  // 템플릿 다운로드
  const handleDownloadTemplate = () => {
    // 템플릿 CSV 파일 다운로드
    // 카테고리를 5개 필드로 분리: 과정분류, 과목분류, 주요항목, 세부항목, 세세항목
    // 레이블은 자동 생성되지만 수동 입력도 가능
    const templateContent = `자격증,과정분류,과목분류,주요항목,세부항목,세세항목,레이블,문제제시문,서브제시문,선택지1,선택지2,선택지3,선택지4,선택지5,정답,해설,난이도,출제빈도,기출년도,기출회차,기출번호
정보처리기사,1,1,1,1,1,1-1-1-1-1,다음 중 관계형 데이터베이스의 특징이 아닌 것은?,,데이터 중복 최소화,ACID 속성 보장,정규화 지원,계층형 구조,트랜잭션 처리,D,관계형 데이터베이스는 계층형 구조가 아닌 테이블 기반 구조를 사용합니다.,중,5,2024,01,01
정보처리기사,1,1,1,1,1,1-1-1-1-1,정규화의 목적은 무엇인가?,,데이터 중복 제거,쿼리 성능 향상,데이터 보안 강화,데이터 백업 용이,,A,정규화는 데이터 중복을 제거하고 데이터 무결성을 보장하기 위한 데이터베이스 설계 기법입니다.,중,3,2024,01,02`

    const blob = new Blob(['\uFEFF' + templateContent], { type: 'text/csv;charset=utf-8;' }) // BOM 추가 (Excel 한글 깨짐 방지)
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'question_upload_template.csv'
    // 다운로드 속성 명시적으로 설정
    link.setAttribute('download', 'question_upload_template.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    // 안내 메시지 표시 (선택사항)
    // alert는 너무 방해가 될 수 있으므로 주석 처리
    // console.log('템플릿이 다운로드되었습니다. 파일이 읽기 전용으로 열려도 편집 가능합니다.')
  }

  return (
    <div className="space-y-6">
      <div className="border rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">문제 일괄 업로드</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Excel 또는 CSV 파일을 업로드하여 문제를 일괄 등록할 수 있습니다.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleDownloadTemplate}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            템플릿 다운로드
          </Button>
        </div>

        {/* 안내 메시지 */}
        <div className="space-y-3">
          <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">💡 템플릿 사용 안내</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>템플릿이 읽기 전용으로 열려도 <strong>편집 가능</strong>합니다 (Excel에서 "편집 가능" 버튼 클릭)</li>
                <li>Google Sheets로 업로드하면 바로 편집할 수 있습니다</li>
                <li>저장 시 CSV UTF-8 형식으로 저장하세요 (한글 깨짐 방지)</li>
              </ul>
            </div>
          </div>

          <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <p className="font-medium mb-1">⚠️ 템플릿 필드 형식 안내</p>
              <ul className="list-disc list-inside space-y-1 text-xs space-y-1">
                <li><strong>과정분류</strong>: 1-6 (1:정보처리기사, 2:컴퓨터활용능력, 3:빅데이터분석기사, 4:경영정보시각화능력, 5:ADsP, 6:SQLD)</li>
                <li><strong>과목분류</strong>: 1-5 (1:1과목, 2:2과목, 3:3과목, 4:4과목, 5:5과목)</li>
                <li><strong>주요항목, 세부항목, 세세항목</strong>: 숫자로 입력 (값 없음 허용)</li>
                <li><strong>레이블</strong>: 자동 생성되거나 수동 입력 가능 (과정분류-과목분류-주요항목-세부항목-세세항목 형식)</li>
                <li><strong>기출번호</strong>: "01", "15" 등 숫자로 입력</li>
                <li><strong>출제빈도</strong>: 숫자로 입력 (예: 5)</li>
                <li>나머지 필드는 개별 입력 폼과 동일합니다</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 파일 선택 */}
        <div className="space-y-2">
          <label className="text-sm font-medium block text-left">파일 선택</label>
          <div className="flex items-center gap-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileSelect}
              disabled={uploading}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-primary file:text-primary-foreground
                hover:file:bg-primary/90
                file:cursor-pointer cursor-pointer
                disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        {/* 덮어쓰기 옵션 */}
        <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <input
            type="checkbox"
            id="overwrite"
            checked={overwrite}
            onChange={(e) => setOverwrite(e.target.checked)}
            disabled={uploading}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <label htmlFor="overwrite" className="text-sm text-blue-800 dark:text-blue-200 cursor-pointer">
            <strong>기존 문제 덮어쓰기</strong>
            <span className="ml-2 text-xs text-blue-600 dark:text-blue-300">
              (체크 시: 기존 문제를 찾아 업데이트, 체크 해제 시: 새로 추가만)
            </span>
          </label>
        </div>

        {/* 미리보기 */}
        {previewResult && (
          <div className="border rounded-lg p-4 bg-muted/50">
            <h4 className="text-sm font-semibold mb-2">파일 미리보기</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span>총 행 수:</span>
                <span className="font-medium">{previewResult.questions.length + previewResult.errors.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <span>유효한 문제:</span>
                <span className="font-medium text-green-600">{previewResult.questions.length}개</span>
              </div>
              {previewResult.errors.length > 0 && (
                <div className="flex items-center gap-2">
                  <span>오류:</span>
                  <span className="font-medium text-red-600">{previewResult.errors.length}개</span>
                </div>
              )}
              {previewResult.warnings.length > 0 && (
                <div className="flex items-center gap-2">
                  <span>경고:</span>
                  <span className="font-medium text-yellow-600">{previewResult.warnings.length}개</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 진행률 */}
        {uploading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>업로드 중...</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* 업로드 버튼 */}
        <Button
          onClick={handleUpload}
          disabled={uploading || !selectedFile}
          className="w-full gap-2"
        >
          <Upload className="h-4 w-4" />
          {uploading ? '업로드 중...' : '업로드 시작'}
        </Button>
      </div>

      {/* 결과 표시 */}
      {result && (
        <div className="border rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-2">
            {result.success ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <h3 className="text-lg font-semibold text-green-600">업로드 완료</h3>
              </>
            ) : (
              <>
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <h3 className="text-lg font-semibold text-yellow-600">업로드 완료 (일부 오류)</h3>
              </>
            )}
          </div>

          <div className={`grid gap-4 ${result.updateCount !== undefined ? 'grid-cols-4' : 'grid-cols-3'}`}>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{result.totalRows}</div>
              <div className="text-sm text-muted-foreground">총 행 수</div>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{result.successCount}</div>
              <div className="text-sm text-muted-foreground">성공</div>
            </div>
            {result.updateCount !== undefined && result.updateCount > 0 && (
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{result.updateCount}</div>
                <div className="text-sm text-muted-foreground">업데이트</div>
              </div>
            )}
            {result.insertCount !== undefined && result.insertCount > 0 && (
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{result.insertCount}</div>
                <div className="text-sm text-muted-foreground">새로 추가</div>
              </div>
            )}
            <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{result.errorCount}</div>
              <div className="text-sm text-muted-foreground">실패</div>
            </div>
          </div>

          {/* 오류 목록 */}
          {result.errors.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">오류 목록</h4>
              <div className="max-h-60 overflow-y-auto space-y-1">
                {result.errors.map((error, index) => (
                  <div
                    key={index}
                    className="text-sm p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800"
                  >
                    <div className="font-medium">행 {error.row}: {error.error}</div>
                    {error.question && (
                      <div className="text-xs text-muted-foreground mt-1">
                        문제: {error.question.content?.substring(0, 50)}...
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 경고 목록 */}
          {result.warnings.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">경고 목록</h4>
              <div className="max-h-60 overflow-y-auto space-y-1">
                {result.warnings.map((warning, index) => (
                  <div
                    key={index}
                    className="text-sm p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800"
                  >
                    행 {warning.row}: {warning.message}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

