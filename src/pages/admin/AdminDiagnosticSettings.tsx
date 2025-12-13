import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import AdminLayout from '@/components/admin/AdminLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Save, Plus, Trash2 } from 'lucide-react'

type CertificationType =
  | '정보처리기사'
  | '컴퓨터활용능력'
  | '빅데이터분석기사'
  | '경영정보시각화능력'
  | 'ADsP'
  | 'SQLD'
  | '사회조사분석사'
  | 'TESAT'
  | '공인중개사'

const CERTIFICATIONS: CertificationType[] = [
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

// 자격증별 기본 과목별 문항 수 (1과목-2과목-3과목-4과목-5과목)
const DEFAULT_SUBJECT_WEIGHTS: Record<CertificationType, number[]> = {
  '정보처리기사': [2, 2, 2, 2, 2], // 2-2-2-2-2 (5과목)
  '컴퓨터활용능력': [2, 4, 4, 0, 0], // 2-4-4-0-0 (3과목)
  '빅데이터분석기사': [2, 2, 4, 2, 0], // 2-2-4-2-0 (4과목)
  '경영정보시각화능력': [2, 4, 4, 0, 0], // 2-4-4-0-0 (3과목)
  'ADsP': [2, 2, 6, 0, 0], // 2-2-6-0-0 (3과목)
  'SQLD': [2, 8, 0, 0, 0], // 2-8-0-0-0 (2과목)
  '사회조사분석사': [3, 4, 3, 0, 0], // 3-4-3-0-0 (3과목: 조사방법과 설계, 조사관리와 자료처리, 통계분석과 활용)
  'TESAT': [4, 3, 3, 0, 0], // 4-3-3-0-0 (3과목: 경제이론, 경제시사, 상황판단)
  '공인중개사': [2, 2, 2, 2, 1, 1], // 2-2-2-2-1-1 (6과목: 부동산학개론, 민법, 공인중개사법령, 공법, 공시법령, 세법)
}

interface SubjectWeight {
  subjectNumber: number
  questionCount: number
}

export default function AdminDiagnosticSettings() {
  const [selectedCertification, setSelectedCertification] = useState<CertificationType | ''>('')
  const [subjects, setSubjects] = useState<SubjectWeight[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 자격증 선택 시 해당 자격증의 과목별 문항 수 로드
  useEffect(() => {
    if (!selectedCertification) {
      setSubjects([])
      setError(null)
      return
    }

    setError(null)

    const loadSubjectWeights = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('certification_subject_weights')
          .select('subject_number, question_count')
          .eq('certification_type', selectedCertification)
          .order('subject_number', { ascending: true })

        if (error) {
          console.error('과목별 문항 수 조회 실패:', error)
          // 테이블이 없는 경우에도 계속 진행 (초기화된 상태로 시작)
          if (error.code === '42P01' || error.message?.includes('does not exist') || error.message?.includes('relation') || error.message?.includes('table')) {
            console.warn('⚠️ certification_subject_weights 테이블이 없습니다. SQL 파일을 실행해주세요.')
            setError('데이터베이스 테이블이 없습니다. Supabase Dashboard → SQL Editor에서 create_certification_subject_weights_table.sql 파일을 실행해주세요.')
            // 테이블이 없어도 기본값 사용
            const defaultWeights = DEFAULT_SUBJECT_WEIGHTS[selectedCertification] || [0, 0, 0, 0, 0]
            setSubjects(
              defaultWeights.map((count, index) => ({
                subjectNumber: index + 1,
                questionCount: count,
              }))
            )
            setLoading(false)
            return
          }
          // 다른 에러는 사용자에게 알림하지만 기본값 사용
          console.warn('과목별 문항 수를 불러오는데 실패했습니다. 기본값으로 시작합니다.')
          setError(`데이터 조회 실패: ${error.message || '알 수 없는 오류'}. 기본값을 사용합니다.`)
          const defaultWeights = DEFAULT_SUBJECT_WEIGHTS[selectedCertification] || [0, 0, 0, 0, 0]
          setSubjects(
            defaultWeights.map((count, index) => ({
              subjectNumber: index + 1,
              questionCount: count,
            }))
          )
          setLoading(false)
          return
        }

        if (data && data.length > 0) {
          // DB에서 가져온 데이터 사용
          setSubjects(
            data.map((item) => ({
              subjectNumber: item.subject_number,
              questionCount: item.question_count,
            }))
          )
        } else {
          // 데이터가 없으면 기본값 사용
          const defaultWeights = DEFAULT_SUBJECT_WEIGHTS[selectedCertification] || [0, 0, 0, 0, 0]
          setSubjects(
            defaultWeights.map((count, index) => ({
              subjectNumber: index + 1,
              questionCount: count,
            }))
          )
        }
      } catch (error) {
        console.error('과목별 문항 수 조회 중 예외:', error)
        // 예외 발생 시에도 기본값 사용
        const defaultWeights = DEFAULT_SUBJECT_WEIGHTS[selectedCertification] || [0, 0, 0, 0, 0]
        setSubjects(
          defaultWeights.map((count, index) => ({
            subjectNumber: index + 1,
            questionCount: count,
          }))
        )
      } finally {
        setLoading(false)
      }
    }

    loadSubjectWeights()
  }, [selectedCertification])

  const handleSubjectCountChange = (index: number, value: string) => {
    const newValue = parseInt(value) || 0
    if (newValue < 0) return

    const newSubjects = [...subjects]
    newSubjects[index].questionCount = newValue
    setSubjects(newSubjects)
  }

  const handleAddSubject = () => {
    if (subjects.length >= 6) {
      alert('최대 6개 과목까지만 입력할 수 있습니다.')
      return
    }

    const nextSubjectNumber = subjects.length + 1
    setSubjects([...subjects, { subjectNumber: nextSubjectNumber, questionCount: 0 }])
  }

  const handleRemoveSubject = (index: number) => {
    if (subjects.length <= 1) {
      alert('최소 1개 과목은 유지해야 합니다.')
      return
    }

    const newSubjects = subjects.filter((_, i) => i !== index)
    // 과목 번호 재정렬
    const renumberedSubjects = newSubjects.map((subject, i) => ({
      ...subject,
      subjectNumber: i + 1,
    }))
    setSubjects(renumberedSubjects)
  }

  const handleSave = async () => {
    if (!selectedCertification) {
      alert('자격증을 선택해주세요.')
      return
    }

    const totalQuestions = subjects.reduce((sum, s) => sum + s.questionCount, 0)
    if (totalQuestions === 0) {
      alert('최소 1개 이상의 문항을 배정해주세요.')
      return
    }

    if (totalQuestions !== 10) {
      if (!confirm(`총 문항 수가 ${totalQuestions}개입니다. 10문제로 맞추는 것을 권장합니다. 계속하시겠습니까?`)) {
        return
      }
    }

    setSaving(true)
    try {
      // 기존 데이터 삭제
      const { error: deleteError } = await supabase
        .from('certification_subject_weights')
        .delete()
        .eq('certification_type', selectedCertification)

      if (deleteError && deleteError.code !== '42P01') {
        // 테이블이 없는 경우가 아니면 에러 처리
        console.warn('기존 데이터 삭제 실패 (무시하고 계속):', deleteError)
      }

      // 새 데이터 삽입 (문항 수가 0보다 큰 것만)
      const dataToInsert = subjects
        .filter((s) => s.questionCount > 0)
        .map((s) => ({
          certification_type: selectedCertification,
          subject_number: s.subjectNumber,
          question_count: s.questionCount,
        }))

      if (dataToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('certification_subject_weights')
          .insert(dataToInsert)

        if (insertError) {
          if (insertError.code === '42P01' || insertError.message?.includes('does not exist')) {
            alert('데이터베이스 테이블이 없습니다. Supabase Dashboard → SQL Editor에서 create_certification_subject_weights_table.sql 파일을 실행해주세요.')
            throw insertError
          }
          throw insertError
        }
      }

      alert('과목별 문항 수가 저장되었습니다.')
    } catch (error: any) {
      console.error('저장 실패:', error)
      if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
        alert('데이터베이스 테이블이 없습니다.\n\nSupabase Dashboard → SQL Editor에서 다음 파일을 실행해주세요:\ncreate_certification_subject_weights_table.sql')
      } else {
        alert(`저장 중 오류가 발생했습니다: ${error?.message || '알 수 없는 오류'}`)
      }
    } finally {
      setSaving(false)
    }
  }

  const totalQuestions = subjects.reduce((sum, s) => sum + s.questionCount, 0)

  return (
    <AdminLayout title="진단 테스트 설정" description="자격증별 과목별 진단 테스트 문항 수를 설정합니다.">
      <div className="max-w-3xl space-y-6">
        {/* 에러 메시지 */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* 자격증 선택 카드 */}
        <div className="bg-card border rounded-lg p-6 space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-1">자격증 선택</h3>
            <p className="text-sm text-muted-foreground">진단 테스트를 설정할 자격증을 선택하세요</p>
          </div>
          
          <Select
            value={selectedCertification}
            onValueChange={(value) => setSelectedCertification(value as CertificationType)}
          >
            <SelectTrigger className="h-12">
              <SelectValue placeholder="자격증을 선택하세요" />
            </SelectTrigger>
            <SelectContent>
              {CERTIFICATIONS.map((cert) => (
                <SelectItem key={cert} value={cert}>
                  {cert}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 과목별 문항 수 설정 카드 */}
        {selectedCertification && (
          <div className="bg-card border rounded-lg p-6 space-y-6">
            {/* 헤더 */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-1">과목별 문항 수 설정</h3>
                <p className="text-sm text-muted-foreground">
                  각 과목에 배정할 문항 수를 입력하세요 (총 10문항 권장)
                </p>
              </div>
              {subjects.length < 6 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddSubject}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  과목 추가
                </Button>
              )}
            </div>

            {/* 과목 입력 리스트 */}
            <div className="space-y-3">
              {subjects.map((subject, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-center w-16 h-16 bg-primary/10 rounded-lg flex-shrink-0">
                    <span className="text-2xl font-bold text-primary">
                      {subject.subjectNumber}
                    </span>
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground mb-1 block">
                      {subject.subjectNumber}과목 문항 수
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      max="10"
                      value={subject.questionCount}
                      onChange={(e) => handleSubjectCountChange(index, e.target.value)}
                      className="h-10"
                      placeholder="0"
                    />
                  </div>
                  {subjects.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveSubject(index)}
                      className="flex-shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* 총 문항 수 표시 */}
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">총 문항 수</p>
                  {totalQuestions !== 10 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {totalQuestions < 10
                        ? `10문제까지 ${10 - totalQuestions}문제 더 배정 가능`
                        : `${totalQuestions - 10}문제 초과`}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <div
                    className={`text-3xl font-bold ${
                      totalQuestions === 10
                        ? 'text-green-600 dark:text-green-400'
                        : totalQuestions > 10
                        ? 'text-orange-500'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {totalQuestions}
                  </div>
                  <p className="text-xs text-muted-foreground">/ 10 문항</p>
                </div>
              </div>
            </div>

            {/* 저장 버튼 */}
            <Button
              onClick={handleSave}
              disabled={saving || loading || totalQuestions === 0}
              className="w-full h-12 text-base gap-2"
              size="lg"
            >
              <Save className="h-5 w-5" />
              {saving ? '저장 중...' : '설정 저장'}
            </Button>
          </div>
        )}

        {/* 빈 상태 */}
        {!selectedCertification && (
          <div className="bg-card border rounded-lg p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-muted rounded-full mb-4">
              <Save className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">자격증을 선택해주세요</h3>
            <p className="text-sm text-muted-foreground">
              위에서 자격증을 선택하면 과목별 문항 수를 설정할 수 있습니다.
            </p>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

