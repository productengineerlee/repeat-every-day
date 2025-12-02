import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '@/context'
import { getWrongAnswers, type WrongAnswerWithQuestion } from '@/lib/api/wrongAnswers'
import { scheduleReviewNotifications } from '@/lib/utils/notifications'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import ReviewBadge from './ReviewBadge'
import type { WrongAnswerTab } from './WrongAnswerTabs'
import { Search, ArrowUpDown } from 'lucide-react'
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

  // 고유 카테고리 목록
  const uniqueCategories = useMemo(() => {
    const categories = new Set<string>()
    wrongAnswers.forEach((item) => {
      if (item.question?.category) {
        categories.add(item.question.category)
      }
    })
    return Array.from(categories).sort()
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
          {category === 'today'
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
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="카테고리" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                {uniqueCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
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
        <div className="space-y-4">
          {filteredAndSorted.map((item) => (
            <div
              key={item.id}
              className="p-4 border rounded-lg hover:bg-accent transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium line-clamp-2">
                    {item.question?.content || '문제 내용'}
                  </p>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <p className="text-sm text-muted-foreground">
                      틀린 횟수: {item.wrongCount}회
                    </p>
                    {item.question?.category && (
                      <span className="text-xs px-2 py-0.5 bg-muted rounded">
                        {item.question.category}
                      </span>
                    )}
                    {item.question?.difficulty && (
                      <span className="text-xs px-2 py-0.5 bg-muted rounded">
                        난이도: {item.question.difficulty}/5
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
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

