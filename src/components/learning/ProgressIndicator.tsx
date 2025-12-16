import { motion } from 'framer-motion'

interface ProgressIndicatorProps {
  current: number
  total: number
  answered: number[]
}

export default function ProgressIndicator({
  current,
  total,
  answered,
}: ProgressIndicatorProps) {
  const progress = (current / total) * 100

  return (
    <div className="space-y-2">
      {/* 진행률 텍스트 */}
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-muted-foreground">
          진행률
        </span>
        <span className="text-sm font-medium">
          {current} / {total}
        </span>
      </div>

      {/* 진행률 바 */}
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </div>
  )
}















