import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/context'
import { getWeaknessAnalysis, type WeaknessAnalysis } from '@/lib/api/dashboard'
import { TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react'

export default function WeaknessAnalysis() {
  const { user } = useAuth()
  const [analysis, setAnalysis] = useState<WeaknessAnalysis[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAnalysis = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const data = await getWeaknessAnalysis(user.id)
        setAnalysis(data)
      } catch (error) {
        console.error('Error fetching weakness analysis:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalysis()
  }, [user])

  const getProgressText = (score: number): string => {
    if (score >= 80) return '우수합니다!'
    if (score >= 60) return '거의 다 왔어요!'
    if (score >= 40) return '계속 노력하세요!'
    return '더 집중이 필요해요'
  }

  const getTrendIcon = (trend: WeaknessAnalysis['trend']) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-600" />
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getTrendColor = (trend: WeaknessAnalysis['trend']) => {
    switch (trend) {
      case 'improving':
        return 'text-green-600 dark:text-green-400'
      case 'declining':
        return 'text-red-600 dark:text-red-400'
      default:
        return 'text-muted-foreground'
    }
  }

  if (loading) {
    return (
      <div className="bg-card border rounded-lg p-6 space-y-4">
        <div className="h-6 bg-muted animate-pulse rounded w-1/3" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </div>
    )
  }

  if (analysis.length === 0) {
    return (
      <div className="bg-card border rounded-lg p-6 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">
          아직 분석할 데이터가 없습니다.
          <br />
          진단 테스트를 완료하면 취약 영역 분석을 확인할 수 있습니다.
        </p>
      </div>
    )
  }

  // 가장 개선된 카테고리 (개선도 상위 3개)
  const mostImproved = analysis
    .filter((a) => a.improvement > 0)
    .slice(0, 3)

  // 가장 개선이 필요한 카테고리 (점수 낮은 순)
  const needsImprovement = [...analysis]
    .sort((a, b) => a.currentScore - b.currentScore)
    .slice(0, 3)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-card border rounded-lg p-6 space-y-6"
    >
      <div>
        <h2 className="text-2xl font-bold mb-2">취약 영역 분석</h2>
        <p className="text-muted-foreground">
          영역별 실력 변화를 확인하고 집중 학습하세요
        </p>
      </div>

      {/* 영역별 진행률 바 */}
      <div className="space-y-4">
        {analysis.map((item, index) => {
          const progressText = getProgressText(item.currentScore)

          return (
            <motion.div
              key={item.category}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{item.category}</span>
                  {getTrendIcon(item.trend)}
                  {item.improvement !== 0 && (
                    <span
                      className={`text-sm font-medium ${getTrendColor(item.trend)}`}
                    >
                      {item.improvement > 0 ? '+' : ''}
                      {item.improvement.toFixed(1)}점
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <span className="font-bold text-lg">{item.currentScore}점</span>
                  <p className="text-xs text-muted-foreground">{progressText}</p>
                </div>
              </div>
              <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className={`h-full ${
                    item.currentScore >= 80
                      ? 'bg-green-500'
                      : item.currentScore >= 60
                      ? 'bg-primary'
                      : item.currentScore >= 40
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${item.currentScore}%` }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                />
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* 가장 개선된 영역 */}
      {mostImproved.length > 0 && (
        <div className="pt-4 border-t">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            가장 개선된 영역
          </h3>
          <div className="flex flex-wrap gap-2">
            {mostImproved.map((item) => (
              <span
                key={item.category}
                className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-full text-sm font-medium"
              >
                {item.category} (+{item.improvement.toFixed(1)}점)
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 개선이 필요한 영역 */}
      {needsImprovement.length > 0 && (
        <div className="pt-4 border-t">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            집중 학습이 필요한 영역
          </h3>
          <div className="flex flex-wrap gap-2">
            {needsImprovement.map((item) => (
              <span
                key={item.category}
                className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded-full text-sm font-medium"
              >
                {item.category} ({item.currentScore}점)
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}













