/**
 * Notifications API
 * 
 * 알림 시스템을 위한 API 함수들
 */

import { supabase } from '../supabaseClient'

export type NotificationType = 'streak_reminder' | 'achievement' | 'review' | 'daily_learning' | 'challenge'

export interface NotificationSettings {
  id: string
  userId: string
  enabled: boolean
  streakReminderEnabled: boolean
  streakReminderTime: string // HH:mm:ss 형식
  achievementNotificationsEnabled: boolean
  reviewRemindersEnabled: boolean
  dailyLearningReminderEnabled: boolean
  dailyLearningReminderTime: string // HH:mm:ss 형식
  quietHoursStart: string | null
  quietHoursEnd: string | null
  timezone: string
  createdAt: string
  updatedAt: string
}

export interface NotificationLog {
  id: string
  userId: string
  type: NotificationType
  title: string
  body: string
  data: Record<string, unknown> | null
  sentAt: string
  readAt: string | null
  clickedAt: string | null
}

/**
 * 알림 설정 가져오기 (없으면 기본값 생성)
 */
export async function getNotificationSettings(
  userId: string
): Promise<NotificationSettings> {
  try {
    // maybeSingle 사용 - 데이터가 없어도 에러 발생하지 않음
    const { data, error } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    // PGRST116(데이터 없음)이 아닌 실제 에러만 처리
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching notification settings:', error)
      // 에러가 있어도 기본값으로 계속 진행
    }

    if (data) {
      return {
        id: data.id,
        userId: data.user_id,
        enabled: data.enabled ?? true,
        streakReminderEnabled: data.streak_reminder_enabled ?? true,
        streakReminderTime: data.streak_reminder_time ?? '20:00:00',
        achievementNotificationsEnabled: data.achievement_notifications_enabled ?? true,
        reviewRemindersEnabled: data.review_reminders_enabled ?? true,
        dailyLearningReminderEnabled: data.daily_learning_reminder_enabled ?? true,
        dailyLearningReminderTime: data.daily_learning_reminder_time ?? '09:00:00',
        quietHoursStart: data.quiet_hours_start,
        quietHoursEnd: data.quiet_hours_end,
        timezone: data.timezone,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      }
    }

    // 기본 설정 생성 (upsert 사용 - 이미 있으면 업데이트, 없으면 생성)
    const { data: newSettings, error: createError } = await supabase
      .from('notification_settings')
      .upsert({
        user_id: userId,
        enabled: true,
        streak_reminder_enabled: true,
        streak_reminder_time: '20:00:00',
        achievement_notifications_enabled: true,
        review_reminders_enabled: true,
        daily_learning_reminder_enabled: true,
        daily_learning_reminder_time: '09:00:00',
      }, {
        onConflict: 'user_id',
      })
      .select()
      .single()

    if (createError) {
      // 409 에러(이미 존재)인 경우 다시 조회 시도
      if (createError.code === '23505' || createError.message.includes('duplicate')) {
        const { data: existingSettings } = await supabase
          .from('notification_settings')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle()
        
        if (existingSettings) {
          return {
            id: existingSettings.id,
            userId: existingSettings.user_id,
            enabled: existingSettings.enabled ?? true,
            streakReminderEnabled: existingSettings.streak_reminder_enabled ?? true,
            streakReminderTime: existingSettings.streak_reminder_time ?? '20:00:00',
            achievementNotificationsEnabled: existingSettings.achievement_notifications_enabled ?? true,
            reviewRemindersEnabled: existingSettings.review_reminders_enabled ?? true,
            dailyLearningReminderEnabled: existingSettings.daily_learning_reminder_enabled ?? true,
            dailyLearningReminderTime: existingSettings.daily_learning_reminder_time ?? '09:00:00',
            quietHoursStart: existingSettings.quiet_hours_start,
            quietHoursEnd: existingSettings.quiet_hours_end,
            timezone: existingSettings.timezone,
            createdAt: existingSettings.created_at,
            updatedAt: existingSettings.updated_at,
          }
        }
      }
      throw createError
    }

    return {
      id: newSettings.id,
      userId: newSettings.user_id,
      enabled: newSettings.enabled,
      streakReminderEnabled: newSettings.streak_reminder_enabled,
      streakReminderTime: newSettings.streak_reminder_time,
      achievementNotificationsEnabled: newSettings.achievement_notifications_enabled,
      reviewRemindersEnabled: newSettings.review_reminders_enabled,
      dailyLearningReminderEnabled: newSettings.daily_learning_reminder_enabled,
      dailyLearningReminderTime: newSettings.daily_learning_reminder_time,
      quietHoursStart: newSettings.quiet_hours_start,
      quietHoursEnd: newSettings.quiet_hours_end,
      timezone: newSettings.timezone,
      createdAt: newSettings.created_at,
      updatedAt: newSettings.updated_at,
    }
  } catch (error) {
    console.error('Error fetching notification settings:', error)
    // 기본값 반환
    return {
      id: '',
      userId,
      enabled: true,
      streakReminderEnabled: true,
      streakReminderTime: '20:00:00',
      achievementNotificationsEnabled: true,
      reviewRemindersEnabled: true,
      dailyLearningReminderEnabled: true,
      dailyLearningReminderTime: '09:00:00',
      quietHoursStart: null,
      quietHoursEnd: null,
      timezone: 'Asia/Seoul',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  }
}

/**
 * 알림 설정 업데이트
 */
export async function updateNotificationSettings(
  userId: string,
  updates: Partial<Omit<NotificationSettings, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
): Promise<{ success: boolean; error?: string }> {
  try {
    const updateData: Record<string, unknown> = {}
    if (updates.enabled !== undefined) updateData.enabled = updates.enabled
    if (updates.streakReminderEnabled !== undefined)
      updateData.streak_reminder_enabled = updates.streakReminderEnabled
    if (updates.streakReminderTime !== undefined)
      updateData.streak_reminder_time = updates.streakReminderTime
    if (updates.achievementNotificationsEnabled !== undefined)
      updateData.achievement_notifications_enabled = updates.achievementNotificationsEnabled
    if (updates.reviewRemindersEnabled !== undefined)
      updateData.review_reminders_enabled = updates.reviewRemindersEnabled
    if (updates.dailyLearningReminderEnabled !== undefined)
      updateData.daily_learning_reminder_enabled = updates.dailyLearningReminderEnabled
    if (updates.dailyLearningReminderTime !== undefined)
      updateData.daily_learning_reminder_time = updates.dailyLearningReminderTime
    if (updates.quietHoursStart !== undefined)
      updateData.quiet_hours_start = updates.quietHoursStart
    if (updates.quietHoursEnd !== undefined)
      updateData.quiet_hours_end = updates.quietHoursEnd
    if (updates.timezone !== undefined) updateData.timezone = updates.timezone

    const { error } = await supabase
      .from('notification_settings')
      .upsert(
        {
          user_id: userId,
          ...updateData,
        },
        {
          onConflict: 'user_id',
        }
      )

    if (error) {
      throw error
    }

    return { success: true }
  } catch (error) {
    console.error('Error updating notification settings:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '알림 설정 업데이트 실패',
    }
  }
}

/**
 * 알림 로그 기록
 */
export async function logNotification(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<{ success: boolean; logId?: string; error?: string }> {
  try {
    const { data: logData, error } = await supabase
      .from('notification_logs')
      .insert({
        user_id: userId,
        type,
        title,
        body,
        data: data || null,
      })
      .select('id')
      .single()

    if (error) {
      // RLS 정책 에러는 조용히 처리 (개발 중 예상되는 에러)
      if (error.message?.includes('row-level security') || error.message?.includes('policy')) {
        return {
          success: false,
          error: 'RLS policy error (silent)',
        }
      }
      throw error
    }

    return {
      success: true,
      logId: logData.id,
    }
  } catch (error) {
    // 에러 로깅을 최소화 (너무 많은 에러 메시지 방지)
    if (error instanceof Error && !error.message?.includes('row-level security')) {
      console.error('Error logging notification:', error)
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : '알림 로그 기록 실패',
    }
  }
}

/**
 * 알림 로그 가져오기
 */
export async function getNotificationLogs(
  userId: string,
  limit: number = 50,
  unreadOnly: boolean = false
): Promise<NotificationLog[]> {
  try {
    let query = supabase
      .from('notification_logs')
      .select('*')
      .eq('user_id', userId)
      .order('sent_at', { ascending: false })
      .limit(limit)

    if (unreadOnly) {
      query = query.is('read_at', null)
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    return (
      data?.map((log) => ({
        id: log.id,
        userId: log.user_id,
        type: log.type as NotificationType,
        title: log.title,
        body: log.body,
        data: log.data,
        sentAt: log.sent_at,
        readAt: log.read_at,
        clickedAt: log.clicked_at,
      })) || []
    )
  } catch (error) {
    console.error('Error fetching notification logs:', error)
    return []
  }
}

/**
 * 알림 읽음 처리
 */
export async function markNotificationAsRead(
  userId: string,
  logId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('notification_logs')
      .update({
        read_at: new Date().toISOString(),
      })
      .eq('id', logId)
      .eq('user_id', userId)

    if (error) {
      throw error
    }

    return { success: true }
  } catch (error) {
    console.error('Error marking notification as read:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '알림 읽음 처리 실패',
    }
  }
}

/**
 * 알림 클릭 처리
 */
export async function markNotificationAsClicked(
  userId: string,
  logId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('notification_logs')
      .update({
        clicked_at: new Date().toISOString(),
      })
      .eq('id', logId)
      .eq('user_id', userId)

    if (error) {
      throw error
    }

    return { success: true }
  } catch (error) {
    console.error('Error marking notification as clicked:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '알림 클릭 처리 실패',
    }
  }
}

