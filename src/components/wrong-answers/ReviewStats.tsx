import { CheckCircle2, XCircle, TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'

interface ReviewStatsProps {
  total: number
  correct: number
  incorrect: number
  graduated: number
}

export default function ReviewStats({
  total,
  correct,
  incorrect,
  graduated,
}: ReviewStatsProps) {
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 border rounded-lg bg-card"
      >
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">전체</span>
        </div>
        <p className="text-2xl font-bold">{total}</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="p-4 border rounded-lg bg-card"
      >
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <span className="text-sm text-muted-foreground">정답</span>
        </div>
        <p className="text-2xl font-bold text-green-600">{correct}</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="p-4 border rounded-lg bg-card"
      >
        <div className="flex items-center gap-2 mb-2">
          <XCircle className="h-4 w-4 text-red-600" />
          <span className="text-sm text-muted-foreground">오답</span>
        </div>
        <p className="text-2xl font-bold text-red-600">{incorrect}</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="p-4 border rounded-lg bg-card"
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm text-muted-foreground">정확도</span>
        </div>
        <p className="text-2xl font-bold">{accuracy}%</p>
      </motion.div>

      {graduated > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="col-span-2 md:col-span-4 p-4 border rounded-lg bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20"
        >
          <p className="text-center text-lg font-semibold">
            🎓 {graduated}개의 문제가 졸업했습니다!
          </p>
        </motion.div>
      )}
    </div>
  )
}













