import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { Question } from '@/types'
import type { StudySession } from '@/lib/api/learning'

interface ResultsScreenProps {
  questions: Question[]
  session: StudySession
  onComplete: () => void
}

// 알파벳을 동그라미 숫자로 변환하는 매핑
const answerToCircledNumber: Record<string, string> = {
  'A': '①',
  'B': '②',
  'C': '③',
  'D': '④',
  'E': '⑤',
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
  const totalQuestions = questions.length
  const accuracy = Math.round((correctCount / totalQuestions) * 100)

  // 총 소요 시간 계산
  const totalTimeSpent = Object.values(session.answers).reduce(
    (acc, answer) => acc + answer.timeSpent,
    0
  )

  // 시간 포맷 함수
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    if (mins > 0) {
      return `${mins}분 ${secs}초`
    }
    return `${secs}초`
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* 제목 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-3xl font-bold mb-2">학습 완료!</h1>
        <p className="text-muted-foreground">학습 결과를 확인하세요</p>
      </motion.div>

      {/* 요약 카드 3개 (정답, 정답률, 소요 시간) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 정답 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-2">정답</div>
                <div className="text-4xl font-bold text-primary">
                  {correctCount} / {totalQuestions}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* 정답률 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-2">정답률</div>
                <div className="text-4xl font-bold text-green-600">
                  {accuracy}%
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* 총 소요 시간 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-2">
                  총 소요 시간
                </div>
                <div className="text-4xl font-bold text-blue-600">
                  {formatTime(totalTimeSpent)}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* 문제별 상세 결과 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="space-y-4"
      >
        <h2 className="text-xl font-semibold mb-4">문제별 결과</h2>
        {questions.map((question, index) => {
          const record = session.answers[question.id]
          const isCorrect = record?.isCorrect ?? false
          const userAnswer = record?.answer ?? ''

          return (
            <Card key={question.id}>
              <CardContent className="pt-6 space-y-4">
                {/* 문제 번호 (앞에 ○ 또는 ✗) */}
                <div className="flex items-center gap-2">
                  <span
                    className={`text-lg font-semibold ${
                      isCorrect ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {isCorrect ? '○' : '✗'}
                  </span>
                  <h3 className="text-lg font-semibold">문제 {index + 1}</h3>
                </div>

                {/* 문제 내용 */}
                <p className="text-left whitespace-pre-wrap">
                  {question.content}
                </p>

                {/* 보기 */}
                <div className="space-y-2">
                  {question.options.map((option, optIndex) => {
                    const optionLetter = String.fromCharCode(65 + optIndex) // A, B, C, D, E
                    const isUserAnswer = userAnswer === optionLetter
                    const isCorrectAnswer =
                      question.correctAnswer === optionLetter

                    return (
                      <div
                        key={optIndex}
                        className={`p-3 rounded border ${
                          isCorrectAnswer
                            ? 'bg-green-50 border-green-200'
                            : isUserAnswer
                            ? 'bg-red-50 border-red-200'
                            : 'bg-muted/30'
                        }`}
                      >
                        <span className="font-medium mr-2">
                          {optionLetter}.
                        </span>
                        {option}
                      </div>
                    )
                  })}
                </div>

                {/* 정답/선택 정보 */}
                <div className="flex gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">정답: </span>
                    <span className="font-semibold text-green-600">
                      {answerToCircledNumber[question.correctAnswer] ||
                        question.correctAnswer}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">선택: </span>
                    <span
                      className={`font-semibold ${
                        isCorrect ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {answerToCircledNumber[userAnswer] || userAnswer}
                    </span>
                  </div>
                </div>

                {/* 해설 */}
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="text-sm font-semibold text-muted-foreground mb-2">
                    해설
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {question.explanation}
                  </p>
                </div>

                {/* 소요 시간 */}
                <div className="text-sm text-muted-foreground">
                  ⏱ 소요 시간: {formatTime(record?.timeSpent ?? 0)}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </motion.div>

      {/* 완료 버튼 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex justify-center"
      >
        <Button size="lg" onClick={onComplete}>
          학습 완료
        </Button>
      </motion.div>
    </div>
  )
}
