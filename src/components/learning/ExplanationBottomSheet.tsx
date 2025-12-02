import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import HighlightedText from './HighlightedText'

interface ExplanationBottomSheetProps {
  explanation: string
  isOpen: boolean
  onClose: () => void
  onTermClick?: (term: string, position: { x: number; y: number }) => void
}

export default function ExplanationBottomSheet({
  explanation,
  isOpen,
  onClose,
  onTermClick,
}: ExplanationBottomSheetProps) {
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

  // 배경 클릭으로 닫기
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

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
            className="fixed inset-0 bg-black/50 z-40"
            onClick={handleBackdropClick}
            aria-hidden="true"
          />

          {/* 바텀 시트 */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 30,
            }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t rounded-t-2xl shadow-2xl max-h-[80vh] flex flex-col"
          >
            {/* 핸들 바 */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full" />
            </div>

            {/* 헤더 */}
            <div className="flex items-center justify-between px-6 pb-4 border-b">
              <h3 className="text-lg font-semibold">해설</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                aria-label="닫기"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* 설명 내용 */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="text-base leading-relaxed whitespace-pre-wrap">
                  <HighlightedText text={explanation} onTermClick={onTermClick} />
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

