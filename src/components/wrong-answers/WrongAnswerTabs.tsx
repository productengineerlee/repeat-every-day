import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import WrongAnswerList from './WrongAnswerList'

export type WrongAnswerTab = 'all' | 'today' | 'review' | 'graduated'

interface WrongAnswerTabsProps {
  onTabChange?: (tab: WrongAnswerTab) => void
}

export default function WrongAnswerTabs({
  onTabChange,
}: WrongAnswerTabsProps) {
  const [activeTab, setActiveTab] = useState<WrongAnswerTab>('all')

  const handleTabChange = (value: string) => {
    const tab = value as WrongAnswerTab
    setActiveTab(tab)
    onTabChange?.(tab)
  }

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="all">전체</TabsTrigger>
        <TabsTrigger value="today">오늘</TabsTrigger>
        <TabsTrigger value="review">복습</TabsTrigger>
        <TabsTrigger value="graduated">졸업</TabsTrigger>
      </TabsList>

      <TabsContent value="all" className="mt-4">
        <WrongAnswerList category="all" />
      </TabsContent>

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















