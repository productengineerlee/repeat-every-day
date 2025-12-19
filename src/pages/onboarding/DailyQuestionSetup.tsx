import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useOnboarding } from '@/context'
import { useAuth } from '@/context'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabaseClient'
import { BookOpen, CheckCircle, ArrowRight, AlertCircle } from 'lucide-react'

const questionCountOptions = [1, 3, 5, 10]

export default function DailyQuestionSetup() {
  const { state, completeOnboarding } = useOnboarding()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [questionCount, setQuestionCount] = useState<number>(3) // 기본값 3문제
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 선택된 자격증
  const selectedCertification = state.certificationType

  // 로그인하지 않은 사용자는 회원가입으로 리다이렉트
  if (!user) {
    localStorage.setItem('redirect_after_auth', 'dashboard')
    navigate('/signup', { replace: true })
    return null
  }

  const handleSave = async () => {
    if (!user || !selectedCertification) {
      setError('사용자 정보 또는 자격증 정보가 없습니다.')
      return
    }

    try {
      setSaving(true)
      setError(null)

      // daily_question_count JSONB 구조로 저장
      // 선택한 자격증을 키로 사용
      const questionCounts: Record<string, number | null> = {
        [selectedCertification]: questionCount
      }

      // users 테이블 업데이트
      const { error: updateError } = await supabase
        .from('users')
        .update({ daily_question_count: questionCounts })
        .eq('id', user.id)

      if (updateError) {
        console.error('Error saving daily question count:', updateError)
        throw updateError
      }

      // 온보딩 완료 표시
      completeOnboarding()
      
      // 대시보드로 이동
      navigate('/dashboard', { replace: true })
    } catch (err) {
      console.error('Error in handleSave:', err)
      setError('설정 저장 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleSkip = () => {
    // 건너뛰기: 설정 없이 대시보드로
    completeOnboarding()
    navigate('/dashboard', { replace: true })
  }

  if (!selectedCertification) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <p className="text-red-600 dark:text-red-400">
            자격증이 선택되지 않았습니다.
          </p>
          <Button onClick={() => navigate('/onboarding')}>처음으로</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 pb-16">
      <div className="w-full max-w-2xl space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            <BookOpen className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-4">학습 설정</h1>
          <p className="text-muted-foreground text-lg">
            매일 풀 문제 수를 선택해주세요
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-card border rounded-lg p-8 space-y-8"
        >
          {/* 선택된 자격증 표시 */}
          <div className="text-center">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-semibold">
              <CheckCircle className="h-4 w-4" />
              {selectedCertification}
            </span>
          </div>

          {/* 문제 수 선택 */}
          <div className="space-y-5">
            <h3 className="text-lg font-semibold text-center">
              매일 배달받을 문제 수
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {questionCountOptions.map((count) => (
                <button
                  key={count}
                  onClick={() => setQuestionCount(count)}
                  className={`
                    p-7 rounded-lg border-2 transition-all hover:scale-105
                    ${
                      questionCount === count
                        ? 'border-primary bg-primary/10 shadow-lg'
                        : 'border-border hover:border-primary/50'
                    }
                  `}
                >
                  <div className="text-center">
                    <div className="text-3xl font-bold mb-2">{count}</div>
                    <div className="text-sm text-muted-foreground">문제</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 안내 메시지 */}
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-5">
              <p className="text-base text-muted-foreground text-center leading-relaxed">
                💡 매일 <span className="font-bold text-primary">{questionCount}문제</span>씩 꾸준히 풀면서
                <br />
                취약한 부분을 집중적으로 학습할 수 있습니다.
              </p>
            </div>
            
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-5">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                <div className="text-base text-yellow-800 dark:text-yellow-200">
                  <p className="font-bold mb-2 text-lg">안내</p>
                  <p className="leading-relaxed">
                    현재 일부 자격증은 문제 데이터가 준비 중입니다.
                    <br />
                    나중에 프로필 &gt; 학습설정에서 언제든 변경할 수 있습니다.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* 버튼 */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={handleSkip}
              disabled={saving}
              className="w-full sm:flex-1"
            >
              나중에 설정하기
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full sm:flex-1 gap-2"
            >
              {saving ? (
                '저장 중...'
              ) : (
                <>
                  설정 완료
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </motion.div>

        {/* 추가 정보 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-center text-sm text-muted-foreground"
        >
          <p>
            나중에 프로필 {'>'} 학습설정에서 언제든지 변경할 수 있습니다.
          </p>
        </motion.div>
      </div>
    </div>
  )
}

