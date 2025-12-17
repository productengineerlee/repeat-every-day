/**
 * Notification Settings Component
 * 
 * 알림 설정을 관리하는 컴포넌트
 */

import { useState, useEffect } from 'react'
import { useAuth } from '@/context'
import { requestNotificationPermission } from '@/lib/utils/notifications'
import {
  getNotificationSettings,
  updateNotificationSettings,
  type NotificationSettings,
} from '@/lib/api/notifications'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Bell, Clock, Moon } from 'lucide-react'

export default function NotificationSettings() {
  const { user } = useAuth()
  const [settings, setSettings] = useState<NotificationSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>('default')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      loadSettings()
      checkBrowserPermission()
    }
  }, [user]) // loadSettings는 user에 의존하므로 의존성 배열에 포함하지 않아도 됨

  const loadSettings = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)
      console.log('Loading notification settings for user:', user.id)
      const data = await getNotificationSettings(user.id)
      console.log('Loaded notification settings:', data)
      setSettings(data)
    } catch (err) {
      console.error('Error loading notification settings:', err)
      setError(`설정을 불러오는데 실패했습니다: ${err instanceof Error ? err.message : '알 수 없는 오류'}`)
      // 에러가 발생해도 기본값으로 계속 진행
      setSettings({
        id: '',
        userId: user.id,
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
      })
    } finally {
      setLoading(false)
    }
  }

  const checkBrowserPermission = () => {
    if ('Notification' in window) {
      setBrowserPermission(Notification.permission)
    }
  }

  const requestPermission = async () => {
    const granted = await requestNotificationPermission()
    if (granted) {
      setBrowserPermission('granted')
    } else {
      setBrowserPermission(Notification.permission)
    }
  }

  const updateSetting = async <K extends keyof NotificationSettings>(
    key: K,
    value: NotificationSettings[K]
  ) => {
    if (!user || !settings) return

    const updatedSettings = { ...settings, [key]: value }
    setSettings(updatedSettings)

    try {
      setSaving(true)
      const result = await updateNotificationSettings(user.id, {
        [key]: value,
      } as Partial<NotificationSettings>)

      if (!result.success) {
        throw new Error(result.error)
      }
    } catch (err) {
      console.error('Error updating setting:', err)
      setError('설정 저장에 실패했습니다.')
      // 롤백
      setSettings(settings)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 min-h-[200px]">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-sm text-muted-foreground">설정을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  // settings가 없어도 기본값으로 표시
  if (!settings && !loading) {
    return (
      <div className="p-8 text-center text-muted-foreground min-h-[200px]">
        <p className="mb-4">설정을 불러올 수 없습니다.</p>
        {error && <p className="text-sm text-destructive mb-4">{error}</p>}
        <Button onClick={loadSettings} variant="outline" size="sm">
          다시 시도
        </Button>
      </div>
    )
  }

  // settings가 없으면 로딩 상태 유지
  if (!settings) {
    return (
      <div className="flex items-center justify-center p-8 min-h-[200px]">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-sm text-muted-foreground">설정을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  const canUseNotifications =
    browserPermission === 'granted' || browserPermission === 'default'

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-bold">알림 설정</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          학습 리마인더와 성취도 알림을 관리하세요.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
          {error}
        </div>
      )}

      {/* 브라우저 알림 권한 */}
      <div className="space-y-4 p-4 border rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-left">브라우저 알림 권한</h3>
            <p className="text-sm text-muted-foreground">
              {browserPermission === 'granted'
                ? '알림이 허용되었습니다.'
                : browserPermission === 'denied'
                  ? '알림이 차단되었습니다. 브라우저 설정에서 변경하세요.'
                  : '알림 권한을 요청하세요.'}
            </p>
          </div>
          {browserPermission !== 'granted' && (
            <Button
              variant="outline"
              size="sm"
              onClick={requestPermission}
              disabled={browserPermission === 'denied'}
            >
              권한 요청
            </Button>
          )}
        </div>
      </div>

      {/* 전체 알림 활성화 */}
      <div className="space-y-4 p-4 border rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-left">알림 활성화</h3>
            <p className="text-sm text-muted-foreground">
              모든 알림을 켜거나 끌 수 있습니다.
            </p>
          </div>
          <Switch
            checked={settings.enabled}
            onCheckedChange={(checked) => updateSetting('enabled', checked)}
            disabled={!canUseNotifications || saving}
          />
        </div>
      </div>

      {/* 스트릭 리마인더 */}
      <div className="space-y-4 p-4 border rounded-lg">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-left">스트릭 리마인더</h3>
              <p className="text-sm text-muted-foreground">
                매일 스트릭 유지를 위한 알림을 받습니다.
              </p>
            </div>
            <Switch
              checked={settings.streakReminderEnabled && settings.enabled}
              onCheckedChange={(checked) =>
                updateSetting('streakReminderEnabled', checked)
              }
              disabled={!settings.enabled || !canUseNotifications || saving}
            />
          </div>

          {settings.streakReminderEnabled && settings.enabled && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <label className="text-sm font-medium">알림 시간</label>
              <Input
                type="time"
                value={settings.streakReminderTime.substring(0, 5)}
                onChange={(e) => {
                  const time = e.target.value + ':00'
                  updateSetting('streakReminderTime', time)
                }}
                disabled={!settings.enabled || saving}
                className="ml-auto w-32"
              />
            </div>
          )}
        </div>
      </div>

      {/* 성취도 알림 */}
      <div className="space-y-4 p-4 border rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-left">성취도 알림</h3>
            <p className="text-sm text-muted-foreground">
              성취도를 달성했을 때 알림을 받습니다.
            </p>
          </div>
          <Switch
            checked={settings.achievementNotificationsEnabled && settings.enabled}
            onCheckedChange={(checked) =>
              updateSetting('achievementNotificationsEnabled', checked)
            }
            disabled={!settings.enabled || !canUseNotifications || saving}
          />
        </div>
      </div>

      {/* 일일 학습 리마인더 */}
      <div className="space-y-4 p-4 border rounded-lg">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-left">일일 학습 리마인더</h3>
              <p className="text-sm text-muted-foreground">
                매일 학습을 시작하도록 알림을 받습니다.
              </p>
            </div>
            <Switch
              checked={settings.dailyLearningReminderEnabled && settings.enabled}
              onCheckedChange={(checked) =>
                updateSetting('dailyLearningReminderEnabled', checked)
              }
              disabled={!settings.enabled || !canUseNotifications || saving}
            />
          </div>

          {settings.dailyLearningReminderEnabled && settings.enabled && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <label className="text-sm font-medium">알림 시간</label>
              <Input
                type="time"
                value={settings.dailyLearningReminderTime.substring(0, 5)}
                onChange={(e) => {
                  const time = e.target.value + ':00'
                  updateSetting('dailyLearningReminderTime', time)
                }}
                disabled={!settings.enabled || saving}
                className="ml-auto w-32"
              />
            </div>
          )}
        </div>
      </div>

      {/* 복습 알림 */}
      <div className="space-y-4 p-4 border rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-left">복습 알림</h3>
            <p className="text-sm text-muted-foreground">
              복습할 문제가 있을 때 알림을 받습니다.
            </p>
          </div>
          <Switch
            checked={settings.reviewRemindersEnabled && settings.enabled}
            onCheckedChange={(checked) =>
              updateSetting('reviewRemindersEnabled', checked)
            }
            disabled={!settings.enabled || !canUseNotifications || saving}
          />
        </div>
      </div>

      {/* 조용한 시간 설정 */}
      <div className="space-y-4 p-4 border rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Moon className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold text-left">조용한 시간</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          이 시간 동안은 알림을 받지 않습니다.
        </p>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">시작 시간</label>
            <Input
              type="time"
              value={settings.quietHoursStart?.substring(0, 5) || ''}
              onChange={(e) => {
                const time = e.target.value ? e.target.value + ':00' : null
                updateSetting('quietHoursStart', time)
              }}
              disabled={!settings.enabled || saving}
            />
          </div>
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">종료 시간</label>
            <Input
              type="time"
              value={settings.quietHoursEnd?.substring(0, 5) || ''}
              onChange={(e) => {
                const time = e.target.value ? e.target.value + ':00' : null
                updateSetting('quietHoursEnd', time)
              }}
              disabled={!settings.enabled || saving}
            />
          </div>
        </div>
      </div>

      {saving && (
        <div className="text-center text-sm text-muted-foreground">
          저장 중...
        </div>
      )}
    </div>
  )
}

