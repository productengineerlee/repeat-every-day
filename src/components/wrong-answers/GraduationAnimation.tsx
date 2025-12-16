import { motion, AnimatePresence } from 'framer-motion'
import { GraduationCap, Sparkles } from 'lucide-react'

interface GraduationAnimationProps {
  show: boolean
  count: number
  onComplete: () => void
}

export default function GraduationAnimation({
  show,
  count,
  onComplete,
}: GraduationAnimationProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={onComplete}
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: 'spring', damping: 15 }}
            className="bg-card border rounded-2xl p-8 max-w-md mx-4 text-center relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 배경 효과 */}
            <motion.div
              animate={{
                rotate: [0, 360],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'linear',
              }}
              className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 via-orange-400/20 to-yellow-400/20"
            />

            {/* 졸업 모자 아이콘 */}
            <motion.div
              initial={{ y: -50, rotate: -10 }}
              animate={{ y: 0, rotate: 0 }}
              transition={{ type: 'spring', damping: 10 }}
              className="relative z-10 mb-4"
            >
              <GraduationCap className="h-20 w-20 mx-auto text-yellow-500" />
            </motion.div>

            {/* 반짝이는 효과 */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                  x: [
                    0,
                    Math.cos((i * Math.PI) / 3) * 100,
                    Math.cos((i * Math.PI) / 3) * 150,
                  ],
                  y: [
                    0,
                    Math.sin((i * Math.PI) / 3) * 100,
                    Math.sin((i * Math.PI) / 3) * 150,
                  ],
                }}
                transition={{
                  duration: 1.5,
                  delay: i * 0.1,
                  repeat: Infinity,
                  repeatDelay: 0.5,
                }}
                className="absolute top-1/2 left-1/2"
              >
                <Sparkles className="h-4 w-4 text-yellow-400" />
              </motion.div>
            ))}

            {/* 텍스트 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="relative z-10"
            >
              <h2 className="text-3xl font-bold mb-2">🎓 졸업 축하합니다!</h2>
              <p className="text-lg text-muted-foreground mb-4">
                {count}개의 문제를 완벽하게 마스터했습니다!
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onComplete}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-semibold"
              >
                확인
              </motion.button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}















