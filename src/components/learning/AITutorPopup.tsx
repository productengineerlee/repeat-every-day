import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import FeedbackButtons from './FeedbackButtons'

interface AITutorPopupProps {
  term: string
  explanation: string
  isOpen: boolean
  onClose: () => void
  position?: { x: number; y: number }
}

export default function AITutorPopup({
  term,
  explanation,
  isOpen,
  onClose,
  position,
}: AITutorPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null)

  // ESC 키로 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // 팝업 위치 조정 (화면 밖으로 나가지 않도록)
  useEffect(() => {
    if (isOpen && popupRef.current && position) {
      const popup = popupRef.current
      const rect = popup.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      let x = position.x
      let y = position.y

      // 오른쪽으로 나가는 경우
      if (x + rect.width > viewportWidth) {
        x = viewportWidth - rect.width - 16
      }

      // 왼쪽으로 나가는 경우
      if (x < 16) {
        x = 16
      }

      // 아래로 나가는 경우
      if (y + rect.height > viewportHeight) {
        y = position.y - rect.height - 40 // 용어 위에 표시
      }

      // 위로 나가는 경우
      if (y < 16) {
        y = 16
      }

      popup.style.left = `${x}px`
      popup.style.top = `${y}px`
    }
  }, [isOpen, position])

  // 배경 클릭으로 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        isOpen &&
        popupRef.current &&
        !popupRef.current.contains(e.target as Node)
      ) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  if (!position) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 배경 오버레이 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/20 z-40"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* 팝업 */}
          <motion.div
            ref={popupRef}
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 25,
            }}
            className="fixed z-50 bg-card border rounded-lg shadow-2xl max-w-sm w-full p-4"
            style={{
              left: position.x,
              top: position.y + 30, // 용어 아래에 표시
            }}
            role="dialog"
            aria-labelledby="ai-tutor-title"
            aria-describedby="ai-tutor-description"
          >
            {/* 헤더 */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-full">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3
                    id="ai-tutor-title"
                    className="font-semibold text-sm"
                  >
                    AI 튜터
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {term}에 대한 설명
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-6 w-6"
                aria-label="닫기"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* 설명 내용 */}
            <div
              id="ai-tutor-description"
              className="text-sm leading-relaxed text-muted-foreground"
            >
              {explanation}
            </div>

            {/* 피드백 버튼 */}
            <FeedbackButtons term={term} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

