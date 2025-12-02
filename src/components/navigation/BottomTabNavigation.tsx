import { useLocation, useNavigate } from 'react-router-dom'
import { Home, BookOpen, Camera, FileX, User } from 'lucide-react'
import { motion } from 'framer-motion'

interface TabItem {
  path: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const tabs: TabItem[] = [
  { path: '/dashboard', label: '홈', icon: Home },
  { path: '/learning', label: '학습', icon: BookOpen },
  { path: '/camera', label: '카메라', icon: Camera },
  { path: '/wrong-answers', label: '오답노트', icon: FileX },
  { path: '/profile', label: '마이페이지', icon: User },
]

export default function BottomTabNavigation() {
  const location = useLocation()
  const navigate = useNavigate()

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/' || location.pathname === '/dashboard'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <motion.nav
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t"
    >
      <div className="container mx-auto px-2">
        <div className="flex items-center justify-around h-16">
          {tabs.map((tab) => {
            const active = isActive(tab.path)
            const Icon = tab.icon

            return (
              <button
                key={tab.path}
                type="button"
                onClick={() => navigate(tab.path)}
                className={`
                  flex flex-col items-center justify-center gap-1 flex-1 h-full
                  transition-colors relative
                  ${active ? 'text-primary' : 'text-muted-foreground'}
                  hover:text-foreground
                `}
                aria-label={tab.label}
                aria-current={active ? 'page' : undefined}
              >
                {active && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute top-0 left-0 right-0 h-1 bg-primary rounded-b-full"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
                <Icon className={`h-5 w-5 ${active ? 'scale-110' : ''} transition-transform`} />
                <span className="text-xs font-medium">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </motion.nav>
  )
}








