import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Edit, Trash2, Plus } from 'lucide-react'
import AdminLayout from '@/components/admin/AdminLayout'
import { getQuestionsList, deleteQuestion, type QuestionListItem } from '@/lib/api/questions'

const CERTIFICATION_TYPES = [
  '정보처리기사',
  '컴퓨터활용능력',
  '빅데이터분석기사',
  '경영정보시각화능력',
  'ADsP',
  'SQLD',
]

export default function AdminQuestionList() {
  const navigate = useNavigate()
  const location = useLocation()
  const [questions, setQuestions] = useState<QuestionListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [error, setError] = useState<string | null>(null)
  
  // 필터 상태
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCertification, setSelectedCertification] = useState<string>('')
  const [selectedExamSession, setSelectedExamSession] = useState<string>(
    (location.state as { examSession?: string })?.examSession || ''
  )
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

  // 문제 목록 로드
  const loadQuestions = async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await getQuestionsList({
        certificationType: selectedCertification || undefined,
        search: searchTerm || undefined,
        examSession: selectedExamSession || undefined,
        limit: itemsPerPage,
        offset: (currentPage - 1) * itemsPerPage,
        orderBy: selectedExamSession ? 'exam_number' : 'created_at',
        order: selectedExamSession ? 'asc' : 'desc',
      })

      if (result.error) {
        setError(result.error)
        setQuestions([])
        setTotal(0)
      } else {
        setQuestions(result.questions)
        setTotal(result.total)
      }
    } catch (err) {
      console.error('문제 목록 로드 실패:', err)
      setError(err instanceof Error ? err.message : '문제 목록을 불러오는 중 오류가 발생했습니다.')
      setQuestions([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  // 문제 삭제
  const handleDelete = async (questionId: string) => {
    if (!confirm('이 문제를 삭제하시겠습니까?')) {
      return
    }

    try {
      const result = await deleteQuestion(questionId)
      if (result.success) {
        // 목록 새로고침
        await loadQuestions()
      } else {
        alert(`삭제 실패: ${result.error}`)
      }
    } catch (err) {
      console.error('문제 삭제 실패:', err)
      alert('문제 삭제 중 오류가 발생했습니다.')
    }
  }

  // 검색/필터 변경 시 목록 새로고침
  useEffect(() => {
    setCurrentPage(1) // 필터 변경 시 첫 페이지로
  }, [searchTerm, selectedCertification, selectedExamSession])

  useEffect(() => {
    loadQuestions()
  }, [currentPage, searchTerm, selectedCertification, selectedExamSession])

  // 난이도 표시 변환
  const getDifficultyText = (difficulty: number): string => {
    if (difficulty === 5) return '상'
    if (difficulty === 3) return '중'
    if (difficulty === 1) return '하'
    if (difficulty >= 4) return '상'
    if (difficulty >= 2) return '중'
    return '하'
  }

  const totalPages = Math.ceil(total / itemsPerPage)

  return (
    <AdminLayout
      title="문제 목록"
      description={`등록된 문제를 조회하고 수정할 수 있습니다. (총 ${total}개)`}
    >

        {/* 검색 및 필터 */}
        <div className="bg-card border rounded-lg p-4 mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* 검색 */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="문제 내용으로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* 자격증 필터 */}
            <div className="sm:w-64">
              <select
                value={selectedCertification}
                onChange={(e) => setSelectedCertification(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">전체 자격증</option>
                {CERTIFICATION_TYPES.map((cert) => (
                  <option key={cert} value={cert}>
                    {cert}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* 기출회차 필터 */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="기출회차 입력 (예: 2024-01)"
                value={selectedExamSession}
                onChange={(e) => {
                  let value = e.target.value
                  // YYYY-MM 형식으로 포맷팅 (숫자와 하이픈만 허용)
                  value = value.replace(/[^0-9-]/g, '')
                  // YYYY-MM 형식 강제 (예: 2024-01)
                  if (value.length > 4 && !value.includes('-')) {
                    value = value.slice(0, 4) + '-' + value.slice(4)
                  }
                  // 최대 길이 제한 (YYYY-MM = 7자)
                  if (value.length > 7) {
                    value = value.slice(0, 7)
                  }
                  // 하이픈이 2개 이상이면 첫 번째만 유지
                  const parts = value.split('-')
                  if (parts.length > 2) {
                    value = parts[0] + '-' + parts.slice(1).join('')
                  }
                  setSelectedExamSession(value)
                }}
                maxLength={7}
              />
            </div>
            {selectedExamSession && (
              <Button
                variant="outline"
                onClick={() => setSelectedExamSession('')}
                size="sm"
              >
                초기화
              </Button>
            )}
          </div>
          {selectedExamSession && (
            <div className="text-sm text-muted-foreground">
              📌 '{selectedExamSession}' 회차의 문제를 기출번호 오름차순으로 표시합니다.
            </div>
          )}
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* 문제 목록 */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">등록된 문제가 없습니다.</p>
            <Button onClick={() => navigate('/admin/question-input')}>
              <Plus className="h-4 w-4 mr-2" />
              문제 추가하기
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {questions.map((question, index) => (
                <motion.div
                  key={question.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-card border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span className="text-sm font-medium text-muted-foreground">
                          #{question.id.substring(0, 8)}...
                        </span>
                        {question.examSession && (
                          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded">
                            {question.examSession}
                          </span>
                        )}
                        {question.examNumber && (
                          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded">
                            기출 {question.examNumber}번
                          </span>
                        )}
                        <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">
                          {question.certificationType}
                        </span>
                        <span className="px-2 py-1 bg-muted text-xs rounded">
                          {question.category}
                        </span>
                        <span className="px-2 py-1 bg-muted text-xs rounded">
                          난이도: {getDifficultyText(question.difficulty)}
                        </span>
                        <span className="px-2 py-1 bg-muted text-xs rounded">
                          선택지 {question.optionsCount}개
                        </span>
                      </div>
                      <p className="text-sm text-foreground line-clamp-2">
                        {question.content}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        등록일: {new Date(question.createdAt).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/admin/questions/${question.id}/edit`)}
                        className="gap-2"
                      >
                        <Edit className="h-4 w-4" />
                        수정
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(question.id)}
                        className="gap-2 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                        삭제
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  이전
                </Button>
                <span className="text-sm text-muted-foreground">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  다음
                </Button>
              </div>
            )}
          </>
        )}
    </AdminLayout>
  )
}

