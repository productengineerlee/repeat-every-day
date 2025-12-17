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
  
  // 인덱스 또는 한글 자음을 원형 숫자로 변환 (①, ②, ③, ④, ⑤)
  const indexToCircleNumber = (idx: number | string): string => {
    const circleNumbers = ['①', '②', '③', '④', '⑤']
    const koreanConsonants = ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ']
    
    // 한글 자음인 경우
    if (typeof idx === 'string') {
      const koreanIndex = koreanConsonants.indexOf(idx)
      if (koreanIndex !== -1) {
        return circleNumbers[koreanIndex]
      }
    }
    
    // 숫자 인덱스인 경우
    const numIdx = typeof idx === 'number' ? idx : parseInt(idx)
    if (!isNaN(numIdx) && numIdx >= 0 && numIdx < circleNumbers.length) {
      return circleNumbers[numIdx]
    }
    
    return typeof idx === 'string' ? idx : `${idx + 1}`
  }

  // options가 배열인 경우 객체로 변환 (①, ②, ③, ④, ⑤ 키 사용)
  const optionsObj: Record<string, string> =
    Array.isArray(options)
      ? options.reduce((acc, val, idx) => {
          acc[indexToCircleNumber(idx)] = val // ①, ②, ③, ④, ⑤
          return acc
        }, {} as Record<string, string>)
      : options

  const handleSelect = (key: string) => {
    if (disabled) return

    const isCorrect = key === correctAnswer
    setSelectedAnswer(key)
    onAnswerSelect(key, isCorrect)
  }

  // 선택지 텍스트에서 앞의 숫자 접두사 제거 (예: "0. ", "1. ", "2. " 등)
  const cleanOptionText = (text: string): string => {
    // "숫자. " 또는 "숫자." 형식으로 시작하는 경우 제거
    // 예: "0. ① 수익비용대응 원칙" → "① 수익비용대응 원칙"
    // 예: "1. ② 발생주의 원칙" → "② 발생주의 원칙"
    return text.replace(/^\d+\.\s*/, '').trim()
  }

  return (
    <div className="space-y-3">
      {Object.entries(optionsObj).map(([key, value], index) => {
        const isSelected = selectedAnswer === key
        const cleanedValue = cleanOptionText(value)

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
            {/* 선택지 텍스트 (질문지 원본 번호 포함) */}
            <span className="flex-1">{cleanedValue}</span>
          </motion.label>
        )
      })}
    </div>
  )
}








