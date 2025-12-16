/**
 * useNotificationScheduler Hook
 * 
 * 알림 스케줄러를 초기화하고 관리하는 커스텀 훅
 */

import { useEffect, useRef } from 'react'
import { useAuth } from '@/context'
import { initializeNotificationSchedules } from '@/lib/utils/notificationScheduler'

export function useNotificationScheduler() {
  const { user } = useAuth()
  const scheduleIdsRef = useRef<{
    streakReminderId: number | null
    dailyReminderId: number | null
  }>({
    streakReminderId: null,
    dailyReminderId: null,
  })

  useEffect(() => {
    if (!user) {
      // 기존 스케줄 정리
      if (scheduleIdsRef.current.streakReminderId !== null) {
        clearTimeout(scheduleIdsRef.current.streakReminderId)
        scheduleIdsRef.current.streakReminderId = null
      }
      if (scheduleIdsRef.current.dailyReminderId !== null) {
        clearTimeout(scheduleIdsRef.current.dailyReminderId)
        scheduleIdsRef.current.dailyReminderId = null
      }
      return
    }

    // 알림 스케줄 초기화
    initializeNotificationSchedules(user.id).then((ids) => {
      scheduleIdsRef.current = ids
    })

    // 컴포넌트 언마운트 시 정리
    return () => {
      if (scheduleIdsRef.current.streakReminderId !== null) {
        clearTimeout(scheduleIdsRef.current.streakReminderId)
      }
      if (scheduleIdsRef.current.dailyReminderId !== null) {
        clearTimeout(scheduleIdsRef.current.dailyReminderId)
      }
    }
  }, [user])
}














