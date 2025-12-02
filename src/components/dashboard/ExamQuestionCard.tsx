/**
 * Exam Question Card Component
 * 
 * 기출문제를 선택하고 풀 수 있는 카드 컴포넌트
 */

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '@/context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getExamQuestionSet } from '@/lib/api/questions'
import { supabase } from '@/lib/supabaseClient'
import { BookOpen, Clock, Play } from 'lucide-react'

type CertificationType = '정보처리기사' | '컴퓨터활용능력' | '빅데이터분석기사' | '경영정보시각화능력' | 'ADsP' | 'SQLD'

const CERTIFICATIONS: CertificationType[] = [
  '정보처리기사',
  '컴퓨터활용능력',
  '빅데이터분석기사',
  '경영정보시각화능력',
  'ADsP',
  'SQLD',
]

type ExamSubject = '1과목' | '2과목' | '3과목' | '4과목' | '5과목' | '전체'

export default function ExamQuestionCard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [selectedCertification, setSelectedCertification] = useState<CertificationType | ''>('')
  const [examYear, setExamYear] = useState<string>('')
  const [examSessionNumber, setExamSessionNumber] = useState<string>('')
  const [examSubject, setExamSubject] = useState<ExamSubject | ''>('')
  const [questionIds, setQuestionIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [availableYears, setAvailableYears] = useState<string[]>([])
  const [availableSessions, setAvailableSessions] = useState<string[]>([]) // 사용 가능한 회차 목록 (예: ['1', '2', '3'])
  const [availableSubjects, setAvailableSubjects] = useState<ExamSubject[]>([]) // 사용 가능한 과목 목록

  const EXAM_SUBJECTS: ExamSubject[] = ['1과목', '2과목', '3과목', '4과목', '5과목', '전체']

  // examSession 계산 (기출년도와 기출회차를 합쳐서)
  const examSession = useMemo(() => {
    if (examYear && examSessionNumber) {
      return `${examYear}-${examSessionNumber.padStart(2, '0')}`
    }
    return ''
  }, [examYear, examSessionNumber])

  // 문제 불러오기
  const loadExamQuestions = useCallback(async () => {
    // examSubject가 필수이므로 없으면 문제를 불러오지 않음
    if (!user || !selectedCertification || !examSession || !examSubject || examSubject === '전체') {
      console.log(`⏸️ 문제 불러오기 스킵: user=${!!user}, 자격증=${selectedCertification}, 회차=${examSession}, 과목=${examSubject}`)
      setQuestionIds([])
      return
    }

    try {
      setLoading(true)
      console.log(`🔄 ${selectedCertification} 기출문제 불러오기 시작: userId=${user.id}, session=${examSession}, subject=${examSubject || '전체'}`)
      
      // 자격증별 대분류 번호 매핑
      const certificationToCategoryMap: Record<string, string> = {
        '정보처리기사': '1',
        '컴퓨터활용능력': '2',
        '빅데이터분석기사': '3',
        '경영정보시각화능력': '4',
        'ADsP': '5',
        'SQLD': '6',
      }

      const 대분류번호 = certificationToCategoryMap[selectedCertification]
      let query = supabase
        .from('questions')
        .select('id, exam_session, exam_number, category')
        .eq('certification_type', selectedCertification)
        .eq('exam_session', examSession)

      // examSubject가 필수이므로 항상 중분류 필터링 적용
      if (examSubject && examSubject !== '전체' && 대분류번호) {
        // '1과목' -> '1', '2과목' -> '2', '3과목' -> '3' 등으로 변환
        const 중분류번호 = examSubject.replace('과목', '')
        // 중분류가 해당 번호인 문제만 필터링
        // 예: "3과목" 선택 시 category LIKE '3-3-%' (빅데이터분석기사의 경우)
        query = query.like('category', `${대분류번호}-${중분류번호}-%`)
        console.log(`🔍 기출과목 필터 적용: ${examSubject} (중분류=${중분류번호}) → category LIKE '${대분류번호}-${중분류번호}-%'`)
      } else if (대분류번호) {
        // 전체 선택 시 대분류만 필터링 (모든 과목 포함)
        query = query.like('category', `${대분류번호}-%`)
        console.log(`🔍 대분류 필터 적용: category LIKE '${대분류번호}-%' (모든 과목)`)
      }

      // exam_number로 정렬 (오름차순)
      try {
        query = query.order('exam_number', { ascending: true })
      } catch (orderError) {
        console.log('⚠️ exam_number 정렬 실패, created_at으로 정렬:', orderError)
        // exam_number 정렬 실패 시 카테고리의 중분류 기준으로 정렬 시도
        try {
          // 카테고리로 정렬 (중분류 기준)
          query = query.order('category', { ascending: true })
        } catch (categoryOrderError) {
          query = query.order('created_at', { ascending: false })
        }
      }

      const { data, error } = await query

      if (error) {
        console.error('❌ 기출문제 불러오기 에러:', error)
        // exam_session 또는 exam_number 컬럼이 없는 경우 fallback
        if (error.message?.includes('exam_session') || error.message?.includes('exam_number') || error.code === '42703') {
          console.log('⚠️ exam_session 또는 exam_number 컬럼이 없어 일반 문제를 가져옵니다.')
          const ids = await getExamQuestionSet(user.id, selectedCertification, 50)
          setQuestionIds(ids)
          return
        }
        setQuestionIds([])
        return
      }

      // 중분류 기준으로 추가 필터링 및 정렬 (클라이언트 측)
      // 서버 측 필터링이 완벽하지 않을 수 있으므로 클라이언트 측에서도 검증
      let filteredData = data || []
      
      // examSubject가 필수이므로 항상 필터링 적용
      if (examSubject && examSubject !== '전체') {
        const 중분류번호 = examSubject.replace('과목', '')
        console.log(`🔍 클라이언트 측 필터링 시작: 요청 중분류=${중분류번호}, 서버 데이터=${data?.length || 0}개`)
        
        // 클라이언트 측에서 중분류 필터링 (이중 검증)
        const beforeFilter = filteredData.length
        filteredData = filteredData.filter((q: any) => {
          const category = q.category || ''
          const parts = category.split('-')
          const 중분류 = parts[1] || ''
          
          // 중분류가 일치하는지 확인
          const matches = 중분류 === 중분류번호
          
          if (!matches) {
            console.log(`❌ 필터링 제외: category=${category}, 중분류=${중분류}, 요청=${중분류번호}`)
          } else {
            console.log(`✅ 필터링 포함: category=${category}, 중분류=${중분류}`)
          }
          
          return matches
        })
        
        console.log(`🔍 클라이언트 측 필터링 결과: ${filteredData.length}개 (필터링 전: ${beforeFilter}개, 서버: ${data?.length || 0}개)`)
        
        if (filteredData.length === 0 && beforeFilter > 0) {
          console.warn(`⚠️ 필터링 후 문제가 0개입니다. 서버 데이터의 카테고리:`, data?.map((q: any) => q.category))
        }
      } else {
        console.warn(`⚠️ examSubject가 없거나 '전체'입니다. 필터링을 건너뜁니다.`)
      }
      
      // 정렬: exam_number 오름차순
      let sortedData = filteredData.sort((a: any, b: any) => {
        const aExamNum = a.exam_number || 0
        const bExamNum = b.exam_number || 0
        return aExamNum - bExamNum
      })

      const ids = sortedData.map((q: any) => q.id)
      console.log(`📦 ${selectedCertification} 기출문제 ID: ${ids.length}개 (회차: ${examSession}${examSubject ? `, 과목: ${examSubject}` : ''})`, ids)
      console.log(`📋 필터링된 문제 상세:`, sortedData.map((q: any) => ({ 
        id: q.id, 
        category: q.category, 
        exam_number: q.exam_number 
      })))
      setQuestionIds(ids)
    } catch (error) {
      console.error(`❌ ${selectedCertification} 기출문제를 가져오는 중 에러 발생:`, error)
      setQuestionIds([])
    } finally {
      setLoading(false)
    }
  }, [user, selectedCertification, examSession, examSubject])

  // 자격증, 기출년도, 기출회차, 과목 변경 시 문제 다시 로드
  // examSubject가 필수이므로 선택되어야만 문제를 불러옴
  // examYear와 examSessionNumber가 모두 입력되어야 examSession이 생성되므로, 이들도 의존성에 포함
  useEffect(() => {
    // 기출년도와 기출회차가 모두 입력되어야 examSession이 생성됨
    const hasValidSession = examYear && examSessionNumber && examSession
    
    if (selectedCertification && hasValidSession && examSubject) {
      console.log(`🔄 문제 로드 트리거: 자격증=${selectedCertification}, 년도=${examYear}, 회차=${examSessionNumber}, 조합된 회차=${examSession}, 과목=${examSubject}`)
      loadExamQuestions()
    } else {
      console.log(`⏸️ 문제 로드 스킵: 자격증=${selectedCertification}, 년도=${examYear}, 회차=${examSessionNumber}, 조합된 회차=${examSession}, 과목=${examSubject}`)
      setQuestionIds([])
    }
  }, [selectedCertification, examYear, examSessionNumber, examSession, examSubject, loadExamQuestions])

  const handleStartLearning = () => {
    if (!selectedCertification || !examSession || questionIds.length === 0) return

    // 기출문제 세션을 위한 상태 저장
    const sessionData = {
      questionIds,
      certificationType: selectedCertification,
      examSession: examSession,
      examSubject: examSubject || undefined,
      isExamQuestion: true,
    }

    navigate('/learning', { state: sessionData })
  }

  // 자격증별 사용 가능한 연도 가져오기
  const loadAvailableYears = useCallback(async () => {
    if (!selectedCertification) {
      setAvailableYears([])
      return
    }

    try {
      const { data, error } = await supabase
        .from('questions')
        .select('exam_session')
        .eq('certification_type', selectedCertification)
        .not('exam_session', 'is', null)

      if (error) {
        console.error('❌ 사용 가능한 연도 가져오기 에러:', error)
        // 에러 발생 시 기본 연도 목록 제공 (최근 5년)
        const currentYear = new Date().getFullYear()
        const defaultYears = Array.from({ length: 5 }, (_, i) => String(currentYear - i))
        setAvailableYears(defaultYears)
        return
      }

      // exam_session에서 연도 추출 (예: "2024-01" -> "2024")
      const years = new Set<string>()
      if (data && data.length > 0) {
        data.forEach((q: any) => {
          if (q.exam_session) {
            const year = q.exam_session.split('-')[0]
            if (year && year.length === 4) {
              years.add(year)
            }
          }
        })
      }

      // 연도를 내림차순으로 정렬 (최신 연도가 먼저)
      const sortedYears = Array.from(years).sort((a, b) => parseInt(b) - parseInt(a))
      
      // 연도가 없으면 기본 연도 목록 제공 (최근 5년)
      if (sortedYears.length === 0) {
        const currentYear = new Date().getFullYear()
        const defaultYears = Array.from({ length: 5 }, (_, i) => String(currentYear - i))
        setAvailableYears(defaultYears)
      } else {
        setAvailableYears(sortedYears)
      }
    } catch (error) {
      console.error('❌ 사용 가능한 연도 가져오기 중 오류:', error)
      // 에러 발생 시 기본 연도 목록 제공
      const currentYear = new Date().getFullYear()
      const defaultYears = Array.from({ length: 5 }, (_, i) => String(currentYear - i))
      setAvailableYears(defaultYears)
    }
  }, [selectedCertification])

  // 자격증과 연도에 따른 사용 가능한 회차 가져오기
  const loadAvailableSessions = useCallback(async () => {
    if (!selectedCertification || !examYear) {
      setAvailableSessions([])
      setAvailableSubjects([])
      return
    }

    try {
      const { data, error } = await supabase
        .from('questions')
        .select('exam_session, category')
        .eq('certification_type', selectedCertification)
        .like('exam_session', `${examYear}-%`)

      if (error) {
        console.error('❌ 사용 가능한 회차 가져오기 에러:', error)
        setAvailableSessions([])
        setAvailableSubjects([])
        return
      }

      // exam_session에서 회차 추출 (예: "2024-01" -> "1", "2024-02" -> "2")
      const sessions = new Set<string>()
      const subjects = new Set<string>()
      
      if (data && data.length > 0) {
        data.forEach((q: any) => {
          if (q.exam_session) {
            const parts = q.exam_session.split('-')
            if (parts.length >= 2) {
              const sessionNum = parts[1].replace(/^0+/, '') || parts[1] // 앞의 0 제거
              sessions.add(sessionNum)
            }
          }
          
          // 카테고리에서 중분류 추출 (예: "3-2-3-4" -> "2" -> "2과목")
          if (q.category) {
            const categoryParts = q.category.split('-')
            if (categoryParts.length >= 2) {
              const 중분류 = categoryParts[1]
              if (중분류 && !isNaN(parseInt(중분류))) {
                subjects.add(`${중분류}과목`)
              }
            }
          }
        })
      }

      // 회차를 오름차순으로 정렬
      const sortedSessions = Array.from(sessions).sort((a, b) => parseInt(a) - parseInt(b))
      setAvailableSessions(sortedSessions)

      // 과목을 오름차순으로 정렬
      const sortedSubjects = Array.from(subjects).sort((a, b) => {
        const numA = parseInt(a.replace('과목', ''))
        const numB = parseInt(b.replace('과목', ''))
        return numA - numB
      }) as ExamSubject[]
      
      // '전체' 옵션 추가
      if (sortedSubjects.length > 0) {
        setAvailableSubjects([...sortedSubjects, '전체'])
      } else {
        // 과목이 없으면 기본 과목 목록 제공
        setAvailableSubjects(EXAM_SUBJECTS)
      }
    } catch (error) {
      console.error('❌ 사용 가능한 회차 가져오기 중 오류:', error)
      setAvailableSessions([])
      setAvailableSubjects(EXAM_SUBJECTS)
    }
  }, [selectedCertification, examYear])

  // 자격증 선택 시 회차/과목 초기화 및 사용 가능한 연도 로드
  const handleCertificationChange = (value: CertificationType | '') => {
    setSelectedCertification(value)
    setExamYear('')
    setExamSessionNumber('')
    setExamSubject('')
    setQuestionIds([])
    setAvailableSessions([])
    setAvailableSubjects([])
  }

  // 자격증 선택 시 사용 가능한 연도 로드
  useEffect(() => {
    if (selectedCertification) {
      loadAvailableYears()
    } else {
      setAvailableYears([])
      setAvailableSessions([])
      setAvailableSubjects([])
    }
  }, [selectedCertification, loadAvailableYears])

  // 연도 선택 시 사용 가능한 회차 및 과목 로드
  useEffect(() => {
    if (selectedCertification && examYear) {
      loadAvailableSessions()
    } else {
      setAvailableSessions([])
      setAvailableSubjects([])
    }
  }, [selectedCertification, examYear, loadAvailableSessions])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/20 rounded-xl p-6 md:p-8 space-y-6"
    >
      {/* 헤더 */}
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">기출문제</h2>
          </div>
          <p className="text-muted-foreground">
            {selectedCertification && examSession ? (
              examSubject ? `${examSubject} 문제를 불러오세요` : '기출과목을 선택해주세요'
            ) : (
              '자격증과 기출회차를 선택해주세요'
            )}
          </p>
        </div>
      </div>

      {/* 자격증 선택 및 기출년도/회차/과목 입력 */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          {/* 자격증 선택 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-left block">자격증 선택</label>
            <Select
              value={selectedCertification || undefined}
              onValueChange={(value) => handleCertificationChange(value as CertificationType)}
            >
              <SelectTrigger className="w-full">
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
          </div>

          {/* 기출년도 선택 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-left block">
              기출년도 (선택)
            </label>
            <Select
              value={examYear || undefined}
              onValueChange={(value) => setExamYear(value)}
              disabled={!selectedCertification || availableYears.length === 0}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="연도를 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}년
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 기출회차 선택 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-left block">
              기출회차 (선택)
            </label>
            <Select
              value={examSessionNumber || undefined}
              onValueChange={(value) => setExamSessionNumber(value)}
              disabled={!selectedCertification || !examYear || availableSessions.length === 0}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="회차를 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {availableSessions.map((session) => (
                  <SelectItem key={session} value={session}>
                    {session}회차
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 기출과목 선택 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-left block">기출과목 선택</label>
            <Select
              value={examSubject || undefined}
              onValueChange={(value) => setExamSubject(value as ExamSubject)}
              disabled={!selectedCertification || !examSession || availableSubjects.length === 0}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="과목을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {availableSubjects.length > 0 ? (
                  availableSubjects.map((subject) => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))
                ) : (
                  EXAM_SUBJECTS.map((subject) => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* 시작 버튼 */}
      <Button
        onClick={handleStartLearning}
        disabled={!selectedCertification || !examSession || !examSubject || questionIds.length === 0 || loading}
        size="lg"
        className="w-full"
      >
        {loading ? (
          '문제 불러오는 중...'
        ) : !selectedCertification ? (
          '자격증을 선택해주세요'
        ) : !examSession ? (
          '기출회차를 입력해주세요'
        ) : !examSubject ? (
          '기출과목을 선택해주세요'
        ) : questionIds.length === 0 ? (
          '문제가 없습니다'
        ) : (
          <>
            <Play className="mr-2 h-5 w-5" />
            기출문제 풀기
          </>
        )}
      </Button>
    </motion.div>
  )
}

