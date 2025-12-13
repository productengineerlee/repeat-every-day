import { useState } from 'react'
import { ThumbsUp, ThumbsDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { submitAIExplanationFeedback } from '@/lib/api/aiTutor'

interface FeedbackButtonsProps {
  term: string
  onFeedbackSubmitted?: () => void
}

export default function FeedbackButtons({
  term,
  onFeedbackSubmitted,
}: FeedbackButtonsProps) {
  const [feedback, setFeedback] = useState<'helpful' | 'not-helpful' | null>(
    null
  )
  const [submitting, setSubmitting] = useState(false)

  const handleFeedback = async (helpful: boolean) => {
    if (feedback !== null || submitting) return

    setSubmitting(true)
    setFeedback(helpful ? 'helpful' : 'not-helpful')

    try {
      await submitAIExplanationFeedback(term, helpful)
      onFeedbackSubmitted?.()
    } catch (error) {
      console.error('Error submitting feedback:', error)
      // 피드백 상태는 유지 (시각적 피드백)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex items-center gap-2 mt-4 pt-4 border-t">
      <span className="text-xs text-muted-foreground">이 설명이 도움이 되었나요?</span>
      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleFeedback(true)}
          disabled={feedback !== null || submitting}
          className={`h-8 w-8 p-0 ${
            feedback === 'helpful'
              ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
              : ''
          }`}
          aria-label="도움됨"
        >
          <ThumbsUp className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleFeedback(false)}
          disabled={feedback !== null || submitting}
          className={`h-8 w-8 p-0 ${
            feedback === 'not-helpful'
              ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
              : ''
          }`}
          aria-label="도움 안됨"
        >
          <ThumbsDown className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}













