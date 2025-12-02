/**
 * User Info Settings Component
 * 
 * 회원정보를 수정하는 컴포넌트
 */

import { useState, useEffect } from 'react'
import { useAuth } from '@/context'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { User, Loader2 } from 'lucide-react'

export default function UserInfoSettings() {
  const { user } = useAuth()
  const [name, setName] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (user) {
      loadUserInfo()
    }
  }, [user])

  const loadUserInfo = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)
      
      // user_metadata에서 이름 가져오기
      setName(user.user_metadata?.name || '')
    } catch (err) {
      console.error('Error loading user info:', err)
      setError('정보를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const saveUserInfo = async () => {
    if (!user) return

    try {
      setSaving(true)
      setError(null)
      setSuccess(false)

      // Supabase Auth의 user_metadata 업데이트
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          name: name.trim() || null,
        },
      })

      if (updateError) {
        setError(`정보 저장에 실패했습니다: ${updateError.message}`)
        return
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error('Error saving user info:', err)
      setError('정보 저장 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">정보를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 text-left">
      <div className="flex items-center gap-2 mb-4">
        <User className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-bold text-left">회원정보수정</h2>
      </div>

      <div className="space-y-4 text-left">
        <div className="text-left flex items-center gap-4">
          <label className="text-sm font-medium text-foreground w-20 flex-shrink-0 text-left">
            이메일
          </label>
          <div className="flex-1">
            <Input
              type="email"
              value={user?.email || ''}
              disabled
              className="bg-muted text-left"
            />
            <p className="text-xs text-muted-foreground mt-1 text-left">
              이메일은 변경할 수 없습니다.
            </p>
          </div>
        </div>

        <div className="text-left flex items-center gap-4">
          <label className="text-sm font-medium text-foreground w-20 flex-shrink-0 text-left">
            이름
          </label>
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="이름을 입력하세요"
            disabled={saving}
            className="text-left flex-1"
          />
        </div>

        <div className="text-left flex items-center gap-4">
          <label className="text-sm font-medium text-muted-foreground w-20 flex-shrink-0 text-left">
            가입일
          </label>
          <p className="text-sm text-foreground text-left flex-1">
            {user?.created_at
              ? new Date(user.created_at).toLocaleDateString('ko-KR')
              : '-'}
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
            <p className="text-sm text-green-800 dark:text-green-200">
              정보가 저장되었습니다!
            </p>
          </div>
        )}

        <Button
          onClick={saveUserInfo}
          disabled={saving}
          className="w-full"
        >
          {saving ? '저장 중...' : '정보 저장'}
        </Button>
      </div>
    </div>
  )
}

