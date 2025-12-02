/**
 * Export Utilities
 * 
 * 통계 데이터를 PDF 및 CSV 형식으로 내보내는 유틸리티 함수들
 */

import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import type { PeriodStatistics, ComparisonResult, ExamReadiness } from '../api/aggregation'
import type { DailyActivity } from '../api/statistics'
import type { UserAchievement } from '../api/achievements'

/**
 * CSV 내보내기
 */
export function exportToCSV(
  data: Record<string, string | number>[],
  filename: string = `statistics-${format(new Date(), 'yyyy-MM-dd')}.csv`
): void {
  if (data.length === 0) {
    alert('내보낼 데이터가 없습니다.')
    return
  }

  // 헤더 생성
  const headers = Object.keys(data[0])
  const csvHeaders = headers.join(',')

  // 데이터 행 생성
  const csvRows = data.map((row) =>
    headers
      .map((header) => {
        const value = row[header]
        // 값에 쉼표나 따옴표가 있으면 따옴표로 감싸기
        if (value === null || value === undefined) return ''
        const stringValue = String(value)
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`
        }
        return stringValue
      })
      .join(',')
  )

  // CSV 내용 생성
  const csvContent = [csvHeaders, ...csvRows].join('\n')

  // BOM 추가 (한글 깨짐 방지)
  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })

  // 다운로드
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * 일일 활동 데이터를 CSV로 내보내기
 */
export function exportDailyActivityToCSV(activities: DailyActivity[]): void {
  const csvData = activities.map((activity) => ({
    날짜: format(new Date(activity.date), 'yyyy-MM-dd', { locale: ko }),
    '문제 수': activity.count,
    '정답 수': activity.correctCount,
    '정답률 (%)': activity.accuracy,
  }))

  exportToCSV(csvData, `daily-activity-${format(new Date(), 'yyyy-MM-dd')}.csv`)
}

/**
 * 통계 데이터를 CSV로 내보내기
 */
export function exportStatisticsToCSV(stats: PeriodStatistics): void {
  const csvData = [
    {
      구분: '기간',
      값: `${format(new Date(stats.startDate), 'yyyy-MM-dd', { locale: ko })} ~ ${format(new Date(stats.endDate), 'yyyy-MM-dd', { locale: ko })}`,
    },
    {
      구분: '총 문제 수',
      값: stats.totalQuestions,
    },
    {
      구분: '정답 수',
      값: stats.correctAnswers,
    },
    {
      구분: '정답률 (%)',
      값: stats.accuracy,
    },
    {
      구분: '평균 소요 시간 (초)',
      값: stats.averageTimeSpent,
    },
    ...stats.categories.map((cat) => ({
      구분: `카테고리: ${cat.category}`,
      값: `${cat.count}문제, 정답률 ${cat.accuracy}%`,
    })),
  ]

  exportToCSV(csvData, `statistics-${stats.period}-${format(new Date(), 'yyyy-MM-dd')}.csv`)
}

/**
 * 성취도 데이터를 CSV로 내보내기
 */
export function exportAchievementsToCSV(achievements: UserAchievement[]): void {
  const csvData = achievements.map((achievement) => ({
    '성취도 이름': achievement.achievement.name,
    '카테고리': achievement.achievement.category,
    '희귀도': achievement.achievement.rarity,
    '진행도 (%)': achievement.progress,
    '달성 여부': achievement.unlockedAt ? '달성' : '미달성',
    '달성일': achievement.unlockedAt
      ? format(new Date(achievement.unlockedAt), 'yyyy-MM-dd', { locale: ko })
      : '-',
  }))

  exportToCSV(csvData, `achievements-${format(new Date(), 'yyyy-MM-dd')}.csv`)
}

/**
 * PDF 내보내기 (간단한 텍스트 기반)
 * 차트가 포함된 PDF는 html2canvas와 jspdf를 사용하여 구현
 */
export async function exportToPDF(
  title: string,
  content: {
    sections: {
      title: string
      content: string | string[]
    }[]
    charts?: {
      elementId: string
      title: string
    }[]
  },
  filename: string = `report-${format(new Date(), 'yyyy-MM-dd')}.pdf`
): Promise<void> {
  try {
    // 동적 import로 jspdf와 html2canvas 로드
    const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
      import('jspdf'),
      import('html2canvas'),
    ])

    const doc = new jsPDF()
    let yPosition = 20

    // 제목 추가
    doc.setFontSize(18)
    doc.text(title, 14, yPosition)
    yPosition += 10

    // 섹션 추가
    content.sections.forEach((section) => {
      doc.setFontSize(14)
      doc.text(section.title, 14, yPosition)
      yPosition += 8

      doc.setFontSize(11)
      const contentArray = Array.isArray(section.content) ? section.content : [section.content]
      contentArray.forEach((line) => {
        if (yPosition > 280) {
          doc.addPage()
          yPosition = 20
        }
        doc.text(line, 14, yPosition)
        yPosition += 7
      })
      yPosition += 5
    })

    // 차트 추가 (있는 경우)
    if (content.charts && content.charts.length > 0) {
      for (const chart of content.charts) {
        const element = document.getElementById(chart.elementId)
        if (element) {
          try {
            const canvas = await html2canvas(element, {
              scale: 2,
              useCORS: true,
            })
            const imgData = canvas.toDataURL('image/png')

            if (yPosition > 200) {
              doc.addPage()
              yPosition = 20
            }

            doc.setFontSize(12)
            doc.text(chart.title, 14, yPosition)
            yPosition += 8

            const imgWidth = 180
            const imgHeight = (canvas.height * imgWidth) / canvas.width

            doc.addImage(imgData, 'PNG', 14, yPosition, imgWidth, imgHeight)
            yPosition += imgHeight + 10
          } catch (error) {
            console.error(`Error capturing chart ${chart.elementId}:`, error)
          }
        }
      }
    }

    // PDF 저장
    doc.save(filename)
  } catch (error) {
    console.error('Error exporting to PDF:', error)
    alert('PDF 내보내기 중 오류가 발생했습니다.')
  }
}

/**
 * 통계 리포트를 PDF로 내보내기
 */
export async function exportStatisticsReportToPDF(
  stats: PeriodStatistics,
  comparison?: ComparisonResult,
  examReadiness?: ExamReadiness
): Promise<void> {
  const sections: { title: string; content: string[] }[] = []

  // 기본 통계
  sections.push({
    title: '학습 통계',
    content: [
      `기간: ${format(new Date(stats.startDate), 'yyyy-MM-dd', { locale: ko })} ~ ${format(new Date(stats.endDate), 'yyyy-MM-dd', { locale: ko })}`,
      `총 문제 수: ${stats.totalQuestions}문제`,
      `정답 수: ${stats.correctAnswers}문제`,
      `정답률: ${stats.accuracy}%`,
      `평균 소요 시간: ${stats.averageTimeSpent}초`,
    ],
  })

  // 카테고리별 성능
  if (stats.categories.length > 0) {
    sections.push({
      title: '카테고리별 성능',
      content: stats.categories.map(
        (cat) => `${cat.category}: ${cat.count}문제, 정답률 ${cat.accuracy}%`
      ),
    })
  }

  // 비교 데이터
  if (comparison) {
    sections.push({
      title: '기간 비교',
      content: [
        `정답률 변화: ${comparison.improvement.accuracy > 0 ? '+' : ''}${comparison.improvement.accuracy.toFixed(1)}%`,
        `문제 수 변화: ${comparison.improvement.totalQuestions > 0 ? '+' : ''}${comparison.improvement.totalQuestions}문제`,
        `평균 시간 변화: ${comparison.improvement.averageTimeSpent > 0 ? '+' : ''}${comparison.improvement.averageTimeSpent}%`,
      ],
    })
  }

  // 시험 준비도
  if (examReadiness) {
    sections.push({
      title: '시험 준비도 예측',
      content: [
        `전체 점수: ${examReadiness.overallScore}점`,
        `예상 점수: ${examReadiness.predictedScore}점`,
        `준비도: ${examReadiness.readinessLevel === 'excellent' ? '우수' : examReadiness.readinessLevel === 'ready' ? '준비됨' : examReadiness.readinessLevel === 'needs-improvement' ? '개선 필요' : '준비 안됨'}`,
        ...(examReadiness.daysUntilExam !== null
          ? [`시험까지 남은 일수: ${examReadiness.daysUntilExam}일`]
          : []),
        ...examReadiness.recommendations.map((rec) => `• ${rec}`),
      ],
    })
  }

  await exportToPDF(
    '학습 통계 리포트',
    { sections },
    `statistics-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`
  )
}

