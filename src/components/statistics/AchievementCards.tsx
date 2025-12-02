import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/context'
import {
  getAllAchievements,
  getUserAchievements,
  checkAndUpdateAchievements,
  getAchievementIcon,
  type Achievement,
  type UserAchievement,
} from '@/lib/api/achievements'
import { Award, Lock, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

const RARITY_COLORS = {
  common: 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700',
  rare: 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700',
  epic: 'bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700',
  legendary: 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-400 dark:border-yellow-600',
}

const RARITY_TEXT_COLORS = {
  common: 'text-gray-700 dark:text-gray-300',
  rare: 'text-blue-700 dark:text-blue-300',
  epic: 'text-purple-700 dark:text-purple-300',
  legendary: 'text-yellow-700 dark:text-yellow-300',
}

const CATEGORY_LABELS = {
  streak: '연속 학습',
  accuracy: '정확도',
  completion: '완료',
  speed: '속도',
  mastery: '마스터리',
}

export default function AchievementCards() {
  const { user } = useAuth()
  const [allAchievements, setAllAchievements] = useState<Achievement[]>([])
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([])
  const [loading, setLoading] = useState(true)
  const [newlyUnlocked, setNewlyUnlocked] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const [achievements, userAchievementsData] = await Promise.all([
          getAllAchievements(),
          getUserAchievements(user.id),
        ])

        setAllAchievements(achievements)
        setUserAchievements(userAchievementsData)

        // Achievement 진행도 체크 및 업데이트
        const { unlocked } = await checkAndUpdateAchievements(user.id)
        if (unlocked.length > 0) {
          setNewlyUnlocked(unlocked)
          // 업데이트 후 다시 가져오기
          const updated = await getUserAchievements(user.id)
          setUserAchievements(updated)
        }
      } catch (error) {
        console.error('Error fetching achievements:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user])

  // Achievement 맵 생성 (userAchievements와 allAchievements 결합)
  const achievementMap = new Map<string, UserAchievement>()
  userAchievements.forEach((ua) => {
    achievementMap.set(ua.achievement.code, ua)
  })

  // 카테고리별로 그룹화
  const achievementsByCategory = allAchievements.reduce(
    (acc, achievement) => {
      if (!acc[achievement.category]) {
        acc[achievement.category] = []
      }
      acc[achievement.category].push(achievement)
      return acc
    },
    {} as Record<string, Achievement[]>
  )

  const categories = Object.keys(achievementsByCategory)

  // 필터링된 Achievement 목록
  const displayedAchievements = selectedCategory
    ? achievementsByCategory[selectedCategory] || []
    : allAchievements

  // 통계 계산
  const totalAchievements = allAchievements.length
  const unlockedCount = userAchievements.filter((ua) => ua.unlockedAt).length
  const completionRate = totalAchievements > 0 ? Math.round((unlockedCount / totalAchievements) * 100) : 0

  if (loading) {
    return (
      <div className="bg-card border rounded-lg p-6">
        <div className="h-6 bg-muted animate-pulse rounded w-1/3 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-card border rounded-lg p-6 space-y-6"
    >
      {/* 헤더 */}
      <div>
        <h2 className="text-2xl font-bold mb-2">성취도</h2>
        <p className="text-muted-foreground text-sm">
          학습 목표를 달성하고 배지를 획득하세요
        </p>
      </div>

      {/* 통계 요약 */}
      <div className="grid grid-cols-3 gap-4 pb-4 border-b">
        <div className="text-center">
          <p className="text-2xl font-bold">{unlockedCount}</p>
          <p className="text-xs text-muted-foreground">달성</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold">{totalAchievements}</p>
          <p className="text-xs text-muted-foreground">전체</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold">{completionRate}%</p>
          <p className="text-xs text-muted-foreground">완료율</p>
        </div>
      </div>

      {/* 카테고리 필터 */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory(null)}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            selectedCategory === null
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted hover:bg-muted/80'
          )}
        >
          전체
        </button>
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              selectedCategory === category
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80'
            )}
          >
            {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] || category}
          </button>
        ))}
      </div>

      {/* Achievement 카드 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {displayedAchievements.map((achievement, index) => {
            const userAchievement = achievementMap.get(achievement.code)
            const isUnlocked = !!userAchievement?.unlockedAt
            const progress = userAchievement?.progress || 0
            const isNewlyUnlocked = newlyUnlocked.includes(achievement.code)

            const IconComponent = getAchievementIcon(achievement.icon)

            return (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className={cn(
                  'relative p-4 border-2 rounded-lg transition-all',
                  RARITY_COLORS[achievement.rarity],
                  isUnlocked ? 'opacity-100' : 'opacity-60',
                  isNewlyUnlocked && 'ring-4 ring-yellow-400 dark:ring-yellow-500'
                )}
              >
                {/* 새로 달성 애니메이션 */}
                {isNewlyUnlocked && (
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    className="absolute -top-2 -right-2 z-10"
                  >
                    <Sparkles className="h-6 w-6 text-yellow-500 fill-yellow-500" />
                  </motion.div>
                )}

                {/* 아이콘 */}
                <div className="flex items-start justify-between mb-3">
                  <div className={cn('p-3 rounded-lg', isUnlocked ? 'bg-background' : 'bg-muted')}>
                    {isUnlocked ? (
                      <IconComponent className={cn('h-6 w-6', RARITY_TEXT_COLORS[achievement.rarity])} />
                    ) : (
                      <Lock className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <span className={cn('text-xs font-semibold px-2 py-1 rounded', RARITY_TEXT_COLORS[achievement.rarity])}>
                    {achievement.rarity.toUpperCase()}
                  </span>
                </div>

                {/* 제목 및 설명 */}
                <div className="mb-3">
                  <h3 className={cn('font-semibold mb-1', isUnlocked ? RARITY_TEXT_COLORS[achievement.rarity] : 'text-muted-foreground')}>
                    {achievement.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">{achievement.description}</p>
                </div>

                {/* 진행도 바 */}
                {!isUnlocked && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">진행도</span>
                      <span className="font-medium">{progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className={cn('h-full', RARITY_COLORS[achievement.rarity].split(' ')[0])}
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5, delay: index * 0.05 }}
                      />
                    </div>
                  </div>
                )}

                {/* 달성 날짜 */}
                {isUnlocked && userAchievement?.unlockedAt && (
                  <div className="text-xs text-muted-foreground mt-2">
                    달성일: {new Date(userAchievement.unlockedAt).toLocaleDateString('ko-KR')}
                  </div>
                )}
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* 빈 상태 */}
      {displayedAchievements.length === 0 && (
        <div className="text-center py-12">
          <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">표시할 성취도가 없습니다.</p>
        </div>
      )}
    </motion.div>
  )
}








