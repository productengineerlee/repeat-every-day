import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle } from 'lucide-react'

interface FeedbackAnimationProps {
  isCorrect: boolean
  show: boolean
  onComplete?: () => void
}

export default function FeedbackAnimation({
  isCorrect,
  show,
  onComplete,
}: FeedbackAnimationProps) {
  useEffect(() => {
    if (show) {
      // 햅틱 피드백 (모바일 디바이스)
      if ('vibrate' in navigator) {
        if (isCorrect) {
          // 정답: 짧은 진동
          navigator.vibrate(100)
        } else {
          // 오답: 긴 진동
          navigator.vibrate([100, 50, 100])
        }
      }

      // 애니메이션 완료 후 콜백 호출
      const timer = setTimeout(() => {
        if (onComplete) {
          onComplete()
        }
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [show, isCorrect, onComplete])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          transition={{
            type: 'spring',
            stiffness: 500,
            damping: 30,
          }}
          className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
        >
          <div
            className={`
              rounded-full p-8
              ${
                isCorrect
                  ? 'bg-green-500/90 dark:bg-green-600/90'
                  : 'bg-red-500/90 dark:bg-red-600/90'
              }
            `}
          >
            {isCorrect ? (
              <CheckCircle className="h-24 w-24 text-white" />
            ) : (
              <XCircle className="h-24 w-24 text-white" />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}








