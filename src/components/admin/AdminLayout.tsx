import { ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { FileText, List, LayoutDashboard } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AdminLayoutProps {
  children: ReactNode
  title?: string
  description?: string
}

export default function AdminLayout({ children, title, description }: AdminLayoutProps) {
  const navigate = useNavigate()
  const location = useLocation()

  const menuItems = [
    {
      label: '문제 입력',
      path: '/admin/question-input',
      icon: FileText,
    },
    {
      label: '문제 목록',
      path: '/admin/questions',
      icon: List,
    },
  ]

  const isActive = (path: string) => {
    if (path === '/admin/question-input') {
      return location.pathname === '/admin/question-input'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* 좌측 사이드바 */}
      <aside className="w-64 bg-card border-r border-border flex flex-col">
        {/* 로고/헤더 */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="h-6 w-6 text-primary" />
            <h2 className="text-lg font-bold">관리자</h2>
          </div>
        </div>

        {/* 메뉴 */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.path)
            return (
              <Button
                key={item.path}
                variant={active ? 'default' : 'ghost'}
                className={cn(
                  'w-full justify-start gap-3',
                  active && 'bg-primary text-primary-foreground'
                )}
                onClick={() => navigate(item.path)}
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
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {title && (
            <div className="mb-6">
              <h1 className="text-2xl font-bold">{title}</h1>
              {description && (
                <p className="text-sm text-muted-foreground mt-1">{description}</p>
              )}
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  )
}

