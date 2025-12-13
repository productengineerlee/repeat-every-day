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
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  FileX,
  Play,
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

type ExamSubject = '1과목' | '2과목' | '3과목' | '4과목' | '5과목' | '전체'

const EXAM_SUBJECTS: ExamSubject[] = ['1과목', '2과목', '3과목', '4과목', '5과목', '전체']

const features = [
  {
    icon: Target,
    title: '개인화된 학습',
    description: 'AI 기반 약점 분석과 간격 반복 학습 알고리즘으로 당신만의 맞춤형 문제를 추천합니다.',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
  },
  {
    icon: BarChart3,
    title: '실시간 통계',
    description: '학습 진행 상황과 성과를 한눈에 확인할 수 있는 상세한 대시보드와 분석 차트를 제공합니다.',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
  },
  {
    icon: Trophy,
    title: '게이미피케이션',
    description: '스트릭, 업적, 보상 시스템으로 학습 동기를 부여하고 지속적인 성장을 지원합니다.',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
  },
]

const benefits = [
  '에빙하우스 망각 곡선 기반 간격 반복 학습',
  'AI 튜터를 통한 개념 설명 및 이해도 향상',
  '오답 노트 자동 관리 및 복습 스케줄링',
  '다양한 자격증 지원 (정보처리기사, ADsP, SQLD 등)',
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
  const [examSubject, setExamSubject] = useState<ExamSubject | ''>('')
  const [questionIds, setQuestionIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [availableYears, setAvailableYears] = useState<string[]>([])
  const [availableSessions, setAvailableSessions] = useState<string[]>([])
  const [availableSubjects, setAvailableSubjects] = useState<ExamSubject[]>([])

  // examSession 계산 (기출년도와 기출회차를 합쳐서)
  const examSession = useMemo(() => {
    if (examYear && examSessionNumber) {
      return `${examYear}-${examSessionNumber.padStart(2, '0')}`
    }
    return ''
  }, [examYear, examSessionNumber])

  // 문제 불러오기
  const loadExamQuestions = useCallback(async () => {
    if (!selectedCertification || !examSession || !examSubject || examSubject === '전체') {
      setQuestionIds([])
      return
    }

    try {
      setLoading(true)
      
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
        .limit(1000) // 제한 추가로 성능 개선

      if (examSubject && examSubject !== '전체' && 대분류번호) {
        const 중분류번호 = examSubject.replace('과목', '')
        query = query.like('category', `${대분류번호}-${중분류번호}-%`)
      } else if (대분류번호) {
        query = query.like('category', `${대분류번호}-%`)
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
        // 에러 상세 정보 로깅
        if (error.code) {
          console.error('에러 코드:', error.code)
        }
        if (error.message) {
          console.error('에러 메시지:', error.message)
        }
        setQuestionIds([])
        return
      }

      let filteredData = data || []
      
      if (examSubject && examSubject !== '전체') {
        const 중분류번호 = examSubject.replace('과목', '')
        filteredData = filteredData.filter((q: any) => {
          const category = q.category || ''
          const parts = category.split('-')
          const 중분류 = parts[1] || ''
          return 중분류 === 중분류번호
        })
      }
      
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
  }, [selectedCertification, examSession, examSubject])

  useEffect(() => {
    const hasValidSession = examYear && examSessionNumber && examSession
    
    if (selectedCertification && hasValidSession && examSubject) {
      loadExamQuestions()
    } else {
      setQuestionIds([])
    }
  }, [selectedCertification, examYear, examSessionNumber, examSession, examSubject, loadExamQuestions])

  const handleStartLearning = () => {
    if (!selectedCertification || !examSession || questionIds.length === 0) return

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
        .limit(1000) // 제한 추가로 성능 개선

      if (error) {
        console.error('❌ 사용 가능한 연도 가져오기 에러:', error)
        const currentYear = new Date().getFullYear()
        const defaultYears = Array.from({ length: 5 }, (_, i) => String(currentYear - i))
        setAvailableYears(defaultYears)
        return
      }

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

      const sortedYears = Array.from(years).sort((a, b) => parseInt(b) - parseInt(a))
      
      if (sortedYears.length === 0) {
        const currentYear = new Date().getFullYear()
        const defaultYears = Array.from({ length: 5 }, (_, i) => String(currentYear - i))
        setAvailableYears(defaultYears)
      } else {
        setAvailableYears(sortedYears)
      }
    } catch (error) {
      console.error('❌ 사용 가능한 연도 가져오기 중 오류:', error)
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
        .limit(1000) // 제한 추가로 성능 개선

      if (error) {
        console.error('❌ 사용 가능한 회차 가져오기 에러:', error)
        setAvailableSessions([])
        setAvailableSubjects([])
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

      const sortedSessions = Array.from(sessions).sort((a, b) => parseInt(a) - parseInt(b))
      setAvailableSessions(sortedSessions)

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
    } catch (error) {
      console.error('❌ 사용 가능한 회차 가져오기 중 오류:', error)
      setAvailableSessions([])
      setAvailableSubjects(EXAM_SUBJECTS)
    }
  }, [selectedCertification, examYear])

  const handleCertificationChange = (value: CertificationType | '') => {
    setSelectedCertification(value)
    setExamYear('')
    setExamSessionNumber('')
    setExamSubject('')
    setQuestionIds([])
    setAvailableSessions([])
    setAvailableSubjects([])
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
      {/* 진단 테스트 섹션 */}
      <section className="container mx-auto px-4 py-20 md:py-32">
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
          
          <div className="space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold">
              딱 10문제로 진단해 보세요
            </h2>
          </div>
          <Button
            size="lg"
            className="text-lg px-8 h-12"
            onClick={handleStartDiagnostic}
          >
            진단하기
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </motion.div>
      </section>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-8 max-w-4xl mx-auto"
        >
          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-3xl md:text-4xl font-bold"
          >
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              취약부분을 공략하세요
            </span>
          </motion.h1>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4"
          >
            {!user ? (
              <>
                <Link to="/dashboard">
                  <Button size="lg" className="text-lg px-8 h-12 group">
                    대시보드
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link to="/dashboard">
                  <Button size="lg" className="text-lg px-8 h-12 group">
                    대시보드
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </>
            )}
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">왜 certiQ인가요?</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            과학적 학습 방법론과 최신 기술을 결합한 스마트한 학습 플랫폼
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => {
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
                <div className="h-full bg-card border rounded-xl p-8 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
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
      <section className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
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
            ) : (
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  기출문제를 풀려면 로그인이 필요합니다.
                </p>
              </div>
            )}
          </motion.div>
        </motion.div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-4 py-20 bg-muted/30 rounded-3xl my-20">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">주요 기능</h2>
            <p className="text-lg text-muted-foreground">
              certiQ가 제공하는 강력한 학습 도구들
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex items-start gap-3"
              >
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-foreground">{benefit}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Final CTA Section */}
      {!user && (
        <section className="container mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-2xl mx-auto bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-12 border border-primary/20"
          >
            <TrendingUp className="h-12 w-12 text-primary mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              지금 시작하세요
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              무료로 가입하고 개인화된 학습 경험을 시작해보세요
            </p>
            <Link to="/signup">
              <Button size="lg" className="text-lg px-8 h-12 group">
                무료로 시작하기
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </motion.div>
        </section>
      )}
    </div>
  )
}



