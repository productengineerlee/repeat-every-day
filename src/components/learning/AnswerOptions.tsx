import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

interface AnswerOptionsProps {
  options: Record<string, string> | string[]
  correctAnswer: string
  onAnswerSelect: (answer: string, isCorrect: boolean) => void
  disabled?: boolean
  questionId?: string // 문제 ID 추가 (문제 변경 감지용)
}

export default function AnswerOptions({
  options,
  correctAnswer,
  onAnswerSelect,
  disabled = false,
  questionId,
}: AnswerOptionsProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)

  // 문제가 변경되면 선택 상태 리셋
  useEffect(() => {
    setSelectedAnswer(null)
  }, [questionId])

  // 원형 숫자 배열
  const circleNumbers = ['①', '②', '③', '④', '⑤']
  
  // options가 배열인 경우 객체로 변환 (A, B, C, D, E 키 사용)
  const optionsObj: Record<string, string> =
    Array.isArray(options)
      ? options.reduce((acc, val, idx) => {
          acc[String.fromCharCode(65 + idx)] = val // A, B, C, D, E
          return acc
        }, {} as Record<string, string>)
      : options

  const handleSelect = (key: string) => {
    if (disabled) return

    const isCorrect = key === correctAnswer
    setSelectedAnswer(key)
    onAnswerSelect(key, isCorrect)
  }

  return (
    <div className="space-y-3">
      {Object.entries(optionsObj).map(([key, value], index) => {
        const isSelected = selectedAnswer === key
        const circleNumber = circleNumbers[index] // ①, ②, ③, ④, ⑤

        return (
          <motion.label
            key={key}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`
              flex items-center gap-3 w-full p-4 text-left border-2 rounded-lg transition-all cursor-pointer
              ${
                isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }
              ${disabled ? 'cursor-not-allowed opacity-50' : ''}
            `}
          >
            {/* 라디오 버튼 */}
            <input
              type="radio"
              name="answer"
              value={key}
              checked={isSelected}
              onChange={() => handleSelect(key)}
              disabled={disabled}
              className="sr-only"
            />
            {/* 라디오 버튼 시각적 표시 */}
            <div
              className={`
                w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0
                ${
                  isSelected
                    ? 'border-primary bg-primary'
                    : 'border-muted-foreground bg-background'
                }
              `}
            >
              {isSelected && (
                <div className="w-3 h-3 rounded-full bg-primary-foreground" />
              )}
            </div>
            {/* 원형 숫자 표시 */}
            <span className="text-lg font-medium">{circleNumber}</span>
            {/* 선택지 텍스트 */}
            <span className="flex-1">{value}</span>
          </motion.label>
        )
      })}
    </div>
  )
}








