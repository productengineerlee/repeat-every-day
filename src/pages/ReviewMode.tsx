import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, type PanInfo } from 'framer-motion'
import { useAuth } from '@/context'
import QuestionCard from '@/components/learning/QuestionCard'
import AnswerOptions from '@/components/learning/AnswerOptions'
import ProgressIndicator from '@/components/learning/ProgressIndicator'
import FeedbackAnimation from '@/components/learning/FeedbackAnimation'
import ExplanationBottomSheet from '@/components/learning/ExplanationBottomSheet'
import ReviewStats from '@/components/wrong-answers/ReviewStats'
import GraduationAnimation from '@/components/wrong-answers/GraduationAnimation'
import { Button } from '@/components/ui/button'
import { getWrongAnswers, markReviewComplete } from '@/lib/api/wrongAnswers'
import { getQuestions } from '@/lib/api/learning'
import type { Question } from '@/types'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

const SWIPE_THRESHOLD = 50

export default function ReviewMode() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [answered, setAnswered] = useState<number[]>([])
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedbackCorrect, setFeedbackCorrect] = useState(false)
  const [showExplanation, setShowExplanation] = useState(false)
  const [stats, setStats] = useState({
    total: 0,
    correct: 0,
    incorrect: 0,
    graduated: 0,
  })
  const [showGraduation, setShowGraduation] = useState(false)
  const [graduatedCount, setGraduatedCount] = useState(0)

  // 복습 문제 로드
  useEffect(() => {
    const loadReviewItems = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const items = await getWrongAnswers(user.id, 'review')
        setStats((prev) => ({ ...prev, total: items.length }))

        if (items.length > 0) {
          const questionIds = items.map((item) => item.questionId)
          const questionData = await getQuestions(questionIds)
          setQuestions(questionData)
        }
      } catch (error) {
        console.error('Error loading review items:', error)
      } finally {
        setLoading(false)
      }
    }

    loadReviewItems()
  }, [user])

  const currentQuestion = questions[currentIndex]

  const handleAnswerSelect = useCallback(
    async (_answer: string, isCorrect: boolean) => {
      if (!currentQuestion || !user) return

      setFeedbackCorrect(isCorrect)
      setShowFeedback(true)
      setAnswered((prev) => [...prev, currentIndex + 1])

      // 통계 업데이트
      setStats((prev) => ({
        ...prev,
        correct: prev.correct + (isCorrect ? 1 : 0),
        incorrect: prev.incorrect + (isCorrect ? 0 : 1),
      }))

      // 복습 완료 처리
      const result = await markReviewComplete(
        user.id,
        currentQuestion.id,
        isCorrect
      )

      if (result.success && result.graduated) {
        setStats((prev) => ({
          ...prev,
          graduated: prev.graduated + 1,
        }))
        setGraduatedCount((prev) => prev + 1)
        // 졸업 애니메이션 표시
        setTimeout(() => {
          setShowGraduation(true)
        }, 500)
      }

      // 설명 표시
      setTimeout(() => {
        setShowExplanation(true)
      }, 1000)
    },
    [currentQuestion, user, currentIndex]
  )

  const handleNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setShowFeedback(false)
      setShowExplanation(false)
    } else {
      // 복습 완료
      navigate('/wrong-answers')
    }
  }, [currentIndex, questions.length, navigate])

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setShowFeedback(false)
      setShowExplanation(false)
    }
  }, [currentIndex])

  const handleSwipe = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (Math.abs(info.offset.x) > SWIPE_THRESHOLD) {
        if (info.offset.x > 0) {
          handlePrevious()
        } else {
          if (showExplanation) {
            handleNext()
          }
        }
      }
    },
    [showExplanation, handleNext, handlePrevious]
  )

  // 키보드 단축키
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (showExplanation) {
        if (e.key === 'ArrowRight' || e.key === 'Enter') {
          handleNext()
        } else if (e.key === 'ArrowLeft') {
          handlePrevious()
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [showExplanation, handleNext, handlePrevious])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">복습 문제를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto p-4 pt-10 text-center py-12">
          <p className="text-lg text-muted-foreground mb-4">
            복습할 문제가 없습니다.
          </p>
          <Button onClick={() => navigate('/wrong-answers')}>
            오답 노트로 돌아가기
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-24 pt-10">
      <div className="container mx-auto p-4">
        {/* 통계 */}
        <ReviewStats
          total={stats.total}
          correct={stats.correct}
          incorrect={stats.incorrect}
          graduated={stats.graduated}
        />

        {/* 진행 표시 */}
        <div className="mb-6">
          <ProgressIndicator
            current={currentIndex + 1}
            total={questions.length}
            answered={answered}
          />
        </div>

        {/* 문제 카드 */}
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={handleSwipe}
          className="relative"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -300 }}
              transition={{ type: 'spring', damping: 20 }}
            >
              {currentQuestion && (
                <>
                  <QuestionCard
                    question={currentQuestion}
                    questionNumber={currentIndex + 1}
                    totalQuestions={questions.length}
                  />

                  <div className="mt-6">
                    <AnswerOptions
                      options={currentQuestion.options}
                      correctAnswer={currentQuestion.correctAnswer}
                      onAnswerSelect={handleAnswerSelect}
                      disabled={showFeedback}
                    />
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* 피드백 애니메이션 */}
        <FeedbackAnimation
          show={showFeedback}
          isCorrect={feedbackCorrect}
          onComplete={() => {}}
        />

        {/* 설명 바텀시트 */}
        {currentQuestion && (
          <ExplanationBottomSheet
            isOpen={showExplanation}
            onClose={() => setShowExplanation(false)}
            explanation={currentQuestion.explanation}
            onTermClick={() => {}}
          />
        )}

        {/* 네비게이션 버튼 */}
        <div className="fixed bottom-24 left-0 right-0 flex justify-between px-4 pointer-events-none">
          <Button
            variant="outline"
            size="icon"
            className="pointer-events-auto"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="pointer-events-auto"
            onClick={() => navigate('/wrong-answers')}
          >
            <X className="h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="pointer-events-auto"
            onClick={handleNext}
            disabled={currentIndex >= questions.length - 1 && !showExplanation}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* 졸업 애니메이션 */}
      <GraduationAnimation
        show={showGraduation}
        count={graduatedCount}
        onComplete={() => setShowGraduation(false)}
      />
    </div>
  )
}

