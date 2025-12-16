import { useState, useEffect } from 'react'
import { useAuth } from '@/context'
import WrongAnswerTabs from '@/components/wrong-answers/WrongAnswerTabs'
import ReviewButton from '@/components/wrong-answers/ReviewButton'
import { getWrongAnswers } from '@/lib/api/wrongAnswers'

export default function WrongAnswers() {
  const { user } = useAuth()
  const [reviewCount, setReviewCount] = useState(0)

  useEffect(() => {
    const loadReviewCount = async () => {
      if (!user) return

      try {
        const items = await getWrongAnswers(user.id, 'review')
        setReviewCount(items.length)
      } catch (error) {
        console.error('Error loading review count:', error)
      }
    }

    loadReviewCount()
  }, [user])

  return (
    <div className="min-h-screen">
      <div className="container mx-auto p-4 pb-24 pt-10">
        <h1 className="text-3xl font-bold mb-6">오답 노트</h1>
        <WrongAnswerTabs />
      </div>
      <ReviewButton reviewCount={reviewCount} />
    </div>
  )
}

