/**
 * Daily Question Settings Component
 * 
 * 매일 배달받을 문제 수를 설정하는 컴포넌트
 */

import { useState, useEffect } from 'react'
import { useAuth } from '@/context'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { BookOpen, Loader2 } from 'lucide-react'

type CertificationType = '빅데이터분석기사' | 'ADsP' | '기출문제-빅데이터분석기사' | '기출문제-ADsP'

interface DailyQuestionCounts {
  '빅데이터분석기사': number | null
  'ADsP': number | null
  '기출문제-빅데이터분석기사': number | null
  '기출문제-ADsP': number | null
}

const CERTIFICATIONS: { type: CertificationType; label: string }[] = [
  { type: '빅데이터분석기사', label: '빅데이터분석기사' },
  { type: 'ADsP', label: 'ADsP' },
  { type: '기출문제-빅데이터분석기사', label: '기출문제 - 빅데이터분석기사' },
  { type: '기출문제-ADsP', label: '기출문제 - ADsP' },
]

export default function DailyQuestionSettings() {
  const { user } = useAuth()
  const [questionCounts, setQuestionCounts] = useState<DailyQuestionCounts>({
    '빅데이터분석기사': null,
    'ADsP': null,
    '기출문제-빅데이터분석기사': null,
    '기출문제-ADsP': null,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (user) {
      loadSettings()
    }
  }, [user])

  const loadSettings = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)
      const { data, error: fetchError } = await supabase
        .from('users')
        .select('daily_question_count')
        .eq('id', user.id)
        .maybeSingle()

      if (fetchError) {
        console.error('Error loading daily question settings:', fetchError)
        // 컬럼이 없을 수 있으므로 기본값 사용 (null)
        // 에러 코드 42703은 컬럼이 없음을 의미
        if (fetchError.code === '42703' || fetchError.message?.includes('column') || fetchError.message?.includes('컬럼')) {
          // 컬럼이 없는 경우 조용히 처리 (에러 메시지 표시 안 함)
          setQuestionCounts({
            '빅데이터분석기사': null,
            'ADsP': null,
            '기출문제-빅데이터분석기사': null,
            '기출문제-ADsP': null,
          })
        } else {
          // 다른 에러인 경우에만 에러 메시지 표시
          setError('설정을 불러오는데 실패했습니다.')
          setQuestionCounts({
            '빅데이터분석기사': null,
            'ADsP': null,
            '기출문제-빅데이터분석기사': null,
            '기출문제-ADsP': null,
          })
        }
      } else {
        // JSONB 형식이면 그대로 사용, INTEGER 형식이면 변환
        const counts = data?.daily_question_count
        if (typeof counts === 'object' && counts !== null) {
          // JSONB 형식
          setQuestionCounts({
            '빅데이터분석기사': (counts as any)['빅데이터분석기사'] || null,
            'ADsP': (counts as any)['ADsP'] || null,
            '기출문제-빅데이터분석기사': (counts as any)['기출문제-빅데이터분석기사'] || null,
            '기출문제-ADsP': (counts as any)['기출문제-ADsP'] || null,
          })
        } else if (typeof counts === 'number') {
          // 기존 INTEGER 형식 (마이그레이션 전) - null로 초기화
          setQuestionCounts({
            '빅데이터분석기사': null,
            'ADsP': null,
            '기출문제-빅데이터분석기사': null,
            '기출문제-ADsP': null,
          })
        } else {
          // 기본값 (null)
          setQuestionCounts({
            '빅데이터분석기사': null,
            'ADsP': null,
            '기출문제-빅데이터분석기사': null,
            '기출문제-ADsP': null,
          })
        }
      }
    } catch (err) {
      console.error('Error loading settings:', err)
      setError('설정을 불러오는데 실패했습니다.')
      setQuestionCounts({
        '빅데이터분석기사': null,
        'ADsP': null,
        '기출문제-빅데이터분석기사': null,
        '기출문제-ADsP': null,
      })
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    if (!user) return

    try {
      setSaving(true)
      setError(null)
      setSuccess(false)

      console.log('💾 Saving question counts:', questionCounts)
      
      const { data: updateData, error: updateError } = await supabase
        .from('users')
        .update({ daily_question_count: questionCounts })
        .eq('id', user.id)
        .select('daily_question_count')
        .single()

      console.log('💾 Update result:', { updateData, error: updateError })

      if (updateError) {
        console.error('❌ Update error:', {
          code: updateError.code,
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint
        })
        
        // 컬럼이 없을 수 있으므로 에러 처리
        if (updateError.code === '42703' || updateError.message?.includes('column') || updateError.message?.includes('컬럼') || updateError.message?.includes('daily_question_count')) {
          setError('데이터베이스에 daily_question_count 컬럼이 없습니다. SQL 스크립트를 실행해주세요.')
        } else if (updateError.code === '42501' || updateError.message?.includes('permission') || updateError.message?.includes('권한')) {
          setError('권한이 없습니다. RLS 정책을 확인해주세요.')
        } else {
          setError(`설정 저장에 실패했습니다: ${updateError.message || updateError.code || '알 수 없는 오류'}`)
        }
        return
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error('Error saving settings:', err)
      setError('설정 저장 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const updateQuestionCount = (certificationType: CertificationType, count: number | null) => {
    setQuestionCounts((prev) => ({
      ...prev,
      [certificationType]: prev[certificationType] === count ? null : count, // 같은 값 클릭 시 해제
    }))
  }

  const questionCountOptions = [1, 3, 5]

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">설정을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 text-left">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-bold text-left">학습 설정</h2>
      </div>

      <div className="space-y-4">
        <p className="text-sm text-muted-foreground mb-4 text-left">
          자격증별로 매일 배달받을 문제 수를 설정할 수 있습니다. 선택하지 않은 자격증은 문제를 배달받지 않습니다.
        </p>
        
        {CERTIFICATIONS.map((cert) => (
          <div key={cert.type} className="flex items-center gap-4">
            <label className="text-sm font-medium text-foreground w-40 flex-shrink-0 text-left">
              {cert.label}
            </label>
            <div className="flex gap-2 flex-1">
              {questionCountOptions.map((count) => (
                <Button
                  key={count}
                  variant={questionCounts[cert.type] === count ? 'default' : 'outline'}
                  onClick={() => updateQuestionCount(cert.type, count)}
                  className="flex-1"
                  disabled={saving}
                >
                  {count}문제
                </Button>
              ))}
            </div>
          </div>
        ))}

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            {error.includes('컬럼이 없습니다') && (
              <div className="text-xs text-red-600 dark:text-red-400 mt-2 space-y-2">
                <p className="font-semibold">
                  💡 해결 방법: Supabase Dashboard → SQL Editor에서 다음 스크립트를 실행하세요:
                </p>
                <div className="bg-red-50 dark:bg-red-950/30 p-2 rounded border border-red-200 dark:border-red-800">
                  <p className="font-medium mb-1">권장: 완전 수정 스크립트 (모든 설정을 한 번에 처리)</p>
                  <code className="bg-red-100 dark:bg-red-950 px-2 py-1 rounded block text-xs break-all">
                    fix_daily_question_count_complete.sql
                  </code>
                </div>
                <p className="text-xs mt-2">또는 개별 스크립트:</p>
                <ul className="list-disc list-inside space-y-1 ml-2 text-xs">
                  <li>
                    컬럼 생성:{' '}
                    <code className="bg-red-100 dark:bg-red-950 px-1 rounded">
                      create_daily_question_count_jsonb.sql
                    </code>
                  </li>
                  <li>
                    RLS 정책 추가:{' '}
                    <code className="bg-red-100 dark:bg-red-950 px-1 rounded">
                      add_users_daily_question_count_rls.sql
                    </code>
                  </li>
                </ul>
                <p className="text-xs mt-2 text-yellow-700 dark:text-yellow-400">
                  ⚠️ 스크립트 실행 후 브라우저를 완전히 새로고침(Ctrl+F5)하세요.
                </p>
              </div>
            )}
            {error.includes('권한이 없습니다') && (
              <div className="text-xs text-red-600 dark:text-red-400 mt-2 space-y-1">
                <p>
                  💡 RLS 정책이 없거나 잘못 설정되었습니다. 다음 스크립트를 실행하세요:
                </p>
                <code className="bg-red-100 dark:bg-red-950 px-1 rounded">
                  add_users_daily_question_count_rls.sql
                </code>
              </div>
            )}
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
            <p className="text-sm text-green-800 dark:text-green-200">
              설정이 저장되었습니다!
            </p>
          </div>
        )}

        <Button
          onClick={saveSettings}
          disabled={saving}
          className="w-full"
        >
          {saving ? '저장 중...' : '설정 저장'}
        </Button>
      </div>
    </div>
  )
}

