import { useAuth } from '@/context'
import { Button } from '@/components/ui/button'
import { User as UserIcon, Bell, BookOpen } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import NotificationSettings from '@/components/settings/NotificationSettings'
import DailyQuestionSettings from '@/components/settings/DailyQuestionSettings'
import UserInfoSettings from '@/components/settings/UserInfoSettings'
import { cn } from '@/lib/utils'

type ProfileTab = 'user-info' | 'daily-settings' | 'notifications'

export default function Profile() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<ProfileTab>('user-info')

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">로그인이 필요합니다.</p>
          <Button onClick={() => navigate('/login')}>로그인</Button>
        </div>
      </div>
    )
  }

  const menuItems = [
    {
      id: 'user-info' as ProfileTab,
      label: '회원정보수정',
      icon: UserIcon,
    },
    {
      id: 'daily-settings' as ProfileTab,
      label: '학습설정',
      icon: BookOpen,
    },
    {
      id: 'notifications' as ProfileTab,
      label: '알림설정',
      icon: Bell,
    },
  ]

  const renderContent = () => {
    switch (activeTab) {
      case 'user-info':
        return <UserInfoSettings />
      case 'daily-settings':
        return <DailyQuestionSettings />
      case 'notifications':
        return <NotificationSettings />
      default:
        return <UserInfoSettings />
    }
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* 좌측 사이드바 */}
      <aside className="w-64 bg-card border-r border-border flex flex-col">
        {/* 헤더 */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <UserIcon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold">프로필</h2>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
        </div>

        {/* 메뉴 */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const active = activeTab === item.id
            return (
              <Button
                key={item.id}
                variant={active ? 'default' : 'ghost'}
                className={cn(
                  'w-full justify-start gap-3',
                  active && 'bg-primary text-primary-foreground'
                )}
                onClick={() => setActiveTab(item.id)}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Button>
            )
          })}
        </nav>
      </aside>

      {/* 메인 컨텐츠 영역 */}
      <main className="flex-1 overflow-auto">
        <div className="px-4 py-8 max-w-4xl">
          <div className="bg-card border rounded-lg overflow-hidden">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  )
}

