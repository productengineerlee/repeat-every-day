import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Plus, X, Upload, XCircle } from 'lucide-react'

type CertificationOption =
  | '정보처리기사'
  | '컴퓨터활용능력'
  | '빅데이터분석기사'
  | '경영정보시각화능력'
  | 'ADsP'
  | 'SQLD'
  | '사회조사분석사'
  | 'TESAT'
  | '공인중개사'

const CERTIFICATIONS: CertificationOption[] = [
  '정보처리기사',
  '컴퓨터활용능력',
  '빅데이터분석기사',
  '경영정보시각화능력',
  'ADsP',
  'SQLD',
  '사회조사분석사',
  'TESAT',
  '공인중개사',
]
import { uploadImage, deleteImage } from '@/lib/api/storage'
import type { QuestionInput } from '@/lib/api/questions'

interface QuestionInputFormProps {
  onSubmit: (question: QuestionInput) => Promise<void>
  onReset?: () => void
  initialData?: Partial<QuestionInput>
  onSuccess?: () => void // 성공 후 콜백
  mode?: 'create' | 'edit' // 생성 모드 또는 수정 모드
}

export default function QuestionInputForm({
  onSubmit,
  onReset,
  initialData,
  onSuccess,
  mode = 'create',
}: QuestionInputFormProps) {
  const [formData, setFormData] = useState<Partial<QuestionInput>>({
    content: '',
    subContent: '',
    subContentImageUrl: undefined,
    options: ['', '', '', '', ''], // 5지선다 기본값
    correctAnswer: 'A',
    explanation: '',
    certificationType: undefined,
    category: '',
    difficulty: '중',
    tags: [],
    frequency: undefined,
    examSession: undefined,
    examNumber: undefined,
    ...initialData,
  })

  const [choiceCount, setChoiceCount] = useState(() => {
    // initialData가 있으면 선택지 개수에 맞춰 설정
    if (initialData?.options) {
      const validOptions = initialData.options.filter(opt => opt && opt.trim() !== '')
      return Math.max(4, validOptions.length) // 최소 4개
    }
    return 5
  })
  const [tagInput, setTagInput] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 기출년도와 기출회차를 분리하여 관리
  const [examYear, setExamYear] = useState<string>(() => {
    // examYear가 직접 있으면 사용
    if (initialData?.examYear) {
      return String(initialData.examYear)
    }
    // examSession이 "2024-01" 형식인 경우에만 년도 추출
    if (initialData?.examSession) {
      const parts = initialData.examSession.split('-')
      // 첫 번째 부분이 4자리 숫자(년도)인 경우만 사용
      if (parts.length === 2 && /^\d{4}$/.test(parts[0])) {
        return parts[0]
      }
    }
    return ''
  })
  const [examSessionNumber, setExamSessionNumber] = useState<string>(() => {
    if (initialData?.examSession) {
      // "2024-01" 형식인 경우 회차 추출
      const parts = initialData.examSession.split('-')
      if (parts.length === 2 && /^\d{4}$/.test(parts[0])) {
        // "2024-01" 형식: 회차 추출
        const sessionNum = parts[1] || ''
        return sessionNum.replace(/^0+/, '') || ''
      } else {
        // "47" 같은 형식: 그대로 회차로 사용
        return initialData.examSession.replace(/^0+/, '') || ''
      }
    }
    return ''
  })
  
  // 기출번호 입력용 로컬 상태 (표시용)
  const [examNumberInput, setExamNumberInput] = useState<string>(() => {
    if (initialData?.examNumber !== undefined) {
      return String(initialData.examNumber).padStart(2, '0')
    }
    return ''
  })

  // initialData가 변경될 때 examYear, examSessionNumber 업데이트
  useEffect(() => {
    // examYear가 직접 있으면 우선 사용
    if (initialData?.examYear) {
      setExamYear(String(initialData.examYear))
    } else if (initialData?.examSession) {
      const parts = initialData.examSession.split('-')
      // "2024-01" 형식인 경우에만 파싱
      if (parts.length === 2 && /^\d{4}$/.test(parts[0])) {
        setExamYear(parts[0])
        const sessionNum = parts[1] || ''
        setExamSessionNumber(sessionNum.replace(/^0+/, '') || '')
      } else {
        // "47" 같은 형식: 년도는 비우고 회차만 설정
        setExamYear('')
        setExamSessionNumber(initialData.examSession.replace(/^0+/, '') || '')
      }
    } else {
      setExamYear('')
      setExamSessionNumber('')
    }
  }, [initialData?.examYear, initialData?.examSession])
  
  // initialData.examNumber가 변경될 때 formData와 examNumberInput 업데이트
  useEffect(() => {
    if (initialData?.examNumber !== undefined) {
      setFormData((prev) => ({
        ...prev,
        examNumber: initialData.examNumber,
      }))
      setExamNumberInput(String(initialData.examNumber).padStart(2, '0'))
    } else {
      setExamNumberInput('')
    }
  }, [initialData?.examNumber])

  // examYear와 examSessionNumber는 각각 별도로 관리 (더 이상 examSession으로 합치지 않음)
  // DB에 각각 저장하므로 이 useEffect는 제거

  // 카테고리 분류 입력값 (initialData에서 초기화)
  // 내부 키는 유지하되, UI 레이블만 변경
  const [categoryLevels, setCategoryLevels] = useState(() => {
    if (initialData?.category) {
      const parts = initialData.category.split('-')
      return {
        대분류: parts[0] || '', // UI: 과정분류
        중분류: parts[1] || '', // UI: 과목분류
        소분류: parts[2] || '', // UI: 주요항목
        세분류: parts[3] || '', // UI: 세부항목
        세세분류: parts[4] || '', // UI: 세세항목
      }
    }
    return {
      대분류: '', // UI: 과정분류
      중분류: '', // UI: 과목분류
      소분류: '', // UI: 주요항목
      세분류: '', // UI: 세부항목
      세세분류: '', // UI: 세세항목
    }
  })

  // 카테고리 레이블 매핑 (UI 표시용)
  const categoryLabels: Record<string, string> = {
    대분류: '과정분류',
    중분류: '과목분류',
    소분류: '주요항목',
    세분류: '세부항목',
    세세분류: '세세항목',
  }

  // 자격증별 대분류 번호 매핑
  const certificationToCategoryMap: Record<string, string> = {
    '정보처리기사': '1',
    '컴퓨터활용능력': '2',
    '빅데이터분석기사': '3',
    '경영정보시각화능력': '4',
    'ADsP': '5',
    'SQLD': '6',
  }

  // 선택지 개수 변경
  const handleChoiceCountChange = (count: number) => {
    setChoiceCount(count)
    const newOptions = [...formData.options || []]
    
    if (count === 4) {
      // 5개에서 4개로 줄이기
      if (newOptions.length > 4) {
        newOptions.splice(4, 1)
      }
      // 정답이 E인 경우 D로 변경
      if (formData.correctAnswer === 'E') {
        setFormData({ ...formData, correctAnswer: 'D', options: newOptions })
      } else {
        setFormData({ ...formData, options: newOptions })
      }
    } else {
      // 4개에서 5개로 늘리기
      if (newOptions.length < 5) {
        newOptions.push('')
      }
      setFormData({ ...formData, options: newOptions })
    }
  }

  // 선택지 업데이트
  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...(formData.options || [])]
    newOptions[index] = value
    setFormData({ ...formData, options: newOptions })
  }

  // 카테고리 분류 변경 핸들러
  const handleCategoryLevelChange = (level: string, value: string) => {
    const newLevels = { ...categoryLevels, [level]: value }
    setCategoryLevels(newLevels)

    // 카테고리 문자열 생성 (빈 값 제외)
    const categoryParts = Object.entries(newLevels)
      .filter(([_, val]) => val.trim() !== '')
      .map(([_, val]) => val.trim())
    
    const categoryString = categoryParts.join('-')
    
    // 카테고리 업데이트 (기존 formData 유지)
    setFormData((prev) => ({
      ...prev,
      category: categoryString,
    }))

    // 레이블 자동 업데이트 (카테고리가 있으면 레이블에 추가)
    if (categoryString) {
      const currentTags = formData.tags || []
      const categoryLabel = categoryString // 레이블에는 카테고리 값만 표시
      
      // 기존 카테고리 레이블 제거 후 새로 추가
      const filteredTags = currentTags.filter(tag => {
        // 카테고리로 시작하는 태그나 카테고리 값과 일치하는 태그 제거
        return !tag.startsWith('카테고리:') && tag !== categoryString
      })
      
      if (!filteredTags.includes(categoryLabel)) {
        setFormData((prev) => ({
          ...prev,
          category: categoryString,
          tags: [categoryLabel, ...filteredTags],
        }))
      } else {
        setFormData((prev) => ({
          ...prev,
          category: categoryString,
          tags: filteredTags,
        }))
      }
    } else {
      // 카테고리가 비어있으면 카테고리 레이블 제거
      setFormData((prev) => {
        const filteredTags = (prev.tags || []).filter(tag => {
          // 숫자-숫자-숫자 패턴이 아닌 태그만 유지
          return !/^\d+(-\d+)*$/.test(tag)
        })
        return {
          ...prev,
          category: '',
          tags: filteredTags,
        }
      })
    }
  }

  // 태그 추가
  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), tagInput.trim()],
      })
      setTagInput('')
    }
  }

  // 태그 제거
  const handleRemoveTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter((t) => t !== tag) || [],
    })
  }

  // 이미지 업로드 핸들러
  const handleImageUpload = async (file: File) => {
    if (!file) return

    // 파일 크기 검증 (5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      setErrors({ ...errors, subContentImageUrl: '파일 크기는 5MB 이하여야 합니다.' })
      return
    }

    // 파일 타입 검증
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      setErrors({ ...errors, subContentImageUrl: 'JPEG, PNG, WebP, GIF 형식만 지원됩니다.' })
      return
    }

    setUploadingImage(true)
    setErrors({ ...errors, subContentImageUrl: '' })

    try {
      const result = await uploadImage(file, 'question-images')
      if (result.url) {
        setFormData({ ...formData, subContentImageUrl: result.url })
        setErrors({ ...errors, subContentImageUrl: '' })
      } else if (result.error) {
        let errorMessage = result.error
        // Storage 버킷 관련 에러인 경우 더 자세한 안내 제공
        if (result.error.includes('버킷') || result.error.includes('Bucket') || result.error.includes('not found')) {
          errorMessage = 'Storage 버킷이 없습니다. Supabase Dashboard에서 "images" 버킷을 생성해주세요.'
        }
        setErrors({ ...errors, subContentImageUrl: errorMessage })
      }
    } catch (error) {
      console.error('이미지 업로드 오류:', error)
      setErrors({ 
        ...errors, 
        subContentImageUrl: '이미지 업로드에 실패했습니다. Storage 버킷 설정을 확인해주세요.' 
      })
    } finally {
      setUploadingImage(false)
    }
  }

  // 이미지 삭제 핸들러
  const handleImageDelete = async () => {
    if (!formData.subContentImageUrl) return

    try {
      // URL에서 파일 경로 추출
      const urlParts = formData.subContentImageUrl.split('/')
      const fileName = urlParts[urlParts.length - 1]
      
      await deleteImage(`question-images/${fileName}`)
      setFormData({ ...formData, subContentImageUrl: undefined })
      // 파일 입력 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('이미지 삭제 오류:', error)
      // 삭제 실패해도 UI에서는 제거
      setFormData({ ...formData, subContentImageUrl: undefined })
      // 파일 입력 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // 드래그 앤 드롭 핸들러
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      handleImageUpload(files[0])
    }
  }

  // 폼 검증
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.content?.trim()) {
      newErrors.content = '문제 제시문을 입력해주세요.'
    }

    // certificationType 검증
    if (!formData.certificationType) {
      newErrors.certificationType = '자격증을 선택해주세요.'
    }

    // 카테고리 검증 (최소 과정분류는 입력되어야 함)
    const hasCategory = Object.values(categoryLevels).some(val => val.trim() !== '')
    if (!hasCategory) {
      newErrors.category = '최소 과정분류를 입력해주세요.'
    }

    // 선택지 검증
    const options = formData.options || []
    const emptyOptions = options.filter((opt) => !opt.trim())
    if (emptyOptions.length > 0) {
      newErrors.options = '모든 선택지를 입력해주세요.'
    }

    // 정답 검증
    if (!formData.correctAnswer) {
      newErrors.correctAnswer = '정답을 선택해주세요.'
    } else {
      const answerIndex = formData.correctAnswer.charCodeAt(0) - 65
      if (answerIndex < 0 || answerIndex >= options.length) {
        newErrors.correctAnswer = '정답이 선택지 범위를 벗어났습니다.'
      }
    }

    if (!formData.explanation?.trim()) {
      newErrors.explanation = '해설을 입력해주세요.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 최신 상태로 검증 (formData가 최신인지 확인)
    const isValid = validateForm()
    if (!isValid) {
      // 검증 실패 시 스크롤을 첫 번째 에러로 이동
      setTimeout(() => {
        const firstErrorKey = Object.keys(errors)[0]
        if (firstErrorKey) {
          const element = document.querySelector(`[name="${firstErrorKey}"]`) || 
                         document.querySelector(`[aria-label*="${firstErrorKey}"]`)
          element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 100)
      setSubmitting(false)
      return
    }

    setSubmitting(true)

    try {
      console.log('문제 저장 시작:', {
        certificationType: formData.certificationType,
        category: formData.category,
        optionsCount: formData.options?.length,
      })

      // 제출 전 최종 검증 (certificationType 확인)
      const certificationType = formData.certificationType
      if (!certificationType || (typeof certificationType === 'string' && certificationType.trim() === '')) {
        setErrors({ ...errors, certificationType: '자격증을 선택해주세요.' })
        setSubmitting(false)
        return
      }

      // 기출년도와 기출회차를 분리하여 전달
      const examYearNum = examYear ? parseInt(examYear, 10) : undefined
      const examSession = examSessionNumber ? examSessionNumber.padStart(2, '0') : undefined

      await onSubmit({
        content: formData.content!,
        subContent: formData.subContent,
        subContentImageUrl: formData.subContentImageUrl,
        options: formData.options!.filter((opt) => opt.trim()),
        correctAnswer: formData.correctAnswer!,
        explanation: formData.explanation!,
        certificationType: certificationType,
        category: formData.category!,
        difficulty: formData.difficulty || '중',
        tags: formData.tags || [],
        frequency: formData.frequency,
        examYear: examYearNum && !isNaN(examYearNum) ? examYearNum : undefined,
        examSession: examSession,
        examNumber: formData.examNumber,
      })

      console.log('문제 저장 완료')
      
      // 수정 모드가 아닐 때만 폼 초기화 (생성 모드에서만 초기화)
      if (mode !== 'edit') {
        // 성공 후 폼 초기화 (약간의 지연을 두어 성공 메시지가 표시된 후 초기화)
        setTimeout(() => {
          handleReset()
          onSuccess?.()
        }, 100)
      } else {
        // 수정 모드에서는 초기화하지 않고 성공 콜백만 호출
        onSuccess?.()
      }
    } catch (error) {
      console.error('문제 제출 오류:', error)
      // 에러를 부모 컴포넌트로 전달하지 않고 여기서 처리할 수도 있지만,
      // 현재는 부모 컴포넌트에서 처리하도록 되어 있음
    } finally {
      setSubmitting(false)
    }
  }

  // 리셋
  const handleReset = () => {
    // 폼 데이터 초기화
    const resetData: Partial<QuestionInput> = {
      content: '',
      subContent: '',
      subContentImageUrl: undefined,
      options: ['', '', '', '', ''], // 5지선다 기본값
      correctAnswer: 'A',
      explanation: '',
      certificationType: undefined,
      category: '',
      difficulty: '중',
      tags: [],
      frequency: undefined,
    }
    
    setFormData(resetData)
    setCategoryLevels({
      대분류: '',
      중분류: '',
      소분류: '',
      세분류: '',
      세세분류: '',
    })
    setChoiceCount(5)
    setTagInput('')
    setErrors({})
    setUploadingImage(false)
    
    // 파일 입력 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    
    onReset?.()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 자격증 선택 */}
      <div className="space-y-2">
        <Label htmlFor="certification" className="block text-left">자격증 선택 *</Label>
        <Select
          value={formData.certificationType || undefined}
          onValueChange={(value) => {
            const certValue = value as CertificationOption
            // 자격증 선택 시 에러 제거
            if (errors.certificationType) {
              const newErrors = { ...errors }
              delete newErrors.certificationType
              setErrors(newErrors)
            }
            
            // 자격증 선택 시 대분류 자동 입력
            let 대분류번호 = ''
            if (certValue && certificationToCategoryMap[certValue]) {
              대분류번호 = certificationToCategoryMap[certValue]
            }
            
            // 카테고리 레벨 업데이트
            const newLevels = { ...categoryLevels }
            if (대분류번호) {
              newLevels.대분류 = 대분류번호
              setCategoryLevels(newLevels)
            }
            
            // 카테고리 문자열 생성
            const categoryParts = Object.entries(newLevels)
              .filter(([_, val]) => val.trim() !== '')
              .map(([_, val]) => val.trim())
            
            const categoryString = categoryParts.join('-')
            
            // formData 업데이트 (certificationType, category, tags를 함께)
            const currentTags = formData.tags || []
            const filteredTags = currentTags.filter(tag => {
              return !tag.startsWith('카테고리:') && tag !== categoryString && !/^\d+(-\d+)*$/.test(tag)
            })
            
            const newTags = categoryString ? [categoryString, ...filteredTags] : filteredTags
            
            // 함수형 업데이트로 이전 상태 보장
            setFormData((prev) => ({
              ...prev,
              certificationType: certValue, // 자격증 타입 명시적으로 업데이트
              category: categoryString,
              tags: newTags,
            }))
          }}
        >
          <SelectTrigger id="certification">
            <SelectValue placeholder="자격증을 선택하세요" />
          </SelectTrigger>
          <SelectContent>
            {CERTIFICATIONS.map((cert) => (
              <SelectItem key={cert} value={cert}>
                {cert}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.certificationType && (
          <p className="text-sm text-destructive">{errors.certificationType}</p>
        )}
      </div>

      {/* 카테고리 분류 입력 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-left block">카테고리 *</label>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {(['대분류', '중분류', '소분류', '세분류', '세세분류'] as const).map((level) => (
            <div key={level} className="space-y-1">
              <label className="text-xs text-muted-foreground text-center block">{categoryLabels[level]}</label>
              <Input
                type="number"
                value={categoryLevels[level]}
                onChange={(e) => {
                  const value = e.target.value
                  // 숫자만 허용 (빈 문자열 또는 숫자)
                  if (value === '' || /^\d+$/.test(value)) {
                    handleCategoryLevelChange(level, value)
                  }
                }}
                onKeyDown={(e) => {
                  // 숫자, 백스페이스, 삭제, 화살표 키만 허용
                  if (
                    !/[0-9]/.test(e.key) &&
                    !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key) &&
                    !(e.ctrlKey || e.metaKey) // Ctrl+C, Ctrl+V 등 허용
                  ) {
                    e.preventDefault()
                  }
                }}
                placeholder=""
                min="0"
                step="1"
                className={`text-center ${errors.category ? 'border-destructive' : ''}`}
              />
            </div>
          ))}
        </div>
        {errors.category && <p className="text-sm text-destructive">{errors.category}</p>}
      </div>

      {/* 레이블 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-left block">레이블 *</label>
        {formData.category ? (
          <div className="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
            <p className="text-sm font-medium text-blue-700 dark:text-blue-300">{formData.category}</p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">카테고리를 입력하면 자동으로 레이블이 생성됩니다.</p>
        )}
      </div>

      {/* 문제 제시문 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-left block">문제 제시문 *</label>
        <textarea
          value={formData.content || ''}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          placeholder="문제 내용을 입력하세요"
          rows={4}
          className={`w-full rounded-md border border-input bg-background px-3 py-2 text-sm ${
            errors.content ? 'border-destructive' : ''
          }`}
        />
        {errors.content && <p className="text-sm text-destructive">{errors.content}</p>}
      </div>

      {/* 서브 제시문 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-left block">문제 서브 제시문 (선택)</label>
        <textarea
          value={formData.subContent || ''}
          onChange={(e) => setFormData({ ...formData, subContent: e.target.value })}
          placeholder="추가 설명이나 보조 문제 내용을 입력하세요"
          rows={3}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
        
        {/* 이미지 업로드 영역 */}
        <div className="space-y-2">
          {formData.subContentImageUrl ? (
            <div className="space-y-2">
              <div className="relative inline-block">
                <img
                  src={formData.subContentImageUrl}
                  alt="서브 제시문 이미지"
                  className="max-h-64 rounded-md border border-border"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8"
                  onClick={handleImageDelete}
                  title="이미지 삭제"
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
              {/* 이미지 변경 버튼 추가 */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  handleImageDelete()
                  setTimeout(() => {
                    fileInputRef.current?.click()
                  }, 100)
                }}
              >
                <Upload className="h-4 w-4 mr-2" />
                이미지 변경
              </Button>
            </div>
          ) : (
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
            >
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-1">
                이미지를 드래그하거나 클릭하여 업로드
              </p>
              <p className="text-xs text-muted-foreground">
                지원 형식: JPEG, PNG, WebP, GIF (최대 5MB)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    handleImageUpload(file)
                  }
                }}
                className="hidden"
              />
            </div>
          )}
          {uploadingImage && (
            <p className="text-sm text-muted-foreground">이미지 업로드 중...</p>
          )}
          {errors.subContentImageUrl && (
            <div className="space-y-2">
              <p className="text-sm text-destructive">{errors.subContentImageUrl}</p>
              {errors.subContentImageUrl.includes('버킷') && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                  <p className="text-xs font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                    💡 해결 방법:
                  </p>
                  <ol className="text-xs text-yellow-700 dark:text-yellow-300 list-decimal list-inside space-y-1">
                    <li>Supabase Dashboard → Storage로 이동</li>
                    <li>"New bucket" 버튼 클릭</li>
                    <li>버킷 이름: <code className="bg-yellow-100 dark:bg-yellow-950 px-1 rounded">images</code></li>
                    <li>Public bucket 옵션 선택 (또는 Private + RLS 정책 설정)</li>
                    <li>Create bucket 클릭</li>
                  </ol>
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                    자세한 가이드는 프로젝트 루트의 <code className="bg-yellow-100 dark:bg-yellow-950 px-1 rounded">setup_storage_bucket.md</code> 파일을 참고하세요.
                  </p>
                </div>
              )}
              {(errors.subContentImageUrl.includes('RLS') || errors.subContentImageUrl.includes('policy') || errors.subContentImageUrl.includes('row-level security')) && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                  <p className="text-xs font-medium text-red-800 dark:text-red-200 mb-2">
                    💡 해결 방법: Storage RLS 정책 설정
                  </p>
                  <ol className="text-xs text-red-700 dark:text-red-300 list-decimal list-inside space-y-1 mb-2">
                    <li>Supabase Dashboard → SQL Editor로 이동</li>
                    <li>프로젝트 루트의 <code className="bg-red-100 dark:bg-red-950 px-1 rounded">add_storage_policies.sql</code> 파일 내용을 복사</li>
                    <li>SQL Editor에 붙여넣고 실행</li>
                  </ol>
                  <details className="text-xs">
                    <summary className="text-red-700 dark:text-red-300 font-medium cursor-pointer mb-1">SQL 직접 실행하기</summary>
                    <div className="mt-2 space-y-2">
                      <div>
                        <p className="text-red-600 dark:text-red-400 mb-1">업로드 정책:</p>
                        <pre className="p-2 bg-red-50 dark:bg-red-950/50 rounded text-xs text-red-800 dark:text-red-300 overflow-x-auto">
{`CREATE POLICY "Allow authenticated uploads to question-images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'images' AND
  (storage.foldername(name))[1] = 'question-images'
);`}
                        </pre>
                      </div>
                      <div>
                        <p className="text-red-600 dark:text-red-400 mb-1">읽기 정책 (Public):</p>
                        <pre className="p-2 bg-red-50 dark:bg-red-950/50 rounded text-xs text-red-800 dark:text-red-300 overflow-x-auto">
{`CREATE POLICY "Allow public read images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'images');`}
                        </pre>
                      </div>
                      <div>
                        <p className="text-red-600 dark:text-red-400 mb-1">삭제 정책:</p>
                        <pre className="p-2 bg-red-50 dark:bg-red-950/50 rounded text-xs text-red-800 dark:text-red-300 overflow-x-auto">
{`CREATE POLICY "Allow users delete own images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'images' AND
  auth.uid()::text = (storage.foldername(name))[2]
);`}
                        </pre>
                      </div>
                    </div>
                  </details>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 선택지 개수 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-left block">선택지 개수</label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={choiceCount === 5 ? 'default' : 'outline'}
            onClick={() => handleChoiceCountChange(5)}
          >
            5지선다
          </Button>
          <Button
            type="button"
            variant={choiceCount === 4 ? 'default' : 'outline'}
            onClick={() => handleChoiceCountChange(4)}
          >
            4지선다
          </Button>
        </div>
      </div>

      {/* 선택지 입력 */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-left block">선택지 *</label>
        {(formData.options || []).slice(0, choiceCount).map((option, index) => {
          const optionNumber = ['①', '②', '③', '④', '⑤'][index] // ①②③④⑤
          const optionLetter = String.fromCharCode(65 + index) // A, B, C, D, E (내부 저장용)
          return (
            <div key={index} className="flex gap-2 items-center">
              <span className="w-8 text-sm font-medium">{optionNumber}</span>
              <Input
                value={option}
                onChange={(e) => handleOptionChange(index, e.target.value)}
                placeholder={`${optionNumber} 선택지 입력`}
                className={errors.options ? 'border-destructive' : ''}
              />
            </div>
          )
        })}
        {errors.options && <p className="text-sm text-destructive">{errors.options}</p>}
      </div>

      {/* 정답 선택 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-left block">정답 *</label>
        <div className="flex gap-2">
          {(formData.options || []).slice(0, choiceCount).map((_, index) => {
            const answerNumber = ['①', '②', '③', '④', '⑤'][index] // ①②③④⑤
            const answerLetter = String.fromCharCode(65 + index) // A, B, C, D, E (내부 저장용)
            return (
              <Button
                key={index}
                type="button"
                variant={formData.correctAnswer === answerLetter ? 'default' : 'outline'}
                onClick={() => setFormData({ ...formData, correctAnswer: answerLetter })}
                className={errors.correctAnswer ? 'border-destructive' : ''}
              >
                {answerNumber}
              </Button>
            )
          })}
        </div>
        {errors.correctAnswer && <p className="text-sm text-destructive">{errors.correctAnswer}</p>}
      </div>

      {/* 해설 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-left block">해설 *</label>
        <textarea
          value={formData.explanation || ''}
          onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
          placeholder="문제 해설을 입력하세요"
          rows={5}
          className={`w-full rounded-md border border-input bg-background px-3 py-2 text-sm ${
            errors.explanation ? 'border-destructive' : ''
          }`}
        />
        {errors.explanation && <p className="text-sm text-destructive">{errors.explanation}</p>}
      </div>

      {/* 난이도 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-left block">난이도</label>
        <div className="flex gap-2">
          {(['상', '중', '하'] as const).map((level) => (
            <Button
              key={level}
              type="button"
              variant={formData.difficulty === level ? 'default' : 'outline'}
              onClick={() => setFormData({ ...formData, difficulty: level })}
            >
              {level}
            </Button>
          ))}
        </div>
      </div>

      {/* 출제빈도 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-left block">출제빈도 (선택)</label>
        <Input
          type="number"
          value={formData.frequency || ''}
          onChange={(e) =>
            setFormData({
              ...formData,
              frequency: e.target.value ? parseInt(e.target.value, 10) : undefined,
            })
          }
          placeholder="출제빈도 입력"
          min={0}
        />
      </div>

      {/* 기출년도, 기출회차 및 기출번호 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-left block">
            기출년도 (선택)
            <span className="text-xs text-muted-foreground ml-1 block">형식: YYYY (예: 2024)</span>
          </label>
          <Input
            type="text"
            placeholder="2024"
            value={examYear}
            onChange={(e) => {
              const value = e.target.value
              // 숫자만 허용하고 4자리로 제한
              const formatted = value.replace(/[^\d]/g, '').slice(0, 4)
              setExamYear(formatted)
              // examSession은 useEffect에서 자동 업데이트됨
            }}
            maxLength={4}
            className="text-left"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-left block">
            기출회차 (선택)
            <span className="text-xs text-muted-foreground ml-1 block">2자리 숫자 (예: 03, 37)</span>
          </label>
          <Input
            type="text"
            placeholder="예: 03, 37"
            value={examSessionNumber}
            onChange={(e) => {
              const value = e.target.value
              // 숫자만 허용하고 2자리로 제한
              const formatted = value.replace(/[^\d]/g, '').slice(0, 2)
              setExamSessionNumber(formatted)
            }}
            onBlur={() => {
              // 포커스를 잃을 때 2자리로 포맷팅
              if (examSessionNumber && examSessionNumber.length === 1) {
                const formatted = examSessionNumber.padStart(2, '0')
                setExamSessionNumber(formatted)
              }
            }}
            maxLength={2}
            className="text-left"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-left block">
            기출번호 (선택)
            <span className="text-xs text-muted-foreground ml-1 block">2자리 숫자 (예: 03, 57)</span>
          </label>
          <Input
            type="text"
            value={examNumberInput}
            onChange={(e) => {
              let value = e.target.value
              // 숫자만 허용하고 최대 2자리
              value = value.replace(/[^0-9]/g, '').slice(0, 2)
              setExamNumberInput(value)
              // formData에는 숫자로 저장
              const numValue = value === '' ? undefined : parseInt(value, 10)
              setFormData({
                ...formData,
                examNumber: numValue,
              })
            }}
            onBlur={() => {
              // 포커스를 잃을 때 2자리로 포맷팅
              if (examNumberInput && examNumberInput.length === 1) {
                const formatted = examNumberInput.padStart(2, '0')
                setExamNumberInput(formatted)
              }
            }}
            placeholder="예: 03, 57"
            maxLength={2}
          />
        </div>
      </div>

      {/* 버튼 */}
      <div className="flex gap-4">
        <Button type="submit" disabled={submitting} className="flex-1">
          {submitting 
            ? (mode === 'edit' ? '수정 중...' : '저장 중...') 
            : (mode === 'edit' ? '문제 수정' : '문제 저장')}
        </Button>
      </div>
    </form>
  )
}

