import { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle } from 'lucide-react'
import AdminLayout from '@/components/admin/AdminLayout'
import QuestionInputForm from '@/components/admin/QuestionInputForm'
import { saveQuestion, type QuestionInput } from '@/lib/api/questions'

export default function AdminQuestionInput() {
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (question: QuestionInput) => {
    setSuccess(null)
    setError(null)

    console.log('handleSubmit 호출됨:', question)

    try {
      console.log('saveQuestion 호출 시작')
      const result = await saveQuestion(question)
      console.log('saveQuestion 결과:', result)

      if (result.error) {
        console.error('저장 실패:', result.error)
        setError(result.error)
        // 에러 메시지가 보이도록 스크롤
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }, 100)
        return
      }

      if (result.id) {
        console.log('저장 성공, 문제 ID:', result.id)
        setSuccess(`문제가 성공적으로 저장되었습니다! (ID: ${result.id})`)
        // 성공 메시지가 보이도록 스크롤
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }, 100)
        // 2초 후 성공 메시지 제거 (폼은 QuestionInputForm에서 자동 초기화됨)
        setTimeout(() => {
          setSuccess(null)
        }, 2000)
      } else {
        console.warn('저장 결과에 ID가 없습니다:', result)
        setError('문제가 저장되었지만 ID를 받지 못했습니다.')
      }
    } catch (err) {
      console.error('문제 저장 중 예외 발생:', err)
      const errorMessage = err instanceof Error ? err.message : '문제 저장 중 오류가 발생했습니다.'
      setError(errorMessage)
      // 에러 메시지가 보이도록 스크롤
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }, 100)
    }
  }

  return (
    <AdminLayout
      title="문제 입력"
      description="관리자용 문제 입력 화면입니다."
    >

        {/* 성공/에러 메시지 */}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2"
          >
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            <p className="text-green-800 dark:text-green-200">{success}</p>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2"
          >
            <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-red-800 dark:text-red-200 font-medium mb-1">문제 저장 실패</p>
              <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
              {(error.includes('Could not find') || error.includes('column') || error.includes('schema cache')) && (
                <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                  <p className="text-yellow-800 dark:text-yellow-300 text-xs font-medium mb-2">
                    💡 해결 방법: 데이터베이스 컬럼 추가 필요
                  </p>
                  <ol className="text-yellow-700 dark:text-yellow-300 text-xs list-decimal list-inside space-y-1 mb-2">
                    <li>Supabase Dashboard → SQL Editor로 이동</li>
                    <li>프로젝트 루트의 <code className="bg-yellow-100 dark:bg-yellow-950 px-1 rounded">add_questions_columns.sql</code> 파일 내용을 복사</li>
                    <li>SQL Editor에 붙여넣고 실행</li>
                  </ol>
                  <details className="text-xs">
                    <summary className="text-yellow-700 dark:text-yellow-300 font-medium cursor-pointer mb-1">SQL 직접 실행하기</summary>
                    <pre className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-950/50 rounded text-xs text-yellow-800 dark:text-yellow-300 overflow-x-auto">
{`ALTER TABLE questions 
ADD COLUMN IF NOT EXISTS sub_content TEXT;

ALTER TABLE questions 
ADD COLUMN IF NOT EXISTS sub_content_image_url TEXT;`}
                    </pre>
                  </details>
                </div>
              )}
              {(error.includes('RLS') || error.includes('권한') || error.includes('policy') || error.includes('permission') || error.includes('row-level security')) && (
                <div className="mt-3 p-3 bg-red-100 dark:bg-red-900/30 rounded-md">
                  <p className="text-red-700 dark:text-red-300 text-xs font-medium mb-2">💡 해결 방법:</p>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-red-700 dark:text-red-300 text-xs font-medium mb-1">1단계: users 테이블에 is_admin 컬럼 추가 (없는 경우)</p>
                      <p className="text-red-600 dark:text-red-400 text-xs mb-1">프로젝트 루트의 <code className="bg-red-200 dark:bg-red-950 px-1 rounded">add_is_admin_column.sql</code> 파일을 Supabase SQL Editor에서 실행하세요</p>
                    </div>
                    
                    <div>
                      <p className="text-red-700 dark:text-red-300 text-xs font-medium mb-1">2단계: questions 테이블에 INSERT 정책 추가</p>
                      <p className="text-red-600 dark:text-red-400 text-xs mb-1">프로젝트 루트의 <code className="bg-red-200 dark:bg-red-950 px-1 rounded">add_questions_insert_policy.sql</code> 파일을 Supabase SQL Editor에서 실행하세요</p>
                    </div>
                    
                    <details className="text-xs">
                      <summary className="text-red-700 dark:text-red-300 font-medium cursor-pointer mb-1">SQL 직접 실행하기</summary>
                      <div className="mt-2 space-y-2">
                        <div>
                          <p className="text-red-600 dark:text-red-400 mb-1">관리자만 INSERT 가능:</p>
                          <pre className="p-2 bg-red-50 dark:bg-red-950/50 rounded text-xs text-red-800 dark:text-red-300 overflow-x-auto">
{`CREATE POLICY "Allow admin insert questions"
ON questions FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.is_admin = true
  )
);`}
                          </pre>
                        </div>
                        <div>
                          <p className="text-red-600 dark:text-red-400 mb-1">또는 개발 단계용 (모든 인증된 사용자):</p>
                          <pre className="p-2 bg-red-50 dark:bg-red-950/50 rounded text-xs text-red-800 dark:text-red-300 overflow-x-auto">
{`CREATE POLICY "Allow authenticated insert questions"
ON questions FOR INSERT
TO authenticated
WITH CHECK (true);`}
                          </pre>
                        </div>
                      </div>
                    </details>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

      {/* 폼 */}
      <div className="bg-card border border-border rounded-lg p-6">
        <QuestionInputForm 
          onSubmit={handleSubmit}
          onSuccess={() => {
            // 성공 후 추가 작업 (필요시)
            console.log('폼이 초기화되었습니다.')
          }}
        />
      </div>
    </AdminLayout>
  )
}

