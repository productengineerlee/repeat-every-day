import { motion } from 'framer-motion'
import type { Question } from '@/types'

interface QuestionCardProps {
  question: Question
  questionNumber: number
  totalQuestions: number
}

export default function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
}: QuestionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="bg-card border rounded-lg p-6 md:p-8 shadow-lg"
    >
      {/* 문제 번호 및 카테고리 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <span className="text-sm text-muted-foreground">
            {question.category || '일반'}
          </span>
          <h2 className="text-xl font-semibold mt-1">
            문제 {questionNumber} / {totalQuestions}
          </h2>
        </div>
        <div className="px-3 py-1 bg-muted rounded-full text-sm">
          난이도: {question.difficulty || '중'}
        </div>
      </div>

      {/* 문제 내용 */}
      <div className="mb-6">
        <p className="text-lg leading-relaxed whitespace-pre-wrap text-left">
          {question.content}
        </p>
      </div>
    </motion.div>
  )
}








