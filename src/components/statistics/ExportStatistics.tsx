import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/context'
import {
  getDailyStatistics,
  getWeeklyStatistics,
  getMonthlyStatistics,
  comparePeriods,
  predictExamReadiness,
  type PeriodStatistics,
  type ComparisonResult,
  type ExamReadiness,
} from '@/lib/api/aggregation'
import {
  exportStatisticsToCSV,
  exportStatisticsReportToPDF,
  exportDailyActivityToCSV,
  exportAchievementsToCSV,
} from '@/lib/utils/export'
import { getDailyActivity } from '@/lib/api/statistics'
import { getUserAchievements } from '@/lib/api/achievements'
import { Download, FileText, FileSpreadsheet, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type ExportFormat = 'csv' | 'pdf'
type PeriodType = 'daily' | 'weekly' | 'monthly'

export default function ExportStatistics() {
  const { user } = useAuth()
  const [exporting, setExporting] = useState(false)
  const [exportType, setExportType] = useState<ExportFormat>('csv')
  const [periodType, setPeriodType] = useState<PeriodType>('monthly')

  const handleExport = async () => {
    if (!user || exporting) return

    try {
      setExporting(true)

      if (exportType === 'csv') {
        await handleCSVExport()
      } else {
        await handlePDFExport()
      }
    } catch (error) {
      console.error('Error exporting statistics:', error)
      alert('내보내기 중 오류가 발생했습니다.')
    } finally {
      setExporting(false)
    }
  }

  const handleCSVExport = async () => {
    if (!user) return

    if (periodType === 'daily') {
      const activities = await getDailyActivity(user.id, 30)
      exportDailyActivityToCSV(activities)
    } else {
      let stats: PeriodStatistics
      if (periodType === 'weekly') {
        stats = await getWeeklyStatistics(user.id)
      } else {
        stats = await getMonthlyStatistics(user.id)
      }
      exportStatisticsToCSV(stats)
    }
  }

  const handlePDFExport = async () => {
    if (!user) return

    let stats: PeriodStatistics
    if (periodType === 'daily') {
      stats = await getDailyStatistics(user.id)
    } else if (periodType === 'weekly') {
      stats = await getWeeklyStatistics(user.id)
    } else {
      stats = await getMonthlyStatistics(user.id)
    }

    // 비교 데이터 가져오기
    let comparison: ComparisonResult | undefined
    try {
      comparison = await comparePeriods(user.id, periodType)
    } catch (error) {
      console.error('Error getting comparison:', error)
    }

    // 시험 준비도 가져오기
    let examReadiness: ExamReadiness | undefined
    try {
      examReadiness = await predictExamReadiness(user.id)
    } catch (error) {
      console.error('Error predicting exam readiness:', error)
    }

    await exportStatisticsReportToPDF(stats, comparison, examReadiness)
  }

  const handleExportAchievements = async () => {
    if (!user || exporting) return

    try {
      setExporting(true)
      const achievements = await getUserAchievements(user.id)
      exportAchievementsToCSV(achievements)
    } catch (error) {
      console.error('Error exporting achievements:', error)
      alert('성취도 내보내기 중 오류가 발생했습니다.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-card border rounded-lg p-6 space-y-4"
    >
      <div>
        <h2 className="text-2xl font-bold mb-2">통계 내보내기</h2>
        <p className="text-muted-foreground text-sm">
          학습 통계를 CSV 또는 PDF 형식으로 다운로드하세요
        </p>
      </div>

      {/* 내보내기 형식 선택 */}
      <div className="space-y-2">
        <label className="text-sm font-medium">내보내기 형식</label>
        <div className="flex gap-2">
          <button
            onClick={() => setExportType('csv')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors',
              exportType === 'csv'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background hover:bg-muted'
            )}
          >
            <FileSpreadsheet className="h-4 w-4" />
            CSV
          </button>
          <button
            onClick={() => setExportType('pdf')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors',
              exportType === 'pdf'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background hover:bg-muted'
            )}
          >
            <FileText className="h-4 w-4" />
            PDF
          </button>
        </div>
      </div>

      {/* 기간 선택 */}
      <div className="space-y-2">
        <label className="text-sm font-medium">기간 선택</label>
        <div className="flex gap-2">
          {(['daily', 'weekly', 'monthly'] as PeriodType[]).map((period) => (
            <button
              key={period}
              onClick={() => setPeriodType(period)}
              className={cn(
                'px-4 py-2 rounded-lg border transition-colors',
                periodType === period
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background hover:bg-muted'
              )}
            >
              {period === 'daily' ? '일간' : period === 'weekly' ? '주간' : '월간'}
            </button>
          ))}
        </div>
      </div>

      {/* 내보내기 버튼 */}
      <div className="flex gap-2 pt-4 border-t">
        <Button
          onClick={handleExport}
          disabled={exporting}
          className="flex-1"
        >
          {exporting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              내보내는 중...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              통계 내보내기
            </>
          )}
        </Button>
        <Button
          onClick={handleExportAchievements}
          disabled={exporting}
          variant="outline"
        >
          {exporting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              내보내는 중...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              성취도 내보내기
            </>
          )}
        </Button>
      </div>

      {/* 안내 메시지 */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p>• CSV 형식: 엑셀 등에서 열어볼 수 있는 원시 데이터</p>
        <p>• PDF 형식: 차트와 요약이 포함된 리포트 형식</p>
        {exportType === 'pdf' && (
          <p className="text-yellow-600 dark:text-yellow-400">
            • PDF 내보내기는 차트 렌더링에 시간이 걸릴 수 있습니다.
          </p>
        )}
      </div>
    </motion.div>
  )
}













