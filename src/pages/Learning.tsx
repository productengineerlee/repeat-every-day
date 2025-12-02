import { useState, useEffect, useCallback, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, type PanInfo } from 'framer-motion'
import { useAuth } from '@/context'
import TopBar from '@/components/dashboard/TopBar'
import QuestionCard from '@/components/learning/QuestionCard'
import AnswerOptions from '@/components/learning/AnswerOptions'
import ProgressIndicator from '@/components/learning/ProgressIndicator'
import AITutorPopup from '@/components/learning/AITutorPopup'
import ResultsScreen from '@/components/learning/ResultsScreen'
import { Button } from '@/components/ui/button'
import { getAIExplanation } from '@/lib/api/aiTutor'
import {
  getQuestions,
  submitAnswer,
  saveSessionToLocal,
  loadSessionFromLocal,
  clearSessionFromLocal,
  type StudySession,
} from '@/lib/api/learning'
import type { Question } from '@/types'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const SWIPE_THRESHOLD = 50

export default function Learning() {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const questionIds = useMemo(
    () => (location.state as { questionIds?: string[] })?.questionIds || [],
    [location.state]
  )

  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answered, setAnswered] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<StudySession | null>(null)
  const [timeStart, setTimeStart] = useState<number>(Date.now())
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null)
  const [termPosition, setTermPosition] = useState<{ x: number; y: number } | null>(null)
  const [aiExplanation, setAIExplanation] = useState<string>('')
  const [showAIPopup, setShowAIPopup] = useState(false)
  const [showResults, setShowResults] = useState(false)

  // 문제 로드
  useEffect(() => {
    const loadQuestions = async () => {
      if (questionIds.length === 0) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const loadedQuestions = await getQuestions(questionIds)

        if (loadedQuestions.length === 0) {
          console.warn('⚠️ 문제를 불러올 수 없습니다. 대시보드로 돌아갑니다.')
          // 문제가 없으면 대시보드로 리다이렉트
          navigate('/dashboard', { replace: true })
          return
        }

        setQuestions(loadedQuestions)

        // 세션 복원 또는 생성
        if (user) {
          const savedSession = loadSessionFromLocal(user.id)
          if (
            savedSession &&
            savedSession.questionIds.join(',') === questionIds.join(',')
          ) {
            setSession(savedSession)
            setCurrentIndex(savedSession.currentIndex)
            setAnswered(
              Object.keys(savedSession.answers).map((qId) => {
                const index = questionIds.indexOf(qId)
                return index + 1
              })
            )
          } else {
            // 새 세션 생성
            const newSession: StudySession = {
              id: `session_${Date.now()}`,
              userId: user.id,
              questionIds,
              answers: {},
              currentIndex: 0,
              startedAt: new Date(),
            }
            setSession(newSession)
            saveSessionToLocal(newSession)
          }
        }
      } catch (error) {
        console.error('Error loading questions:', error)
      } finally {
        setLoading(false)
      }
    }

    loadQuestions()
  }, [questionIds, user])

  // 현재 문제 변경 시 시간 측정 시작
  useEffect(() => {
    setTimeStart(Date.now())
  }, [currentIndex])

  // 세션 저장
  useEffect(() => {
    if (session && user) {
      saveSessionToLocal(session)
    }
  }, [session, user])

  const handleAnswerSelect = useCallback(
    async (answer: string, isCorrect: boolean) => {
      if (!user || !session || !questions[currentIndex]) return

      const question = questions[currentIndex]
      const timeSpent = Math.round((Date.now() - timeStart) / 1000) // 초 단위

      // 답안 제출
      await submitAnswer(user.id, question.id, answer, isCorrect, timeSpent)

      // 세션 업데이트
      const updatedSession: StudySession = {
        ...session,
        answers: {
          ...session.answers,
          [question.id]: { answer, isCorrect, timeSpent },
        },
        currentIndex,
      }
      setSession(updatedSession)
      // 중복 제거하여 답변한 문제 목록 업데이트
      const newAnswered = answered.includes(currentIndex + 1) 
        ? answered 
        : [...answered, currentIndex + 1]
      setAnswered(newAnswered)

      // 모든 문제를 풀었는지 확인
      const allQuestionsAnswered = newAnswered.length === questions.length
      console.log('📝 답안 제출 후 상태:', {
        currentIndex: currentIndex + 1, // 1-based index
        totalQuestions: questions.length,
        answeredBefore: answered.length,
        answeredAfter: newAnswered.length,
        answeredArray: newAnswered,
        allQuestionsAnswered,
        isLastQuestion: currentIndex === questions.length - 1,
      })
    },
    [user, session, questions, currentIndex, timeStart, answered]
  )

  const handleTermClick = useCallback(
    async (term: string, position: { x: number; y: number }) => {
      setSelectedTerm(term)
      setTermPosition(position)
      setShowAIPopup(true)

      // AI 설명 가져오기
      const explanation = await getAIExplanation(term)
      if (explanation) {
        setAIExplanation(explanation.explanation)
      } else {
        setAIExplanation(`${term}에 대한 설명을 불러오는 중입니다...`)
      }
    },
    []
  )

  // handleFeedbackComplete는 더 이상 사용하지 않음 (문제 풀이 중 피드백 제거)

  const handleNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setTimeStart(Date.now()) // 다음 문제로 이동할 때 시간 추적 리셋
    }
  }, [currentIndex, questions.length])

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }, [currentIndex])

  const handleSwipe = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (Math.abs(info.offset.x) > SWIPE_THRESHOLD) {
        if (info.offset.x > 0) {
          handlePrevious()
        } else {
          if (answered.includes(currentIndex + 1)) {
            handleNext()
          }
        }
      }
    },
    [handlePrevious, handleNext, answered, currentIndex]
  )

  // 키보드 단축키
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (showResults) return

      switch (e.key) {
        case 'ArrowLeft':
          handlePrevious()
          break
        case 'ArrowRight':
          if (answered.includes(currentIndex + 1)) {
            handleNext()
          }
          break
        case '1':
        case '2':
        case '3':
        case '4':
          // 답안 선택은 AnswerOptions 컴포넌트에서 처리
          // 키보드 단축키는 향후 구현 예정
          break
        default:
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [showResults, handlePrevious, handleNext, answered, currentIndex, questions])

  const handleComplete = useCallback(() => {
    if (session && user) {
      const completedSession: StudySession = {
        ...session,
        completedAt: new Date(),
      }
      clearSessionFromLocal(user.id)
      navigate('/dashboard', {
        state: { completed: true, session: completedSession },
      })
    }
  }, [session, user, navigate])

  // 결과 화면이 표시되면 문제 풀이 화면 숨기기
  if (showResults && session) {
    return (
      <div className="min-h-screen pb-24">
        <TopBar />
        <ResultsScreen
          questions={questions}
          session={session}
          onComplete={handleComplete}
        />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <TopBar />
        <div className="container mx-auto p-4 pb-24 flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
            <p className="text-muted-foreground">문제를 불러오는 중...</p>
          </div>
        </div>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen">
        <TopBar />
        <div className="container mx-auto p-4 pb-24 flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">문제를 찾을 수 없습니다.</p>
            <Button onClick={() => navigate('/dashboard')}>대시보드로 돌아가기</Button>
          </div>
        </div>
      </div>
    )
  }

  const currentQuestion = questions[currentIndex]
  const isAnswered = answered.includes(currentIndex + 1)
  const isLastQuestion = currentIndex === questions.length - 1
  const allAnswered = answered.length === questions.length
  
  // 디버깅 로그
  console.log('🔍 학습 상태 확인:', {
    currentIndex,
    totalQuestions: questions.length,
    answeredCount: answered.length,
    answered,
    isLastQuestion,
    allAnswered,
    isAnswered,
  })

  return (
    <div className="min-h-screen pb-24">
      <TopBar />
      <div className="container mx-auto p-4 space-y-6">
        {/* 진행률 표시 */}
        <ProgressIndicator
          current={currentIndex + 1}
          total={questions.length}
          answered={answered}
        />

        {/* 문제 카드 */}
        <div className="flex items-center justify-center relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -300 }}
              transition={{ duration: 0.3 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={handleSwipe}
              className="w-full max-w-2xl"
            >
              <QuestionCard
                question={currentQuestion}
                questionNumber={currentIndex + 1}
                totalQuestions={questions.length}
              />

              {/* 답안 선택지 */}
              {!showResults && (
                <div className="mt-6">
                  <AnswerOptions
                    options={currentQuestion.options}
                    correctAnswer={currentQuestion.correctAnswer}
                    onAnswerSelect={handleAnswerSelect}
                    disabled={false}
                    questionId={currentQuestion.id}
                  />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* 네비게이션 버튼 - 문제 풀이 중에만 표시 */}
        {!showResults && (
          <>
            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentIndex === 0}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                이전
              </Button>

              {isLastQuestion && allAnswered ? (
                <Button onClick={() => setShowResults(true)} size="lg">
                  학습 완료
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  disabled={!isAnswered}
                >
                  다음
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>

            {/* 스와이프 안내 */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                좌우로 스와이프하여 문제를 이동할 수 있습니다
              </p>
            </div>
          </>
        )}
      </div>

      {/* AI 튜터 팝업 */}
      {selectedTerm && termPosition && (
        <AITutorPopup
          term={selectedTerm}
          explanation={aiExplanation}
          isOpen={showAIPopup}
          onClose={() => {
            setShowAIPopup(false)
            setSelectedTerm(null)
            setTermPosition(null)
          }}
          position={termPosition}
        />
      )}
    </div>
  )
}
