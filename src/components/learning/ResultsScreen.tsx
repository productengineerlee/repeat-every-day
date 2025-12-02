import { motion } from 'framer-motion'
import { CheckCircle, XCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
      <div className="container mx-auto p-4 space-y-6">
        {/* 결과 요약 카드 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center">
                학습 결과
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center gap-8">
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary">
                    {correctCount}/{totalCount}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    정답
                  </div>
                </div>
                <div className="h-16 w-px bg-border" />
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary">
                    {accuracy}%
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    정답률
                  </div>
                </div>
                <div className="h-16 w-px bg-border" />
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary flex items-center justify-center gap-1">
                    <Clock className="h-6 w-6" />
                    {formatTime(totalTimeSpent)}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    총 소요 시간
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
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

            return (
              <motion.div
                key={question.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card
                  className={`${
                    isCorrect
                      ? 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10'
                      : 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10'
                  }`}
                >
                  <CardHeader className="text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">
                        문제{index + 1}.
                      </span>
                      <span className="text-sm font-medium text-foreground">
                        {isCorrect ? '맞음' : '틀림'}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 py-6 text-left">
                    {/* 정답 */}
                    <div className="text-left">
                      <span className="text-sm font-semibold text-foreground">
                        정답:
                      </span>
                      <span className="ml-2 font-medium text-foreground">
                        {correctAnswerDisplay}
                      </span>
                    </div>

                    {/* 선택 (수험생 답) */}
                    <div className="text-left">
                      <span className="text-sm font-semibold text-foreground">
                        선택:
                      </span>
                      <span className="ml-2 font-medium text-foreground">
                        {userAnswer}
                      </span>
                    </div>

                    {/* 해설 */}
                    <div className="text-left">
                      <div className="mb-2">
                        <span className="text-sm font-semibold text-foreground">
                          해설:
                        </span>
                      </div>
                      <div className="text-sm leading-relaxed whitespace-pre-wrap text-left text-foreground">
                        {question.explanation}
                      </div>
                    </div>

                    {/* 문제 푼 시간 */}
                    <div className="flex items-center gap-2 pt-2 border-t text-sm text-muted-foreground text-left">
                      <Clock className="h-4 w-4" />
                      <span>소요 시간: {formatTime(timeSpent)}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>

        {/* 완료 버튼 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: questions.length * 0.1 }}
          className="sticky bottom-4 z-10"
        >
          <Button
            onClick={onComplete}
            size="lg"
            className="w-full"
          >
            대시보드로 돌아가기
          </Button>
        </motion.div>
      </div>
    </div>
  )
}

