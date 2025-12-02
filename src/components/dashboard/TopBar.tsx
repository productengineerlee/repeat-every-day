import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '@/context'
import { getUserStreak } from '@/lib/api/dashboard'
import { Flame, Bell, User, Settings, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function TopBar() {
  const { user } = useAuth()
  const [streakCount, setStreakCount] = useState(0)
  const [loading, setLoading] = useState(true)

  // 관리자 이메일 목록
  const adminEmails = ['gtsu0707@gmail.com']
  const isAdmin = user?.email && adminEmails.includes(user.email)

  useEffect(() => {
    const fetchStreak = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const streak = await getUserStreak(user.id)
        setStreakCount(streak.streakCount)
      } catch (error) {
        console.error('Error fetching streak:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStreak()
  }, [user])

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b"
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* 좌측: 홈 버튼 */}
          <Link
            to="/dashboard"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            aria-label="홈"
          >
            <Button variant="ghost" size="sm" className="gap-2">
              <Home className="h-5 w-5" />
              <span className="hidden sm:inline">홈</span>
            </Button>
          </Link>

          {/* 중앙: 연속 학습일 */}
          <div className="flex items-center gap-2">
            {loading ? (
              <div className="w-16 h-6 bg-muted animate-pulse rounded" />
            ) : (
              <>
                <motion.div
                  animate={{
                    scale: streakCount > 0 ? [1, 1.2, 1] : 1,
                  }}
                  transition={{
                    duration: 0.5,
                    repeat: streakCount > 0 ? Infinity : 0,
                    repeatDelay: 2,
                  }}
                >
                  <Flame className="h-5 w-5 text-orange-500" />
                </motion.div>
                <span className="font-semibold text-lg">
                  {streakCount}일 연속
                </span>
              </>
            )}
          </div>

          {/* 우측: 관리자 링크, 알림, 마이페이지 */}
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Link to="/admin/question-input">
                <Button variant="outline" size="sm" className="gap-2">
                  <Settings className="h-4 w-4" />
                  Admin
                </Button>
              </Link>
            )}
            <button
              type="button"
              className="relative p-2 hover:bg-accent rounded-full transition-colors"
              aria-label="알림"
            >
              <Bell className="h-5 w-5" />
            </button>
            <Link
              to="/profile"
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              aria-label="마이페이지"
            >
              {user?.user_metadata?.avatar_url || user?.email ? (
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  {user.user_metadata?.avatar_url ? (
                    <img
                      src={user.user_metadata.avatar_url}
                      alt="프로필"
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-5 w-5 text-primary" />
                  )}
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
              )}
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  )
}








