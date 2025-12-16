import { motion } from 'framer-motion'
import type { Question } from '@/types'
import { formatCategoryDisplay } from '@/lib/utils/categoryFormatter'

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
  // 카테고리 포맷팅 (유틸리티 함수 사용)
  const categoryDisplay = question.certificationType + ' - ' + formatCategoryDisplay(question.certificationType || '', question.category || '')
  
  /* 모든 매핑 로직은 lib/utils/categoryFormatter.ts로 이동됨 */

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="bg-card border rounded-lg p-6 md:p-8 shadow-lg"
    >
      {/* 문제 번호 및 카테고리 */}
      <div className="flex items-start justify-between mb-6 gap-2">
        <div className="text-left">
          <div className="px-3 py-1 bg-muted rounded-full text-xs text-muted-foreground mb-2 inline-block">
            {categoryDisplay}
          </div>
          <h2 className="text-xl font-semibold mt-3">
            문제{questionNumber}
          </h2>
        </div>
        <div className="px-3 py-1 bg-muted rounded-full text-xs whitespace-nowrap">
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
