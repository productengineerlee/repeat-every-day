import { AlertTriangle, Clock } from 'lucide-react'
import { differenceInDays } from 'date-fns'

interface ReviewBadgeProps {
  nextReviewDate: Date | string
}

export default function ReviewBadge({
  nextReviewDate,
}: ReviewBadgeProps) {
  const reviewDate = typeof nextReviewDate === 'string' 
    ? new Date(nextReviewDate) 
    : nextReviewDate
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  reviewDate.setHours(0, 0, 0, 0)

  const daysUntilReview = differenceInDays(reviewDate, today)
  const isOverdue = daysUntilReview < 0
  const isUrgent = daysUntilReview <= 1 && daysUntilReview >= 0
  const isWarning = daysUntilReview <= 3 && daysUntilReview > 1

  const getBadgeColor = () => {
    if (isOverdue) {
      return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700'
    }
    if (isUrgent) {
      return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700'
    }
    if (isWarning) {
      return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700'
    }
    return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700'
  }

  const getBadgeText = () => {
    if (isOverdue) {
      return `${Math.abs(daysUntilReview)}일 지연`
    }
    if (isUrgent) {
      return '오늘 복습 필요'
    }
    if (isWarning) {
      return `${daysUntilReview}일 후 복습`
    }
    return `${daysUntilReview}일 후 복습`
  }

  const getIcon = () => {
    if (isOverdue || isUrgent) {
      return <AlertTriangle className="h-3 w-3" />
    }
    return <Clock className="h-3 w-3" />
  }

  return (
    <div
      className={`
        inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border
        ${getBadgeColor()}
      `}
    >
      {getIcon()}
      <span>{getBadgeText()}</span>
    </div>
  )
}

