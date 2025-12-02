/**
 * 브라우저 알림 권한 요청
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications')
    return false
  }

  if (Notification.permission === 'granted') {
    return true
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  return false
}

/**
 * 복습 알림 표시
 */
export async function showReviewNotification(
  count: number,
  onClick?: () => void
): Promise<void> {
  const hasPermission = await requestNotificationPermission()
  
  if (!hasPermission) {
    return
  }

  const notification = new Notification('Certiq 복습 알림', {
    body: `복습할 문제 ${count}개가 있습니다.`,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'review-notification',
    requireInteraction: false,
  })

  if (onClick) {
    notification.onclick = () => {
      window.focus()
      onClick()
      notification.close()
    }
  }

  // 5초 후 자동 닫기
  setTimeout(() => {
    notification.close()
  }, 5000)
}

/**
 * 복습 알림 스케줄링 (로컬 스토리지 기반)
 */
export function scheduleReviewNotifications(
  reviewItems: Array<{ id: string; nextReviewDate: string }>
): void {
  // 오늘 복습할 항목 필터링
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const todayReviews = reviewItems.filter((item) => {
    const reviewDate = new Date(item.nextReviewDate)
    reviewDate.setHours(0, 0, 0, 0)
    return reviewDate <= today
  })

  if (todayReviews.length > 0) {
    // 알림 표시 (페이지가 포커스되어 있을 때만)
    if (document.hasFocus()) {
      showReviewNotification(todayReviews.length, () => {
        // 알림 클릭 시 오답 노트 페이지로 이동
        window.location.href = '/wrong-answers'
      })
    }
  }
}








