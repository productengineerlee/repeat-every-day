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

type CertificationType = '정보처리기사' | '컴퓨터활용능력' | '빅데이터분석기사' | '경영정보시각화능력' | 'ADsP' | 'SQLD' | '사회조사분석사' | 'TESAT' | '공인중개사'

const CERTIFICATIONS: CertificationType[] = [
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

type ExamSubject = '1과목' | '2과목' | '3과목' | '4과목' | '5과목' | '전체' | '1과목-데이터 이해' | '2과목-데이터분석 기획' | '3과목-데이터분석'

// 자격증별 회차 매핑
const CERT_SESSIONS_MAP: Record<string, Record<string, string[]>> = {
  'ADsP': {
    '2024': ['37', '38', '39', '40'],
    '2023': ['33', '34', '35', '36'],
    '2022': ['29', '30', '31', '32'],
  },
}

// 자격증별 과목 매핑
const CERT_SUBJECTS_MAP: Record<string, (ExamSubject | string)[]> = {
  'ADsP': ['1과목-데이터 이해', '2과목-데이터분석 기획', '3과목-데이터분석', '전체'],
}

export default function ExamQuestionCard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [selectedCertification, setSelectedCertification] = useState<CertificationType | ''>('')
  const [examYear, setExamYear] = useState<string>('')
  const [examSessionNumber, setExamSessionNumber] = useState<string>('')
  const [examSubject, setExamSubject] = useState<ExamSubject | string>('')
  const [questionIds, setQuestionIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [availableYears, setAvailableYears] = useState<string[]>([])
  const [availableSessions, setAvailableSessions] = useState<string[]>([]) // 사용 가능한 회차 목록 (예: ['1', '2', '3'])
  const [availableSubjects, setAvailableSubjects] = useState<(ExamSubject | string)[]>([]) // 사용 가능한 과목 목록

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
    // 자격증과 기출년도만 있으면 문제 불러오기 시도
    if (!user || !selectedCertification || !examYear) {
      console.log(`⏸️ 문제 불러오기 스킵: user=${!!user}, 자격증=${selectedCertification}, 년도=${examYear}`)
      setQuestionIds([])
      return
    }

    try {
      setLoading(true)
      console.log(`🔄 ${selectedCertification} 기출문제 불러오기 시작: userId=${user.id}, 년도=${examYear}, 회차=${examSessionNumber || '전체'}, 과목=${examSubject || '전체'}`)
      
      // 자격증별 대분류 번호 매핑
      const certificationToCategoryMap: Record<string, string> = {
        '정보처리기사': '1',
        '컴퓨터활용능력': '2',
        '빅데이터분석기사': '3',
        '경영정보시각화능력': '4',
        'ADsP': '5',
        'SQLD': '6',
        '사회조사분석사': '7',
        'TESAT': '8',
        '공인중개사': '9',
      }

      const 대분류번호 = certificationToCategoryMap[selectedCertification]
      
      // 모든 문제를 가져온 후 클라이언트에서 필터링
      let query = supabase
        .from('questions')
        .select('id, exam_session, exam_number, category')
        .eq('certification_type', selectedCertification)
        .limit(1000)
      
      console.log(`🔍 ${selectedCertification} 문제 조회 (연도: ${examYear}, 회차: ${examSessionNumber || '전체'})`)

      // examSubject가 필수이므로 항상 중분류 필터링 적용
      if (examSubject && examSubject !== '전체' && 대분류번호) {
        // '1과목' -> '1', '1과목-데이터 이해' -> '1' 등으로 변환
        let 중분류번호 = examSubject
        if (examSubject.includes('-')) {
          // "1과목-데이터 이해" 형식
          중분류번호 = examSubject.split('-')[0].replace('과목', '')
        } else {
          // "1과목" 형식
          중분류번호 = examSubject.replace('과목', '')
        }
        // 중분류가 해당 번호인 문제만 필터링
        // 예: "3과목" 선택 시 category LIKE '3-3-%' (빅데이터분석기사의 경우)
        query = query.like('category', `${대분류번호}-${중분류번호}-%`)
        console.log(`🔍 기출과목 필터 적용: ${examSubject} (중분류=${중분류번호}) → category LIKE '${대분류번호}-${중분류번호}-%'`)
      } else {
        console.log(`ℹ️ 기출과목 미선택: 해당 년도의 모든 과목 문제 표시`)
        // 대분류가 있으면 대분류 필터만 적용
        if (대분류번호) {
          query = query.like('category', `${대분류번호}-%`)
          console.log(`🔍 대분류 필터 적용: category LIKE '${대분류번호}-%'`)
        } else {
          console.warn(`⚠️ ${selectedCertification}의 대분류 번호가 없습니다. category 필터 없이 검색합니다.`)
        }
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
        console.error('에러 상세:', { message: error.message, code: error.code, details: error.details })
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

      console.log(`📊 데이터베이스에서 ${data?.length || 0}개 문제 반환됨`)
      if (data && data.length > 0) {
        console.log('📋 첫 3개 문제 샘플:', data.slice(0, 3).map((q: any) => ({
          id: q.id,
          exam_session: q.exam_session,
          exam_number: q.exam_number,
          category: q.category
        })))
      } else {
        console.warn(`⚠️ ${selectedCertification} ${examYear}년${examSessionNumber ? ` ${examSessionNumber}회차` : ''}${examSubject ? ` ${examSubject}` : ''} 문제가 데이터베이스에 없습니다.`)
      }

      // 클라이언트 측 필터링
      let filteredData = data || []
      
      // 1. exam_session 필터링 (연도와 회차)
      if (examSessionNumber) {
        // 회차가 선택된 경우에만 필터링
        const beforeFilter = filteredData.length
        const paddedSession = examSessionNumber.padStart(2, '0')
        
        filteredData = filteredData.filter((q: any) => {
          const session = q.exam_session || ''
          
          // "2022-02", "02", "2" 형식 모두 매칭
          const matchSession = session === `${examYear}-${paddedSession}` || 
                              session === paddedSession || 
                              session === examSessionNumber ||
                              session.endsWith(`-${paddedSession}`) ||
                              session.endsWith(`-${examSessionNumber}`)
          
          if (!matchSession) {
            console.log(`❌ 회차 불일치: exam_session="${session}", 요청="${examSessionNumber}"`)
          }
          
          return matchSession
        })
        console.log(`🔍 회차 필터링 결과: ${filteredData.length}개 (필터링 전: ${beforeFilter}개)`)
      }
      
      // 2. examSubject 필터링
      if (examSubject && examSubject !== '전체') {
        // '1과목' -> '1', '1과목-데이터 이해' -> '1' 등으로 변환
        let 중분류번호 = examSubject
        if (examSubject.includes('-')) {
          중분류번호 = examSubject.split('-')[0].replace('과목', '')
        } else {
          중분류번호 = examSubject.replace('과목', '')
        }
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
  }, [user, selectedCertification, examYear, examSessionNumber, examSubject])

  // 자격증, 기출년도 변경 시 문제 다시 로드 (기출회차와 과목은 선택사항)
  useEffect(() => {
    if (selectedCertification && examYear) {
      console.log(`🔄 문제 로드 트리거: 자격증=${selectedCertification}, 년도=${examYear}, 회차=${examSessionNumber || '전체'}, 과목=${examSubject || '전체'}`)
      loadExamQuestions()
    } else {
      console.log(`⏸️ 문제 로드 스킵: 자격증=${selectedCertification}, 년도=${examYear}`)
      setQuestionIds([])
    }
  }, [selectedCertification, examYear, examSessionNumber, examSubject, loadExamQuestions])

  const handleStartLearning = () => {
    if (!selectedCertification || questionIds.length === 0) return

    // 기출문제 세션을 위한 상태 저장
    const sessionData = {
      questionIds,
      certificationType: selectedCertification,
      examSession: examSession || undefined,
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

    // 매핑된 회차가 있는지 확인
    const mappedSessions = CERT_SESSIONS_MAP[selectedCertification]?.[examYear]
    const mappedSubjects = CERT_SUBJECTS_MAP[selectedCertification]
    
    if (mappedSessions && mappedSubjects) {
      // 매핑된 데이터 사용
      console.log(`✅ ${selectedCertification} ${examYear}년 매핑 데이터 사용: 회차=${mappedSessions.join(',')}, 과목=${mappedSubjects.join(',')}`)
      setAvailableSessions(mappedSessions)
      setAvailableSubjects(mappedSubjects)
      return
    }

    // 매핑이 없으면 DB에서 가져오기
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
      className="relative bg-gradient-to-br from-slate-50 via-blue-50/50 to-slate-50 dark:from-slate-900/30 dark:via-blue-950/20 dark:to-slate-900/30 border border-slate-200/80 dark:border-slate-700/50 rounded-xl p-5 md:p-6 space-y-4 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
    >
      {/* 배경 장식 */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-100/10 to-slate-100/10 rounded-full blur-3xl -z-0" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-slate-100/10 to-blue-100/10 rounded-full blur-3xl -z-0" />
      
      {/* 콘텐츠 */}
      <div className="relative z-10">
        {/* 헤더 */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <motion.img 
              src="/mascot.png" 
              alt="Certiq Mascot" 
              className="w-16 h-16 object-contain drop-shadow-md"
              initial={{ rotate: -10 }}
              animate={{ rotate: 0 }}
              transition={{ type: "spring", stiffness: 200 }}
            />
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-700 dark:text-slate-200">
                기출문제
              </h2>
            </div>
          </div>
          <p className="text-sm md:text-base text-slate-600 dark:text-slate-300 mb-4">
            {selectedCertification && examSession ? (
              examSubject ? (
                <>
                  <span className="text-blue-600 dark:text-blue-400 font-semibold">{examSubject}</span> 문제를 불러오세요 📚
                </>
              ) : (
                '기출과목을 선택해주세요'
              )
            ) : (
              '자격증과 기출회차를 선택해주세요'
            )}
          </p>
        </div>

        {/* 구분선 */}
        <div className="h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent my-4" />

        {/* 자격증 선택 및 기출년도/회차/과목 입력 */}
        <div className="space-y-4 relative z-10 py-2">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 자격증 선택 */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-2"
            >
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center justify-center gap-1">
                자격증 선택
              </label>
              <Select
                value={selectedCertification || undefined}
                onValueChange={(value) => handleCertificationChange(value as CertificationType)}
              >
                <SelectTrigger className="w-full h-10 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-blue-400 dark:hover:border-blue-500 transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-center">
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
            </motion.div>

            {/* 기출년도 선택 */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-2"
            >
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center justify-center gap-1">
                기출년도
              </label>
              <Select
                value={examYear || undefined}
                onValueChange={(value) => setExamYear(value)}
                disabled={!selectedCertification}
              >
                <SelectTrigger className="w-full h-10 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-blue-400 dark:hover:border-blue-500 transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-center">
                  <SelectValue placeholder="연도를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.length > 0 ? (
                    availableYears.map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}년
                      </SelectItem>
                    ))
                  ) : (
                    // 기본 연도 옵션 제공 (최근 5년)
                    Array.from({ length: 5 }, (_, i) => String(new Date().getFullYear() - i)).map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}년
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </motion.div>

            {/* 기출회차 선택 */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-2"
            >
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center justify-center gap-1">
                기출회차
              </label>
              <Select
                value={examSessionNumber || undefined}
                onValueChange={(value) => setExamSessionNumber(value)}
                disabled={!selectedCertification || !examYear}
              >
                <SelectTrigger className="w-full h-10 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-blue-400 dark:hover:border-blue-500 transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-center">
                  <SelectValue placeholder="회차를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {availableSessions.length > 0 ? (
                    availableSessions.map((session) => (
                      <SelectItem key={session} value={session}>
                        {session}회차
                      </SelectItem>
                    ))
                  ) : (
                    // 기본 회차 옵션 제공 (1~4회차)
                    ['1', '2', '3', '4'].map((session) => (
                      <SelectItem key={session} value={session}>
                        {session}회차
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </motion.div>

            {/* 기출과목 선택 */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-2"
            >
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center justify-center gap-1">
                기출과목
              </label>
              <Select
                value={examSubject || undefined}
                onValueChange={(value) => setExamSubject(value as ExamSubject)}
                disabled={!selectedCertification || !examYear}
              >
                <SelectTrigger className="w-full h-10 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-blue-400 dark:hover:border-blue-500 transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-center">
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
            </motion.div>
          </div>
        </div>

        {/* 문제 개수 표시 */}
        {questionIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative z-10 flex items-center gap-3 px-4 py-2.5 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800"
          >
            <div className="p-2 bg-blue-500 dark:bg-blue-600 rounded-lg">
              <BookOpen className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-xs text-slate-600 dark:text-slate-400">불러온 문제 수</p>
              <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">
                총 <span className="text-base">{questionIds.length}</span>문제
              </p>
            </div>
          </motion.div>
        )}

        {/* 시작 버튼 */}
        <motion.div
          whileHover={{ scale: questionIds.length > 0 ? 1.01 : 1 }}
          whileTap={{ scale: questionIds.length > 0 ? 0.99 : 1 }}
          className="relative z-10"
        >
          <Button
            onClick={handleStartLearning}
            disabled={!selectedCertification || !examSession || !examSubject || questionIds.length === 0 || loading}
            size="lg"
            className="w-full h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
          >
            {loading ? (
              <>
                <Clock className="mr-2 h-5 w-5 animate-spin" />
                문제 불러오는 중...
              </>
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
      </div>
    </motion.div>
  )
}

