import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/context'
import {
  BookOpen,
  Target,
  BarChart3,
  Trophy,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  FileX,
  Play,
  Brain,
  GraduationCap,
} from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

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

type ExamSubject = '1과목' | '2과목' | '3과목' | '4과목' | '5과목' | '전체' | '1과목-데이터 이해' | '2과목-데이터분석 기획' | '3과목-데이터분석' | '1과목-컴퓨터 일반' | '2과목-스프레드시트 일반' | '3과목-데이터베이스 일반' | '1과목-빅데이터 분석 기획' | '2과목-빅데이터 탐색' | '3과목-빅데이터 모델링' | '4과목-빅데이터 결과해석' | '1과목-부동산학개론' | '2과목-민법및민사특별법'

// 자격증별 회차 매핑
const CERT_SESSIONS_MAP: Record<string, Record<string, string[]>> = {
  'ADsP': {
    '2025': ['44', '45', '46', '47'],
    '2024': ['40', '41', '42', '43'],
    '2023': ['36', '37', '38', '39'],
    '2022': ['29', '30', '31', '32'],
  },
  '빅데이터분석기사': {
    '2025': ['10', '11'],
    '2024': ['8', '9'],
  },
  'SQLD': {
    '2025': ['56', '57', '58', '59'],
    '2024': ['52', '53', '54', '55'],
  },
  '공인중개사': {
    '2025': ['36'],
    '2024': ['35'],
    '2023': ['34'],
  },
  '사회조사분석사': {
    '2025': ['1', '2', '3'],
    '2024': ['1', '2', '3'],
    '2023': ['1', '2', '3'],
    '2022': ['1', '2', '3'],
  },
  '정보처리기사': {
    '2025': ['1', '2', '3'],
    '2024': ['1', '2', '3'],
  },
  '경영정보시각화능력': {
    '2025': ['1', '2'],
    '2024': ['1', '2'],
  },
}

// 자격증별 과목 매핑
const CERT_SUBJECTS_MAP: Record<string, (ExamSubject | string)[]> = {
  '정보처리기사': ['1과목-소프트웨어설계', '2과목-소프트웨어개발', '3과목-데이터베이스구축', '4과목-프로그래밍언어활용', '5과목-정보시스템구축관리', '전체'],
  '컴퓨터활용능력': ['1과목-컴퓨터 일반', '2과목-스프레드시트 일반', '3과목-데이터베이스 일반', '전체'],
  '빅데이터분석기사': ['1과목-빅데이터 분석 기획', '2과목-빅데이터 탐색', '3과목-빅데이터 모델링', '4과목-빅데이터 결과해석', '전체'],
  '경영정보시각화능력': ['1과목-경영정보일반', '2과목-데이터 해석 및 활용', '3과목-경영정보 시각화 디자인', '전체'],
  'ADsP': ['1과목-데이터 이해', '2과목-데이터분석 기획', '3과목-데이터분석', '전체'],
  'SQLD': ['1과목-데이터 모델링의 이해', '2과목-SQL 기본 및 활용', '전체'],
  '사회조사분석사': ['1과목-조사방법과 설계', '2과목-조사관리와 자료처리', '3과목-통계분석과 활용', '전체'],
  'TESAT': ['1과목-경제이론 (기초, 응용)', '2과목-경제시사 (기초, 응용)', '3과목-상황판단 (응용복합)', '전체'],
  '공인중개사': ['1과목-부동산학개론', '2과목-민법및민사특별법', '전체'],
}

const EXAM_SUBJECTS: ExamSubject[] = ['1과목', '2과목', '3과목', '4과목', '5과목', '전체']

const allFeatures = [
  {
    icon: Target,
    title: '개인화된 학습',
    description: 'AI 기반 약점 분석과 간격 반복 학습 알고리즘으로 당신만의 맞춤형 문제를 추천합니다.',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
  },
  {
    icon: Brain,
    title: '망각곡선기반 반복학습',
    description: '에빙하우스 망각 곡선 기반 간격 반복 학습',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
  },
  {
    icon: FileX,
    title: '나만의 오답노트',
    description: '오답 노트 자동 관리 및 복습 스케줄링',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
  },
  {
    icon: BarChart3,
    title: '실시간 통계',
    description: '학습 진행 상황과 성과를 한눈에 확인할 수 있는 상세한 대시보드와 분석 차트를 제공합니다.',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
  },
  {
    icon: Sparkles,
    title: 'AI 튜터',
    description: 'AI 튜터를 통한 개념 설명 및 이해도 향상',
    color: 'text-pink-600 dark:text-pink-400',
    bgColor: 'bg-pink-50 dark:bg-pink-900/20',
  },
  {
    icon: Trophy,
    title: '게이미피케이션',
    description: '스트릭, 업적, 보상 시스템으로 학습 동기를 부여하고 지속적인 성장을 지원합니다.',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
  },
]

export default function Home() {
  const { user } = useAuth()
  const navigate = useNavigate()

  // 로그인한 사용자는 자동으로 대시보드로 리다이렉트
  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true })
    }
  }, [user, navigate])

  const handleStartDiagnostic = () => {
    // 진단 완료 여부 확인
    const diagnosticCompleted = localStorage.getItem('diagnostic_completed')
    
    // 로그인하지 않았고 이미 진단을 완료한 경우
    if (!user && diagnosticCompleted === 'true') {
      const certType = localStorage.getItem('diagnostic_certification') || '자격증'
      alert(`${certType} 진단을 이미 완료하셨습니다.\n\n결과를 저장하고 맞춤형 학습을 시작하려면 로그인이 필요합니다.`)
      navigate('/login')
      return
    }
    
    // 그 외의 경우 온보딩으로 이동
    navigate('/onboarding')
  }
  const [selectedCertification, setSelectedCertification] = useState<CertificationType | ''>('')
  const [examYear, setExamYear] = useState<string>('')
  const [examSessionNumber, setExamSessionNumber] = useState<string>('')
  const [examSubject, setExamSubject] = useState<ExamSubject | string>('')
  const [questionIds, setQuestionIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [availableYears, setAvailableYears] = useState<string[]>([])
  const [availableSessions, setAvailableSessions] = useState<string[]>([])
  const [availableSubjects, setAvailableSubjects] = useState<(ExamSubject | string)[]>([])

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
    if (!selectedCertification || !examYear) {
      console.log(`⏸️ 문제 불러오기 스킵: 자격증=${selectedCertification}, 년도=${examYear}`)
      setQuestionIds([])
      return
    }

    try {
      setLoading(true)
      console.log(`🔄 ${selectedCertification} 기출문제 불러오기 시작: 년도=${examYear}, 회차=${examSessionNumber || '전체'}, 과목=${examSubject || '전체'}`)
      
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
      
      // DB 쿼리 단계에서 필터링 (연도는 클라이언트에서 처리)
      // 성능 최적화: 필요한 컬럼만 선택
      let query = supabase
        .from('questions')
        .select('id, exam_session, exam_number, category')
        .eq('certification_type', selectedCertification)
        .limit(1000)
      
      // 성능 팁: 연도가 DB에 포함된 경우 OR 조건으로 필터링 시도
      // exam_session이 "2025-36" 또는 "36" 형식 모두 지원
      if (examYear) {
        const validSessions = CERT_SESSIONS_MAP[selectedCertification]?.[examYear] || []
        if (validSessions.length > 0) {
          // 연도-회차 또는 회차만 있는 데이터 모두 가져오기
          const orConditions = validSessions.map(s => `exam_session.eq.${examYear}-${s},exam_session.eq.${s}`).join(',')
          // Supabase의 OR 필터는 복잡해서 클라이언트에서 처리하는 게 더 간단함
        }
      }
      
      console.log(`🔍 ${selectedCertification} 문제 조회 (연도: ${examYear}, 회차: ${examSessionNumber || '전체'}, 과목: ${examSubject || '전체'})`)

      // 과목 필터링 (DB에서)
      if (examSubject && examSubject !== '전체' && 대분류번호) {
        // '1과목' -> '1', '1과목-데이터 이해' -> '1' 등으로 변환
        let 중분류번호 = examSubject
        if (examSubject.includes('-')) {
          중분류번호 = examSubject.split('-')[0].replace('과목', '')
        } else {
          중분류번호 = examSubject.replace('과목', '')
        }
        query = query.like('category', `${대분류번호}-${중분류번호}-%`)
        console.log(`🔍 기출과목 필터 적용: ${examSubject} (중분류=${중분류번호})`)
      } else if (대분류번호) {
        query = query.like('category', `${대분류번호}-%`)
        console.log(`ℹ️ 기출과목 미선택: 모든 과목 표시`)
      } else {
        console.warn(`⚠️ ${selectedCertification}의 대분류 번호가 없습니다. category 필터 없이 검색합니다.`)
      }

      try {
        query = query.order('exam_number', { ascending: true })
      } catch (orderError) {
        console.warn('⚠️ exam_number 정렬 실패, category로 정렬 시도:', orderError)
        try {
          query = query.order('category', { ascending: true })
        } catch (categoryOrderError) {
          console.warn('⚠️ category 정렬 실패, created_at으로 정렬:', categoryOrderError)
          query = query.order('created_at', { ascending: false })
        }
      }

      const { data, error } = await query

      if (error) {
        console.error('❌ 기출문제 불러오기 에러:', error)
        console.error('에러 상세:', { message: error.message, code: error.code, details: error.details })
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

      let filteredData = data || []
      
      // 1. 연도 + 회차 필터링 (클라이언트에서)
      const beforeFilter = filteredData.length
      
      // 회차 매핑에서 해당 연도의 유효한 회차 목록 가져오기
      const validSessions = CERT_SESSIONS_MAP[selectedCertification]?.[examYear] || []
      console.log(`📋 ${selectedCertification} ${examYear}년 유효 회차: [${validSessions.join(', ')}]`)
      
      filteredData = filteredData.filter((q: any) => {
        const session = q.exam_session || ''
        
        // exam_session에서 연도와 회차 추출
        let sessionYear = ''
        let sessionNumber = ''
        
        if (session.includes('-')) {
          // "2023-34" 형식
          const parts = session.split('-')
          sessionYear = parts[0]
          sessionNumber = parts[1]?.replace(/^0+/, '') || parts[1]
        } else {
          // "34" 형식 (연도 없음)
          sessionNumber = session.replace(/^0+/, '') || session
          // 회차 매핑에서 이 회차가 어느 연도에 속하는지 확인
          for (const [year, sessions] of Object.entries(CERT_SESSIONS_MAP[selectedCertification] || {})) {
            if (sessions.includes(sessionNumber)) {
              sessionYear = year
              break
            }
          }
        }
        
        // 연도 매칭 확인
        const yearMatch = sessionYear === examYear || (sessionYear === '' && validSessions.includes(sessionNumber))
        
        if (!yearMatch) {
          console.log(`❌ 연도 불일치: exam_session="${session}" (추출: ${sessionYear}-${sessionNumber}), 요청="${examYear}"`)
          return false
        }
        
        // 회차 매칭 확인 (회차가 선택된 경우)
        if (examSessionNumber) {
          const paddedSession = examSessionNumber.padStart(2, '0')
          const sessionMatch = sessionNumber === examSessionNumber || sessionNumber === paddedSession
          
          if (!sessionMatch) {
            console.log(`❌ 회차 불일치: exam_session="${session}" (회차: ${sessionNumber}), 요청="${examSessionNumber}"`)
          }
          
          return sessionMatch
        }
        
        return true
      })
      
      console.log(`🔍 연도/회차 필터링 결과: ${filteredData.length}개 (필터링 전: ${beforeFilter}개)`)
      
      // 2. 과목 필터링은 이미 DB 쿼리에서 처리됨
      console.log(`✅ 최종 필터링 완료: ${filteredData.length}개 문제`)
      
      let sortedData = filteredData.sort((a: any, b: any) => {
        const aExamNum = a.exam_number || 0
        const bExamNum = b.exam_number || 0
        return aExamNum - bExamNum
      })

      const ids = sortedData.map((q: any) => q.id)
      setQuestionIds(ids)
    } catch (error) {
      console.error('❌ 기출문제를 가져오는 중 에러 발생:', error)
      setQuestionIds([])
    } finally {
      setLoading(false)
    }
  }, [selectedCertification, examYear, examSessionNumber, examSubject])

  useEffect(() => {
    if (selectedCertification && examYear) {
      console.log(`🔄 문제 로드 트리거: 자격증=${selectedCertification}, 년도=${examYear}, 회차=${examSessionNumber || '전체'}, 과목=${examSubject || '전체'}`)
      loadExamQuestions()
    } else {
      setQuestionIds([])
    }
  }, [selectedCertification, examYear, examSessionNumber, examSubject, loadExamQuestions])

  const handleStartLearning = () => {
    if (!selectedCertification || questionIds.length === 0) return

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

    // 매핑된 연도가 있는지 확인
    const mappedYears = CERT_SESSIONS_MAP[selectedCertification]
    const yearsSet = new Set<string>()
    
    // 매핑된 연도 추가
    if (mappedYears) {
      Object.keys(mappedYears).forEach(year => yearsSet.add(year))
      console.log(`✅ ${selectedCertification} 매핑된 연도 추가: ${Array.from(yearsSet).join(', ')}`)
    }

    try {
      const { data, error } = await supabase
        .from('questions')
        .select('exam_session')
        .eq('certification_type', selectedCertification)
        .not('exam_session', 'is', null)
        .limit(1000) // 제한 추가로 성능 개선

      if (error) {
        console.error('❌ 사용 가능한 연도 가져오기 에러:', error)
        // 매핑된 연도가 있으면 사용, 없으면 기본 연도 제공
        if (yearsSet.size > 0) {
          const sortedYears = Array.from(yearsSet).sort((a, b) => parseInt(b) - parseInt(a))
          setAvailableYears(sortedYears)
        } else {
          const currentYear = new Date().getFullYear()
          const defaultYears = Array.from({ length: 5 }, (_, i) => String(currentYear - i))
          setAvailableYears(defaultYears)
        }
        return
      }

      // DB에서 가져온 연도 추가
      if (data && data.length > 0) {
        data.forEach((q: any) => {
          if (q.exam_session) {
            const year = q.exam_session.split('-')[0]
            if (year && year.length === 4) {
              yearsSet.add(year)
            }
          }
        })
      }

      const sortedYears = Array.from(yearsSet).sort((a, b) => parseInt(b) - parseInt(a))
      
      if (sortedYears.length === 0) {
        const currentYear = new Date().getFullYear()
        const defaultYears = Array.from({ length: 5 }, (_, i) => String(currentYear - i))
        setAvailableYears(defaultYears)
      } else {
        setAvailableYears(sortedYears)
      }
    } catch (error) {
      console.error('❌ 사용 가능한 연도 가져오기 중 오류:', error)
      // 매핑된 연도가 있으면 사용, 없으면 기본 연도 제공
      if (yearsSet.size > 0) {
        const sortedYears = Array.from(yearsSet).sort((a, b) => parseInt(b) - parseInt(a))
        setAvailableYears(sortedYears)
      } else {
        const currentYear = new Date().getFullYear()
        const defaultYears = Array.from({ length: 5 }, (_, i) => String(currentYear - i))
        setAvailableYears(defaultYears)
      }
    }
  }, [selectedCertification])

  // 자격증과 연도에 따른 사용 가능한 회차 가져오기
  const loadAvailableSessions = useCallback(async () => {
    if (!selectedCertification || !examYear) {
      setAvailableSessions([])
      setAvailableSubjects([])
      return
    }

    // 매핑된 회차와 과목 확인 (독립적으로 처리)
    const mappedSessions = CERT_SESSIONS_MAP[selectedCertification]?.[examYear]
    const mappedSubjects = CERT_SUBJECTS_MAP[selectedCertification]
    
    // 둘 다 매핑이 있으면 둘 다 사용하고 리턴
    if (mappedSessions && mappedSubjects) {
      console.log(`✅ ${selectedCertification} ${examYear}년 매핑 데이터 사용: 회차=${mappedSessions.join(',')}, 과목=${mappedSubjects.join(',')}`)
      setAvailableSessions(mappedSessions)
      setAvailableSubjects(mappedSubjects)
      return
    }
    
    // 과목 매핑만 있으면 과목은 매핑 사용, 회차는 DB에서 가져오기
    if (mappedSubjects) {
      console.log(`✅ ${selectedCertification} 과목 매핑 사용: ${mappedSubjects.join(',')}`)
      setAvailableSubjects(mappedSubjects)
      // 회차는 아래 DB 조회에서 처리
    }

    // 회차 매핑만 있으면 회차는 매핑 사용, 과목은 DB에서 가져오기
    if (mappedSessions) {
      console.log(`✅ ${selectedCertification} ${examYear}년 회차 매핑 사용: ${mappedSessions.join(',')}`)
      setAvailableSessions(mappedSessions)
      // 과목은 아래 DB 조회에서 처리
    }
    
    // DB에서 데이터 가져오기 (회차 또는 과목 중 매핑 안 된 것)
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('exam_session, category')
        .eq('certification_type', selectedCertification)
        .like('exam_session', `${examYear}-%`)
        .limit(1000) // 제한 추가로 성능 개선

      if (error) {
        console.error('❌ 사용 가능한 회차 가져오기 에러:', error)
        if (!mappedSessions) setAvailableSessions([])
        if (!mappedSubjects) setAvailableSubjects([])
        return
      }

      const sessions = new Set<string>()
      const subjects = new Set<string>()
      
      if (data && data.length > 0) {
        data.forEach((q: any) => {
          if (q.exam_session) {
            const parts = q.exam_session.split('-')
            if (parts.length >= 2) {
              const sessionNum = parts[1].replace(/^0+/, '') || parts[1]
              sessions.add(sessionNum)
            }
          }
          
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

      // 회차 설정 (매핑이 없을 때만)
      if (!mappedSessions) {
        const sortedSessions = Array.from(sessions).sort((a, b) => parseInt(a) - parseInt(b))
        setAvailableSessions(sortedSessions)
      }

      // 과목 설정 (매핑이 없을 때만)
      if (!mappedSubjects) {
        const sortedSubjects = Array.from(subjects).sort((a, b) => {
          const numA = parseInt(a.replace('과목', ''))
          const numB = parseInt(b.replace('과목', ''))
          return numA - numB
        }) as ExamSubject[]
        
        if (sortedSubjects.length > 0) {
          setAvailableSubjects([...sortedSubjects, '전체'])
        } else {
          setAvailableSubjects(EXAM_SUBJECTS)
        }
      }
    } catch (error) {
      console.error('❌ 사용 가능한 회차 가져오기 중 오류:', error)
      if (!mappedSessions) setAvailableSessions([])
      if (!mappedSubjects) setAvailableSubjects(EXAM_SUBJECTS)
    }
  }, [selectedCertification, examYear])

  const handleCertificationChange = (value: CertificationType | '') => {
    console.log(`🔄 자격증 변경: ${selectedCertification} → ${value}`)
    setSelectedCertification(value)
    
    // 모든 관련 상태 명시적으로 초기화
    setExamYear('')
    setExamSessionNumber('')
    setExamSubject('')
    setQuestionIds([])
    setAvailableSessions([])
    setAvailableSubjects([])
    
    console.log('✅ 기출년도, 회, 과목 초기화 완료')
  }

  const handleYearChange = (value: string) => {
    setExamYear(value)
    setExamSessionNumber('')
    setExamSubject('')
    setQuestionIds([])
  }

  useEffect(() => {
    if (selectedCertification) {
      loadAvailableYears().catch((error) => {
        console.error('연도 로드 중 오류:', error)
      })
    } else {
      setAvailableYears([])
      setAvailableSessions([])
      setAvailableSubjects([])
    }
  }, [selectedCertification, loadAvailableYears])

  useEffect(() => {
    if (selectedCertification && examYear) {
      loadAvailableSessions().catch((error) => {
        console.error('회차 로드 중 오류:', error)
      })
    } else {
      setAvailableSessions([])
      setAvailableSubjects([])
    }
  }, [selectedCertification, examYear, loadAvailableSessions])

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto text-center space-y-6"
        >
          {/* 마스코트 이미지 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex justify-center mb-6"
          >
            <img 
              src="/mascot.png" 
              alt="CertiQ 마스코트" 
              className="w-48 h-48 object-contain"
            />
          </motion.div>
          
          {/* 제목 */}
          <div className="space-y-2">
            <h2 className="text-3xl md:text-4xl font-bold">
              10문제로 우선 진단하세요
            </h2>
            <h3 className="text-3xl md:text-4xl font-bold text-muted-foreground">
              개인화 문제로 반복하세요
            </h3>
          </div>

          {/* 버튼 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-wrap gap-4 justify-center items-center"
          >
            <Button
              size="lg"
              className="text-lg px-8 h-12"
              onClick={handleStartDiagnostic}
            >
              진단하기
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Link to="/dashboard">
              <Button size="lg" variant="outline" className="text-lg px-8 h-12 group">
                대시보드
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20 bg-muted/30 rounded-3xl my-20">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold">왜 certiQ인가요?</h2>
        </motion.div>

        {/* 주요 기능 카드 */}
        <div className="grid md:grid-cols-3 gap-8">
          {allFeatures.map((feature, index) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group relative"
              >
                <div className="h-full min-h-[280px] bg-card border rounded-xl p-8 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <div className={`inline-flex p-3 rounded-lg ${feature.bgColor} mb-4`}>
                    <Icon className={`h-6 w-6 ${feature.color}`} />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* 기출문제 불러오기 섹션 */}
      <section className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-5xl mx-auto"
        >
          {/* 섹션 제목 */}
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">기출문제 풀기</h2>
            <p className="text-lg text-muted-foreground">
              원하는 자격증의 기출문제를 선택하여 학습하세요
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-card border rounded-xl p-6 md:p-8 shadow-sm space-y-6"
          >

            {/* 자격증 선택 및 기출년도/회차/과목 입력 */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 자격증 선택 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium block">자격증 선택</label>
                  <Select
                    value={selectedCertification || undefined}
                    onValueChange={handleCertificationChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="선택하세요" />
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
                  <label className="text-sm font-medium block">
                    기출년도
                  </label>
                  <Select
                    key={`year-${selectedCertification}`}
                    value={examYear || undefined}
                    onValueChange={handleYearChange}
                    disabled={!selectedCertification}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="선택하세요" />
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
                </div>

                {/* 기출회 선택 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium block">
                    기출회
                  </label>
                  <Select
                    key={`session-${selectedCertification}-${examYear}`}
                    value={examSessionNumber || undefined}
                    onValueChange={(value) => setExamSessionNumber(value)}
                    disabled={!selectedCertification || !examYear}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSessions.length > 0 ? (
                        availableSessions.map((session) => (
                          <SelectItem key={session} value={session}>
                            {session}회
                          </SelectItem>
                        ))
                      ) : (
                        // 기본 회 옵션 제공 (1~4회)
                        ['1', '2', '3', '4'].map((session) => (
                          <SelectItem key={session} value={session}>
                            {session}회
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* 기출과목 선택 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium block">기출과목</label>
                  <Select
                    key={`subject-${selectedCertification}-${examYear}`}
                    value={examSubject || undefined}
                    onValueChange={(value) => setExamSubject(value as ExamSubject)}
                    disabled={!selectedCertification || !examYear}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="선택하세요" />
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
            <div className="pt-4">
              {user ? (
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
                    '기출회를 선택해주세요'
                  ) : !examSubject ? (
                    '기출과목을 선택해주세요'
                  ) : questionIds.length === 0 ? (
                    '문제가 없습니다'
                  ) : (
                    <>
                      <Play className="mr-2 h-5 w-5" />
                      학습 시작하기
                    </>
                  )}
                </Button>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground mb-4">
                    기출문제를 풀려면 로그인이 필요합니다
                  </p>
                  <Link to="/login">
                    <Button size="lg">
                      로그인하기
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      </section>

    </div>
  )
}



