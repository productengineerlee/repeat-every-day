import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '@/context'
import { getWrongAnswers, markReviewComplete, type WrongAnswerWithQuestion } from '@/lib/api/wrongAnswers'
import { scheduleReviewNotifications } from '@/lib/utils/notifications'
import { formatCategoryDisplay } from '@/lib/utils/categoryFormatter'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Card } from '@/components/ui/card'
import ReviewBadge from './ReviewBadge'
import type { WrongAnswerTab } from './WrongAnswerTabs'
import { Search, ArrowUpDown, Trophy, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface WrongAnswerListProps {
  category: WrongAnswerTab
}

type SortOption = 'reviewDate' | 'wrongCount' | 'category' | 'difficulty'
type SortOrder = 'asc' | 'desc'

export default function WrongAnswerList({ category }: WrongAnswerListProps) {
  const { user } = useAuth()
  const [wrongAnswers, setWrongAnswers] = useState<WrongAnswerWithQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<SortOption>('reviewDate')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  const [expandedId, setExpandedId] = useState<string>('')
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({})
  const [showResults, setShowResults] = useState<Record<string, boolean>>({})
  const [isSubmitting, setIsSubmitting] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const fetchWrongAnswers = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const data = await getWrongAnswers(user.id, category)
        setWrongAnswers(data)

        // 복습 알림 스케줄링 (복습 탭인 경우)
        if (category === 'review' && data.length > 0) {
          scheduleReviewNotifications(
            data.map((item) => ({
              id: item.id,
              nextReviewDate: item.nextReviewDate?.toString() || '',
            }))
          )
        }
      } catch (error) {
        console.error('Error fetching wrong answers:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchWrongAnswers()
  }, [user, category])

  // 고유 카테고리 목록 (코드 -> 표시명 매핑)
  const uniqueCategories = useMemo(() => {
    const categoryMap = new Map<string, string>()
    wrongAnswers.forEach((item) => {
      if (item.question?.category && item.question?.certificationType) {
        const code = item.question.category
        const displayName = formatCategoryDisplay(
          item.question.certificationType,
          code
        )
        categoryMap.set(code, displayName)
      }
    })
    // 코드를 키로, 표시명을 값으로 하는 배열 반환
    return Array.from(categoryMap.entries()).sort((a, b) => 
      a[1].localeCompare(b[1])
    )
  }, [wrongAnswers])

  // 필터링 및 정렬
  const filteredAndSorted = useMemo(() => {
    let filtered = [...wrongAnswers]

    // 검색 필터
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (item) =>
          item.question?.content?.toLowerCase().includes(query) ||
          item.question?.category?.toLowerCase().includes(query)
      )
    }

    // 카테고리 필터
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(
        (item) => item.question?.category === categoryFilter
      )
    }

    // 정렬
    filtered.sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case 'reviewDate': {
          const dateA = a.nextReviewDate
            ? new Date(a.nextReviewDate).getTime()
            : 0
          const dateB = b.nextReviewDate
            ? new Date(b.nextReviewDate).getTime()
            : 0
          comparison = dateA - dateB
          break
        }

        case 'wrongCount':
          comparison = a.wrongCount - b.wrongCount
          break

        case 'category':
          comparison =
            (a.question?.category || '').localeCompare(
              b.question?.category || ''
            )
          break

        case 'difficulty': {
          comparison =
            (a.question?.difficulty || 0) - (b.question?.difficulty || 0)
          break
        }

        default:
          comparison = 0
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })

    return filtered
  }, [wrongAnswers, searchQuery, categoryFilter, sortBy, sortOrder])

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
  }

  const handleAnswerSelect = (itemId: string, answer: string) => {
    if (showResults[itemId]) return
    setSelectedAnswers({ ...selectedAnswers, [itemId]: answer })
  }

  const handleSubmit = async (item: WrongAnswerWithQuestion) => {
    if (!user || !item.question) return
    const itemId = item.id
    const selectedAnswer = selectedAnswers[itemId]
    if (!selectedAnswer) return

    // 정답 비교
    const correctAnswer = item.question.correctAnswer
    const isCorrect = selectedAnswer === correctAnswer

    setShowResults({ ...showResults, [itemId]: true })
    setIsSubmitting({ ...isSubmitting, [itemId]: true })

    try {
      const result = await markReviewComplete(
        user.id,
        item.question.id,
        isCorrect
      )

      if (result.graduated) {
        alert('🎉 축하합니다! 이 문제를 완전히 마스터했습니다!')
      }
    } catch (error) {
      console.error('Error marking review complete:', error)
    } finally {
      setIsSubmitting({ ...isSubmitting, [itemId]: false })
    }
  }

  const handleClose = (itemId: string) => {
    // 해당 아이템의 상태 초기화
    const newSelectedAnswers = { ...selectedAnswers }
    const newShowResults = { ...showResults }
    const newIsSubmitting = { ...isSubmitting }
    
    delete newSelectedAnswers[itemId]
    delete newShowResults[itemId]
    delete newIsSubmitting[itemId]
    
    setSelectedAnswers(newSelectedAnswers)
    setShowResults(newShowResults)
    setIsSubmitting(newIsSubmitting)
    
    // 아코디언 접기
    setExpandedId('')
    
    // 목록 새로고침
    refreshList()
  }

  const refreshList = async () => {
    if (!user) return

    try {
      setLoading(true)
      const data = await getWrongAnswers(user.id, category)
      setWrongAnswers(data)
      // 상태 초기화
      setExpandedId('')
      setSelectedAnswers({})
      setShowResults({})
      setIsSubmitting({})
    } catch (error) {
      console.error('Error refreshing wrong answers:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    )
  }

  if (wrongAnswers.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          {category === 'all'
            ? '틀린 문제가 없습니다.'
            : category === 'today'
            ? '오늘 틀린 문제가 없습니다.'
            : category === 'review'
            ? '복습할 문제가 없습니다.'
            : '졸업한 문제가 없습니다.'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 검색 및 필터 */}
      <div className="space-y-3">
        {/* 검색 입력 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="문제 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* 필터 및 정렬 */}
        <div className="flex gap-2 flex-wrap">
          {/* 카테고리 필터 */}
          {uniqueCategories.length > 0 && (
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="카테고리" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                {uniqueCategories.map(([code, displayName]) => (
                  <SelectItem key={code} value={code}>
                    {displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* 정렬 옵션 */}
          <Select
            value={sortBy}
            onValueChange={(value) => setSortBy(value as SortOption)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="정렬 기준" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="reviewDate">복습일</SelectItem>
              <SelectItem value="wrongCount">틀린 횟수</SelectItem>
              <SelectItem value="category">카테고리</SelectItem>
              <SelectItem value="difficulty">난이도</SelectItem>
            </SelectContent>
          </Select>

          {/* 정렬 순서 토글 */}
          <Button
            variant="outline"
            size="icon"
            onClick={toggleSortOrder}
            aria-label="정렬 순서 변경"
          >
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 결과 개수 */}
      {searchQuery || categoryFilter !== 'all' ? (
        <p className="text-sm text-muted-foreground">
          {filteredAndSorted.length}개의 결과
        </p>
      ) : null}

      {/* 오답 목록 */}
      {filteredAndSorted.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">검색 결과가 없습니다.</p>
        </div>
      ) : (
        <Accordion
          type="single"
          collapsible
          value={expandedId}
          onValueChange={setExpandedId}
          className="space-y-4"
        >
          {filteredAndSorted.map((item) => {
            const itemId = item.id
            const selectedAnswer = selectedAnswers[itemId]
            const showResult = showResults[itemId]
            const isCorrect = selectedAnswer === item.question?.correctAnswer
            const optionLabels = ['①', '②', '③', '④', '⑤']

            return (
              <AccordionItem
                key={itemId}
                value={itemId}
                className="border rounded-lg"
              >
                <AccordionTrigger className="p-4 hover:no-underline hover:bg-accent">
                  <div className="flex items-start justify-between gap-4 w-full">
                    <div className="flex-1 min-w-0 text-left">
                      <p className="font-medium line-clamp-2">
                        {item.question?.content || '문제 내용'}
                      </p>
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <p className="text-sm text-muted-foreground">
                          틀린 횟수: {item.wrongCount}회
                        </p>
                        {/* 졸업 진행 표시 */}
                        {item.consecutiveCorrect !== undefined && !item.graduated && (
                          <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200">
                            연속 정답: {item.consecutiveCorrect}/5
                          </span>
                        )}
                        {item.graduated && (
                          <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-green-50 text-green-700 rounded border border-green-200">
                            <Trophy className="h-3 w-3" />
                            졸업
                          </span>
                        )}
                        {item.question?.category && item.question?.certificationType && (
                          <span className="text-xs px-2 py-0.5 bg-muted rounded">
                            {formatCategoryDisplay(item.question.certificationType, item.question.category)}
                          </span>
                        )}
                        {item.question?.difficulty && (
                          <span className="text-xs px-2 py-0.5 bg-muted rounded">
                            난이도: {item.question.difficulty}
                          </span>
                        )}
                      </div>
                    </div>
                    {item.nextReviewDate && category === 'review' && (
                      <div className="flex-shrink-0">
                        <ReviewBadge nextReviewDate={item.nextReviewDate} />
                      </div>
                    )}
                  </div>
                </AccordionTrigger>

                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-4 pt-2">
                    {/* 진행 상황 바 */}
                    {item.consecutiveCorrect !== undefined && item.consecutiveCorrect < 5 && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>졸업까지</span>
                          <span>{5 - item.consecutiveCorrect}번 남음</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${(item.consecutiveCorrect / 5) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* 선택지 */}
                    <div className="space-y-2">
                      {item.question?.options.map((option, index) => {
                        const label = optionLabels[index]
                        const isSelected = selectedAnswer === label
                        
                        // 정답 확인 - correctAnswer는 이제 항상 ①②③④⑤ 형식
                        const correctAnswer = item.question?.correctAnswer || ''
                        const isCorrectAnswer = correctAnswer === label

                        let borderColor = 'border-border'
                        let bgColor = 'bg-card hover:bg-accent'
                        let textColor = ''

                        if (showResult) {
                          if (isCorrectAnswer) {
                            borderColor = 'border-green-500'
                            bgColor = 'bg-green-50'
                            textColor = 'text-green-700'
                          } else if (isSelected) {
                            borderColor = 'border-red-500'
                            bgColor = 'bg-red-50'
                            textColor = 'text-red-700'
                          }
                        } else if (isSelected) {
                          borderColor = 'border-primary'
                          bgColor = 'bg-primary/5'
                        }

                        return (
                          <button
                            key={index}
                            onClick={() => handleAnswerSelect(itemId, label)}
                            disabled={showResult}
                            className={`w-full p-3 rounded-lg border-2 ${borderColor} ${bgColor} ${textColor} text-left transition-all disabled:cursor-not-allowed`}
                          >
                            <div className="flex items-start gap-2">
                              {/* 라디오 버튼 */}
                              <div className="flex-shrink-0 mt-0.5">
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                  isSelected ? 'border-primary' : 'border-muted-foreground'
                                }`}>
                                  {isSelected && (
                                    <div className="w-3 h-3 rounded-full bg-primary" />
                                  )}
                                </div>
                              </div>
                              {/* 선택지 텍스트 (이미 ① 포함) */}
                              <span className="flex-1">{option}</span>
                              {showResult && isCorrectAnswer && (
                                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                              )}
                              {showResult && isSelected && !isCorrectAnswer && (
                                <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                              )}
                            </div>
                          </button>
                        )
                      })}
                    </div>

                    {/* 해설 (결과 표시 후) */}
                    {showResult && item.question?.explanation && (
                      <Card className="p-4 bg-muted/50">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">해설</span>
                            {isCorrect ? (
                              <span className="text-green-600 text-sm">정답입니다! 👏</span>
                            ) : (
                              <span className="text-red-600 text-sm">다시 한 번 도전해보세요!</span>
                            )}
                          </div>
                          <p className="text-sm leading-relaxed whitespace-pre-wrap text-left">
                            {item.question.explanation}
                          </p>
                        </div>
                      </Card>
                    )}

                    {/* 버튼 */}
                    <div className="flex justify-end gap-2">
                      {showResult ? (
                        <Button onClick={() => handleClose(itemId)}>
                          닫기
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleSubmit(item)}
                          disabled={!selectedAnswer || isSubmitting[itemId]}
                        >
                          {isSubmitting[itemId] ? '제출 중...' : '제출'}
                        </Button>
                      )}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
      )}
    </div>
  )
}

