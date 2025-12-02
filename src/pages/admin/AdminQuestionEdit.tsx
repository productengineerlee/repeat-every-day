import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import AdminLayout from '@/components/admin/AdminLayout'
import QuestionInputForm from '@/components/admin/QuestionInputForm'
import { getQuestionById, updateQuestion, type QuestionInput } from '@/lib/api/questions'

export default function AdminQuestionEdit() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [questionData, setQuestionData] = useState<Partial<QuestionInput> | null>(null)

  // 문제 데이터 로드
  useEffect(() => {
    const loadQuestion = async () => {
      if (!id) {
        setError('문제 ID가 없습니다.')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        const result = await getQuestionById(id)

        if (result.error || !result.question) {
          setError(result.error || '문제를 찾을 수 없습니다.')
          setLoading(false)
          return
        }

        const q = result.question

        // 난이도를 '상', '중', '하'로 변환
        const difficultyToText: Record<number, '상' | '중' | '하'> = {
          5: '상',
          3: '중',
          1: '하',
        }
        const difficultyText = difficultyToText[q.difficulty] || 
          (q.difficulty >= 4 ? '상' : q.difficulty >= 2 ? '중' : '하')

        // 카테고리를 대분류-중분류-소분류-세분류-세세분류로 분리
        const categoryParts = q.category.split('-')
        const categoryLevels = {
          대분류: categoryParts[0] || '',
          중분류: categoryParts[1] || '',
          소분류: categoryParts[2] || '',
          세분류: categoryParts[3] || '',
          세세분류: categoryParts[4] || '',
        }

        // QuestionInput 형식으로 변환
        const formData: Partial<QuestionInput> = {
          content: q.content,
          subContent: q.subContent,
          subContentImageUrl: q.subContentImageUrl,
          options: q.options.length >= 4 ? q.options : [...q.options, ...Array(5 - q.options.length).fill('')],
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          certificationType: q.certificationType,
          category: q.category,
          difficulty: difficultyText,
          tags: q.tags,
          frequency: q.frequency,
          examSession: q.examSession,
          examNumber: q.examNumber,
        }

        setQuestionData(formData)
      } catch (err) {
        console.error('문제 로드 실패:', err)
        setError(err instanceof Error ? err.message : '문제를 불러오는 중 오류가 발생했습니다.')
      } finally {
        setLoading(false)
      }
    }

    loadQuestion()
  }, [id])

  // 문제 수정 제출
  const handleSubmit = async (question: QuestionInput) => {
    if (!id) {
      setError('문제 ID가 없습니다.')
      return
    }

    setSuccess(null)
    setError(null)

    try {
      const result = await updateQuestion(id, question)

      if (result.error) {
        // exam_session 또는 exam_number 컬럼이 없는 경우 특별한 안내 메시지 표시
        let errorMessage = result.error
        if (result.error.includes('exam_session') || result.error.includes('exam_number') || 
            result.error.includes("Could not find the 'exam_session' column") || 
            result.error.includes("Could not find the 'exam_number' column")) {
          errorMessage = `${result.error}\n\n💡 해결 방법: Supabase Dashboard → SQL Editor에서 add_exam_session_columns.sql 파일 내용을 실행하세요.`
        }
        setError(errorMessage)
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }, 100)
        return
      }

      if (result.id) {
        setSuccess('문제가 성공적으로 수정되었습니다!')
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }, 100)
        // 1.5초 후 문제 목록으로 이동
        setTimeout(() => {
          navigate('/admin/questions')
        }, 1500)
      } else {
        setError('문제가 수정되었지만 ID를 받지 못했습니다.')
      }
    } catch (err) {
      console.error('문제 수정 중 예외 발생:', err)
      const errorMessage = err instanceof Error ? err.message : '문제 수정 중 오류가 발생했습니다.'
      setError(errorMessage)
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }, 100)
    }
  }

  if (loading) {
    return (
      <AdminLayout title="문제 수정">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">문제를 불러오는 중...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (error && !questionData) {
    return (
      <AdminLayout
        title="문제 수정"
        description="문제를 불러올 수 없습니다."
      >
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <p className="text-red-800 dark:text-red-200">{error}</p>
          <Button onClick={() => navigate('/admin/questions')} className="mt-4">
            문제 목록으로 돌아가기
          </Button>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout
      title="문제 수정"
      description={`문제 ID: ${id}`}
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
              <p className="text-red-800 dark:text-red-200 font-medium mb-1">문제 수정 실패</p>
              <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
            </div>
          </motion.div>
        )}

        {/* 폼 */}
        {questionData && (
          <div className="bg-card border border-border rounded-lg p-6">
            <QuestionInputForm 
              onSubmit={handleSubmit}
              initialData={questionData}
              mode="edit"
              onSuccess={() => {
                console.log('문제가 수정되었습니다.')
              }}
            />
          </div>
        )}
    </AdminLayout>
  )
}

