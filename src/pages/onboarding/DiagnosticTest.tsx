import { useState, useEffect } from 'react'
import { motion, AnimatePresence, type PanInfo } from 'framer-motion'
import { useOnboarding } from '@/context'
import { Button } from '@/components/ui/button'
import { getDiagnosticQuestions, type DiagnosticQuestion } from '@/lib/api/questions'
import { ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react'

const SWIPE_THRESHOLD = 50

export default function DiagnosticTest() {
  const { state, setDiagnosticAnswer, nextStep, previousStep } = useOnboarding()
  const [questions, setQuestions] = useState<DiagnosticQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)

  useEffect(() => {
    const fetchQuestions = async () => {
      if (!state.certificationType) {
        setError('자격증이 선택되지 않았습니다.')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const fetchedQuestions = await getDiagnosticQuestions(
          state.certificationType,
          10
        )
        setQuestions(fetchedQuestions)
        if (fetchedQuestions.length === 0) {
          setError('진단 문제를 찾을 수 없습니다.')
        }
      } catch (err) {
        setError('문제를 불러오는 중 오류가 발생했습니다.')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchQuestions()
  }, [state.certificationType])

  const currentQuestion = questions[currentIndex]
  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0
  const hasAnswered = currentQuestion
    ? state.diagnosticAnswers[currentQuestion.id] !== undefined
    : false

  // 이미 답한 문제의 경우 선택된 답 표시
  useEffect(() => {
    if (currentQuestion && state.diagnosticAnswers[currentQuestion.id]) {
      setSelectedAnswer(state.diagnosticAnswers[currentQuestion.id])
    } else {
      setSelectedAnswer(null)
    }
  }, [currentQuestion, state.diagnosticAnswers])

  const handleAnswerSelect = (answer: string) => {
    if (!currentQuestion) return

    setSelectedAnswer(answer)
    setDiagnosticAnswer(currentQuestion.id, answer)
  }

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setSelectedAnswer(null)
    } else {
      // 모든 문제를 완료했으므로 다음 단계로
      nextStep()
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    } else {
      previousStep()
    }
  }

  const handleSwipe = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (Math.abs(info.offset.x) > SWIPE_THRESHOLD) {
      if (info.offset.x > 0) {
        // 오른쪽으로 스와이프 (이전 문제)
        if (currentIndex > 0) {
          setCurrentIndex(currentIndex - 1)
        }
      } else {
        // 왼쪽으로 스와이프 (다음 문제)
        if (currentIndex < questions.length - 1 && hasAnswered) {
          setCurrentIndex(currentIndex + 1)
        }
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">문제를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md">
          <p className="text-red-600 dark:text-red-400">{error || '문제를 찾을 수 없습니다.'}</p>
          <Button onClick={previousStep}>이전으로 돌아가기</Button>
        </div>
      </div>
    )
  }

  const options = currentQuestion?.options || {}

  return (
    <div className="min-h-screen flex flex-col p-4">
      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col">
        {/* 진행률 표시 */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-muted-foreground">
              문제 {currentIndex + 1} / {questions.length}
            </span>
            <span className="text-sm font-medium text-muted-foreground">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* 문제 카드 */}
        <div className="flex-1 flex items-center justify-center relative">
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
              <div className="bg-card border rounded-lg p-6 md:p-8 shadow-lg">
                {/* 문제 번호 및 카테고리 */}
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <span className="text-sm text-muted-foreground">
                      {currentQuestion.category}
                    </span>
                    <h2 className="text-xl font-semibold mt-1">
                      문제 {currentIndex + 1}
                    </h2>
                  </div>
                  {hasAnswered && (
                    <div className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="h-5 w-5" />
                      <span className="text-sm font-medium">답변 완료</span>
                    </div>
                  )}
                </div>

                {/* 문제 내용 */}
                <div className="mb-8">
                  <p className="text-lg leading-relaxed">{currentQuestion.content}</p>
                </div>

                {/* 선택지 */}
                <div className="space-y-3">
                  {Object.entries(options).map(([key, value]) => {
                    const isSelected = selectedAnswer === key

                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleAnswerSelect(key)}
                        className={`
                          w-full p-4 text-left border-2 rounded-lg transition-all
                          ${
                            isSelected
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          }
                        `}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`
                              w-6 h-6 rounded-full border-2 flex items-center justify-center
                              ${
                                isSelected
                                  ? 'border-primary bg-primary text-primary-foreground'
                                  : 'border-muted-foreground'
                              }
                            `}
                          >
                            {isSelected && (
                              <div className="w-2 h-2 rounded-full bg-current" />
                            )}
                          </div>
                          <span className="font-medium mr-2">{key}.</span>
                          <span className="flex-1">{value as string}</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* 네비게이션 버튼 */}
        <div className="flex justify-between items-center mt-6">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            이전
          </Button>

          <div className="flex gap-2">
            {questions.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => {
                  setCurrentIndex(index)
                  setSelectedAnswer(null)
                }}
                className={`
                  w-2 h-2 rounded-full transition-all
                  ${
                    index === currentIndex
                      ? 'bg-primary w-8'
                      : state.diagnosticAnswers[questions[index].id]
                      ? 'bg-green-500'
                      : 'bg-muted'
                  }
                `}
                aria-label={`문제 ${index + 1}로 이동`}
              />
            ))}
          </div>

          <Button
            onClick={handleNext}
            disabled={!hasAnswered}
          >
            {currentIndex === questions.length - 1 ? '완료' : '다음'}
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        {/* 스와이프 안내 */}
        <div className="text-center mt-4">
          <p className="text-sm text-muted-foreground">
            좌우로 스와이프하여 문제를 이동할 수 있습니다
          </p>
        </div>
      </div>
    </div>
  )
}

