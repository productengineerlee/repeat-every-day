import { motion } from 'framer-motion'
import { BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'

interface ReviewButtonProps {
  reviewCount: number
}

export default function ReviewButton({ reviewCount }: ReviewButtonProps) {
  const navigate = useNavigate()

  if (reviewCount === 0) {
    return null
  }

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="fixed bottom-24 right-4 z-50"
    >
      <Button
        size="lg"
        className="rounded-full shadow-lg h-14 px-6 gap-2"
        onClick={() => navigate('/review')}
      >
        <BookOpen className="h-5 w-5" />
        <span className="font-semibold">복습 시작</span>
        {reviewCount > 0 && (
          <span className="bg-background text-foreground rounded-full px-2 py-0.5 text-xs font-bold min-w-[24px]">
            {reviewCount}
          </span>
        )}
      </Button>
    </motion.div>
  )
}













