import { useState, useEffect } from 'react'
import { motion, AnimatePresence, type PanInfo } from 'framer-motion'
import { useOnboarding } from '@/context'
import { Button } from '@/components/ui/button'
import { getDiagnosticQuestions, type DiagnosticQuestion } from '@/lib/api/questions'
import { ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react'
import { formatCategoryDisplay } from '@/lib/utils/categoryFormatter'
import { formatDifficulty } from '@/lib/utils/difficultyFormatter'

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
        console.log('🔄 진단테스트 문제 가져오기 시작:', state.certificationType)
        const fetchedQuestions = await getDiagnosticQuestions(
          state.certificationType,
          10
        )
        console.log('📦 받은 문제 개수:', fetchedQuestions.length)
        console.log('📝 문제 목록:', fetchedQuestions)
        setQuestions(fetchedQuestions)
        if (fetchedQuestions.length === 0) {
          setError('진단 문제를 찾을 수 없습니다.')
        }
      } catch (err) {
        setError('문제를 불러오는 중 오류가 발생했습니다.')
        console.error('❌ 문제 가져오기 에러:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchQuestions()
  }, [state.certificationType])

  // 인덱스를 문자(A, B, C, D, E)로 변환
  const indexToLetter = (index: string): string => {
    const letters = ['A', 'B', 'C', 'D', 'E']
    const numIndex = parseInt(index)
    return letters[numIndex] || index
  }

  const currentQuestion = questions[currentIndex]
  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0
  const hasAnswered = currentQuestion
    ? state.diagnosticAnswers[currentQuestion.id] !== undefined
    : false

  // 이미 답한 문제의 경우 선택된 답 표시
  useEffect(() => {
    if (currentQuestion && state.diagnosticAnswers[currentQuestion.id]) {
      const savedAnswer = state.diagnosticAnswers[currentQuestion.id]
      // 저장된 답안이 숫자 형식이면 문자로 변환
      const convertedAnswer = /^\d+$/.test(savedAnswer) ? indexToLetter(savedAnswer) : savedAnswer
      setSelectedAnswer(convertedAnswer)
    } else {
      setSelectedAnswer(null)
    }
  }, [currentQuestion, state.diagnosticAnswers])

  const handleAnswerSelect = (answer: string) => {
    if (!currentQuestion) return

    console.log('💾 답안 저장:', {
      questionId: currentQuestion.id,
      answer,
      questionContent: currentQuestion.content.substring(0, 50) + '...'
    })

    setSelectedAnswer(answer)
    setDiagnosticAnswer(currentQuestion.id, answer)
  }

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      console.log(`➡️ 다음 문제로 이동 (${currentIndex + 1} → ${currentIndex + 2})`)
      setCurrentIndex(currentIndex + 1)
      setSelectedAnswer(null)
    } else {
      // 모든 문제를 완료했으므로 다음 단계로
      console.log('✅ 모든 문제 완료! 결과 페이지로 이동')
      console.log('💬 저장된 답안들:', state.diagnosticAnswers)
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

  // 선택지 텍스트에서 접두사 제거 함수
  const cleanOptionText = (text: string): string => {
    // "숫자. " 또는 "문자. " 형식으로 시작하는 경우 제거
    // 예: "1. ", "A. ", "① " 등
    return text.replace(/^[①-⑤\d+A-E]+\.\s*/, '').trim()
  }

  const rawOptions = currentQuestion?.options || {}
  
  // options의 키를 A, B, C, D, E로 변환
  const options: Record<string, unknown> = {}
  Object.entries(rawOptions).forEach(([key, value]) => {
    const letter = indexToLetter(key)
    options[letter] = value
  })

  return (
    <div className="min-h-screen flex flex-col p-4 md:p-6">
      <div className="max-w-4xl mx-auto w-full flex flex-col">
        {/* 진행률 표시 */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-base font-medium text-muted-foreground">
              문제 {currentIndex + 1} / {questions.length}
            </span>
            <span className="text-base font-medium text-muted-foreground">
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
        <div className="mt-6 mb-6">
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
              className="w-full max-w-2xl mx-auto"
            >
              <div className="bg-card border rounded-lg p-5 md:p-6 shadow-lg">
                {/* 문제 번호 및 카테고리 */}
                <div className="flex justify-between items-start mb-4">
                  <div className="text-left">
                    <span className="text-base text-muted-foreground">
                      {formatCategoryDisplay(state.certificationType || '', currentQuestion.category || '')}
                    </span>
                    <h2 className="text-2xl font-semibold mt-1">
                      문제 {currentIndex + 1}
                    </h2>
                  </div>
                  <div className="px-3 py-1 bg-muted rounded-full text-xs whitespace-nowrap">
                    난이도: {formatDifficulty(currentQuestion.difficulty)}
                  </div>
                </div>

                {/* 문제 내용 */}
                <div className="mb-4">
                  <p className="text-xl leading-relaxed text-left">{currentQuestion.content}</p>
                </div>

                {/* 선택지 */}
                <div className="space-y-2">
                  {Object.entries(options).map(([key, value]) => {
                    const isSelected = selectedAnswer === key
                    const cleanedValue = cleanOptionText(value as string)

                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleAnswerSelect(key)}
                        className={`
                          w-full p-3 text-left border-2 rounded-lg transition-all
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
                              w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0
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
                          <span className="flex-1 text-left text-base md:text-lg">{cleanedValue}</span>
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
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            이전
          </Button>

          <Button
            onClick={handleNext}
            disabled={!hasAnswered}
          >
            {currentIndex === questions.length - 1 ? '완료' : '다음'}
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

