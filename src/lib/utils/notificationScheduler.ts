/**
 * Notification Scheduler
 * 
 * 알림 스케줄링 및 표시를 위한 유틸리티 함수들
 */

import { requestNotificationPermission } from './notifications'
import {
  getNotificationSettings,
  logNotification,
} from '../api/notifications'
import { getStreakStatus } from '../api/streak'

/**
 * 현재 시간이 조용한 시간인지 확인
 */
function isQuietHours(
  quietHoursStart: string | null,
  quietHoursEnd: string | null
): boolean {
  if (!quietHoursStart || !quietHoursEnd) {
    return false
  }

  const now = new Date()
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:00`

  // 조용한 시간이 자정을 넘어가는 경우 (예: 22:00 - 08:00)
  if (quietHoursStart > quietHoursEnd) {
    return currentTime >= quietHoursStart || currentTime <= quietHoursEnd
  }

  return currentTime >= quietHoursStart && currentTime <= quietHoursEnd
}

/**
 * 스트릭 리마인더 알림 표시
 */
export async function showStreakReminderNotification(
  userId: string,
  streakCount: number
): Promise<void> {
  try {
    const settings = await getNotificationSettings(userId)

    if (!settings.enabled || !settings.streakReminderEnabled) {
      return
    }

    if (isQuietHours(settings.quietHoursStart, settings.quietHoursEnd)) {
      return
    }

    const hasPermission = await requestNotificationPermission()
    if (!hasPermission) {
      return
    }

    const messages = [
      `🔥 ${streakCount}일 연속 학습 중! 오늘도 화이팅!`,
      `✨ ${streakCount}일째 스트릭 유지 중입니다. 오늘의 학습을 완료하세요!`,
      `💪 ${streakCount}일 연속 학습! 오늘도 한 걸음 더 나아가세요!`,
      `🌟 ${streakCount}일 스트릭! 오늘의 목표를 달성하세요!`,
    ]

    const randomMessage = messages[Math.floor(Math.random() * messages.length)]

    const notification = new Notification('certiQ 스트릭 리마인더', {
      body: randomMessage,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'streak-reminder',
      requireInteraction: false,
    })

    notification.onclick = () => {
      window.focus()
      window.location.href = '/dashboard'
      notification.close()
    }

    // 알림 로그 기록
    await logNotification(
      userId,
      'streak_reminder',
      '스트릭 리마인더',
      randomMessage,
      {
        streakCount,
      }
    )

    // 5초 후 자동 닫기
    setTimeout(() => {
      notification.close()
    }, 5000)
  } catch (error) {
    console.error('Error showing streak reminder notification:', error)
  }
}

/**
 * 성취도 달성 알림 표시
 */
export async function showAchievementNotification(
  userId: string,
  achievementName: string,
  achievementDescription?: string
): Promise<void> {
  try {
    const settings = await getNotificationSettings(userId)

    if (!settings.enabled || !settings.achievementNotificationsEnabled) {
      return
    }

    if (isQuietHours(settings.quietHoursStart, settings.quietHoursEnd)) {
      return
    }

    const hasPermission = await requestNotificationPermission()
    if (!hasPermission) {
      return
    }

    const messages = [
      `🎉 축하합니다! "${achievementName}" 성취도를 달성했습니다!`,
      `🏆 "${achievementName}" 달성! 계속해서 노력하세요!`,
      `⭐ "${achievementName}" 성취도 획득! 멋져요!`,
    ]

    const randomMessage = messages[Math.floor(Math.random() * messages.length)]
    const body = achievementDescription
      ? `${randomMessage}\n${achievementDescription}`
      : randomMessage

    const notification = new Notification('certiQ 성취도 달성', {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: `achievement-${achievementName}`,
      requireInteraction: true, // 성취도 알림은 사용자 주의 필요
    })

    notification.onclick = () => {
      window.focus()
      window.location.href = '/dashboard'
      notification.close()
    }

    // 알림 로그 기록
    await logNotification(
      userId,
      'achievement',
      '성취도 달성',
      body,
      {
        achievementName,
        achievementDescription,
      }
    )

    // 성취도 알림은 10초 후 자동 닫기
    setTimeout(() => {
      notification.close()
    }, 10000)
  } catch (error) {
    console.error('Error showing achievement notification:', error)
  }
}

/**
 * 일일 학습 리마인더 알림 표시
 */
export async function showDailyLearningReminder(userId: string): Promise<void> {
  try {
    const settings = await getNotificationSettings(userId)

    if (!settings.enabled || !settings.dailyLearningReminderEnabled) {
      return
    }

    if (isQuietHours(settings.quietHoursStart, settings.quietHoursEnd)) {
      return
    }

    const hasPermission = await requestNotificationPermission()
    if (!hasPermission) {
      return
    }

    const streakStatus = await getStreakStatus(userId)

    const messages = [
      '📚 오늘의 학습을 시작하세요!',
      '💡 오늘도 한 문제씩 풀어보세요!',
      '🎯 오늘의 목표를 달성하세요!',
    ]

    const randomMessage = messages[Math.floor(Math.random() * messages.length)]
    const body =
      streakStatus.currentStreak > 0
        ? `${randomMessage}\n현재 ${streakStatus.currentStreak}일 연속 학습 중입니다.`
        : randomMessage

    const notification = new Notification('certiQ 일일 학습 리마인더', {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'daily-learning-reminder',
      requireInteraction: false,
    })

    notification.onclick = () => {
      window.focus()
      window.location.href = '/learning'
      notification.close()
    }

    // 알림 로그 기록
    await logNotification(
      userId,
      'daily_learning',
      '일일 학습 리마인더',
      body,
      {
        streakCount: streakStatus.currentStreak,
      }
    )

    setTimeout(() => {
      notification.close()
    }, 5000)
  } catch (error) {
    console.error('Error showing daily learning reminder:', error)
  }
}

/**
 * 스트릭 리마인더 스케줄링 (클라이언트 측)
 * 실제로는 서버 측 스케줄러(pg_cron 등)를 사용하는 것이 좋지만,
 * 클라이언트 측에서도 기본적인 스케줄링 지원
 */
export function scheduleStreakReminder(
  userId: string,
  reminderTime: string
): number | null {
  try {
    const [hours, minutes] = reminderTime.split(':').map(Number)
    const now = new Date()
    const reminderDate = new Date()
    reminderDate.setHours(hours, minutes, 0, 0)

    // 오늘의 알림 시간이 지났으면 내일로 설정
    if (reminderDate <= now) {
      reminderDate.setDate(reminderDate.getDate() + 1)
    }

    const msUntilReminder = reminderDate.getTime() - now.getTime()

    return window.setTimeout(async () => {
      const streakStatus = await getStreakStatus(userId)
      if (streakStatus.currentStreak > 0) {
        await showStreakReminderNotification(userId, streakStatus.currentStreak)
      }
      // 다음 날 알림 스케줄링
      scheduleStreakReminder(userId, reminderTime)
    }, msUntilReminder) as unknown as number
  } catch (error) {
    console.error('Error scheduling streak reminder:', error)
    return null
  }
}

/**
 * 일일 학습 리마인더 스케줄링
 */
export function scheduleDailyLearningReminder(
  userId: string,
  reminderTime: string
): number | null {
  try {
    const [hours, minutes] = reminderTime.split(':').map(Number)
    const now = new Date()
    const reminderDate = new Date()
    reminderDate.setHours(hours, minutes, 0, 0)

    // 오늘의 알림 시간이 지났으면 내일로 설정
    if (reminderDate <= now) {
      reminderDate.setDate(reminderDate.getDate() + 1)
    }

    const msUntilReminder = reminderDate.getTime() - now.getTime()

    return window.setTimeout(async () => {
      await showDailyLearningReminder(userId)
      // 다음 날 알림 스케줄링
      scheduleDailyLearningReminder(userId, reminderTime)
    }, msUntilReminder) as unknown as number
  } catch (error) {
    console.error('Error scheduling daily learning reminder:', error)
    return null
  }
}

/**
 * 모든 알림 스케줄 초기화
 */
export async function initializeNotificationSchedules(
  userId: string
): Promise<{ streakReminderId: number | null; dailyReminderId: number | null }> {
  try {
    const settings = await getNotificationSettings(userId)

    const streakReminderId = settings.streakReminderEnabled
      ? scheduleStreakReminder(userId, settings.streakReminderTime)
      : null

    const dailyReminderId = settings.dailyLearningReminderEnabled
      ? scheduleDailyLearningReminder(userId, settings.dailyLearningReminderTime)
      : null

    return {
      streakReminderId,
      dailyReminderId,
    }
  } catch (error) {
    console.error('Error initializing notification schedules:', error)
    return {
      streakReminderId: null,
      dailyReminderId: null,
    }
  }
}

