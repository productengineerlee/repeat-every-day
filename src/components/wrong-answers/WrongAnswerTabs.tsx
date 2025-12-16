import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import WrongAnswerList from './WrongAnswerList'

export type WrongAnswerTab = 'today' | 'review' | 'graduated'

interface WrongAnswerTabsProps {
  onTabChange?: (tab: WrongAnswerTab) => void
}

export default function WrongAnswerTabs({
  onTabChange,
}: WrongAnswerTabsProps) {
  const [activeTab, setActiveTab] = useState<WrongAnswerTab>('today')

  const handleTabChange = (value: string) => {
    const tab = value as WrongAnswerTab
    setActiveTab(tab)
    onTabChange?.(tab)
  }

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="today">오늘의 오답</TabsTrigger>
        <TabsTrigger value="review">복습 알림</TabsTrigger>
        <TabsTrigger value="graduated">졸업</TabsTrigger>
      </TabsList>

      <TabsContent value="today" className="mt-4">
        <WrongAnswerList category="today" />
      </TabsContent>

      <TabsContent value="review" className="mt-4">
        <WrongAnswerList category="review" />
      </TabsContent>

      <TabsContent value="graduated" className="mt-4">
        <WrongAnswerList category="graduated" />
      </TabsContent>
    </Tabs>
  )
}















