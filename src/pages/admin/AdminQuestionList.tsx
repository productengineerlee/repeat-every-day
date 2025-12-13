import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Edit, Trash2, Plus, CheckSquare, Square } from 'lucide-react'
import AdminLayout from '@/components/admin/AdminLayout'
import { getQuestionsList, deleteQuestion, deleteQuestions, type QuestionListItem } from '@/lib/api/questions'

const CERTIFICATION_TYPES = [
  '정보처리기사',
  '컴퓨터활용능력',
  '빅데이터분석기사',
  '경영정보시각화능력',
  'ADsP',
  'SQLD',
  '사회조사분석사',
  'TESAT',
  '공인중개사',
]

// 자격증별 과목 매핑
const SUBJECT_MAP: Record<string, string[]> = {
  '정보처리기사': [
    '1-소프트웨어 설계',
    '2-소프트웨어 개발',
    '3-데이터베이스 구축',
    '4-프로그래밍 언어 활용',
    '5-정보시스템 구축관리',
  ],
  '컴퓨터활용능력': [
    '1-컴퓨터 일반',
    '2-스프레드시트 일반',
  ],
  '빅데이터분석기사': [
    '1-빅데이터 분석 기획',
    '2-빅데이터 탐색',
    '3-빅데이터 모델링',
    '4-빅데이터 결과 해석',
  ],
  '경영정보시각화능력': [
    '1-데이터 시각화 기획',
    '2-데이터 시각화 구현',
    '3-데이터 시각화 활용',
  ],
  'ADsP': [
    '1-데이터의 이해',
    '2-데이터 분석 기획',
    '3-데이터 분석',
  ],
  'SQLD': [
    '1-데이터 모델링의 이해',
    '2-SQL 기본 및 활용',
  ],
  '사회조사분석사': [
    '1-조사방법과 설계',
    '2-조사관리와 자료처리',
    '3-통계분석과 활용',
  ],
  'TESAT': [
    '1-경제이론(기초, 응용)',
    '2-경제시사(기초, 응용)',
    '3-상황판단(응용복합)',
  ],
  '공인중개사': [
    '1-부동산학개론',
    '2-민법 및 민사특별법',
    '3-공인중개사법령',
    '4-부동산공법',
    '5-부동산공시법령',
    '6-부동산세법',
  ],
}

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
  const [selectedSubject, setSelectedSubject] = useState<string>('')
  const [selectedExamYear, setSelectedExamYear] = useState<string>('')
  const [selectedExamSession, setSelectedExamSession] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20
  
  // 일괄 선택 상태
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)

  // 문제 목록 로드
  const loadQuestions = async () => {
    setLoading(true)
    setError(null)

    try {
      // 과목 필터: category가 "과정번호-과목번호-"로 시작하는 경우
      let categoryFilter: string | undefined
      if (selectedSubject) {
        const subjectNumber = selectedSubject.split('-')[0] // "1-과목명"에서 "1" 추출
        if (selectedCertification) {
          // 자격증의 과정분류 번호 찾기
          const certIndex = CERTIFICATION_TYPES.indexOf(selectedCertification)
          if (certIndex !== -1) {
            const processNumber = certIndex + 1 // 1부터 시작
            categoryFilter = `${processNumber}-${subjectNumber}` // 예: "9-2"
          }
        }
      }

      const result = await getQuestionsList({
        certificationType: selectedCertification || undefined,
        category: categoryFilter,
        search: searchTerm || undefined,
        examYear: selectedExamYear ? parseInt(selectedExamYear, 10) : undefined,
        examSession: selectedExamSession || undefined,
        limit: itemsPerPage,
        offset: (currentPage - 1) * itemsPerPage,
      })

      if (result.error) {
        setError(result.error)
        setQuestions([])
        setTotal(0)
      } else {
        // DB에서 이미 정렬되어 옴 (년도↓ → 회차↓ → 문제번호↑ → 등록일↓)
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
    console.log('🗑️ 삭제 버튼 클릭됨:', questionId)
    
    if (!confirm('이 문제를 삭제하시겠습니까?')) {
      console.log('❌ 사용자가 삭제를 취소했습니다.')
      return
    }

    try {
      console.log('🗑️ 삭제 요청 시작:', questionId)
      const result = await deleteQuestion(questionId)
      console.log('🗑️ 삭제 결과:', result)
      
      if (result.success) {
        console.log('✅ 삭제 성공, 목록 새로고침 중...')
        // 선택 해제
        setSelectedIds((prev) => {
          const newSet = new Set(prev)
          newSet.delete(questionId)
          return newSet
        })
        // 목록 새로고침
        await loadQuestions()
        console.log('✅ 목록 새로고침 완료')
      } else {
        console.error('❌ 삭제 실패:', result.error)
        alert(`삭제 실패: ${result.error}`)
      }
    } catch (err) {
      console.error('❌ 문제 삭제 중 예외 발생:', err)
      alert(`문제 삭제 중 오류가 발생했습니다: ${err instanceof Error ? err.message : '알 수 없는 오류'}`)
    }
  }

  // 일괄 삭제
  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) {
      alert('삭제할 문제를 선택해주세요.')
      return
    }

    const count = selectedIds.size
    if (!confirm(`선택한 ${count}개의 문제를 삭제하시겠습니까?`)) {
      return
    }

    setIsDeleting(true)
    try {
      const questionIds = Array.from(selectedIds)
      console.log('🗑️ 일괄 삭제 시작:', { count, questionIds })
      
      const result = await deleteQuestions(questionIds)
      console.log('🗑️ 일괄 삭제 결과:', result)
      
      if (result.success) {
        alert(`✅ ${result.deletedCount}개의 문제가 삭제되었습니다.`)
        setSelectedIds(new Set())
        await loadQuestions()
      } else {
        const errorMsg = result.errors.length > 0
          ? `${result.deletedCount}개 삭제 성공, ${result.errors.length}개 실패: ${result.errors.map(e => e.error).join(', ')}`
          : '일부 문제 삭제에 실패했습니다.'
        alert(errorMsg)
        // 성공한 항목은 선택 해제
        const failedIds = new Set(result.errors.map(e => e.questionId))
        setSelectedIds((prev) => {
          const newSet = new Set(prev)
          failedIds.forEach(id => newSet.delete(id))
          return newSet
        })
        await loadQuestions()
      }
    } catch (err) {
      console.error('❌ 일괄 삭제 중 예외 발생:', err)
      alert(`일괄 삭제 중 오류가 발생했습니다: ${err instanceof Error ? err.message : '알 수 없는 오류'}`)
    } finally {
      setIsDeleting(false)
    }
  }

  // 전체 선택/해제
  const handleSelectAll = () => {
    if (selectedIds.size === questions.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(questions.map(q => q.id)))
    }
  }

  // 개별 선택/해제
  const handleToggleSelect = (questionId: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(questionId)) {
        newSet.delete(questionId)
      } else {
        newSet.add(questionId)
      }
      return newSet
    })
  }

  // 자격증 변경 시 과목 초기화
  useEffect(() => {
    setSelectedSubject('')
  }, [selectedCertification])

  // 검색/필터 변경 시 목록 새로고침
  useEffect(() => {
    setCurrentPage(1) // 필터 변경 시 첫 페이지로
    setSelectedIds(new Set()) // 선택 초기화
  }, [searchTerm, selectedCertification, selectedSubject, selectedExamYear, selectedExamSession])

  useEffect(() => {
    loadQuestions()
    // 페이지 변경 시 선택 초기화
    setSelectedIds(new Set())
  }, [currentPage, searchTerm, selectedCertification, selectedSubject, selectedExamYear, selectedExamSession])

  // 난이도 표시 변환
  const getDifficultyText = (difficulty: number): string => {
    if (difficulty === 5) return '상'
    if (difficulty === 3) return '중'
    if (difficulty === 1) return '하'
    if (difficulty >= 4) return '상'
    if (difficulty >= 2) return '중'
    return '하'
  }

  // 과목명 가져오기
  const getSubjectName = (certificationType: string, category: string): string | null => {
    if (!category || !certificationType) return null
    
    const categoryParts = category.split('-')
    if (categoryParts.length < 2) return null
    
    const subjectNumber = categoryParts[1] // "9-2-1-1-1"에서 "2"
    const subjects = SUBJECT_MAP[certificationType]
    
    if (!subjects) return null
    
    // "2-민법 및 민사특별법"에서 과목명만 추출
    const subject = subjects.find(s => s.startsWith(`${subjectNumber}-`))
    if (!subject) return null
    
    return subject.substring(subject.indexOf('-') + 1) // "민법 및 민사특별법"
  }

  const totalPages = Math.ceil(total / itemsPerPage)

  return (
    <AdminLayout
      title="문제 목록"
      description={`등록된 문제를 조회하고 수정할 수 있습니다. (총 ${total}개)`}
    >

        {/* 검색 및 필터 */}
        <div className="bg-card border rounded-lg p-4 mb-6 space-y-4">
          {/* 검색 */}
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

          {/* 필터 */}
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            {/* 자격증 필터 */}
            <div className="w-full sm:flex-1 space-y-2">
              <label className="text-sm font-medium">자격증</label>
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
            
            {/* 과목 필터 */}
            <div className="w-full sm:w-48 space-y-2">
              <label className="text-sm font-medium">과목</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                disabled={!selectedCertification}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">
                  {selectedCertification ? '전체 과목' : '먼저 자격증을 선택하세요'}
                </option>
                {selectedCertification && SUBJECT_MAP[selectedCertification]?.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </div>
            
            {/* 기출년도 */}
            <div className="w-full sm:w-32 space-y-2">
              <label className="text-sm font-medium">기출년도</label>
              <Input
                type="text"
                placeholder="예: 2024"
                value={selectedExamYear}
                onChange={(e) => {
                  let value = e.target.value
                  value = value.replace(/[^0-9]/g, '')
                  if (value.length > 4) {
                    value = value.slice(0, 4)
                  }
                  setSelectedExamYear(value)
                }}
                maxLength={4}
              />
            </div>
            
            {/* 기출회차 */}
            <div className="w-full sm:w-32 space-y-2">
              <label className="text-sm font-medium">기출회차</label>
              <Input
                type="text"
                placeholder="예: 01, 37"
                value={selectedExamSession}
                onChange={(e) => {
                  let value = e.target.value
                  value = value.replace(/[^0-9]/g, '')
                  if (value.length > 2) {
                    value = value.slice(0, 2)
                  }
                  setSelectedExamSession(value)
                }}
                maxLength={2}
              />
            </div>
            
            {/* 초기화 버튼 */}
            {(selectedExamYear || selectedExamSession) && (
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedExamYear('')
                  setSelectedExamSession('')
                }}
                size="sm"
              >
                초기화
              </Button>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            📌 {selectedExamYear || selectedExamSession 
              ? `${selectedExamYear ? `${selectedExamYear}년` : ''}${selectedExamYear && selectedExamSession ? ' ' : ''}${selectedExamSession ? `${selectedExamSession}회차` : ''} 문제를 `
              : '모든 문제를 '}
            <strong>년도↓ → 회차↓ → 문제번호↑</strong> 순서로 표시합니다.
          </div>
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
            {/* 일괄 선택 및 삭제 도구바 */}
            <div className="mb-4 flex items-center justify-between p-4 bg-muted/50 border rounded-lg">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSelectAll}
                  className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
                >
                  {selectedIds.size === questions.length ? (
                    <CheckSquare className="h-5 w-5 text-primary" />
                  ) : (
                    <Square className="h-5 w-5" />
                  )}
                  <span>전체 선택</span>
                </button>
                {selectedIds.size > 0 && (
                  <span className="text-sm text-muted-foreground">
                    {selectedIds.size}개 선택됨
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {/* 필터링된 문항 수 표시 */}
                <div className="text-sm font-medium text-muted-foreground">
                  {selectedCertification && (
                    <>
                      <span className="text-primary">{selectedCertification}</span>
                      {selectedSubject && (
                        <>
                          <span className="mx-1">›</span>
                          <span className="text-green-600 dark:text-green-400">
                            {selectedSubject.split('-')[1]}
                          </span>
                        </>
                      )}
                      <span className="mx-2">·</span>
                    </>
                  )}
                  <span className="text-foreground font-semibold">총 {total}문항</span>
                </div>
                {selectedIds.size > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBatchDelete}
                    disabled={isDeleting}
                    className="gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    {isDeleting ? '삭제 중...' : `선택한 ${selectedIds.size}개 삭제`}
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-3">
              {questions.map((question, index) => {
                const isSelected = selectedIds.has(question.id)
                return (
                  <motion.div
                    key={question.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`bg-card border rounded-lg p-4 hover:shadow-md transition-shadow ${
                      isSelected ? 'ring-2 ring-primary' : ''
                    }`}
                  >
                    <div className="space-y-3">
                      {/* 상단: 체크박스 + 배지 + 문제 내용 */}
                      <div className="flex items-start gap-3">
                        {/* 체크박스 */}
                        <button
                          onClick={() => handleToggleSelect(question.id)}
                          className="mt-1 flex-shrink-0"
                        >
                          {isSelected ? (
                            <CheckSquare className="h-5 w-5 text-primary" />
                          ) : (
                            <Square className="h-5 w-5 text-muted-foreground" />
                          )}
                        </button>
                        
                        <div className="flex-1 min-w-0">
                          {/* 배지 정보 */}
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            {question.examYear && (
                              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded">
                                {question.examYear}년
                              </span>
                            )}
                            {question.examSession && (
                              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded">
                                {question.examSession}회차
                              </span>
                            )}
                            {!question.examYear && !question.examSession && (
                              <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs rounded" title="기출정보 없음">
                                기출정보 미등록
                              </span>
                            )}
                            <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">
                              {question.certificationType}
                            </span>
                            {(() => {
                              const subjectName = getSubjectName(question.certificationType, question.category)
                              return subjectName ? (
                                <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded">
                                  {subjectName}
                                </span>
                              ) : null
                            })()}
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
                          
                          {/* 문제 내용 (왼쪽 정렬) */}
                          <p className="text-sm text-foreground line-clamp-2 text-left">
                            {question.content}
                          </p>
                        </div>
                      </div>
                      
                      {/* 하단: 등록일 + 버튼들 (같은 라인) */}
                      <div className="flex items-center justify-between gap-4 pl-8">
                        <p className="text-xs text-muted-foreground">
                          등록일: {new Date(question.createdAt).toLocaleDateString('ko-KR')}
                        </p>
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
                            className="gap-2"
                          >
                            <Trash2 className="h-4 w-4" />
                            삭제
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
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

