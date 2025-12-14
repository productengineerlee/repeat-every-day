import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '@/context'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { getTodayDailySet, createDailySet, type DailyQuestionSet } from '@/lib/api/dashboard'
import { getDailyQuestionSet, getExamQuestionSet } from '@/lib/api/questions'
import { supabase } from '@/lib/supabaseClient'
import { BookOpen, Clock, Play, CheckCircle, RefreshCw, PlusCircle } from 'lucide-react'

// 모든 지원되는 자격증 타입
type CertificationType = 
  | '정보처리기사' 
  | '컴퓨터활용능력' 
  | '빅데이터분석기사' 
  | '경영정보시각화능력' 
  | 'ADsP' 
  | 'SQLD' 
  | '사회조사분석사' 
  | 'TESAT' 
  | '공인중개사'

// 자격증별 한글 라벨
const CERTIFICATION_LABELS: Record<CertificationType, string> = {
  '정보처리기사': '정보처리기사',
  '컴퓨터활용능력': '컴퓨터활용능력',
  '빅데이터분석기사': '빅데이터분석기사',
  '경영정보시각화능력': '경영정보시각화능력',
  'ADsP': 'ADsP',
  'SQLD': 'SQLD',
  '사회조사분석사': '사회조사분석사',
  'TESAT': 'TESAT',
  '공인중개사': '공인중개사',
}

export default function DailyQuestionCard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [dailySet, setDailySet] = useState<DailyQuestionSet | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [selectedCertification, setSelectedCertification] = useState<CertificationType | null>(null)
  const [dailyQuestionCounts, setDailyQuestionCounts] = useState<Record<string, number | null>>({})
  const [showCompletionDialog, setShowCompletionDialog] = useState(false)
  const [completedQuestionIds, setCompletedQuestionIds] = useState<string[]>([])
  const [userName, setUserName] = useState<string>('')

  // 자격증별 문제 수 가져오기 (null이면 0 반환하여 문제를 불러오지 않음)
  const getQuestionCountForCertification = useCallback((certificationType: CertificationType): number => {
    const count = dailyQuestionCounts[certificationType]
    return count !== null && count !== undefined ? count : 0
  }, [dailyQuestionCounts])

  const loadQuestionsForCertification = useCallback(async (certificationType: CertificationType) => {
    if (!user) return

    try {
      setCreating(true)
      console.log(`🔄 ${certificationType} 문제 불러오기 시작: userId=${user.id}`)
      
      // 선택한 자격증에 맞는 문제 수 가져오기
      const questionCount = getQuestionCountForCertification(certificationType)
      
      // 문제 수가 0이면 문제를 불러오지 않음
      if (questionCount === 0) {
        console.log(`⚠️ ${certificationType}에 대한 문제 수가 설정되지 않았습니다.`)
        setDailySet({
          id: `temp-${Date.now()}`,
          questionIds: [],
          completed: false,
          completedAt: null,
          createdAt: new Date().toISOString(),
          progress: 0,
        })
        return
      }
      
      let questionIds: string[] = []
      
      // 기출문제 옵션인지 확인
      if (certificationType === '기출문제-빅데이터분석기사') {
        questionIds = await getExamQuestionSet(
          user.id,
          '빅데이터분석기사',
          questionCount
        )
      } else if (certificationType === '기출문제-ADsP') {
        questionIds = await getExamQuestionSet(
          user.id,
          'ADsP',
          questionCount
        )
      } else {
        // 일반 문제 가져오기
        questionIds = await getDailyQuestionSet(
          user.id,
          certificationType,
          questionCount
        )
      }
      
      console.log(`📦 ${certificationType} 문제 ID: ${questionIds.length}개`, questionIds)

      if (questionIds.length === 0) {
        // 문제가 없으면 빈 세트로 표시
        setDailySet({
          id: `temp-${Date.now()}`,
          questionIds: [],
          completed: false,
          completedAt: null,
          createdAt: new Date().toISOString(),
          progress: 0,
        })
        return
      }

      // 문제 ID를 세트로 표시
      setDailySet({
        id: `temp-${Date.now()}`,
        questionIds: questionIds,
        completed: false,
        completedAt: null,
        createdAt: new Date().toISOString(),
        progress: 0,
      })
    } catch (error) {
      console.error(`❌ ${certificationType} 문제를 가져오는 중 에러 발생:`, error)
    } finally {
      setCreating(false)
    }
  }, [user, getQuestionCountForCertification])

  const createTodaySet = useCallback(async () => {
    if (!user) return

    try {
      setCreating(true)
      // 사용자의 일일 문제 수 설정 가져오기
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('daily_question_count')
        .eq('id', user.id)
        .maybeSingle()

      if (userError && userError.code !== 'PGRST116') {
        console.error('Error fetching user data:', userError)
      }
      
      // 일일 문제 수 설정 (JSONB 형식 또는 INTEGER 형식 지원)
      const counts = userData?.daily_question_count
      let updatedCounts: Record<string, number | null> = {}
      
      if (typeof counts === 'object' && counts !== null) {
        // JSONB 형식 - DB에서 가져온 값을 그대로 사용
        updatedCounts = { ...counts }
      }
      
      setDailyQuestionCounts(updatedCounts)
      
      // 설정된 자격증 중 첫 번째 자격증 찾기 (문제 수가 설정된 것)
      const firstSelectedCert = Object.keys(updatedCounts).find(
        key => updatedCounts[key] !== null && updatedCounts[key] !== undefined && updatedCounts[key]! > 0
      ) as CertificationType | undefined
      
      if (!firstSelectedCert) {
        console.log('⚠️ 설정된 자격증이 없습니다.')
        setDailySet({
          id: `temp-${Date.now()}`,
          questionIds: [],
          completed: false,
          completedAt: null,
          createdAt: new Date().toISOString(),
          progress: 0,
        })
        return
      }
      
      const questionCount = updatedCounts[firstSelectedCert] || 0
      console.log(`🔄 일일 문제 세트 생성 시작: userId=${user.id}, certificationType=${firstSelectedCert}, count=${questionCount}`)
      
      // 일일 문제 세트 생성 시도
      let questionIds: string[] = []
      
      try {
        // 기출문제 옵션인지 확인
        if (firstSelectedCert === '기출문제-빅데이터분석기사') {
          questionIds = await getExamQuestionSet(
            user.id,
            '빅데이터분석기사',
            questionCount
          )
        } else if (firstSelectedCert === '기출문제-ADsP') {
          questionIds = await getExamQuestionSet(
            user.id,
            'ADsP',
            questionCount
          )
        } else {
          // 일반 문제 가져오기
          questionIds = await getDailyQuestionSet(
            user.id,
            firstSelectedCert,
            questionCount
          )
        }
        console.log(`📦 getDailyQuestionSet/getExamQuestionSet 반환값: ${questionIds.length}개의 문제 ID (요청: ${questionCount}개)`, questionIds)
        
        // 문제 수가 요청한 것보다 많으면 잘라내기
        if (questionIds.length > questionCount) {
          console.log(`⚠️ 요청한 ${questionCount}개보다 많은 ${questionIds.length}개의 문제가 반환되었습니다. ${questionCount}개로 제한합니다.`)
          questionIds = questionIds.slice(0, questionCount)
        }
      } catch (error) {
        console.error('❌ 문제를 가져오는 중 에러 발생:', error)
        questionIds = []
      }

      // 문제 ID가 없어도 daily_sets는 생성 (임시 문제 ID 사용)
      const result = await createDailySet(user.id, questionIds)

      if (result.success && result.setId) {
        // 생성된 세트 가져오기
        const newSet = await getTodayDailySet(user.id)
        if (newSet) {
          setDailySet(newSet)
          setSelectedCertification(firstSelectedCert)
        } else {
          console.warn('⚠️ 일일 세트를 생성했지만 가져올 수 없습니다.')
        }
      } else {
        console.error('Failed to create daily set:', result.error)
        // 실패 시 빈 세트로 표시 (임시 세트 생성하지 않음)
        setDailySet({
          id: `error-${Date.now()}`,
          questionIds: [],
          completed: false,
          completedAt: null,
          createdAt: new Date().toISOString(),
          progress: 0,
        })
      }
    } catch (error) {
      console.error('Error creating daily set:', error)
    } finally {
      setCreating(false)
    }
  }, [user])

  useEffect(() => {
    const fetchDailySet = async () => {
      if (!user) {
        console.log('⚠️ 사용자가 로그인하지 않았습니다.')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        
        // 사용자의 일일 문제 수 설정 및 이름 가져오기
        const { data: userData } = await supabase
          .from('users')
          .select('daily_question_count, name')
          .eq('id', user.id)
          .maybeSingle()
        
        // 사용자 이름 설정
        if (userData?.name) {
          setUserName(userData.name)
        }
        
        // 일일 문제 수 설정 (JSONB 형식 또는 INTEGER 형식 지원)
        const counts = userData?.daily_question_count
        if (typeof counts === 'object' && counts !== null) {
          // JSONB 형식 - DB에서 가져온 값을 그대로 사용
          setDailyQuestionCounts({ ...counts })
        } else {
          // INTEGER 형식이거나 없으면 빈 객체로 초기화
          setDailyQuestionCounts({})
        }
        
        console.log(`🔄 오늘의 일일 세트 가져오기 시작: userId=${user.id}`)
        const set = await getTodayDailySet(user.id)
        console.log(`📦 getTodayDailySet 결과:`, set ? {
          id: set.id,
          questionIdsCount: set.questionIds.length,
          questionIds: set.questionIds.slice(0, 3),
        } : 'null')

        if (!set) {
          console.log('📝 오늘의 세트가 없어서 새로 생성합니다.')
          // 오늘의 세트가 없으면 생성
          await createTodaySet()
        } else {
          // 기존 세트가 있으면 현재 설정과 비교
          const counts = userData?.daily_question_count
          let expectedCount = 0
          let expectedCertification: CertificationType | null = null
          
          if (typeof counts === 'object' && counts !== null) {
            // 설정된 자격증 중 첫 번째 자격증 찾기
            const firstSelectedCert = Object.keys(counts).find(
              key => (counts as any)[key] !== null && (counts as any)[key] !== undefined && (counts as any)[key]! > 0
            ) as CertificationType | undefined
            
            if (firstSelectedCert) {
              expectedCertification = firstSelectedCert
              expectedCount = (counts as any)[firstSelectedCert] || 0
            }
          }
          
          console.log(`🔍 기존 세트 검증: 기존 문제 수=${set.questionIds.length}, 예상 문제 수=${expectedCount}, 예상 자격증=${expectedCertification}`)
          
          // 기존 세트의 문제 수가 현재 설정과 다르면 재생성
          if (expectedCount > 0 && set.questionIds.length !== expectedCount) {
            console.log(`⚠️ 기존 세트의 문제 수(${set.questionIds.length})가 현재 설정(${expectedCount})과 다릅니다. 기존 세트를 삭제하고 재생성합니다.`)
            
            // 기존 세트 삭제
            try {
              const { error: deleteError } = await supabase
                .from('daily_sets')
                .delete()
                .eq('id', set.id)
              
              if (deleteError) {
                console.error('기존 세트 삭제 실패:', deleteError)
              } else {
                console.log('✅ 기존 세트 삭제 완료')
              }
            } catch (deleteErr) {
              console.error('기존 세트 삭제 중 오류:', deleteErr)
            }
            
            // 새로 생성
            await createTodaySet()
          } else {
            // 문제 수가 정확히 일치하거나 설정이 없으면 기존 세트 사용
            // 하지만 문제 수가 설정보다 많으면 자르기
            if (expectedCount > 0 && set.questionIds.length > expectedCount) {
              console.log(`⚠️ 기존 세트의 문제 수(${set.questionIds.length})가 설정(${expectedCount})보다 많습니다. ${expectedCount}개로 제한합니다.`)
              const limitedSet = {
                ...set,
                questionIds: set.questionIds.slice(0, expectedCount),
              }
              setDailySet(limitedSet)
            } else {
              console.log(`✅ 기존 세트를 사용합니다: ${set.questionIds.length}개의 문제`)
              setDailySet(set)
            }
            
            if (expectedCertification) {
              setSelectedCertification(expectedCertification)
            }
          }
        }
      } catch (error) {
        console.error('❌ Error fetching daily set:', error)
        console.error('에러 상세:', JSON.stringify(error, null, 2))
        // 에러 발생 시에도 로딩 상태 해제
      } finally {
        setLoading(false)
      }
    }

    fetchDailySet()
    
    // 페이지 포커스 시 데이터 새로고침 (학습 완료 후 돌아올 때)
    const handleFocus = () => {
      if (user) {
        console.log('👀 페이지 포커스 - 데이터 새로고침')
        fetchDailySet()
      }
    }
    
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]) // createTodaySet 제거 (useCallback으로 메모이제이션되어 있어도 의존성에서 제거)

  const handleStartLearning = () => {
    if (dailySet && dailySet.questionIds.length > 0) {
      // 완료된 경우 또는 진행률이 100%인 경우 옵션 Dialog 표시
      if (dailySet.completed || dailySet.progress === 100) {
        console.log('🎉 학습 완료! 옵션 Dialog 표시')
        setCompletedQuestionIds(dailySet.questionIds)
        setShowCompletionDialog(true)
        return
      }
      
      // 임시 문제 ID가 아닌 실제 문제 ID만 필터링
      const validQuestionIds = dailySet.questionIds.filter(
        (id) => !id.startsWith('temp-') && id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
      )
      
      if (validQuestionIds.length > 0) {
        console.log('📝 학습 시작/계속하기')
        navigate('/learning', { state: { questionIds: validQuestionIds } })
      } else {
        console.warn('⚠️ 유효한 문제 ID가 없어 학습을 시작할 수 없습니다.')
        alert('문제를 불러올 수 없습니다. 관리자에게 문의해주세요.')
      }
    } else {
      console.warn('⚠️ 문제 세트가 없거나 비어있습니다.')
      alert('문제를 불러올 수 없습니다. 관리자에게 문의해주세요.')
    }
  }

  const handleReviewSameQuestions = () => {
    setShowCompletionDialog(false)
    if (completedQuestionIds.length > 0) {
      navigate('/learning', { state: { questionIds: completedQuestionIds } })
    }
  }

  const handleLoadNewQuestions = async () => {
    setShowCompletionDialog(false)
    
    if (!user || !selectedCertification) return
    
    try {
      setCreating(true)
      const questionCount = getQuestionCountForCertification(selectedCertification)
      
      if (questionCount === 0) {
        alert('문제 수가 설정되지 않았습니다.')
        return
      }
      
      // 기존 문제를 제외한 새로운 문제 가져오기
      let newQuestionIds: string[] = []
      
      if (selectedCertification === '기출문제-빅데이터분석기사') {
        newQuestionIds = await getExamQuestionSet(
          user.id,
          '빅데이터분석기사',
          questionCount,
          completedQuestionIds // 제외할 문제 ID
        )
      } else if (selectedCertification === '기출문제-ADsP') {
        newQuestionIds = await getExamQuestionSet(
          user.id,
          'ADsP',
          questionCount,
          completedQuestionIds
        )
      } else {
        newQuestionIds = await getDailyQuestionSet(
          user.id,
          selectedCertification,
          questionCount,
          completedQuestionIds
        )
      }
      
      if (newQuestionIds.length === 0) {
        alert('더 이상 새로운 문제가 없습니다.')
        return
      }
      
      // 새로운 세트로 학습 시작
      navigate('/learning', { state: { questionIds: newQuestionIds } })
    } catch (error) {
      console.error('❌ 새로운 문제를 가져오는 중 에러:', error)
      alert('문제를 불러오는 중 오류가 발생했습니다.')
    } finally {
      setCreating(false)
    }
  }

  const estimatedTime = dailySet ? Math.ceil(dailySet.questionIds.length * 2) : 10 // 문제당 약 2분

  if (loading || creating) {
    // 선택된 자격증 정보 생성
    const selectedCerts = Object.entries(dailyQuestionCounts)
      .filter(([_, count]) => count !== null && count !== undefined && count > 0)
      .map(([name, count]) => ({ name, count: count as number }))
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-gradient-to-br from-slate-50 via-blue-50/50 to-slate-50 dark:from-slate-900/30 dark:via-blue-950/20 dark:to-slate-900/30 border border-slate-200/80 dark:border-slate-700/50 rounded-xl p-5 md:p-6 shadow-sm overflow-hidden"
      >
        {/* 배경 장식 */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-100/10 to-slate-100/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-slate-100/10 to-blue-100/10 rounded-full blur-3xl" />
        
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-slate-200/50 dark:bg-slate-700/50 animate-pulse rounded-xl" />
            <div className="h-8 bg-slate-200/50 dark:bg-slate-700/50 animate-pulse rounded-lg w-1/3" />
          </div>
          {selectedCerts.length > 0 ? (
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {userName || user?.email || '회원'}님{' '}
              {selectedCerts.map((cert, index) => (
                <span key={cert.name}>
                  <span className="text-blue-600 dark:text-blue-400 font-semibold">{cert.name}</span> 과정 매일{' '}
                  <span className="text-blue-600 dark:text-blue-400 font-semibold">{cert.count}문제</span>
                  {index < selectedCerts.length - 1 ? ', ' : ' '}
                </span>
              ))}
              배달 선택하셨어요~
            </p>
          ) : (
            <div className="h-6 bg-slate-200/50 dark:bg-slate-700/50 animate-pulse rounded-lg w-2/3" />
          )}
          <div className="h-14 bg-blue-200/50 dark:bg-blue-800/50 animate-pulse rounded-xl" />
        </div>
      </motion.div>
    )
  }

  if (!dailySet || dailySet.questionIds.length === 0) {
    // 사용자의 자격증 유형 확인
    const checkCertificationType = async () => {
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('certification_type')
          .eq('id', user.id)
          .maybeSingle()
        console.log(`👤 사용자 자격증 유형:`, userData?.certification_type || '없음 (기본값: 정보처리기사)')
      }
    }
    checkCertificationType()

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-gradient-to-br from-slate-50 via-amber-50/30 to-slate-50 dark:from-slate-900/30 dark:via-amber-950/20 dark:to-slate-900/30 border border-slate-200/80 dark:border-slate-700/50 rounded-xl p-5 md:p-6 text-center space-y-4 shadow-sm overflow-hidden"
      >
        {/* 배경 장식 */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-amber-100/10 to-slate-100/10 rounded-full blur-3xl" />
        
        <div className="relative z-10">
          <div className="mb-4">
            <div className="inline-block p-4 bg-amber-500 dark:bg-amber-600 rounded-2xl mb-3">
              <BookOpen className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">
              문제를 불러올 수 없습니다 😅
            </h3>
            <p className="text-gray-600 dark:text-gray-400">걱정하지 마세요! 다시 시도해볼까요?</p>
          </div>
          
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-3 mb-6">
            <p className="font-semibold text-gray-700 dark:text-gray-300">가능한 원인:</p>
            <ul className="list-none space-y-2 text-left max-w-md mx-auto">
              <li className="flex items-start gap-2">
                <span className="text-amber-500">•</span>
                <span>데이터베이스에 해당 자격증 문제가 없습니다</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500">•</span>
                <span>빅데이터분석기사의 경우 카테고리가 "3-"로 시작하는 문제만 표시됩니다</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500">•</span>
                <span>관리자 화면에서 문제를 등록해주세요</span>
              </li>
            </ul>
          </div>
          
          <Button
            onClick={createTodaySet}
            size="lg"
            className="bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700 text-white font-semibold shadow-sm"
          >
            <Play className="mr-2 h-5 w-5" />
            다시 시도하기
          </Button>
        </div>
      </motion.div>
    )
  }

  return (
    <>
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
        {/* 헤더 - 마스코트와 함께 */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-3">
              <motion.img 
                src="/mascot.png" 
                alt="Certiq Mascot" 
                className="w-12 h-12 object-contain drop-shadow-md"
                initial={{ rotate: -10 }}
                animate={{ rotate: 0 }}
                transition={{ type: "spring", stiffness: 200 }}
              />
              <h2 className="text-2xl md:text-3xl font-bold text-slate-700 dark:text-slate-200">
                오늘의 문제
              </h2>
            </div>
            {/* 사용자 선택 정보 */}
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {(() => {
                // 선택한 자격증 정보 표시
                const cert = selectedCertification || 
                  (Object.keys(dailyQuestionCounts).find(
                    key => dailyQuestionCounts[key] !== null && dailyQuestionCounts[key] !== undefined && dailyQuestionCounts[key]! > 0
                  ) as CertificationType | undefined)
                
                if (cert) {
                  const count = getQuestionCountForCertification(cert)
                  const certLabel = CERTIFICATION_LABELS[cert] || cert
                  return `${userName || '회원'}님 ${certLabel} 과정 매일 ${count}문제 배달 선택하셨어요~`
                }
                
                return '자격증을 선택해주세요'
              })()}
            </p>
            
            {/* 배달 메시지 */}
            <p className="text-base text-gray-700 dark:text-gray-300 font-medium">
              {(() => {
                // 선택한 자격증이 있으면 해당 자격증의 설정된 문제 수 표시
                if (selectedCertification) {
                  const count = getQuestionCountForCertification(selectedCertification)
                  if (count > 0) {
                    return (
                      <>
                        주문하신 <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{count}문제</span>가 
                        <span className="inline-block ml-1">신선하게 배달되었어요! 🚀</span>
                      </>
                    )
                  }
                }
                
                // 선택한 자격증이 없을 때, 설정된 자격증 중 첫 번째의 문제 수 표시
                const firstSelectedCert = Object.keys(dailyQuestionCounts).find(
                  key => dailyQuestionCounts[key] !== null && dailyQuestionCounts[key] !== undefined
                ) as CertificationType | undefined
                
                if (firstSelectedCert) {
                  const count = getQuestionCountForCertification(firstSelectedCert)
                  if (count > 0) {
                    return (
                      <>
                        주문하신 <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{count}문제</span>가 
                        <span className="inline-block ml-1">신선하게 배달되었어요! 🚀</span>
                      </>
                    )
                  }
                }
                
                // 문제가 로드된 경우에만 실제 문제 수 표시
                if (dailySet && dailySet.questionIds.length > 0) {
                  return (
                    <>
                      주문하신 <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{dailySet.questionIds.length}문제</span>가 
                      <span className="inline-block ml-1">신선하게 배달되었어요! 🚀</span>
                    </>
                  )
                }
                
                return ''
              })()}
            </p>
          </div>
          
          {dailySet.completed && (
            <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-green-500 text-white rounded-full shadow-md">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-bold">완료!</span>
            </div>
          )}
        </div>

        {/* 구분선 */}
        <div className="h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent my-4" />

        {/* 진행률 바 */}
        {dailySet.progress > 0 && !dailySet.completed && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3 p-4 bg-white/60 dark:bg-gray-800/60 rounded-xl backdrop-blur-sm"
          >
            <div className="flex justify-between text-sm font-medium">
              <span className="text-gray-700 dark:text-gray-300">🎯 학습 진행률</span>
              <span className="text-blue-600 dark:text-blue-400 font-bold">{dailySet.progress}%</span>
            </div>
            <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${dailySet.progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          </motion.div>
        )}

        {/* 예상 시간 */}
        <div className="flex items-center gap-3 px-4 py-2.5 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="p-2 bg-blue-500 dark:bg-blue-600 rounded-lg">
            <Clock className="h-4 w-4 text-white" />
          </div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            예상 소요 시간: <span className="text-base">약 {estimatedTime}분</span>
          </p>
        </div>

        {/* 시작 버튼 */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <Button
            onClick={handleStartLearning}
            size="lg"
            className="w-full h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white shadow-sm hover:shadow-md transition-all"
          >
            {dailySet.completed ? (
              <>
                <CheckCircle className="mr-2 h-6 w-6" />
                계속 학습하기 💪
              </>
            ) : dailySet.progress > 0 ? (
              <>
                <Play className="mr-2 h-6 w-6" />
                계속 학습하기 💪
              </>
            ) : (
              <>
                <Play className="mr-2 h-6 w-6" />
                학습 시작하기! 🚀
              </>
            )}
          </Button>
        </motion.div>
      </div>
    </motion.div>

      {/* 완료 후 옵션 Dialog */}
      <Dialog open={showCompletionDialog} onOpenChange={setShowCompletionDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-slate-700 dark:text-slate-200">
              🎉 완료하셨네요!
            </DialogTitle>
            <DialogDescription className="text-base pt-2">
              다음 중 어떻게 하시겠어요?
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 pt-4">
            {/* 옵션 1: 같은 문제 다시 풀기 */}
            <Button
              onClick={handleReviewSameQuestions}
              size="lg"
              variant="outline"
              className="w-full h-auto py-4 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 hover:border-blue-300 dark:hover:border-blue-700 transition-all"
            >
              <div className="p-2 bg-blue-500 dark:bg-blue-600 rounded-lg flex-shrink-0">
                <RefreshCw className="h-5 w-5 text-white" />
              </div>
              <div className="text-left flex-1">
                <p className="font-bold text-base text-foreground">같은 문제 다시 풀어보기</p>
                <p className="text-sm text-muted-foreground mt-1">복습으로 완벽하게 이해해보세요</p>
              </div>
            </Button>
            
            {/* 옵션 2: 새로운 문제 풀기 */}
            <Button
              onClick={handleLoadNewQuestions}
              disabled={creating}
              size="lg"
              className="w-full h-auto py-4 flex items-start gap-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
            >
              <div className="p-2 bg-white/20 rounded-lg flex-shrink-0">
                <PlusCircle className="h-5 w-5 text-white" />
              </div>
              <div className="text-left flex-1">
                <p className="font-bold text-base">추가로 새로운 문제 풀기</p>
                <p className="text-sm text-white/80 mt-1">
                  {creating ? '문제를 불러오는 중...' : '다른 문제로 실력을 더 키워보세요'}
                </p>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

