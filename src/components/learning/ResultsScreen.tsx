import { motion } from 'framer-motion'
import { Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { Question } from '@/types'
import type { StudySession } from '@/lib/api/learning'

interface ResultsScreenProps {
  questions: Question[]
  session: StudySession
  onComplete: () => void
}

export default function ResultsScreen({
  questions,
  session,
  onComplete,
}: ResultsScreenProps) {
  // 정답 개수 계산
  const correctCount = Object.values(session.answers).filter(
    (answer) => answer.isCorrect
  ).length
  const totalCount = questions.length
  const accuracy = Math.round((correctCount / totalCount) * 100)

  // 총 소요 시간 계산
  const totalTimeSpent = Object.values(session.answers).reduce(
    (sum, answer) => sum + answer.timeSpent,
    0
  )

  // 시간 포맷팅 (초 → 분:초 또는 시간:분:초)
  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds}초`
    }
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    if (minutes < 60) {
      return `${minutes}분 ${remainingSeconds}초`
    }
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}시간 ${remainingMinutes}분 ${remainingSeconds}초`
  }

  return (
    <div className="min-h-screen pb-24">
      <div className="container mx-auto p-4 space-y-8 max-w-4xl">
        {/* 결과 요약 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-center space-y-6"
        >
          <h1 className="text-3xl font-bold">학습 완료!</h1>
          
          <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
            <div className="bg-card border rounded-lg p-4">
              <div className="text-3xl font-bold text-primary mb-1">
                {correctCount}/{totalCount}
              </div>
              <div className="text-sm text-muted-foreground">정답</div>
            </div>
            
            <div className="bg-card border rounded-lg p-4">
              <div className="text-3xl font-bold text-primary mb-1">
                {accuracy}%
              </div>
              <div className="text-sm text-muted-foreground">정답률</div>
            </div>
            
            <div className="bg-card border rounded-lg p-4">
              <div className="text-xl font-bold text-primary mb-1 flex items-center justify-center gap-1">
                <Clock className="h-5 w-5" />
                {formatTime(totalTimeSpent)}
              </div>
              <div className="text-sm text-muted-foreground">소요시간</div>
            </div>
          </div>
        </motion.div>

        {/* 문제별 결과 리스트 */}
        <div className="space-y-4">
          {questions.map((question, index) => {
            const answerData = session.answers[question.id]
            const userAnswer = answerData?.answer || ''
            const isCorrect = answerData?.isCorrect || false
            const timeSpent = answerData?.timeSpent || 0

            // 원형 숫자와 일반 문자 변환 맵
            const circleToLetter: Record<string, string> = {
              '①': 'A',
              '②': 'B',
              '③': 'C',
              '④': 'D',
              '⑤': 'E',
            }
            const letterToCircle: Record<string, string> = {
              'A': '①',
              'B': '②',
              'C': '③',
              'D': '④',
              'E': '⑤',
            }
            
            // 정답을 일반 문자로 변환 (options 배열 인덱스 접근용)
            const correctAnswerLetter =
              circleToLetter[question.correctAnswer] || question.correctAnswer
            
            // 정답 표시용 (원형 숫자 우선, 없으면 일반 문자)
            const correctAnswerDisplay = 
              /[①②③④⑤]/.test(question.correctAnswer)
                ? question.correctAnswer 
                : letterToCircle[question.correctAnswer] || question.correctAnswer

            // 사용자 선택 표시용 (원형 숫자로 변환)
            const userAnswerDisplay = 
              /[①②③④⑤]/.test(userAnswer)
                ? userAnswer
                : letterToCircle[userAnswer] || userAnswer

            return (
              <motion.div
                key={question.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card className="overflow-hidden">
                  <div className="p-6">
                    <div className="space-y-3">
                      {/* 문제 번호 */}
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        {isCorrect ? (
                          <span className="text-green-600 dark:text-green-400">○</span>
                        ) : (
                          <span className="text-red-600 dark:text-red-400">✗</span>
                        )}
                        문제 {index + 1}
                      </h3>

                      {/* 정답/선택 */}
                      <div className="flex gap-6 text-sm">
                        <div>
                          <span className="text-muted-foreground">정답:</span>
                          <span className="ml-2 font-semibold text-green-600 dark:text-green-400">
                            {correctAnswerDisplay}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">선택:</span>
                          <span className={`ml-2 font-semibold ${
                            isCorrect 
                              ? 'text-green-600 dark:text-green-400' 
                              : 'text-red-600 dark:text-red-400'
                          }`}>
                            {userAnswerDisplay}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{formatTime(timeSpent)}</span>
                        </div>
                      </div>

                      {/* 해설 */}
                      <div className="bg-muted/50 rounded-lg p-4">
                        <div className="text-xs font-semibold text-muted-foreground mb-2">
                          해설
                        </div>
                        <div className="text-sm leading-relaxed whitespace-pre-wrap">
                          {question.explanation}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </div>

        {/* 완료 버튼 */}
        <div className="flex justify-center pt-4">
          <Button
            onClick={onComplete}
            size="lg"
            className="min-w-64"
          >
            대시보드로 돌아가기
          </Button>
        </div>
      </div>
    </div>
  )
}

