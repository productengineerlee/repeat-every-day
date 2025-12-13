import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '@/context'
import { Button } from '@/components/ui/button'
import { getTodayDailySet, createDailySet, type DailyQuestionSet } from '@/lib/api/dashboard'
import { getDailyQuestionSet, getExamQuestionSet } from '@/lib/api/questions'
import { supabase } from '@/lib/supabaseClient'
import { BookOpen, Clock, Play, CheckCircle } from 'lucide-react'

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

export default function DailyQuestionCard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [dailySet, setDailySet] = useState<DailyQuestionSet | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [selectedCertification, setSelectedCertification] = useState<CertificationType | null>(null)
  const [dailyQuestionCounts, setDailyQuestionCounts] = useState<Record<string, number | null>>({})

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
        
        // 사용자의 일일 문제 수 설정 가져오기
        const { data: userData } = await supabase
          .from('users')
          .select('daily_question_count')
          .eq('id', user.id)
          .maybeSingle()
        
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]) // createTodaySet 제거 (useCallback으로 메모이제이션되어 있어도 의존성에서 제거)

  const handleStartLearning = () => {
    if (dailySet && dailySet.questionIds.length > 0) {
      // 임시 문제 ID가 아닌 실제 문제 ID만 필터링
      const validQuestionIds = dailySet.questionIds.filter(
        (id) => !id.startsWith('temp-') && id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
      )
      
      if (validQuestionIds.length > 0) {
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

  const estimatedTime = dailySet ? Math.ceil(dailySet.questionIds.length * 2) : 10 // 문제당 약 2분

  if (loading || creating) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/20 rounded-xl p-6 md:p-8"
      >
        <div className="space-y-4">
          <div className="h-6 bg-muted animate-pulse rounded w-1/3" />
          <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
          <div className="h-12 bg-muted animate-pulse rounded" />
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
        className="bg-card border rounded-xl p-6 md:p-8 text-center space-y-4"
      >
        <p className="text-muted-foreground">오늘의 문제 세트를 불러올 수 없습니다.</p>
        <div className="text-sm text-muted-foreground space-y-2">
          <p>가능한 원인:</p>
          <ul className="list-disc list-inside space-y-1 text-left max-w-md mx-auto">
            <li>데이터베이스에 해당 자격증 문제가 없습니다</li>
            <li>빅데이터분석기사의 경우 카테고리가 "3-"로 시작하는 문제만 표시됩니다</li>
            <li>관리자 화면에서 문제를 등록해주세요</li>
          </ul>
          <Button
            onClick={createTodaySet}
            variant="outline"
            className="mt-4"
          >
            다시 시도
          </Button>
        </div>
      </motion.div>
    )
  }

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
            <h2 className="text-2xl font-bold">오늘의 문제</h2>
          </div>
          <p className="text-muted-foreground">
            {(() => {
              // 선택한 자격증이 있으면 해당 자격증의 설정된 문제 수 표시
              if (selectedCertification) {
                const count = getQuestionCountForCertification(selectedCertification)
                if (count > 0) {
                  return (
                    <>
                      주문하신 <span className="text-primary font-semibold">{count}문제</span>가 배달되었어요~
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
                      주문하신 <span className="text-primary font-semibold">{count}문제</span>가 배달되었어요~
                    </>
                  )
                }
              }
              
              // 문제가 로드된 경우에만 실제 문제 수 표시
              if (dailySet && dailySet.questionIds.length > 0) {
                return (
                  <>
                    주문하신 <span className="text-primary font-semibold">{dailySet.questionIds.length}문제</span>가 배달되었어요~
                  </>
                )
              }
              
              return '자격증을 선택해주세요'
            })()}
          </p>
        </div>
        {dailySet.completed && (
          <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
            <CheckCircle className="h-5 w-5" />
            <span className="text-sm font-medium">완료</span>
          </div>
        )}
      </div>


      {/* 진행률 바 */}
      {dailySet.progress > 0 && !dailySet.completed && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">진행률</span>
            <span className="font-medium">{dailySet.progress}%</span>
          </div>
          <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${dailySet.progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      )}

      {/* 예상 시간 */}
      <div className="flex items-center gap-2 text-muted-foreground">
        <Clock className="h-4 w-4" />
        <span className="text-sm">예상 소요 시간: 약 {estimatedTime}분</span>
      </div>

      {/* 시작 버튼 */}
      <Button
        onClick={handleStartLearning}
        disabled={dailySet.completed}
        size="lg"
        className="w-full"
      >
        {dailySet.completed ? (
          <>
            <CheckCircle className="mr-2 h-5 w-5" />
            오늘의 학습 완료
          </>
        ) : dailySet.progress > 0 ? (
          <>
            <Play className="mr-2 h-5 w-5" />
            계속 학습하기
          </>
        ) : (
          <>
            <Play className="mr-2 h-5 w-5" />
            학습 시작하기
          </>
        )}
      </Button>
    </motion.div>
  )
}

