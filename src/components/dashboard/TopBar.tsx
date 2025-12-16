import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '@/context'
import { User } from 'lucide-react'

export default function TopBar() {
  const { user } = useAuth()

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b"
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* 좌측: certiQ 로고 */}
          <Link to="/dashboard">
            <h1 className="text-xl font-bold">certiQ</h1>
          </Link>

          {/* 우측: 마이페이지 */}
          <div className="flex items-center gap-2">
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








