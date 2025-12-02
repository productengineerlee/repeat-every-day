import { motion } from 'framer-motion'

interface ProgressIndicatorProps {
  current: number
  total: number
  answered: number[]
}

export default function ProgressIndicator({
  current,
  total,
  answered,
}: ProgressIndicatorProps) {
  const progress = (current / total) * 100

  return (
    <div className="space-y-2">
      {/* 진행률 텍스트 */}
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-muted-foreground">
          진행률
        </span>
        <span className="text-sm font-medium">
          {current} / {total}
        </span>
      </div>

      {/* 진행률 바 */}
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* 문제별 상태 표시 */}
      <div className="flex gap-1 justify-center">
        {Array.from({ length: total }).map((_, index) => {
          const questionNumber = index + 1
          const isAnswered = answered.includes(questionNumber)
          const isCurrent = questionNumber === current

          return (
            <div
              key={index}
              className={`
                w-2 h-2 rounded-full transition-all
                ${
                  isCurrent
                    ? 'w-8 bg-primary'
                    : isAnswered
                    ? 'bg-green-500'
                    : 'bg-muted'
                }
              `}
              title={`문제 ${questionNumber}${isAnswered ? ' (완료)' : ''}`}
            />
          )
        })}
      </div>
    </div>
  )
}








